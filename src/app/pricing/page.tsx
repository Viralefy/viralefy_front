import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import type { Plan } from "@/lib/api";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
// LangCode importado abaixo apenas pra anotar `lang` recebido pelo Footer.

// Pricing overview — hub público em USDT/USD canônico.
// Centraliza followers/likes/views milestones + link pro marketplace.
//
// ISR 30 min: `revalidate=1800` no fetch + sem `force-dynamic` no module.
// Antes tinha ambos, mas force-dynamic anula revalidate (Next gera por request),
// e este hub é estável o suficiente pra ISR — cache hit + low TTFB pro crawler.
//
// BUG-104 (QA 2026-06-13): página rendava só em EN mesmo em /br/...
// onde o middleware seta x-locale=pt-BR. Agora a página lê o header,
// resolve a LangCode (pt|en) e usa um pack local com PT + fallback EN.
// generateMetadata também lê headers() — Next 15 permite isso e a página
// continua ISR (a revalidate=1800 não muda).
export const revalidate = 1800;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// htmlLang (BCP47, ex. "pt-BR") → lang da página.
// Como só estamos suportando PT vs EN nesta página por enquanto,
// qualquer locale começando com "pt" cai em "pt"; o resto cai em "en".
// Tipo local PageLang (subset de LangCode) garante index seguro no PRICING.
type PageLang = "pt" | "en";

async function resolveLang(): Promise<PageLang> {
  const h = await headers();
  const locale = h.get("x-locale") || "en";
  if (locale.toLowerCase().startsWith("pt")) return "pt";
  return "en";
}

// Pack local desta página. Strings nunca cobertas pelo Pack global (`tr`)
// vivem aqui pra evitar inflar `i18n/languages.ts` com texto de página
// específica. Mesma técnica usada em legal/[doc] (otherLanguagesLabel).
type PricingPack = {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  tableFollowers: string;
  tableLikes: string;
  tableViews: string;
  thPlatform: string;
  uspRefillTitle: string;
  uspRefillBody: string;
  uspPasswordTitle: string;
  uspPasswordBody: string;
  uspCryptoTitle: string;
  uspCryptoBody: string;
  uspSupportTitle: string;
  uspSupportBody: string;
  browseAll: string;
  schemaPageName: string;
  schemaPageDesc: string;
  breadcrumbHome: string;
  breadcrumbPricing: string;
};

const PRICING: Record<"pt" | "en", PricingPack> = {
  en: {
    metaTitle: "Transparent pricing in USDT — Viralefy",
    metaDescription:
      "Compare Viralefy pricing for Instagram and TikTok followers, likes and views. Prices in USDT/USD, no password required, refill guarantee.",
    heroTitle: "Transparent pricing in USDT",
    heroSubtitle:
      "One canonical price list in USD/USDT across 130 markets. Local currencies are display-only — billing is always in stable USD.",
    tableFollowers: "Followers",
    tableLikes: "Likes",
    tableViews: "Views",
    thPlatform: "Platform",
    uspRefillTitle: "Refill guarantee",
    uspRefillBody: "Drops within 30 days are auto-refilled at no extra cost.",
    uspPasswordTitle: "No password required",
    uspPasswordBody: "We only need a public profile or post URL — never your credentials.",
    uspCryptoTitle: "Crypto-first",
    uspCryptoBody: "Pay in USDT, BTC, ETH or 50+ assets. Stable USD pricing across the catalog.",
    uspSupportTitle: "24/7 support",
    uspSupportBody: "Live ticket support every day. Replies in under 2 hours on average.",
    browseAll: "Browse all 130 markets",
    schemaPageName: "Viralefy pricing",
    schemaPageDesc: "Transparent pricing in USDT for Instagram and TikTok engagement plans.",
    breadcrumbHome: "Home",
    breadcrumbPricing: "Pricing",
  },
  pt: {
    metaTitle: "Preços transparentes em USDT — Viralefy",
    metaDescription:
      "Compare os preços da Viralefy para seguidores, curtidas e visualizações no Instagram e TikTok. Preços em USDT/USD, sem senha, com reposição garantida.",
    heroTitle: "Preços transparentes em USDT",
    heroSubtitle:
      "Uma tabela canônica em USD/USDT para 130 mercados. As moedas locais são apenas exibição — a cobrança é sempre em USD estável.",
    tableFollowers: "Seguidores",
    tableLikes: "Curtidas",
    tableViews: "Visualizações",
    thPlatform: "Plataforma",
    uspRefillTitle: "Reposição garantida",
    uspRefillBody: "Quedas em até 30 dias são repostas automaticamente, sem custo adicional.",
    uspPasswordTitle: "Sem precisar de senha",
    uspPasswordBody: "Pedimos apenas o @ público ou o link do post — nunca suas credenciais.",
    uspCryptoTitle: "Cripto em primeiro lugar",
    uspCryptoBody: "Pague em USDT, BTC, ETH ou 50+ ativos. Preço estável em USD em todo o catálogo.",
    uspSupportTitle: "Suporte 24/7",
    uspSupportBody: "Tickets respondidos por humanos todos os dias. Resposta média em menos de 2 horas.",
    browseAll: "Explorar os 130 mercados",
    schemaPageName: "Preços Viralefy",
    schemaPageDesc: "Preços transparentes em USDT para planos de engajamento no Instagram e TikTok.",
    breadcrumbHome: "Início",
    breadcrumbPricing: "Preços",
  },
};

