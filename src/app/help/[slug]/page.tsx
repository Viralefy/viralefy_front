import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { HELP_TOPICS, helpAllSlugs, helpTopicBySlug } from "@/lib/help";
import { withGlobalGraph } from "@/lib/jsonld";
import { JsonLdScript } from "@/components/JsonLdScript";

// Help center detail. EN-only. generateStaticParams + per-slug canonical.

type Params = { slug: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// ISR (round 23 Track XX): SSG via generateStaticParams + revalidate.
export const revalidate = 1800;

export function generateStaticParams(): { slug: string }[] {
  return helpAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = helpTopicBySlug(slug);
  if (!topic) return { title: "Not found" };
  const meta = indexableMeta({ modifiedAt: `${topic.updatedAt}T00:00:00Z` });
  const canonical = `/help/${slug}`;
  const description = topic.intro.length > 158 ? `${topic.intro.slice(0, 155)}…` : topic.intro;
  return {
    title: { absolute: `${topic.title} | Viralefy Help center` },
    description,
    alternates: {
      canonical,
      languages: { "x-default": canonical, en: canonical },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title: topic.title,
      description,
      url: `${siteUrl()}${canonical}`,
      locale: "en_US",
      type: "article",
      siteName: "Viralefy",
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
  };
}

export default async function HelpTopicPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const topic = helpTopicBySlug(slug);
  if (!topic) notFound();

  const url = siteUrl();
  const pageUrl = `${url}/help/${topic.slug}`;
  const datePublished = "2026-01-01";
  const dateModified = topic.updatedAt;

  // FAQPage só se cada section parecer Q&A (heading curto + body substancial).
  const looksFaqLike = topic.sections.every((s) => s.heading.length <= 90 && s.body.length >= 80);

  const related = topic.relatedSlugs
    .map((s) => HELP_TOPICS.find((t) => t.slug === s))
    .filter((t): t is (typeof HELP_TOPICS)[number] => Boolean(t));

  const nodes: object[] = [
    {
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: topic.title,
      description: topic.intro,
      datePublished,
      dateModified,
      inLanguage: "en",
      mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
      // Track CC: author/publisher referenciam o nó Organization canônico
      // prepended por withGlobalGraph (mesmo @id `${url}/#organization`).
      author: { "@id": `${url}/#organization` },
      publisher: { "@id": `${url}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: "Help center", item: `${url}/help` },
        { "@type": "ListItem", position: 3, name: topic.title, item: pageUrl },
      ],
    },
  ];

  if (looksFaqLike) {
    nodes.push({
      "@type": "FAQPage",
      mainEntity: topic.sections.map((s) => ({
        "@type": "Question",
        name: s.heading,
        acceptedAnswer: { "@type": "Answer", text: s.body },
      })),
    });
  }

  // BUG-191: consolida em UM @graph.
  // Track CC: withGlobalGraph prepende Org+WebSite (en-only).
  const jsonld = withGlobalGraph(nodes, { siteUrl: url, inLanguage: "en" });

  return (
    <>
      <JsonLdScript data={jsonld} />

      <article className="container" lang="en" style={{ paddingTop: "2rem", paddingBottom: "3rem", maxWidth: 760 }}>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
          <Link href="/help">← Help center</Link>
        </p>
        <h1 style={{ marginBottom: "0.25rem" }}>{topic.title}</h1>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 0 }}>Updated {topic.updatedAt}</p>

        <p
          style={{
            marginTop: "1.25rem",
            padding: "1rem",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            color: "var(--text)",
            background: "rgba(255,255,255,0.02)",
            fontSize: "1rem",
            lineHeight: 1.55,
          }}
        >
          {topic.intro}
        </p>

        {topic.sections.map((s) => (
          <section key={s.heading} style={{ marginTop: "1.75rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>{s.heading}</h2>
            <p style={{ color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{s.body}</p>
          </section>
        ))}

        {related.length > 0 && (
          <section style={{ marginTop: "2.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Related articles</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.4rem" }}>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/help/${r.slug}`} style={{ color: "var(--accent)" }}>
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <Footer lang="en" compact />
    </>
  );
}
