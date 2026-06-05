import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { CASE_STUDIES, CASE_STUDY_DISCLAIMER } from "@/lib/case-studies";

const TITLE = "Case studies | Viralefy";
const DESCRIPTION =
  "Composite case studies showing how operators, agencies and creators use Viralefy to move real engagement metrics. Personas anonymised, numbers directional.";
const PATH = "/case-studies";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata(): Promise<Metadata> {
  const meta = indexableMeta();
  const og = "/og/case-studies";
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: {
      canonical: PATH,
      languages: { "x-default": PATH, en: PATH },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: `${siteUrl()}${PATH}`,
      locale: "en_US",
      type: "website",
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@viralefy",
      creator: "@viralefy",
      images: [og],
    },
  };
}

export default function CaseStudiesHubPage() {
  const url = siteUrl();
  const pageUrl = `${url}${PATH}`;

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: "Case studies", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Viralefy case studies",
      description: DESCRIPTION,
      url: pageUrl,
      isPartOf: { "@type": "WebSite", name: "Viralefy", url },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: CASE_STUDIES.length,
      itemListElement: CASE_STUDIES.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.title,
        url: `${url}${PATH}/${c.slug}`,
      })),
    },
  ];

  return (
    <>
      {jsonld.map((doc, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }} />
      ))}

      <article lang="en">
        <nav aria-label="Breadcrumb" className="container" style={{ paddingTop: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <ol style={{ listStyle: "none", display: "flex", gap: "0.5rem", padding: 0, flexWrap: "wrap" }}>
            <li><Link href="/">Home</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">Case studies</li>
          </ol>
        </nav>

        <header className="hero container" style={{ textAlign: "center", maxWidth: 820, marginInline: "auto" }}>
          <h1 style={{ fontSize: "2.4rem", marginBottom: "0.75rem" }}>Real growth, real numbers</h1>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.55 }}>
            Six composite case studies drawn from aggregated panel data across small businesses, e-commerce brands, agencies and creators. Identities are protected; the metrics are directional but built from real Viralefy customer cohorts.
          </p>
        </header>

        <main className="container" style={{ paddingBottom: "4rem", maxWidth: 1200 }}>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
              marginTop: "2rem",
            }}
          >
            {CASE_STUDIES.map((c) => (
              <Link
                key={c.slug}
                href={`${PATH}/${c.slug}`}
                className="card"
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  textDecoration: "none",
                  color: "inherit",
                  height: "100%",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    alignSelf: "flex-start",
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--accent)",
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    padding: "0.25rem 0.6rem",
                  }}
                >
                  {c.industry}
                </span>
                <h2 style={{ fontSize: "1.1rem", margin: 0, lineHeight: 1.35 }}>{c.title}</h2>
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Result
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent)" }}>{c.resultMetric}</div>
                </div>
              </Link>
            ))}
          </section>

          <p
            style={{
              marginTop: "2.5rem",
              padding: "1rem 1.25rem",
              borderRadius: 8,
              border: "1px dashed var(--border)",
              color: "var(--muted)",
              fontSize: "0.85rem",
              textAlign: "center",
            }}
          >
            {CASE_STUDY_DISCLAIMER}
          </p>
        </main>
      </article>

      <Footer lang="en" compact />
    </>
  );
}