function ogLocale(lang: PageLang): string {
  return lang === "pt" ? "pt_BR" : "en_US";
}

function schemaLang(lang: PageLang): string {
  return lang === "pt" ? "pt-BR" : "en";
}

export async function generateMetadata(): Promise<Metadata> {
  const meta = indexableMeta();
  const url = siteUrl();
  const canonical = "/pricing";
  const lang = await resolveLang();
  const t = PRICING[lang];
  return {
    title: { absolute: t.metaTitle },
    description: t.metaDescription,
    robots: meta.robots,
    other: meta.other,
    alternates: {
      canonical,
      // x-default mantém EN como padrão global; pt-BR adicionado pra Brasil/Portugal.
      languages: { "x-default": canonical, en: canonical, "pt-BR": canonical },
    },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      url: `${url}${canonical}`,
      locale: ogLocale(lang),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: "@viralefy",
      creator: "@viralefy",
      title: t.metaTitle,
      description: t.metaDescription,
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
  thPlatform,
}: {
  title: string;
  plans: Plan[];
  categoryPrefix: string;
  thPlatform: string;
}) {
  return (
    <section className="card" style={{ marginTop: "2rem", overflowX: "auto" }}>
      <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>{title}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
              {thPlatform}
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

function uspsFor(t: PricingPack) {
  return [
    { title: t.uspRefillTitle, body: t.uspRefillBody },
    { title: t.uspPasswordTitle, body: t.uspPasswordBody },
    { title: t.uspCryptoTitle, body: t.uspCryptoBody },
    { title: t.uspSupportTitle, body: t.uspSupportBody },
  ];
}

export default async function PricingPage() {
  const plans = await getPlans();
  const url = siteUrl();
  const pageUrl = `${url}/pricing`;
  const lang = await resolveLang();
  const t = PRICING[lang];
  const usps = uspsFor(t);

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
      name: t.schemaPageName,
      url: pageUrl,
      description: t.schemaPageDesc,
      inLanguage: schemaLang(lang),
      isPartOf: { "@id": `${url}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: url },
        { "@type": "ListItem", position: 2, name: t.breadcrumbPricing, item: pageUrl },
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

      <article lang={schemaLang(lang)}>
        <header className="hero container">
          <h1>{t.heroTitle}</h1>
          <p style={{ color: "var(--muted)", maxWidth: 640, margin: "0.75rem auto 0" }}>
            {t.heroSubtitle}
          </p>
        </header>

        <main className="container" style={{ paddingBottom: "4rem", maxWidth: 1100 }}>
          <PricingTable title={t.tableFollowers} plans={plans} categoryPrefix="seguidores" thPlatform={t.thPlatform} />
          <PricingTable title={t.tableLikes} plans={plans} categoryPrefix="curtidas" thPlatform={t.thPlatform} />
          <PricingTable title={t.tableViews} plans={plans} categoryPrefix="visualizacoes" thPlatform={t.thPlatform} />

          <section
            style={{
              marginTop: "2rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {usps.map((u) => (
              <div key={u.title} className="card" style={{ padding: "1.25rem" }}>
                <h3 style={{ fontSize: "1rem", margin: "0 0 0.4rem" }}>{u.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>{u.body}</p>
              </div>
            ))}
          </section>

          <section style={{ marginTop: "2.5rem", textAlign: "center" }}>
            <Link href="/" className="btn btn-primary">
              {t.browseAll}
            </Link>
          </section>
        </main>
      </article>

      <Footer lang={lang} compact />
    </>
  );
}
