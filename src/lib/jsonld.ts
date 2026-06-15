import type { Country } from "@/i18n/countries";
import type { AggregateRating, Plan } from "./api";

// safeJsonStringify — escapa caracteres que permitem breakout do contexto
// <script type="application/ld+json"> quando o JSON é injetado via
// dangerouslySetInnerHTML. JSON.stringify nativo NÃO escapa </script>, &, ou
// os terminadores de linha U+2028/U+2029 (que terminam strings JS no parser
// HTML inline). Sem essa escapagem, qualquer string controlada por admin
// (ex.: plan.name) que contenha "</script><script>..." executa no contexto
// do usuário. Convenção: TODA injeção de JSON-LD via dangerouslySetInnerHTML
// passa por este helper. Veja OWASP "XSS Prevention in JavaScript Contexts".
export function safeJsonStringify(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

// Schema.org JSON-LD para landing de país. Blocos emitidos:
//   - Organization (marca, logo, contactPoint, sameAs)
//   - WebSite (com SearchAction de país)
//   - WebPage (página em si, inLanguage)
//   - BreadcrumbList
//   - Service + AggregateOffer (com price em USD, derivado dos prices map
//     manualmente curados em plans.prices — USD é o display default)
//
// Cada bloco é serializado em <script type="application/ld+json">. Compatível
// com Rich Results Test do Google + JSON-LD Validator do Schema.org.

// Preferência de moeda no JSON-LD. USD é a moeda mais portável globalmente
// pro Google e Bing; USDT logo em seguida porque é a canônica do storefront
// (1:1 com USD). EUR é o terceiro maior bloco; BRL fica por último pra
// nunca virar default mundial em rich results. BTC só pra completar.
const PREFERRED_OFFER_CURRENCIES = ["USD", "USDT", "EUR", "BRL", "BTC"] as const;

// Merchant Listings (rich result) exige `image`, `hasMerchantReturnPolicy`,
// `shippingDetails` em offers — sem isso o item fica inválido pra rich
// snippet no Search Console (warning ou erro dependendo do campo).
//
// Como Viralefy é 100% digital (entrega via API/automação, sem produto
// físico):
//   - shippingDetails: $0, processamento instantâneo, sem transporte. Schema
//     ainda exige a estrutura completa pra validar.
//   - hasMerchantReturnPolicy: 30-day refill/refund — a garantia padrão do
//     storefront. Mapeia pra FiniteReturnWindow + FreeReturn.

export type OfferEnhancements = {
  shippingDetails: object;
  hasMerchantReturnPolicy: object;
};

/**
 * Devolve os campos opcionais-mas-críticos que o Google espera em cada Offer
 * pra qualificar como Merchant Listing rich result. Centraliza pra todas as
 * superfícies (slug, category, country) emitirem a mesma forma.
 *
 * Estrutura conforme docs:
 *   https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
 *   https://developers.google.com/search/docs/appearance/structured-data/product
 */
/**
 * Constrói o bloco AggregateRating do Schema.org a partir do summary do
 * backend. Devolve null quando review_count = 0 — Google rejeita
 * aggregateRating sem reviews reais (e o handler do backend devolve null
 * justamente pra calller omitir o bloco).
 *
 * Política: NÃO fabricar. ratingValue/reviewCount vêm direto da tabela
 * `reviews` populada pelo formulário /orders/[id]/review, que só aceita
 * submissões de orders pagas e dono autenticado.
 */
export function buildAggregateRating(agg: AggregateRating | null | undefined): object | null {
  if (!agg) return null;
  if (!agg.review_count || agg.review_count < 1) return null;
  return {
    "@type": "AggregateRating",
    ratingValue: agg.rating_value.toFixed(2),
    reviewCount: agg.review_count,
    bestRating: agg.best_rating ?? 5,
    worstRating: agg.worst_rating ?? 1,
  };
}

export function buildOfferEnhancements(countryCode: string): OfferEnhancements {
  const region = countryCode.toUpperCase();
  return {
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "0",
        currency: "USD",
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: region,
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        // Digital — sem handling, entrega instantânea após confirmação de pagamento.
        handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
        transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: region,
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 30,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
  };
}

function pickOfferCurrency(prices: Record<string, string> | undefined): { code: string; amount: string } | null {
  if (!prices) return null;
  for (const code of PREFERRED_OFFER_CURRENCIES) {
    if (prices[code]) return { code, amount: prices[code] };
  }
  // Último recurso: pega a primeira disponível.
  const first = Object.entries(prices)[0];
  return first ? { code: first[0], amount: first[1] } : null;
}

// BUG-191 (QA 2026-06-14): páginas com múltiplos blocos JSON-LD emitiam N
// scripts separados (`<script type="application/ld+json">` por nó), o que faz
// Google/Bing/Ahrefs reportarem "duplicação" e a Rich Results Test expandir
// cada bloco como se fosse documento isolado. Convenção Schema.org pra
// documentos multi-entidade é UM script com `@graph: [...]`. Helper abaixo
// recebe os nós (sem `@context` em cada um — fica só no envelope) e devolve
// o documento canônico.
//
// Se algum nó já carregar `@context`, removemos pra evitar repetição. `@graph`
// herda o `@context` do envelope.
export function toJsonLdGraph(nodes: ReadonlyArray<object | null | undefined>): object {
  const clean = nodes
    .filter((n): n is object => Boolean(n))
    .map((n) => {
      if (!("@context" in n)) return n;
      // Strip @context — fica só no envelope.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ["@context"]: _ctx, ...rest } = n as Record<string, unknown>;
      return rest;
    });
  return { "@context": "https://schema.org", "@graph": clean };
}

// BUG-191 / Track Y (QA 2026-06-14): index pages /cities, /vs, /help,
// /case-studies emitiam apenas CollectionPage + BreadcrumbList + ItemList no
// `@graph`, sem Organization nem WebSite. Validators (Rich Results, Schema.org
// Validator, Ahrefs) só conseguem linkar `isPartOf` ao `#website` quando o nó
// está presente no mesmo documento. Sem isso, o gráfico de entidades fica
// "órfão" e Ahrefs reporta "Organization missing" naquela URL.
//
// Convenção do projeto: home e country pages já emitem Org+WebSite inline via
// buildHomeJsonLd/buildCountryJsonLd. Pra pages globais (sem país no path)
// usamos `buildOrganizationNode`/`buildWebSiteNode` com `@id` canônico
// (`${siteUrl}/#organization`, `${siteUrl}/#website`) — mesmos IDs usados
// pelas pages por país, então validators tratam como uma entidade só.
//
// `withGlobalGraph(nodes, opts)` prepende Organization + WebSite ao @graph
// da page. `opts.inLanguage` cobre o caso onde a page tem idioma fixo
// (todas as 4 index pages atuais são en-only).
export function buildOrganizationNode(siteUrl: string): object {
  const logoUrl = `${siteUrl}/logo.png`;
  return {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Viralefy",
    url: siteUrl,
    logo: { "@type": "ImageObject", url: logoUrl, width: 2471, height: 704 },
    // sameAs intencionalmente omitido até termos perfis sociais oficiais.
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["en", "pt", "es", "fr", "de", "it", "nl", "ru", "ja", "ar"],
      url: `${siteUrl}/legal/contact?lang=en`,
    },
  };
}

