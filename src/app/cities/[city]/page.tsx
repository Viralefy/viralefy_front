import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { CITIES, getCity } from "@/lib/cities";
import { Flag } from "@/components/Flag";
import { categorySlug } from "@/i18n/categories";
import type { LangCode } from "@/i18n/languages";

// BUG-89 (QA 2026-06-13): página rodava só em EN mesmo em /br/cities/...
// Agora detecta lang via header x-locale e usa pack PT mínimo + fallback EN.
// Track C escolheu pack mínimo (strings principais: hero, breadcrumb, CTAs,
// USPs/feature bullets, schema). Os 4 parágrafos longos de body copy ficam
// como débito: traduzi-los exige revisão de copywriter (preço por cidade,
// landmarks locais em PT, etc.) — encerrar isso em PT é trivial mas merece
// QA dedicado.

type PageLang = "pt" | "en";

async function resolveLang(): Promise<PageLang> {
  const h = await headers();
  const locale = h.get("x-locale") || "en";
  if (locale.toLowerCase().startsWith("pt")) return "pt";
  return "en";
}

function schemaLang(lang: PageLang): string {
  return lang === "pt" ? "pt-BR" : "en";
}
function ogLocale(lang: PageLang): string {
  return lang === "pt" ? "pt_BR" : "en_US";
}

type CityPack = {
  metaTitle: (city: string) => string;
  metaDescription: (city: string) => string;
  heroTitle: (city: string) => string;
  heroSubtitle: (city: string) => string;
  ctaSeePlans: (city: string) => string;
  ctaAllCities: string;
  breadcrumbHome: string;
  breadcrumbCities: string;
  whyHeading: (city: string) => string;
  bullets: (city: string, country: string) => string[];
  readyHeading: (city: string) => string;
  readyBody: (country: string) => string;
  readyCta: string;
  bodyP1: (city: string, hoods: string, landmark: string) => string;
  bodyP2: (city: string, population: string) => string;
  bodyP3: string;
  bodyP4: (city: string, hoods: string) => string;
  schemaWebPageName: (city: string) => string;
  schemaServiceName: (city: string) => string;
};

