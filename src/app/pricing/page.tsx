import type { Metadata } from "next";
import Link from "next/link";
import type { Plan } from "@/lib/api";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";

// Pricing overview — hub público em USDT/USD canônico.
// Centraliza followers/likes/views milestones + link pro marketplace.
//
// ISR 30 min: `revalidate=1800` no fetch + sem `force-dynamic` no module.
// Antes tinha ambos, mas force-dynamic anula revalidate (Next gera por request),
// e este hub é estável o suficiente pra ISR — cache hit + low TTFB pro crawler.
export const revalidate = 1800;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata(): Promise<Metadata> {
  const meta = indexableMeta();
  const url = siteUrl();
  const canonical = "/pricing";
  const title = "Transparent pricing in USDT — Viralefy";
  const description =
    "Compare Viralefy pricing for Instagram and TikTok followers, likes and views. Prices in USDT/USD, no password required, refill guarantee.";
  return {
    title: { absolute: title },
    description,
    robots: meta.robots,
    other: meta.other,
    alternates: {
      canonical,
      languages: { "x-default": canonical, en: canonical },
    },
    openGraph: {
      title,
      description,
      url: `${url}${canonical}`,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: "@viralefy",
      creator: "@viralefy",
      title,
      description,
    },
  };
}

// Milestones exibidos nas tabelas — pega o plano mais próximo por qty.
const MILESTONES = [100, 500, 1000, 5000, 10000, 25000, 50000];

type Row = {
  platform: "instagram" | "tiktok";
  label: string;
};

const FOLLOWER_ROWS: Row[] = [
  { platform: "instagram", label: "Instagram" },
  { platform: "tiktok", label: "TikTok" },
];

async function getPlans(): Promise<Plan[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/v1/plans`, { next: { revalidate: 1800 } });
    const json = await res.json();
    return (json.data as Plan[]) ?? [];
  } catch {
    return [];
  }
}

function priceUSD(p: Plan): string {
  return p.prices?.["USD"] ?? (p.price_cents / 100).toFixed(2);
}

function findPlan(
  plans: Plan[],
  category: string,
  platform: "instagram" | "tiktok",
  qty: number,
): Plan | undefined {
  // EXATO. Se não tiver plano para o milestone, devolve undefined e a célula
  // renderiza "—" (mais honesto que mostrar preço de outro tamanho).
  return plans.find(
    (p) => p.category === category && p.platform === platform && p.active && p.followers_qty === qty,
  );
}

function fmtQty(n: number): string {
  if (n >= 1000) return `${n / 1000}k`;
  return String(n);
}

function PricingTable({
  title,
  plans,
  categoryPrefix,
}: {
  title: string;
  plans: Plan[];
  categoryPrefix: string;
}) {
  return (
    <section className="card" style={{ marginTop: "2rem", overflowX: "auto" }}>
      <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>{title}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
              Platform
            </th>
            {MILESTONES.map((m) => (
              <th
                key={m}
                style={{ textAlign: "right", padding: "0.5rem", borderBottom: "1px solid var(--border)" }}
              >
                {fmtQty(m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FOLLOWER_ROWS.map((row) => {
            const category = `${categoryPrefix}_${row.platform}`;
            return (
              <tr key={row.platform}>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>{row.label}</td>
                {MILESTONES.map((m) => {
                  const p = findPlan(plans, category, row.platform, m);
                  return (
                    <td
                      key={m}
                      style={{
                        padding: "0.5rem",
                        borderBottom: "1px solid var(--border)",
                        textAlign: "right",
                        color: p ? "var(--text)" : "var(--muted)",
                      }}
                    >
                      {p ? `$${priceUSD(p)}` : "—"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

const USPS = [
  { title: "Refill guarantee", body: "Drops within 30 days are auto-refilled at no extra cost." },
  { title: "No password required", body: "We only need a public profile or post URL — never your credentials." },
  { title: "Crypto-first", body: "Pay in USDT, BTC, ETH or 50+ assets. Stable USD pricing across the catalog." },
  { title: "24/7 support", body: "Live ticket support every day. Replies in under 2 hours on average." },
];

export default async function PricingPage() {
  const plans = await getPlans();
  const url = siteUrl();
  const pageUrl = `${url}/pricing`;

  // ItemList agrega Offer por plano milestone — cobre rich result Merchant.
  const offerItems: object[] = [];
  let position = 1;
  for (const prefix of ["seguidores", "curtidas", "visualizacoes"] as const) {
    for (const row of FOLLOWER_ROWS) {
      for (const m of MILESTONES) {
        const p = findPlan(plans, `${prefix}_${row.platform}`, row.platform, m);
        if (!p) continue;
        offerItems.push({
          "@type": "ListItem",
          position: position++,
          item: {
            "@type": "Offer",
            name: p.name,
            sku: p.id,
            price: priceUSD(p),
            priceCurrency: "USD",
            url: pageUrl,
            availability: "https://schema.org/InStock",
          },
        });
      }
    }
  }

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      name: "Viralefy pricing",
      url: pageUrl,
      description: "Transparent pricing in USDT for Instagram and TikTok engagement plans.",
      inLanguage: "en",
      isPartOf: { "@id": `${url}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: "Pricing", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${pageUrl}#itemlist`,
      name: "Viralefy plans",
      numberOfItems: offerItems.length,
      itemListElement: offerItems,
    },
  ];

  return (
    <>
      {jsonld.map((doc, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }}
        />
      ))}

      <article lang="en">
        <header className="hero container">
          <h1>Transparent pricing in USDT</h1>
          <p style={{ color: "var(--muted)", maxWidth: 640, margin: "0.75rem auto 0" }}>
            One canonical price list in USD/USDT across 130 markets. Local currencies are display-only — billing is always
            in stable USD.
          </p>
        </header>

        <main className="container" style={{ paddingBottom: "4rem", maxWidth: 1100 }}>
          <PricingTable title="Followers" plans={plans} categoryPrefix="seguidores" />
          <PricingTable title="Likes" plans={plans} categoryPrefix="curtidas" />
          <PricingTable title="Views" plans={plans} categoryPrefix="visualizacoes" />

          <section className="card" style={{ marginTop: "2rem" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Premium services</h2>
            <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>
              Beyond engagement, the marketplace ships ready-to-use digital assets with instant handover after payment.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
              <li>
                <strong>Facebook BMs</strong> — Verified Business Managers, daily caps $50 to $5k.
              </li>
              <li>
                <strong>Aged profiles</strong> — Instagram & TikTok profiles with real followers, 30+ days aged.
              </li>
              <li>
                <strong>Validated emails</strong> — Filtered email lists from 100 to 10k addresses, CSV in 24h.
              </li>
            </ul>
            <p style={{ marginTop: "1rem" }}>
              <Link href="/marketplace" className="btn btn-outline">
                See marketplace
              </Link>
            </p>
          </section>

          <section
            style={{
              marginTop: "2rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {USPS.map((u) => (
              <div key={u.title} className="card" style={{ padding: "1.25rem" }}>
                <h3 style={{ fontSize: "1rem", margin: "0 0 0.4rem" }}>{u.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>{u.body}</p>
              </div>
            ))}
          </section>

          <section style={{ marginTop: "2.5rem", textAlign: "center" }}>
            <Link href="/" className="btn btn-primary">
              Browse all 130 markets
            </Link>
          </section>
        </main>
      </article>

      <Footer lang="en" compact />
    </>
  );
}