export function buildWebSiteNode(
  siteUrl: string,
  opts: { inLanguage?: string | string[] } = {},
): object {
  const inLanguage = opts.inLanguage ?? [
    "en",
    "pt",
    "es",
    "fr",
    "de",
    "it",
    "nl",
    "ru",
    "ja",
    "ar",
  ];
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Viralefy",
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/{country_code}` },
      "query-input": "required name=country_code",
    },
  };
}

// withGlobalGraph — prepende Org + WebSite aos nós da page e empacota num
// único `@graph`. Use em qualquer page que emita JSON-LD próprio pra garantir
// que o gráfico tenha as entidades globais (sem isso, `isPartOf: { @id: …/#website }`
// vira ponteiro pendurado pro validador).
//
// `opts.inLanguage` é repassado ao WebSite. Não confunda com o inLanguage de
// CollectionPage/WebPage — esse continua sendo definido pela própria page
// (idioma da URL/conteúdo); o do WebSite descreve o site como um todo.
export function withGlobalGraph(
  pageNodes: ReadonlyArray<object | null | undefined>,
  opts: { siteUrl: string; inLanguage?: string | string[] },
): object {
  const org = buildOrganizationNode(opts.siteUrl);
  const website = buildWebSiteNode(opts.siteUrl, { inLanguage: opts.inLanguage });
  return toJsonLdGraph([org, website, ...pageNodes]);
}

// BUG-192 (QA 2026-06-14): AggregateOffer.lowPrice tem que ser o MÍNIMO real
// dos tiers, highPrice o máximo. Antes cada page replicava a fórmula manual
// e algumas variantes (slug page) não filtravam preços não-numéricos
// (`"on_request"`, `""`, `null`). Cenário borda: um tier com `amount = "0"`
// derruba o lowPrice pra 0 sem que seja oferta real. Helper centralizado:
//   1. Filtra ofertas com `price` numérico > 0 (zero = enterprise/cotação)
//   2. Calcula low/high a partir dos validos
//   3. priceCurrency obrigatório (Schema.org); usamos o passado em opts
//   4. Retorna null quando 0 offers válidas — caller omite o bloco
export type AggregateOfferInput = {
  price: string;
  priceCurrency: string;
  [k: string]: unknown;
};
export function buildAggregateOffer(
  offers: ReadonlyArray<AggregateOfferInput>,
  opts: { priceCurrency: string },
): object | null {
  const sameCurrency = offers.filter((o) => o.priceCurrency === opts.priceCurrency);
  const numericOffers = sameCurrency.filter((o) => {
    const n = parseFloat(o.price);
    return Number.isFinite(n) && n > 0;
  });
  if (numericOffers.length === 0) return null;
  const prices = numericOffers.map((o) => parseFloat(o.price));
  const low = Math.min(...prices).toFixed(2);
  const high = Math.max(...prices).toFixed(2);
  return {
    "@type": "AggregateOffer",
    priceCurrency: opts.priceCurrency,
    lowPrice: low,
    highPrice: high,
    offerCount: numericOffers.length,
    offers: numericOffers,
  };
}

// buildHomeJsonLd — emite Organization + WebSite + Service + AggregateOffer
// pra home global. Antes a home só tinha Organization + WebSite (sem schema
// de Product/Offer, sem rich result candidato).
//
// Offers apontam pra /us/<slug>/<qty>-<slug> (variante en-US canônica). Cada
// offer carrega image + shippingDetails + hasMerchantReturnPolicy pra Google
// Merchant Listings.
export function buildHomeJsonLd(plans: Plan[], siteUrl: string) {
  const logoUrl = `${siteUrl}/logo.png`;
  const enhancements = buildOfferEnhancements("US");
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Carrega os planos como Offers. URL aponta pra /us/<en-slug>/<qty>-<en-slug>
  // (variante en-US canônica do plano, alinhada com a estratégia x-default
  // do hreflang).
  // categorySlug e categoryUnit vivem em i18n/categories — importamos aqui.
  // (import inline pra evitar ciclo se o consumer já importar buildHomeJsonLd).
  const offers = plans.map((p) => {
    const usd = p.prices?.["USD"] ?? (p.price_cents / 100).toFixed(2);
    const enSlug = categorySlugEn(p.category);
    const planUrl = `${siteUrl}/us/${enSlug}/${p.followers_qty}-${enSlug}`;
    const imgUrl = `${siteUrl}/og/us/${enSlug}/${p.followers_qty}-${enSlug}`;
    return {
      "@type": "Offer",
      name: p.name,
      sku: p.id,
      price: usd,
      priceCurrency: "USD",
      url: planUrl,
      image: imgUrl,
      availability: "https://schema.org/InStock",
      priceValidUntil: validUntil,
      ...enhancements,
    };
  });

  // AggregateOffer via helper centralizado (filtra non-numéricos / zero).
  const aggregateOffer = buildAggregateOffer(offers, { priceCurrency: "USD" });

  // Schema.org @graph: agrupa todos os nós num único documento. Validators
  // tratam refs @id como ponteiros (não inlinam o conteúdo de novo), o que
  // elimina o efeito visual de "duplicação" que aparece quando emitimos N
  // <script> separados (Ahrefs/Rich Results expandem cada ref como nó
  // standalone). Também é a forma canônica recomendada pelo Schema.org pra
  // documentos multi-entidade.
  const organization = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Viralefy",
    url: siteUrl,
    logo: { "@type": "ImageObject", url: logoUrl, width: 2471, height: 704 },
    // sameAs intencionalmente omitido: até termos perfis sociais públicos
    // (Twitter, Instagram da marca, LinkedIn), não vale apontar pra repos
    // GitHub — Ahrefs/Schema.org não esperam isso pra Organization comercial.
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["en", "pt", "es", "fr", "de", "it", "nl", "ru", "ja", "ar"],
      url: `${siteUrl}/legal/contact?lang=en`,
    },
  };

  const website = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Viralefy",
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    // BUG-203 do QA 2026-06-12: inLanguage="en" num site multilingue.
    // Listamos os idiomas em que temos cópia editorial completa.
    inLanguage: ["en", "pt", "es", "fr", "de", "it", "nl", "ru", "ja", "ar"],
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/{country_code}` },
      "query-input": "required name=country_code",
    },
  };

  const service = {
    "@type": "Service",
    "@id": `${siteUrl}/#service`,
    name: "Instagram and TikTok growth services",
    description: "Real Instagram and TikTok followers, likes, comments, shares and views. Account recovery, business assets and validated email packs.",
    serviceType: "Social media growth",
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: { "@type": "Place", name: "Worldwide" },
    offers: aggregateOffer ?? undefined,
  };

  return toJsonLdGraph([organization, website, service]);
}

