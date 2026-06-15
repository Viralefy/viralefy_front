import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { CASE_STUDIES, CASE_STUDY_DISCLAIMER, getCaseStudy } from "@/lib/case-studies";
import { withGlobalGraph } from "@/lib/jsonld";
import { JsonLdScript } from "@/components/JsonLdScript";

// BUG-153/165 do QA 2026-06-12: meta description cortada no meio da frase
// (slice(0, 150)) terminava em "Pay i". Agora cortamos no último espaço
// dentro do limite e sufixamos com "…" — frase legível em qualquer SERP.
function smartTrim(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

type Params = { slug: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// ISR (round 23 Track XX): já tinha generateStaticParams (SSG). Adicionado
// revalidate=1800 pra permitir refresh em background se o dataset crescer.
export const revalidate = 1800;

export async function generateStaticParams(): Promise<Params[]> {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) return { title: "Not found" };
  const canonical = `/case-studies/${slug}`;
  const title = `${c.title} | Viralefy case study`;
  const description = smartTrim(`${c.industry} case study: ${c.challenge}`, 158);
  const meta = indexableMeta({ publishedAt: c.publishedAt, modifiedAt: c.updatedAt });
  const og = `/og/case-studies/${slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: { "x-default": canonical, en: canonical },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title,
      description,
      url: `${siteUrl()}${canonical}`,
      locale: "en_US",
      type: "article",
      siteName: "Viralefy",
      publishedTime: c.publishedAt,
      modifiedTime: c.updatedAt,
      images: [{ url: og, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@viralefy",
      creator: "@viralefy",
      images: [og],
    },
  };
}

export default async function CaseStudyDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) notFound();

  const url = siteUrl();
  const pageUrl = `${url}/case-studies/${c.slug}`;

  // BUG-191: consolida BreadcrumbList + Article em UM @graph.
  // Track CC: withGlobalGraph prepende Org+WebSite. Article.author/publisher
  // referenciam Organization por @id (entidade canônica).
  const jsonld = withGlobalGraph(
    [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: url },
          { "@type": "ListItem", position: 2, name: "Case studies", item: `${url}/case-studies` },
          { "@type": "ListItem", position: 3, name: c.title, item: pageUrl },
        ],
      },
      {
        "@type": "Article",
        headline: c.title,
        description: smartTrim(c.challenge, 200),
        datePublished: c.publishedAt,
        dateModified: c.updatedAt,
        mainEntityOfPage: pageUrl,
        author: { "@id": `${url}/#organization` },
        publisher: { "@id": `${url}/#organization` },
        about: c.industry,
      },
    ],
    { siteUrl: url, inLanguage: "en" },
  );

  return (
    <>
      <JsonLdScript data={jsonld} />

      <article lang="en">
        <nav aria-label="Breadcrumb" className="container" style={{ paddingTop: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          {/* BUG-152 do QA 2026-06-12: breadcrumb final mostrava categoria
              (industry) — agora mostra título do case study pra refletir a
              página atual. */}
          <ol style={{ listStyle: "none", display: "flex", gap: "0.5rem", padding: 0, flexWrap: "wrap" }}>
            <li><Link href="/">Home</Link></li>
            <li aria-hidden>›</li>
            <li><Link href="/case-studies">Case studies</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">{c.title}</li>
          </ol>
        </nav>

        <header className="hero container" style={{ maxWidth: 820, marginInline: "auto", textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--accent)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: "0.3rem 0.8rem",
              marginBottom: "1rem",
            }}
          >
            {c.industry}
          </span>
          <h1 style={{ fontSize: "2.2rem", lineHeight: 1.2, marginBottom: "0.75rem" }}>{c.title}</h1>
          <p style={{ color: "var(--muted)", fontSize: "1rem", lineHeight: 1.55 }}>{c.clientPersona}</p>
        </header>

        <main className="container" style={{ maxWidth: 760, paddingBottom: "4rem" }}>
          <section className="card" style={{ padding: "1.75rem", marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.75rem" }}>
              Challenge
            </h2>
            <p style={{ margin: 0, lineHeight: 1.65 }}>{c.challenge}</p>
          </section>

          <section className="card" style={{ padding: "1.75rem", marginTop: "1rem" }}>
            <h2 style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.75rem" }}>
              Approach
            </h2>
            <p style={{ margin: 0, lineHeight: 1.65 }}>{c.approach}</p>
          </section>

          <section
            className="card"
            style={{
              padding: "2rem 1.75rem",
              marginTop: "1rem",
              textAlign: "center",
              borderColor: "var(--accent)",
            }}
          >
            <h2 style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.75rem" }}>
              Result
            </h2>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--accent)", lineHeight: 1.05, marginBottom: "0.85rem" }}>
              {c.resultMetric}
            </div>
            <p style={{ margin: 0, lineHeight: 1.65, color: "var(--text)" }}>{c.resultBody}</p>
          </section>

          <blockquote
            style={{
              marginTop: "1.5rem",
              padding: "1.5rem 1.75rem",
              borderInlineStart: "3px solid var(--accent)",
              background: "rgba(255,255,255,0.02)",
              borderStartStartRadius: 0,
              borderStartEndRadius: "8px",
              borderEndStartRadius: 0,
              borderEndEndRadius: "8px",
            }}
          >
            <p style={{ fontSize: "1.1rem", fontStyle: "italic", lineHeight: 1.55, margin: 0 }}>
              &ldquo;{c.quote}&rdquo;
            </p>
            <footer style={{ marginTop: "0.85rem", color: "var(--muted)", fontSize: "0.9rem" }}>
              — {c.quoteAttribution}
            </footer>
            <p
              style={{
                marginTop: "1rem",
                paddingTop: "0.85rem",
                borderTop: "1px dashed var(--border)",
                color: "var(--muted)",
                fontSize: "0.78rem",
                margin: "1rem 0 0",
              }}
            >
              {CASE_STUDY_DISCLAIMER}
            </p>
          </blockquote>

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link href="/" className="btn btn-primary" style={{ padding: "0.85rem 2rem" }}>
              Get started
            </Link>
          </div>
        </main>
      </article>

      <Footer lang="en" compact />
    </>
  );
}