const CITY_T: Record<"pt" | "en", CityPack> = {
  en: {
    metaTitle: (city) => `Buy Instagram followers in ${city} — local growth | Viralefy`,
    metaDescription: (city) =>
      `Grow your Instagram and TikTok in ${city}. Real followers, likes and views with delivery tuned to local time zones. Pay in USDT/USD and ship in minutes.`,
    heroTitle: (city) => `Buy Instagram followers in ${city}`,
    heroSubtitle: (city) =>
      `Local audience, real engagement, instant delivery — built for creators and brands across ${city}.`,
    ctaSeePlans: (city) => `See ${city} plans`,
    ctaAllCities: "All cities",
    breadcrumbHome: "Home",
    breadcrumbCities: "Cities",
    whyHeading: (city) => `Why creators in ${city} pick Viralefy`,
    bullets: (city) => [
      "Real-looking accounts with profile photos, bios and posting history — no bot signatures.",
      `Delivery drip tuned to ${city} time zone so growth lands during local peak hours.`,
      "USDT/USD pricing — no FX surprises, no card data, no chargebacks.",
      "Refill guarantee against drops for 30 days on every follower package.",
      "Same dashboard for Instagram, TikTok, and recovery requests.",
      `Support in English plus the primary local language of ${city}.`,
    ],
    readyHeading: (city) => `Ready to grow in ${city}?`,
    readyBody: (country) =>
      `Pick a plan tuned to the ${country} market — followers, likes or views, delivered today.`,
    readyCta: "View Instagram follower plans",
    bodyP1: (city, hoods, landmark) =>
      `Whether you are a creator filming around ${landmark}, a small brand pushing pop-ups through ${hoods}, or an agency scaling client accounts across ${city}, audience density is the bottleneck. Viralefy ships Instagram followers, likes, comments and TikTok views with delivery windows aligned to your local time zone — so new social proof lands when your local audience is actually online.`,
    bodyP2: (city, population) =>
      `${city} is one of the most competitive feeds in the world. With more than ${population} residents and a dense creator economy, breaking the algorithm's warm-up phase without an initial push is brutal. Our starter packs cover that gap: a measured ramp of real-looking accounts that earns your post into the explore tab, then organic engagement compounds from there.`,
    bodyP3:
      "Every order is paid in USDT or USD, settled on-chain so there are no chargebacks and no exposed card data. Delivery starts within minutes of confirmation and finishes over hours or days depending on package size — the slow drip is intentional, it mirrors organic patterns so platform safety systems treat the growth as normal. You can monitor delivery from your dashboard and pause or top up any time.",
    bodyP4: (city, hoods) =>
      `The ${city} market trades on aesthetic — what wins in ${hoods} won't win in a suburban feed two cities over. We don't pretend to fix your content. What we do is remove the cold-start tax so the content you already make gets the surface area it deserves. If you are unsure which package fits your stage, our team answers tickets in English and the city's main language.`,
    schemaWebPageName: (city) => `Buy Instagram followers in ${city}`,
    schemaServiceName: (city) => `Instagram & TikTok growth in ${city}`,
  },
  pt: {
    metaTitle: (city) =>
      `Comprar seguidores no Instagram em ${city} — crescimento local | Viralefy`,
    metaDescription: (city) =>
      `Cresça no Instagram e TikTok em ${city}. Seguidores, curtidas e visualizações reais com entrega ajustada ao fuso local. Pague em USDT/USD com entrega em minutos.`,
    heroTitle: (city) => `Comprar seguidores no Instagram em ${city}`,
    heroSubtitle: (city) =>
      `Público local, engajamento real e entrega rápida — feito para criadores e marcas em ${city}.`,
    ctaSeePlans: (city) => `Ver planos para ${city}`,
    ctaAllCities: "Todas as cidades",
    breadcrumbHome: "Início",
    breadcrumbCities: "Cidades",
    whyHeading: (city) => `Por que criadores em ${city} escolhem a Viralefy`,
    bullets: (city) => [
      "Contas com cara de real — foto, bio e histórico de posts. Sem assinatura de bot.",
      `Entrega gota a gota alinhada ao fuso de ${city}, no horário de pico do público local.`,
      "Preços em USDT/USD — sem surpresa cambial, sem dados de cartão, sem chargeback.",
      "Reposição garantida por 30 dias contra quedas em todo pacote de seguidores.",
      "Mesmo painel para Instagram, TikTok e pedidos de reposição.",
      `Atendimento em inglês e no idioma principal de ${city}.`,
    ],
    readyHeading: (city) => `Pronto para crescer em ${city}?`,
    readyBody: (country) =>
      `Escolha um plano ajustado ao mercado ${country} — seguidores, curtidas ou visualizações entregues hoje.`,
    readyCta: "Ver planos de seguidores no Instagram",
    bodyP1: (city, hoods, landmark) =>
      `Seja você um criador gravando perto de ${landmark}, uma marca pequena promovendo pop-ups por ${hoods} ou uma agência escalando contas de clientes em ${city}, a densidade do público é o gargalo. A Viralefy entrega seguidores, curtidas e comentários no Instagram e visualizações no TikTok com janelas de entrega alinhadas ao seu fuso — para que a nova prova social caia quando o seu público local realmente está online.`,
    bodyP2: (city, population) =>
      `${city} é um dos feeds mais competitivos do mundo. Com mais de ${population} habitantes e uma economia criadora densa, quebrar a fase de aquecimento do algoritmo sem um empurrão inicial é brutal. Nossos pacotes iniciais cobrem esse intervalo: uma escalada medida de contas com cara de real que leva seu post ao explorar, e daí o engajamento orgânico se acumula.`,
    bodyP3:
      "Todo pedido é pago em USDT ou USD, liquidado on-chain — sem chargeback e sem expor dados de cartão. A entrega começa em minutos após a confirmação e termina ao longo de horas ou dias, dependendo do tamanho do pacote. O drip lento é proposital: imita o padrão orgânico para que os sistemas de segurança da plataforma tratem o crescimento como normal. Você acompanha tudo pelo painel e pode pausar ou complementar a qualquer momento.",
    bodyP4: (city, hoods) =>
      `O mercado de ${city} se move pela estética — o que vence em ${hoods} não vence num feed suburbano a duas cidades de distância. A gente não promete consertar o seu conteúdo. O que a gente faz é remover o pedágio do cold-start para que o conteúdo que você já produz tenha a superfície de exibição que merece. Em dúvida sobre qual pacote serve para o seu momento, a equipe responde tickets em inglês e no idioma principal da cidade.`,
    schemaWebPageName: (city) => `Comprar seguidores no Instagram em ${city}`,
    schemaServiceName: (city) => `Crescimento no Instagram e TikTok em ${city}`,
  },
};

