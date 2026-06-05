import type { Country } from "@/i18n/countries";
import type { AggregateRating, Plan } from "./api";

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

  const prices = offers.map((o) => parseFloat(o.price)).filter((n) => !isNaN(n));
  const low = prices.length ? Math.min(...prices).toFixed(2) : "0";
  const high = prices.length ? Math.max(...prices).toFixed(2) : "0";

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
    inLanguage: "en",
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
    offers: offers.length > 0
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: low,
          highPrice: high,
          offerCount: offers.length,
          offers,
        }
      : undefined,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, service],
  };
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
    bms_facebook: "facebook-bms",
    perfis_redes: "aged-profiles",
    emails_validados: "validated-emails",
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

  // Bucket de preços só pra AggregateOffer (mesma moeda). Pega o primeiro plano
  // pra definir a moeda de display do agregado.
  const firstOfferCurrency = offers[0]?.priceCurrency ?? "USD";
  const sameCurrencyOffers = offers.filter((o) => o.priceCurrency === firstOfferCurrency);
  const prices = sameCurrencyOffers.map((o) => parseFloat(o.price)).filter((n) => !isNaN(n));
  const low = prices.length ? Math.min(...prices).toFixed(2) : "0";
  const high = prices.length ? Math.max(...prices).toFixed(2) : "0";

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
    offers: offers.length > 0 ? {
      "@type": "AggregateOffer",
      priceCurrency: firstOfferCurrency,
      lowPrice: low,
      highPrice: high,
      offerCount: offers.length,
      offers,
    } : undefined,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, webpage, breadcrumb, service],
  };
}
