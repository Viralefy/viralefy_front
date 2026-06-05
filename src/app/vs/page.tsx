import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { COMPETITORS } from "@/lib/competitors";

// Hub de comparações Viralefy vs competidores.

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata(): Promise<Metadata> {
  const meta = indexableMeta();
  const canonical = "/vs";
  return {
    title: { absolute: "Viralefy vs the rest — side-by-side comparisons | Viralefy" },
    description:
      "Compare Viralefy with the most popular social-engagement providers: starting price, delivery time, refill, crypto payments and 24/7 support.",
    alternates: {
      canonical,
      languages: { "x-default": canonical, en: canonical },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title: "Viralefy vs the rest — side-by-side comparisons",
      description:
        "Compare Viralefy with the most popular social-engagement providers across price, delivery and support.",
      url: `${siteUrl()}${canonical}`,
      locale: "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
  };
}

export default function VsHubPage() {
  const url = siteUrl();
  const pageUrl = `${url}/vs`;

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${pageUrl}#collection`,
      name: "Viralefy vs the rest",
      url: pageUrl,
      description: "Side-by-side comparisons between Viralefy and other social-engagement providers.",
      inLanguage: "en",
      isPartOf: { "@id": `${url}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: "Comparisons", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${pageUrl}#itemlist`,
      name: "Comparison pages",
      numberOfItems: COMPETITORS.length,
      itemListElement: COMPETITORS.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `Viralefy vs ${c.name}`,
        url: `${url}/vs/${c.slug}`,
      })),
    },
  ];

  return (
    <>
      {jsonld.map((doc, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }} />
      ))}

      <article lang="en">
        <header className="hero container">
          <h1>Viralefy vs the rest</h1>
          <p style={{ color: "var(--muted)", maxWidth: 720, margin: "0.75rem auto 0" }}>
            Honest, factual side-by-side comparisons. USDT-first pricing, 130+ market hreflang and crypto payments are
            our defaults — see how the rest of the market stacks up.
          </p>
        </header>

        <main className="container" style={{ paddingBottom: "4rem", maxWidth: 1100 }}>
          <section className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.85rem 1rem" }}>Provider</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Starting price</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Delivery window</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Refill</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Crypto</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Compare</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c) => (
                  <tr key={c.slug} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>${c.priceFloorUsd.toFixed(2)}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>{c.deliveryWindowHours}h</td>
                    <td style={{ padding: "0.85rem 1rem" }}>{c.offersRefill ? "Yes" : "No"}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>{c.cryptoPayments ? "Yes" : "No"}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <Link href={`/vs/${c.slug}`} className="btn btn-outline" style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}>
                        Viralefy vs {c.name}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "1.5rem", textAlign: "center" }}>
            Data based on public information as of {new Date().toISOString().slice(0, 10)}. Send corrections to support.
          </p>
        </main>
      </article>

      <Footer lang="en" compact />
    </>
  );
}