// categorySlugEn — versão "en" do slug, sem precisar importar i18n/categories
// e arrastar mais dependências pro lib/. Mapeamento espelha categorySlug(en).
function categorySlugEn(cat: string): string {
  const map: Record<string, string> = {
    seguidores_instagram: "instagram-followers",
    seguidores_tiktok: "tiktok-followers",
    curtidas_instagram: "instagram-likes",
    curtidas_tiktok: "tiktok-likes",
    comentarios_instagram: "instagram-comments",
    comentarios_tiktok: "tiktok-comments",
    compartilhamentos_instagram: "instagram-shares",
    compartilhamentos_tiktok: "tiktok-shares",
    visualizacoes_instagram: "instagram-views",
    visualizacoes_tiktok: "tiktok-views",
    servicos: "services",
    recuperacao_perfil: "account-recovery",
  };
  return map[cat] ?? cat;
}

export function buildCountryJsonLd(country: Country, plans: Plan[], siteUrl: string) {
  const pageUrl = `${siteUrl}/${country.code}`;
  const logoUrl = `${siteUrl}/logo.png`;

  // Offers — uma por plano, com moeda preferencial e info de região.
  // Inclui shipping + return policy pra qualificar como Merchant Listing
  // rich result no Google (sem isso, items ficam inválidos no GSC).
  const enhancements = buildOfferEnhancements(country.code);
  const offers = plans.map((p) => {
    const priced = pickOfferCurrency(p.prices) ?? { code: "USD", amount: (p.price_cents / 100).toFixed(2) };
    return {
      "@type": "Offer",
      name: p.name,
      sku: p.id,
      price: priced.amount,
      priceCurrency: priced.code,
      url: pageUrl,
      availability: "https://schema.org/InStock",
      eligibleRegion: { "@type": "Country", name: country.name },
      // priceValidUntil (1 ano a partir de agora) atende validação do Google
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      ...enhancements,
    };
  });

  // AggregateOffer: filtra na moeda canônica do agregado (a primeira oferta
  // define a moeda de display). Helper trata non-numéricos/zero e omite o
  // bloco se nada sobra. BUG-192.
  const firstOfferCurrency = offers[0]?.priceCurrency ?? "USD";
  const aggregateOffer = buildAggregateOffer(offers, { priceCurrency: firstOfferCurrency });

  // @graph wrapper canônico — ver buildHomeJsonLd pra detalhe da decisão.
  const organization = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Viralefy",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 2471,
      height: 704,
    },
    // sameAs intencionalmente omitido (ver buildHomeJsonLd).
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["en", "pt", "es", "fr", "de", "it", "nl", "ru", "ja", "ar"],
      url: `${siteUrl}/legal/contact?lang=en`,
    },
  };

  const website = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Viralefy",
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: country.htmlLang,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/{country_code}`,
      },
      "query-input": "required name=country_code",
    },
  };

  const webpage = {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: country.title,
    description: country.description,
    inLanguage: country.htmlLang,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
    // Datas explícitas (antes Ahrefs reportava "Publicado/Modificado Ausente").
    // datePublished = launch HML; dateModified = build atual (force-dynamic).
    datePublished: "2026-01-01T00:00:00Z",
    dateModified: new Date().toISOString(),
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: country.name, item: pageUrl },
    ],
  };

  const service = {
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: country.h1,
    description: country.description,
    serviceType: "Social media growth",
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: { "@type": "Country", name: country.name },
    // `inLanguage` não é válido em Service (só em CreativeWork e subtipos).
    // O idioma desta página já é declarado pelo WebPage acima — o Google
    // junta os dois nós via @id e atribui o idioma ao serviço por inferência.
    offers: aggregateOffer ?? undefined,
  };

  return toJsonLdGraph([organization, website, webpage, breadcrumb, service]);
}
