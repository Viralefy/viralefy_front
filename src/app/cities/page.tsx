import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { CITIES, REGION_LABEL, REGION_ORDER, citiesByRegion } from "@/lib/cities";
import { Flag } from "@/components/Flag";

// Programmatic SEO hub: lista as 50 cidades top agrupadas por região.

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata(): Promise<Metadata> {
  const url = siteUrl();
  const meta = indexableMeta();
  const title = "Buy Instagram & TikTok followers in your city — 50 markets | Viralefy";
  const description =
    "City-targeted Instagram and TikTok growth packages across 50 top markets — New York, London, Tokyo, São Paulo, Dubai and more. Real audience, instant delivery.";
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: "/cities",
      languages: { "x-default": "/cities", en: "/cities" },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title,
      description,
      locale: "en_US",
      type: "website",
      url: `${url}/cities`,
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
  };
}

export default function CitiesHub() {
  const url = siteUrl();
  const pageUrl = `${url}/cities`;
  const grouped = citiesByRegion();

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${pageUrl}#collection`,
      name: "Viralefy — Cities",
      url: pageUrl,
      description: "City-targeted Instagram and TikTok growth packages across 50 top markets.",
      inLanguage: "en",
      isPartOf: { "@id": `${url}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: "Cities", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${pageUrl}#itemlist`,
      name: "Top 50 cities",
      numberOfItems: CITIES.length,
      itemListElement: CITIES.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        url: `${url}/cities/${c.slug}`,
      })),
    },
  ];

  return (
    <>
      {jsonld.map((doc, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }} />
      ))}

      <article lang="en">
        <header className="hero container" style={{ textAlign: "center", maxWidth: 880, margin: "0 auto", padding: "3rem 1rem 1.5rem" }}>
          <h1 style={{ fontSize: "2.4rem", lineHeight: 1.15, margin: "0 0 1rem" }}>
            Buy Instagram &amp; TikTok followers in your city
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", margin: "0 auto", maxWidth: 640 }}>
            Localized growth packages across 50 top creator markets. Pick your city to see plans, pricing and delivery details tailored to your audience.
          </p>
        </header>

        <main className="container" style={{ maxWidth: 1200, paddingBottom: "4rem" }}>
          {REGION_ORDER.filter((r) => grouped[r].length > 0).map((region) => (
            <section key={region} style={{ marginTop: "2.5rem" }}>
              <h2 style={{ fontSize: "1.3rem", margin: "0 0 1rem", color: "var(--text)" }}>{REGION_LABEL[region]}</h2>
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

      <Footer lang="en" compact />
    </>
  );
}
