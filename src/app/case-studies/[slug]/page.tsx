import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { CASE_STUDIES, CASE_STUDY_DISCLAIMER, getCaseStudy } from "@/lib/case-studies";

type Params = { slug: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateStaticParams(): Promise<Params[]> {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) return { title: "Not found" };
  const canonical = `/case-studies/${slug}`;
  const title = `${c.title} | Viralefy case study`;
  const description = `${c.industry} case study: ${c.challenge.slice(0, 150)}`;
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
      publishedTime: c.publishedAt,
      modifiedTime: c.updatedAt,
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

export default async function CaseStudyDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) notFound();

  const url = siteUrl();
  const pageUrl = `${url}/case-studies/${c.slug}`;

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: "Case studies", item: `${url}/case-studies` },
        { "@type": "ListItem", position: 3, name: c.title, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: c.title,
      description: c.challenge.slice(0, 200),
      datePublished: c.publishedAt,
      dateModified: c.updatedAt,
      mainEntityOfPage: pageUrl,
      author: { "@type": "Organization", name: "Viralefy", url },
      publisher: {
        "@type": "Organization",
        name: "Viralefy",
        url,
        logo: { "@type": "ImageObject", url: `${url}/logotipo-default.png` },
      },
      about: c.industry,
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
            <li><Link href="/case-studies">Case studies</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">{c.industry}</li>
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
              borderLeft: "3px solid var(--accent)",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "0 8px 8px 0",
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