// Programmatic SEO city LP. 50 rotas estáticas; cada uma fala da cidade
// com bairros/landmarks reais antes de redirecionar pro funnel do país.

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Bairros/landmarks plausíveis (factual) — usados na cópia. Cidades sem
// entrada caem num parágrafo genérico baseado em região.
const LOCAL_FLAVOR: Record<string, { neighborhoods: string[]; landmark: string }> = {
  "new-york-city": { neighborhoods: ["Manhattan", "Brooklyn", "Queens", "Williamsburg"], landmark: "Times Square" },
  "los-angeles": { neighborhoods: ["Hollywood", "Venice Beach", "Santa Monica", "Silver Lake"], landmark: "the Hollywood Sign" },
  "chicago": { neighborhoods: ["the Loop", "Wicker Park", "Lincoln Park"], landmark: "Millennium Park" },
  "houston": { neighborhoods: ["Montrose", "Midtown", "the Heights"], landmark: "Buffalo Bayou" },
  "miami": { neighborhoods: ["South Beach", "Wynwood", "Brickell"], landmark: "Ocean Drive" },
  "toronto": { neighborhoods: ["Queen West", "Yorkville", "Kensington Market"], landmark: "the CN Tower" },
  "vancouver": { neighborhoods: ["Gastown", "Yaletown", "Kitsilano"], landmark: "Stanley Park" },
  "london": { neighborhoods: ["Shoreditch", "Camden", "Soho", "Notting Hill"], landmark: "the Thames" },
  "manchester": { neighborhoods: ["the Northern Quarter", "Ancoats", "Deansgate"], landmark: "Manchester Piccadilly" },
  "birmingham-uk": { neighborhoods: ["Digbeth", "the Jewellery Quarter"], landmark: "the Bullring" },
  "paris": { neighborhoods: ["Le Marais", "Saint-Germain", "Montmartre", "the 11th"], landmark: "the Seine" },
  "lyon": { neighborhoods: ["Vieux Lyon", "Croix-Rousse", "Confluence"], landmark: "the Saône riverfront" },
  "marseille": { neighborhoods: ["Le Panier", "Cours Julien"], landmark: "the Vieux-Port" },
  "madrid": { neighborhoods: ["Malasaña", "Chueca", "La Latina"], landmark: "Gran Vía" },
  "barcelona": { neighborhoods: ["El Born", "Gràcia", "Poblenou"], landmark: "Las Ramblas" },
  "berlin": { neighborhoods: ["Kreuzberg", "Neukölln", "Mitte", "Prenzlauer Berg"], landmark: "the Spree" },
  "munich": { neighborhoods: ["Schwabing", "Maxvorstadt", "Glockenbach"], landmark: "the Englischer Garten" },
  "hamburg": { neighborhoods: ["St. Pauli", "Sternschanze", "HafenCity"], landmark: "the Elbphilharmonie" },
  "rome": { neighborhoods: ["Trastevere", "Monti", "Testaccio"], landmark: "the Tiber" },
  "milan": { neighborhoods: ["Brera", "Navigli", "Porta Nuova"], landmark: "the Duomo" },
  "amsterdam": { neighborhoods: ["De Pijp", "Jordaan", "Oud-West"], landmark: "the canal ring" },
  "brussels": { neighborhoods: ["Ixelles", "Saint-Gilles", "Sainte-Catherine"], landmark: "the Grand Place" },
  "dublin": { neighborhoods: ["Temple Bar", "Portobello", "Stoneybatter"], landmark: "the Liffey" },
  "lisbon": { neighborhoods: ["Bairro Alto", "Alfama", "Príncipe Real"], landmark: "the Tagus" },
  "vienna": { neighborhoods: ["Neubau", "Leopoldstadt", "Mariahilf"], landmark: "the Ringstraße" },
  "zurich": { neighborhoods: ["Kreis 4", "Kreis 5", "Niederdorf"], landmark: "Lake Zurich" },
  "stockholm": { neighborhoods: ["Södermalm", "Vasastan", "Östermalm"], landmark: "Gamla Stan" },
  "copenhagen": { neighborhoods: ["Vesterbro", "Nørrebro", "Christianshavn"], landmark: "Nyhavn" },
  "warsaw": { neighborhoods: ["Praga", "Powiśle", "Mokotów"], landmark: "the Vistula" },
  "sydney": { neighborhoods: ["Surry Hills", "Newtown", "Bondi"], landmark: "the Opera House" },
  "melbourne": { neighborhoods: ["Fitzroy", "Brunswick", "St Kilda"], landmark: "the Yarra" },
  "sao-paulo": { neighborhoods: ["Vila Madalena", "Pinheiros", "Jardins", "Itaim"], landmark: "Avenida Paulista" },
  "rio-de-janeiro": { neighborhoods: ["Ipanema", "Leblon", "Copacabana", "Botafogo"], landmark: "Sugarloaf" },
  "mexico-city": { neighborhoods: ["Roma", "Condesa", "Polanco", "Coyoacán"], landmark: "the Zócalo" },
  "buenos-aires": { neighborhoods: ["Palermo", "Recoleta", "San Telmo"], landmark: "the Obelisco" },
  "bogota": { neighborhoods: ["Chapinero", "La Candelaria", "Usaquén"], landmark: "Monserrate" },
  "santiago": { neighborhoods: ["Providencia", "Bellavista", "Lastarria"], landmark: "Cerro San Cristóbal" },
  "lima": { neighborhoods: ["Miraflores", "Barranco", "San Isidro"], landmark: "the Malecón" },
  "dubai": { neighborhoods: ["Downtown", "Dubai Marina", "JBR", "Business Bay"], landmark: "the Burj Khalifa" },
  "riyadh": { neighborhoods: ["Olaya", "Al Malqa", "Diplomatic Quarter"], landmark: "Kingdom Centre" },
  "tel-aviv": { neighborhoods: ["Florentin", "Neve Tzedek", "Rothschild"], landmark: "the Tayelet" },
  "istanbul": { neighborhoods: ["Beyoğlu", "Karaköy", "Kadıköy"], landmark: "the Bosphorus" },
  "cairo": { neighborhoods: ["Zamalek", "Maadi", "Downtown"], landmark: "the Nile" },
  "mumbai": { neighborhoods: ["Bandra", "Andheri", "Lower Parel"], landmark: "Marine Drive" },
  "delhi": { neighborhoods: ["Hauz Khas", "Connaught Place", "Saket"], landmark: "India Gate" },
  "bangalore": { neighborhoods: ["Indiranagar", "Koramangala", "HSR Layout"], landmark: "Cubbon Park" },
  "tokyo": { neighborhoods: ["Shibuya", "Shinjuku", "Harajuku", "Daikanyama"], landmark: "the Shibuya Crossing" },
  "seoul": { neighborhoods: ["Gangnam", "Hongdae", "Itaewon", "Seongsu"], landmark: "the Han River" },
  "singapore": { neighborhoods: ["Tiong Bahru", "Tanjong Pagar", "Holland Village"], landmark: "Marina Bay" },
  "bangkok": { neighborhoods: ["Sukhumvit", "Thonglor", "Ari"], landmark: "the Chao Phraya" },
};

