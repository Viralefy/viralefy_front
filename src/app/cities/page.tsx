import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { CITIES, REGION_LABEL, REGION_ORDER, citiesByRegion } from "@/lib/cities";
import { withGlobalGraph } from "@/lib/jsonld";
import { Flag } from "@/components/Flag";

// Programmatic SEO hub: lista as 50 cidades top agrupadas por região.
//
// BUG-89 / BUG-50 (QA round 22): página era hard-coded EN; agora resolve
// PT/ES via header `x-locale` setado pelo middleware. EN segue como fallback.

type PageLang = "pt" | "en" | "es";

async function resolveLang(): Promise<PageLang> {
  const h = await headers();
  const locale = (h.get("x-locale") || "en").toLowerCase();
  if (locale.startsWith("pt")) return "pt";
  if (locale.startsWith("es")) return "es";
  return "en";
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

type RegionKey = keyof typeof REGION_LABEL;
const TEXT: Record<PageLang, {
  metaTitle: string;
  metaDesc: string;
  h1: string;
  intro: string;
  regions: Record<RegionKey, string>;
  topNCities: string;
  bcHome: string;
  bcCities: string;
}> = {
  pt: {
    metaTitle: "Comprar seguidores Instagram e TikTok na sua cidade — 50 mercados | Viralefy",
    metaDesc:
      "Pacotes de crescimento Instagram e TikTok com foco em cidade — Nova York, Londres, Tóquio, São Paulo, Dubai e mais. Audiência real, entrega rápida.",
    h1: "Comprar seguidores Instagram & TikTok na sua cidade",
    intro:
      "Pacotes de crescimento localizados em 50 mercados criadores. Escolha sua cidade pra ver planos, preços e detalhes de entrega calibrados pela sua audiência.",
    regions: {
      americas: "Américas",
      europe: "Europa",
      asia: "Ásia",
      mena: "Oriente Médio & Norte da África",
      africa: "África",
      oceania: "Oceania",
    },
    topNCities: "Top 50 cidades",
    bcHome: "Início",
    bcCities: "Cidades",
  },
  en: {
    metaTitle: "Buy Instagram & TikTok followers in your city — 50 markets | Viralefy",
    metaDesc:
      "City-targeted Instagram and TikTok growth packages across 50 top markets — New York, London, Tokyo, São Paulo, Dubai and more. Real audience, instant delivery.",
    h1: "Buy Instagram & TikTok followers in your city",
    intro:
      "Localized growth packages across 50 top creator markets. Pick your city to see plans, pricing and delivery details tailored to your audience.",
    regions: REGION_LABEL,
    topNCities: "Top 50 cities",
    bcHome: "Home",
    bcCities: "Cities",
  },
  es: {
    metaTitle: "Comprar seguidores Instagram y TikTok en tu ciudad — 50 mercados | Viralefy",
    metaDesc:
      "Paquetes de crecimiento de Instagram y TikTok enfocados por ciudad — Nueva York, Londres, Tokio, São Paulo, Dubái y más. Audiencia real, entrega rápida.",
    h1: "Comprar seguidores Instagram & TikTok en tu ciudad",
    intro:
      "Paquetes de crecimiento localizados en 50 mercados creadores. Elige tu ciudad para ver planes, precios y detalles de entrega ajustados a tu audiencia.",
    regions: {
      americas: "Américas",
      europe: "Europa",
      asia: "Asia",
      mena: "Oriente Medio y Norte de África",
      africa: "África",
      oceania: "Oceanía",
    },
    topNCities: "Top 50 ciudades",
    bcHome: "Inicio",
    bcCities: "Ciudades",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const url = siteUrl();
  const meta = indexableMeta();
  const lang = await resolveLang();
  const t = TEXT[lang];
  const localeOg = lang === "pt" ? "pt_BR" : lang === "es" ? "es_ES" : "en_US";
  return {
    title: { absolute: t.metaTitle },
    description: t.metaDesc,
    alternates: {
      canonical: "/cities",
      languages: { "x-default": "/cities", en: "/cities" },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title: t.metaTitle,
      description: t.metaDesc,
      locale: localeOg,
      type: "website",
      url: `${url}/cities`,
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
  };
}

export default async function CitiesHub() {
  const lang = await resolveLang();
  const t = TEXT[lang];
  const url = siteUrl();
  const pageUrl = `${url}/cities`;
  const grouped = citiesByRegion();

  const jsonld = withGlobalGraph(
    [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        name: "Viralefy — Cities",
        url: pageUrl,
        description: t.metaDesc,
        inLanguage: lang,
        isPartOf: { "@id": `${url}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.bcHome, item: url },
          { "@type": "ListItem", position: 2, name: t.bcCities, item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemlist`,
        name: t.topNCities,
        numberOfItems: CITIES.length,
        itemListElement: CITIES.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          url: `${url}/cities/${c.slug}`,
        })),
      },
    ],
    { siteUrl: url, inLanguage: lang },
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />

      <article lang={lang}>
        <header className="hero container" style={{ textAlign: "center", maxWidth: 880, margin: "0 auto", padding: "3rem 1rem 1.5rem" }}>
          <h1 style={{ fontSize: "2.4rem", lineHeight: 1.15, margin: "0 0 1rem" }}>{t.h1}</h1>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", margin: "0 auto", maxWidth: 640 }}>{t.intro}</p>
        </header>

        <main className="container" style={{ maxWidth: 1200, paddingBottom: "4rem" }}>
          {REGION_ORDER.filter((r) => grouped[r].length > 0).map((region) => (
            <section key={region} style={{ marginTop: "2.5rem" }}>
              <h2 style={{ fontSize: "1.3rem", margin: "0 0 1rem", color: "var(--text)" }}>
                {t.regions[region] ?? REGION_LABEL[region]}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                {grouped[region].map((city) => (
                  <Link
                    key={city.slug}
                    href={`/cities/${city.slug}`}
                    className="card"
                    style={{ textDecoration: "none", color: "var(--text)", display: "flex", flexDirection: "column", gap: "0.25rem", padding: "1rem" }}
                  >
                    <Flag code={city.country} width={40} title={city.name} />
                    <strong style={{ fontSize: "1rem" }}>{city.name}</strong>
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      {city.country.toUpperCase()} · {(city.population / 1_000_000).toFixed(1)}M
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </main>
      </article>

      <Footer lang={lang} compact />
    </>
  );
}
