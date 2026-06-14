import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { HELP_CATEGORIES, HELP_TOPICS, helpTopicsByCategory } from "@/lib/help";
import { withGlobalGraph } from "@/lib/jsonld";

// Help center hub. EN-only por enquanto, standalone (sem variantes por país).

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata(): Promise<Metadata> {
  const meta = indexableMeta();
  const title = "Help center — buying, delivery, payments and refunds | Viralefy";
  const description =
    "Plain-English answers about buying Instagram and TikTok engagement on Viralefy: delivery windows, refill guarantee, payment methods, account safety and refunds.";
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: "/help",
      languages: { "x-default": "/help", en: "/help" },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title,
      description,
      url: `${siteUrl()}/help`,
      locale: "en_US",
      type: "website",
      siteName: "Viralefy",
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
  };
}

export default function HelpHub() {
  const url = siteUrl();
  const pageUrl = `${url}/help`;

  // BUG-191 / Track Y: Organization + WebSite + CollectionPage + Breadcrumb
  // + ItemList em UM @graph via withGlobalGraph (ver lib/jsonld.ts).
  const jsonld = withGlobalGraph(
    [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        name: "Viralefy Help center",
        url: pageUrl,
        description:
          "Help articles for Viralefy customers — buying plans, delivery timing, refill guarantee, payment methods, account safety and refunds.",
        inLanguage: "en",
        isPartOf: { "@id": `${url}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: url },
          { "@type": "ListItem", position: 2, name: "Help center", item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemlist`,
        name: "Help articles",
        numberOfItems: HELP_TOPICS.length,
        itemListElement: HELP_TOPICS.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.title,
          url: `${url}/help/${t.slug}`,
        })),
      },
    ],
    { siteUrl: url, inLanguage: "en" },
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />

      <article lang="en">
        <header className="hero container" style={{ paddingTop: "2.5rem", paddingBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
            <Link href="/">← Home</Link>
          </p>
          <h1 style={{ marginBottom: "0.4rem" }}>Help center</h1>
          <p style={{ color: "var(--muted)", maxWidth: 680 }}>
            Short, factual answers about buying Instagram and TikTok engagement plans on Viralefy: delivery windows,
            refill guarantee, payment methods, account safety and refunds.
          </p>
        </header>

        <main className="container" style={{ paddingBottom: "4rem", maxWidth: 1100 }}>
          {HELP_CATEGORIES.map((cat) => {
            const topics = helpTopicsByCategory(cat.code);
            if (topics.length === 0) return null;
            return (
              <section key={cat.code} style={{ marginBottom: "2.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{cat.label}</h2>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 0, marginBottom: "1rem" }}>
                  {cat.blurb}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  {topics.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/help/${t.slug}`}
                      className="card"
                      style={{ textDecoration: "none", color: "var(--text)" }}
                    >
                      <h3 style={{ fontSize: "1rem", marginTop: 0, marginBottom: "0.35rem" }}>{t.title}</h3>
                      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                        {t.intro.slice(0, 140)}…
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </main>
      </article>

      <Footer lang="en" compact />
    </>
  );
}