export async function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return { title: "City not found" };

  const url = siteUrl();
  const meta = indexableMeta();
  const lang = await resolveLang();
  const tt = CITY_T[lang];
  const title = tt.metaTitle(city.name);
  const description = tt.metaDescription(city.name);
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/cities/${city.slug}`,
      languages: {
        "x-default": `/cities/${city.slug}`,
        en: `/cities/${city.slug}`,
        "pt-BR": `/cities/${city.slug}`,
      },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title,
      description,
      locale: ogLocale(lang),
      type: "article",
      url: `${url}/cities/${city.slug}`,
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
  };
}

function neighborhoodsText(slug: string, city: string): { hoods: string; landmark: string } {
  const flavor = LOCAL_FLAVOR[slug];
  if (!flavor) return { hoods: `central ${city}`, landmark: `${city}` };
  const list = flavor.neighborhoods;
  const last = list[list.length - 1];
  const head = list.slice(0, -1).join(", ");
  return { hoods: list.length > 1 ? `${head} and ${last}` : last, landmark: flavor.landmark };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();

  const url = siteUrl();
  const pageUrl = `${url}/cities/${city.slug}`;
  const lang = await resolveLang();
  const tt = CITY_T[lang];
  // Locale do toLocaleString segue lang (BUG-89): em PT vira "12.300.000".
  const populationFmt = city.population.toLocaleString(lang === "pt" ? "pt-BR" : "en-US");
  // BUG-90/163 do QA 2026-06-12: ctaHref apontava pra alias EN
  // (/br/instagram-followers) que gerava conteúdo duplicado sem 301 — o
  // canonical próprio mascarava o problema. Agora gera o slug localizado
  // a partir do htmlLang da cidade.
  const cityLang = (city.htmlLang.split("-")[0] || "en") as LangCode;
  const ctaSlug = categorySlug("seguidores_instagram", cityLang);
  const ctaHref = `/${city.country}/${ctaSlug}`;
  const { hoods, landmark } = neighborhoodsText(city.slug, city.name);

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      name: tt.schemaWebPageName(city.name),
      url: pageUrl,
      inLanguage: schemaLang(lang),
      isPartOf: { "@id": `${url}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tt.breadcrumbHome, item: url },
        { "@type": "ListItem", position: 2, name: tt.breadcrumbCities, item: `${url}/cities` },
        { "@type": "ListItem", position: 3, name: city.name, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: tt.schemaServiceName(city.name),
      serviceType: "Social media growth",
      provider: {
        "@type": "Organization",
        name: "Viralefy",
        url,
      },
      areaServed: {
        "@type": "Place",
        name: city.name,
        address: { "@type": "PostalAddress", addressCountry: city.country.toUpperCase() },
      },
      url: pageUrl,
    },
  ];

  return (
    <>
      {jsonld.map((doc, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }} />
      ))}

      <article lang={schemaLang(lang)}>
        {/* BUG-164 do QA 2026-06-12: páginas de cidade não tinham breadcrumb,
            quebrando navegação contextual + Schema breadcrumb estava ausente. */}
        <nav aria-label="Breadcrumb" className="container" style={{ paddingTop: "0.75rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <ol style={{ listStyle: "none", display: "flex", gap: "0.5rem", padding: 0, flexWrap: "wrap" }}>
            <li><Link href="/">{tt.breadcrumbHome}</Link></li>
            <li aria-hidden>›</li>
            <li><Link href="/cities">{tt.breadcrumbCities}</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">{city.name}</li>
          </ol>
        </nav>
        <header className="hero container" style={{ textAlign: "center", maxWidth: 820, margin: "0 auto", padding: "1.5rem 1rem 1.5rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <Flag code={city.country} width={80} title={city.name} style={{ borderRadius: "4px" }} />
          </div>
          <h1 style={{ fontSize: "2.4rem", lineHeight: 1.15, margin: "0 0 1rem" }}>
            {tt.heroTitle(city.name)}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", margin: "0 auto", maxWidth: 640 }}>
            {tt.heroSubtitle(city.name)}
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={ctaHref} className="btn btn-primary">{tt.ctaSeePlans(city.name)}</Link>
            <Link href="/cities" className="btn btn-outline">{tt.ctaAllCities}</Link>
          </div>
        </header>

        <main className="container" style={{ maxWidth: 820, paddingBottom: "4rem" }}>
          <section style={{ marginTop: "2rem", lineHeight: 1.7, color: "var(--text)" }}>
            <p>{tt.bodyP1(city.name, hoods, landmark)}</p>
            <p>{tt.bodyP2(city.name, populationFmt)}</p>
            <p>{tt.bodyP3}</p>
            <p>{tt.bodyP4(city.name, hoods)}</p>
          </section>

          <section style={{ marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.3rem", margin: "0 0 1rem" }}>{tt.whyHeading(city.name)}</h2>
            <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.7, color: "var(--text)" }}>
              {tt.bullets(city.name, city.country.toUpperCase()).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </section>

          <section className="card" style={{ marginTop: "2.5rem", padding: "1.5rem", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem" }}>{tt.readyHeading(city.name)}</h2>
            <p style={{ color: "var(--muted)", margin: "0 0 1.25rem" }}>
              {tt.readyBody(city.country.toUpperCase())}
            </p>
            <Link href={ctaHref} className="btn btn-primary">{tt.readyCta}</Link>
          </section>
        </main>
      </article>

      <Footer lang={lang} compact />
    </>
  );
}
