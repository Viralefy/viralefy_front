import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { TrustSignals } from "@/components/TrustSignals";

// Página índice do marketplace global. Hub que linka pras 3 LPs de assets
// digitais (BMs Facebook, perfis envelhecidos, e-mail packs).

export const dynamic = "force-dynamic";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export const metadata: Metadata = {
  title: { absolute: "Marketplace — BMs, aged profiles, email packs | Viralefy" },
  description:
    "Buy Facebook Business Managers, aged Instagram/TikTok profiles and validated email packs. Instant handover after payment confirmation.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    title: "Marketplace — BMs, aged profiles, email packs",
    description:
      "Buy Facebook BMs, aged Instagram/TikTok profiles and validated email packs. Instant handover after payment.",
    locale: "en_US",
    type: "website",
    url: `${siteUrl()}/marketplace`,
  },
  twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
};

const SECTIONS = [
  {
    slug: "facebook-bms",
    title: "Facebook BMs",
    blurb: "Verified Business Managers with daily caps from $50 to $5k.",
    icon: "📘",
  },
  {
    slug: "aged-profiles",
    title: "Aged profiles",
    blurb: "Instagram & TikTok profiles with real followers (1k–50k), 30+ days aged.",
    icon: "👤",
  },
  {
    slug: "validated-emails",
    title: "Validated emails",
    blurb: "Filtered email lists from 100 to 10k addresses. CSV delivery in 24h.",
    icon: "✉️",
  },
];

export default function MarketplaceIndex() {
  return (
    <>
      <article lang="en">
        <header className="hero container">
          <h1>Marketplace</h1>
          <p>Digital assets ready to use — Facebook Business Managers, aged social profiles and validated email packs. Pay once, take over after payment confirmation.</p>
          <TrustSignals lang="en" />
        </header>

        <main className="container" style={{ paddingBottom: "4rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {SECTIONS.map((s) => (
              <Link
                key={s.slug}
                href={`/marketplace/${s.slug}`}
                className="card"
                style={{ textDecoration: "none", color: "var(--text)" }}
              >
                <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>
                  <span aria-hidden style={{ marginRight: "0.5rem" }}>{s.icon}</span>
                  {s.title}
                </h2>
                <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: 0 }}>{s.blurb}</p>
              </Link>
            ))}
          </div>
        </main>
      </article>

      <Footer lang="en" />
    </>
  );
}
