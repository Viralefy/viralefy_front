import type { Metadata } from "next";
import Link from "next/link";
import type { Plan } from "@/lib/api";
import { COUNTRIES, countriesByRegion, type Region } from "@/i18n/countries";
import { CategoryGroupedGrid } from "@/components/CategoryGroupedGrid";
import { Footer } from "@/components/Footer";
import { TrustSignals } from "@/components/TrustSignals";
import { tr } from "@/i18n/languages";

// Home global. Inglês "international" — atende quem chega sem cookie de
// idioma/país detectado. Conteúdo focado em "global followers" + lista de
// mercados para CTR para subsites por país.
//
// `/` é a entrada canônica para `en` na hreflang.

export const dynamic = "force-dynamic";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export const metadata: Metadata = {
  // absolute = bypass do template "%s | Viralefy" do root layout, já que
  // esse título já termina em "| Viralefy" pra cuidar do SEO da home.
  title: { absolute: "Buy Instagram & TikTok followers worldwide | Viralefy" },
  description:
    "Real followers, engagement and views for Instagram and TikTok. Fast delivery, 30-day refill guarantee, support in your language. Pay in USDT, USD, EUR, BRL or crypto.",
  alternates: (() => {
    const languages: Record<string, string> = { "x-default": "/", en: "/" };
    for (const c of COUNTRIES) languages[c.htmlLang] = `/${c.code}`;
    return { canonical: "/", languages };
  })(),
  openGraph: {
    title: "Buy Instagram & TikTok followers worldwide | Viralefy",
    description:
      "Real followers, engagement and views for Instagram and TikTok. Fast delivery, 30-day refill guarantee, support in your language.",
    locale: "en_US",
    type: "website",
    url: siteUrl(),
    images: [{ url: "/og/global", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy", images: ["/og/global"] },
};

async function getPlans(): Promise<Plan[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/v1/plans`, { cache: "no-store" });
    const json = await res.json();
    return (json.data as Plan[]) ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const plans = await getPlans();
  const t = tr("en");
  const url = siteUrl();

  // JSON-LD para a home global. Organization + WebSite + ItemList dos planos.
  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Viralefy",
      url,
      logo: `${url}/logo.png`,
      sameAs: [],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Viralefy",
      url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${url}/{country}`,
        "query-input": "required name=country",
      },
    },
  ];

  return (
    <>
      {jsonld.map((doc, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }} />
      ))}

      <section className="hero container">
        <h1>{t.home.heroTitle}</h1>
        <p>{t.home.heroSubtitle}</p>
        <TrustSignals lang="en" />
      </section>

      <main className="container" style={{ paddingBottom: "4rem" }}>
        <CategoryGroupedGrid plans={plans} lang="en" countryCode="" />

        <section style={{ marginTop: "3.5rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", textAlign: "center" }}>
            {t.home.pickMarket} <span style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 400 }}>({COUNTRIES.length})</span>
          </h2>
          {([
            ["americas", "Americas"],
            ["sepa", "Europe / SEPA"],
            ["asia", "Asia"],
            ["africa", "Africa"],
            ["oceania", "Oceania"],
            ["europe_other", "Europe (other)"],
          ] as Array<[Region, string]>).map(([region, label]) => {
            const list = countriesByRegion(region);
            if (list.length === 0) return null;
            return (
              <div key={region} style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "0.5rem", textAlign: "center" }}>
                  {label} <span style={{ opacity: 0.6 }}>({list.length})</span>
                </h3>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
                  {list.map((c) => (
                    <Link
                      key={c.code}
                      href={`/${c.code}`}
                      hrefLang={c.htmlLang}
                      style={{ fontSize: "0.85rem", padding: "0.3rem 0.55rem", border: "1px solid var(--border)", borderRadius: "0.4rem", textDecoration: "none" }}
                    >
                      {c.flag} {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <Footer lang="en" />
    </>
  );
}
