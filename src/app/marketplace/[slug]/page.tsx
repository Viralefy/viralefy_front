import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Plan } from "@/lib/api";
import { Footer } from "@/components/Footer";
import { CategoryCardGrid } from "@/components/CategoryCardGrid";
import { TrustSignals } from "@/components/TrustSignals";
import { LiveCounter } from "@/components/LiveCounter";
import {
  categoryLabel,
  categoryUnit,
  type CategoryCode,
} from "@/i18n/categories";

// Marketplace global (sem país). Assets digitais (BMs FB, perfis
// envelhecidos, e-mail packs) não são geo-específicos — fazem sentido
// numa LP global em inglês com SEO próprio em /marketplace/<slug>.
//
// O slug aqui é o nome canônico em inglês (kebab-case): facebook-bms,
// aged-profiles, validated-emails. A página reaproveita o
// CategoryCardGrid + reuse da tradução EN do CATEGORY_LABEL.

export const dynamic = "force-dynamic";

type Params = { slug: string };

type Item = {
  category: CategoryCode;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  bullets: { title: string; body: string }[];
  faq: { q: string; a: string }[];
};

const ITEMS: Record<string, Item> = {
  "facebook-bms": {
    category: "bms_facebook",
    h1: "Facebook Business Managers",
    metaTitle: "Buy Facebook Business Managers (BMs) | Viralefy",
    metaDescription:
      "Verified Facebook Business Managers with daily spend caps from $50 to $5k. Instant handover, replacement if banned at first login.",
    intro:
      "Buy ready-to-use Facebook Business Managers with daily spend caps from $50 to $5k. Verified, aged and instantly delivered after payment confirmation.",
    bullets: [
      { title: "Verified", body: "Each BM passes Meta's business verification and arrives ready to scale ads." },
      { title: "Aged", body: "From 7 days up to 90+ days of spend history depending on tier." },
      { title: "Instant handover", body: "Login credentials and recovery email delivered the moment payment confirms." },
      { title: "Replacement guarantee", body: "If the BM gets banned at first login, we replace it free of charge." },
    ],
    faq: [
      { q: "Can I use my own pixel?", a: "Yes — once you have BM access, you can connect any existing or new pixel." },
      { q: "Do you ship credentials by email?", a: "Yes, in the support ticket that opens automatically after payment." },
      { q: "What if it gets banned later?", a: "Tier 'Trial' is one-shot. Tiers Starter and above include a replacement window of 7 days." },
    ],
  },
  "aged-profiles": {
    category: "perfis_redes",
    h1: "Aged Instagram & TikTok profiles",
    metaTitle: "Buy aged Instagram & TikTok profiles | Viralefy",
    metaDescription:
      "Aged Instagram and TikTok profiles with real followers (1k–50k). 30 to 180+ days aged. Full handover, no password reset blocking.",
    intro:
      "Aged profiles with real followers and authentic history. Pick by follower count and minimum age — we negotiate the niche and audience country with you during the support ticket that opens after payment.",
    bullets: [
      { title: "Real followers", body: "No bots — the follower count is built up organically before sale." },
      { title: "Aged", body: "Profiles range from 30 days to 180+ days; matched to your use case." },
      { title: "Full handover", body: "Phone number, recovery email and 2FA reset come bundled." },
      { title: "Niche match", body: "Tell us the niche and target audience in the post-payment ticket; we shortlist matching profiles before final handover." },
    ],
    faq: [
      { q: "Can I pick the niche?", a: "Yes — niche, audience country and follower demographics are negotiated in the support ticket that opens automatically after payment." },
      { q: "How long does handover take?", a: "24–72 hours from payment confirmation, depending on the niche match." },
      { q: "Can I change the @ handle?", a: "Yes, the handle is yours to rename once you take over." },
    ],
  },
  "validated-emails": {
    category: "emails_validados",
    h1: "Validated email packs",
    metaTitle: "Buy validated email lists (100–10k) | Viralefy",
    metaDescription:
      "Validated, deliverable email lists from 100 to 10,000 addresses. Filter by niche, country and intent. Delivered as CSV after payment.",
    intro:
      "Validated email packs from 100 to 10,000 addresses. Filter by niche, country and intent. Lists are filtered against SMTP bounces and spam-traps before delivery; CSV arrives in the support ticket after payment confirmation.",
    bullets: [
      { title: "Validated", body: "Every address passes SMTP MX + bounce check before shipping." },
      { title: "Filter by niche", body: "Niche, country and use-case filters set in checkout, refined in the support ticket." },
      { title: "CSV delivery", body: "List arrives as CSV attached to the support ticket — within 24h of payment confirmation." },
      { title: "Use case fit", body: "B2B cold outreach, newsletter nurture, retargeting source for lookalikes." },
    ],
    faq: [
      { q: "Is the data GDPR-compliant?", a: "We list legitimate interest opt-in sources for EU addresses. You're responsible for your own outreach compliance." },
      { q: "What format?", a: "CSV with at minimum: email, country code, source category. Additional columns depend on niche." },
      { q: "Can I get a replacement for bouncing addresses?", a: "Yes — addresses bouncing within 48h of delivery are replaced once at no charge." },
    ],
  },
};

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const item = ITEMS[slug];
  if (!item) return { title: "Not found" };
  const canonical = `/marketplace/${slug}`;
  const og = `/og/marketplace/${slug}`;
  return {
    title: { absolute: item.metaTitle },
    description: item.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: item.metaTitle,
      description: item.metaDescription,
      url: `${siteUrl()}${canonical}`,
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

async function getPlans(category: CategoryCode): Promise<Plan[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/v1/plans`, { cache: "no-store" });
    const json = await res.json();
    return ((json.data as Plan[]) ?? []).filter((p) => p.category === category);
  } catch {
    return [];
  }
}

export default async function MarketplacePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const item = ITEMS[slug];
  if (!item) notFound();

  const plans = (await getPlans(item.category)).sort((a, b) => a.followers_qty - b.followers_qty);
  const label = categoryLabel(item.category, "en");
  const unit = categoryUnit(item.category, "en");

  const url = siteUrl();
  const pageUrl = `${url}/marketplace/${slug}`;

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: "Marketplace", item: `${url}/marketplace` },
        { "@type": "ListItem", position: 3, name: label, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: item.h1,
      description: item.metaDescription,
      provider: { "@type": "Organization", name: "Viralefy", url },
      offers: plans.length
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: plans.length ? plans[0].prices?.["USD"] ?? "0" : "0",
            highPrice: plans.length ? plans[plans.length - 1].prices?.["USD"] ?? "0" : "0",
            offerCount: plans.length,
          }
        : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: item.faq.map((q) => ({
        "@type": "Question",
        name: q.q,
        acceptedAnswer: { "@type": "Answer", text: q.a },
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
            <li><Link href="/marketplace">Marketplace</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">{label}</li>
          </ol>
        </nav>

        <header className="hero container">
          <h1>{item.h1}</h1>
          <p>{item.intro}</p>
          <TrustSignals lang="en" />
        </header>

        <main className="container" style={{ paddingBottom: "4rem" }}>
          <CategoryCardGrid
            plans={plans}
            lang="en"
            countryCode="global"
            category={item.category}
            unitLabel={unit}
            hideDetailLink
          />

          <section style={{ marginTop: "3rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              {item.bullets.map((b, i) => (
                <div key={i} className="card" style={{ padding: "1.25rem" }}>
                  <h3 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>{b.title}</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>{b.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: "3rem", maxWidth: 760, marginInline: "auto" }}>
            <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Frequently asked questions</h2>
            {item.faq.map((q, i) => (
              <details key={i} style={{ borderBottom: "1px solid var(--border)", padding: "0.75rem 0" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>{q.q}</summary>
                <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>{q.a}</p>
              </details>
            ))}
          </section>
        </main>
      </article>

      <Footer lang="en" />
      <LiveCounter lang="en" />
    </>
  );
}
