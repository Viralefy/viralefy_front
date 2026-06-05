import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { indexableMeta, indexableDates } from "@/lib/seo-meta";
import { COMPETITORS, getCompetitor, type Competitor } from "@/lib/competitors";

// Comparison detail: Viralefy vs <Competitor>. Linguagem factual,
// sem termos defamatórios. Dados públicos com nota de transparência.

type Params = { competitor: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function generateStaticParams(): Params[] {
  return COMPETITORS.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { competitor } = await params;
  const c = getCompetitor(competitor);
  if (!c) return { title: "Not found" };
  const meta = indexableMeta();
  const canonical = `/vs/${c.slug}`;
  const title = `Viralefy vs ${c.name} — side-by-side comparison`;
  const description = `Compare Viralefy and ${c.name} across starting price (USDT), delivery time, refill, crypto payments and 24/7 human support.`;
  return {
    title: { absolute: `${title} | Viralefy` },
    description,
    alternates: { canonical },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title,
      description,
      url: `${siteUrl()}${canonical}`,
      locale: "en_US",
      type: "article",
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
  };
}

type Row = {
  label: string;
  viralefy: string;
  competitor: string;
};

function buildRows(c: Competitor): Row[] {
  return [
    {
      label: "Starting price (USDT)",
      viralefy: "1.00 USDT",
      competitor: `$${c.priceFloorUsd.toFixed(2)}`,
    },
    {
      label: "Average delivery time",
      viralefy: "0–6 hours (most orders start within minutes)",
      competitor: `${c.deliveryWindowHours}h window`,
    },
    {
      label: "Refill guarantee",
      viralefy: "30-day refill on drop-off",
      competitor: c.offersRefill ? "Yes" : "Not offered",
    },
    {
      label: "24/7 human support",
      viralefy: "Yes — WhatsApp + ticket",
      competitor: c.supportChannels.length ? c.supportChannels.join(", ") : "Not disclosed",
    },
    {
      label: "Crypto payments",
      viralefy: "Yes — USDT (TRC20/ERC20), BTC",
      competitor: c.cryptoPayments ? "Yes" : "Not offered",
    },
    {
      label: "Hreflang + 130 markets",
      viralefy: "Yes — full hreflang matrix across 130 countries",
      competitor: "Limited or single-market",
    },
    {
      label: "USD-first pricing",
      viralefy: "Yes — USDT canonical, local-currency display hint",
      competitor: "USD or single fiat only",
    },
    {
      label: "Free trial",
      viralefy: "Trial tier from 1 USDT",
      competitor: "Not advertised",
    },
  ];
}

export default async function VsCompetitorPage({ params }: { params: Promise<Params> }) {
  const { competitor } = await params;
  const c = getCompetitor(competitor);
  if (!c) notFound();

  const url = siteUrl();
  const pageUrl = `${url}/vs/${c.slug}`;
  const rows = buildRows(c);
  const dates = indexableDates();
  const buildDate = new Date().toISOString().slice(0, 10);

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: "Comparisons", item: `${url}/vs` },
        { "@type": "ListItem", position: 3, name: `Viralefy vs ${c.name}`, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: `Viralefy vs ${c.name}`,
      description: `Factual side-by-side comparison between Viralefy and ${c.name}.`,
      mainEntityOfPage: pageUrl,
      inLanguage: "en",
      datePublished: dates.datePublished,
      dateModified: dates.dateModified,
      author: { "@type": "Organization", name: "Viralefy", url },
      publisher: { "@type": "Organization", name: "Viralefy", url },
      about: { "@type": "Service", name: c.name, description: c.tagline },
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
            <li><Link href="/vs">Comparisons</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">Viralefy vs {c.name}</li>
          </ol>
        </nav>

        <header className="hero container">
          <h1>Viralefy vs {c.name}</h1>
          <p style={{ color: "var(--muted)", maxWidth: 720, margin: "0.75rem auto 0" }}>
            {c.tagline} Here is a factual side-by-side based on publicly available information.
          </p>
        </header>

        <main className="container" style={{ paddingBottom: "4rem", maxWidth: 960 }}>
          <section className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.85rem 1rem", width: "30%" }}>Feature</th>
                  <th style={{ padding: "0.85rem 1rem", color: "var(--accent)" }}>Viralefy</th>
                  <th style={{ padding: "0.85rem 1rem" }}>{c.name}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>{r.label}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>{r.viralefy}</td>
                    <td style={{ padding: "0.85rem 1rem", color: "var(--muted)" }}>{r.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ marginTop: "2.5rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Try Viralefy from 1 USDT</h2>
            <p style={{ color: "var(--muted)", maxWidth: 560, margin: "0 auto 1.25rem" }}>
              Pick a market, pick a plan, pay in USDT or local currency. Delivery starts within minutes.
            </p>
            <Link href="/" className="btn btn-primary">Browse plans</Link>
          </section>

          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "3rem", textAlign: "center", maxWidth: 640, marginInline: "auto" }}>
            Data based on public information as of {buildDate}. Send corrections to support and we will update this page.
          </p>
        </main>
      </article>

      <Footer lang="en" compact />
    </>
  );
}
