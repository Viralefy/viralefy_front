import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { indexableMeta, indexableDates } from "@/lib/seo-meta";
import { COMPETITORS, getCompetitor, type Competitor } from "@/lib/competitors";
// LangCode não importado: Footer aceita o subset "pt"|"en" como compatível.

// Comparison detail: Viralefy vs <Competitor>. Linguagem factual,
// sem termos defamatórios. Dados públicos com nota de transparência.
//
// BUG-75 (QA 2026-06-13): página rodava só em EN mesmo em /br/...
// Agora detecta lang via header x-locale (setado pelo middleware),
// e usa um pack local com PT + fallback EN. EN intacto.

type Params = { competitor: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

type PageLang = "pt" | "en";

async function resolveLang(): Promise<PageLang> {
  const h = await headers();
  const locale = h.get("x-locale") || "en";
  if (locale.toLowerCase().startsWith("pt")) return "pt";
  return "en";
}

function schemaLang(lang: PageLang): string {
  return lang === "pt" ? "pt-BR" : "en";
}
function ogLocale(lang: PageLang): string {
  return lang === "pt" ? "pt_BR" : "en_US";
}

type VsPack = {
  metaTitle: (name: string) => string;
  metaDescription: (name: string) => string;
  heroSubtitleSuffix: string; // appended to competitor tagline
  breadcrumbHome: string;
  breadcrumbComparisons: string;
  thFeature: string;
  thViralefy: string;
  ctaHeadline: string;
  ctaSubtitle: string;
  ctaBrowse: string;
  dataAsOf: (date: string) => string;
  schemaArticleDesc: (name: string) => string;
  rows: {
    startingPrice: string;
    viralefyStartingPrice: string;
    avgDelivery: string;
    viralefyAvgDelivery: string;
    refill: string;
    viralefyRefill: string;
    refillNo: string;
    support: string;
    viralefySupport: string;
    supportNone: string;
    crypto: string;
    viralefyCrypto: string;
    cryptoNo: string;
    cardPix: string;
    viralefyCardPix: string;
    competitorCard: string;
    hreflang: string;
    viralefyHreflang: string;
    competitorHreflang: string;
    multicurrency: string;
    viralefyMulticurrency: string;
    competitorMulticurrency: string;
    competitorWindowSuffix: (h: number) => string;
  };
};

const VS: Record<"pt" | "en", VsPack> = {
  en: {
    metaTitle: (name) => `Viralefy vs ${name} — side-by-side comparison`,
    metaDescription: (name) =>
      `Compare Viralefy and ${name} across starting price (USDT), delivery time, refill, crypto payments and 24/7 human support.`,
    heroSubtitleSuffix: " Here is a factual side-by-side based on publicly available information.",
    breadcrumbHome: "Home",
    breadcrumbComparisons: "Comparisons",
    thFeature: "Feature",
    thViralefy: "Viralefy",
    ctaHeadline: "Try Viralefy from $1.00",
    ctaSubtitle: "Pick a market, pick a plan, pay in USD, EUR, BRL or crypto. Delivery starts within minutes.",
    ctaBrowse: "Browse plans",
    dataAsOf: (d) =>
      `Data based on public information as of ${d}. Send corrections to support and we will update this page.`,
    schemaArticleDesc: (name) => `Factual side-by-side comparison between Viralefy and ${name}.`,
    rows: {
      startingPrice: "Starting price",
      viralefyStartingPrice: "from $1.00 USD (100 Instagram likes)",
      avgDelivery: "Average delivery time",
      viralefyAvgDelivery: "0–6 hours (most orders start within minutes)",
      refill: "Refill guarantee",
      viralefyRefill: "30-day refill on drop-off",
      refillNo: "Not offered",
      support: "Support channel",
      viralefySupport: "In-account support tickets (free, async)",
      supportNone: "Not disclosed",
      crypto: "Crypto payments",
      viralefyCrypto: "Yes — USDT, BTC via Heleket",
      cryptoNo: "Not offered",
      cardPix: "Card + PIX",
      viralefyCardPix: "Stripe (card) + Abacate Pay (PIX BRL)",
      competitorCard: "Card (varies)",
      hreflang: "Hreflang + 130 markets",
      viralefyHreflang: "Yes — full hreflang matrix across 130 countries",
      competitorHreflang: "Limited or single-market",
      multicurrency: "Multicurrency display",
      viralefyMulticurrency: "Yes — USD canonical + local-currency display in 6 currencies",
      competitorMulticurrency: "USD or single fiat only",
      competitorWindowSuffix: (h) => `${h}h window`,
    },
  },
  pt: {
    metaTitle: (name) => `Viralefy vs ${name} — comparação lado a lado`,
    metaDescription: (name) =>
      `Compare Viralefy e ${name} em preço inicial (USDT), tempo de entrega, reposição, pagamentos em cripto e atendimento humano 24/7.`,
    heroSubtitleSuffix: " Veja a comparação factual com base em informações públicas.",
    breadcrumbHome: "Início",
    breadcrumbComparisons: "Comparações",
    thFeature: "Recurso",
    thViralefy: "Viralefy",
    ctaHeadline: "Experimente a Viralefy a partir de US$ 1,00",
    ctaSubtitle:
      "Escolha o mercado, escolha o plano e pague em USD, EUR, BRL ou cripto. A entrega começa em minutos.",
    ctaBrowse: "Ver planos",
    dataAsOf: (d) =>
      `Dados baseados em informações públicas até ${d}. Envie correções ao suporte e atualizaremos esta página.`,
    schemaArticleDesc: (name) => `Comparação factual lado a lado entre Viralefy e ${name}.`,
    rows: {
      startingPrice: "Preço inicial",
      viralefyStartingPrice: "a partir de US$ 1,00 (100 curtidas no Instagram)",
      avgDelivery: "Tempo médio de entrega",
      viralefyAvgDelivery: "0–6 horas (a maioria começa em minutos)",
      refill: "Garantia de reposição",
      viralefyRefill: "Reposição por 30 dias em caso de queda",
      refillNo: "Não oferecido",
      support: "Canal de atendimento",
      viralefySupport: "Tickets dentro da conta (gratuito, assíncrono)",
      supportNone: "Não divulgado",
      crypto: "Pagamento em cripto",
      viralefyCrypto: "Sim — USDT, BTC via Heleket",
      cryptoNo: "Não oferecido",
      cardPix: "Cartão + PIX",
      viralefyCardPix: "Stripe (cartão) + Abacate Pay (PIX em BRL)",
      competitorCard: "Cartão (varia)",
      hreflang: "Hreflang + 130 mercados",
      viralefyHreflang: "Sim — matriz hreflang completa em 130 países",
      competitorHreflang: "Limitado ou apenas um mercado",
      multicurrency: "Exibição multimoeda",
      viralefyMulticurrency: "Sim — USD canônico + exibição local em 6 moedas",
      competitorMulticurrency: "Apenas USD ou uma moeda fiat",
      competitorWindowSuffix: (h) => `janela de ${h}h`,
    },
  },
};

export function generateStaticParams(): Params[] {
  return COMPETITORS.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { competitor } = await params;
  const c = getCompetitor(competitor);
  if (!c) return { title: "Not found" };
  const meta = indexableMeta();
  const canonical = `/vs/${c.slug}`;
  const lang = await resolveLang();
  const tt = VS[lang];
  const title = tt.metaTitle(c.name);
  const description = tt.metaDescription(c.name);
  return {
    title: { absolute: `${title} | Viralefy` },
    description,
    alternates: {
      canonical,
      // BUG-75: adiciona alternate pt-BR pra Brasil/Portugal.
      languages: { "x-default": canonical, en: canonical, "pt-BR": canonical },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title,
      description,
      url: `${siteUrl()}${canonical}`,
      locale: ogLocale(lang),
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

function buildRows(c: Competitor, lang: PageLang): Row[] {
  // BUG-124/125/160/213 do QA 2026-06-12: as afirmações antigas mentiam
  // sobre o produto real. "WhatsApp" não existe em nenhum lugar do site,
  // "1 USDT" não existe (produto mais barato é $1.00 USD = 100 likes
  // Instagram). Substituímos pelas afirmações verificáveis.
  const r = VS[lang].rows;
  const yes = lang === "pt" ? "Sim" : "Yes";
  return [
    {
      label: r.startingPrice,
      viralefy: r.viralefyStartingPrice,
      competitor: `$${c.priceFloorUsd.toFixed(2)}`,
    },
    {
      label: r.avgDelivery,
      viralefy: r.viralefyAvgDelivery,
      competitor: r.competitorWindowSuffix(c.deliveryWindowHours),
    },
    {
      label: r.refill,
      viralefy: r.viralefyRefill,
      competitor: c.offersRefill ? yes : r.refillNo,
    },
    {
      label: r.support,
      viralefy: r.viralefySupport,
      competitor: c.supportChannels.length ? c.supportChannels.join(", ") : r.supportNone,
    },
    {
      label: r.crypto,
      viralefy: r.viralefyCrypto,
      competitor: c.cryptoPayments ? yes : r.cryptoNo,
    },
    {
      label: r.cardPix,
      viralefy: r.viralefyCardPix,
      competitor: r.competitorCard,
    },
    {
      label: r.hreflang,
      viralefy: r.viralefyHreflang,
      competitor: r.competitorHreflang,
    },
    {
      label: r.multicurrency,
      viralefy: r.viralefyMulticurrency,
      competitor: r.competitorMulticurrency,
    },
  ];
}

export default async function VsCompetitorPage({ params }: { params: Promise<Params> }) {
  const { competitor } = await params;
  const c = getCompetitor(competitor);
  if (!c) notFound();

  const url = siteUrl();
  const pageUrl = `${url}/vs/${c.slug}`;
  const lang = await resolveLang();
  const tt = VS[lang];
  const rows = buildRows(c, lang);
  const dates = indexableDates();
  const buildDate = new Date().toISOString().slice(0, 10);

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tt.breadcrumbHome, item: url },
        { "@type": "ListItem", position: 2, name: tt.breadcrumbComparisons, item: `${url}/vs` },
        { "@type": "ListItem", position: 3, name: `Viralefy vs ${c.name}`, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: `Viralefy vs ${c.name}`,
      description: tt.schemaArticleDesc(c.name),
      mainEntityOfPage: pageUrl,
      inLanguage: schemaLang(lang),
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

      <article lang={schemaLang(lang)}>
        <nav aria-label="Breadcrumb" className="container" style={{ paddingTop: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <ol style={{ listStyle: "none", display: "flex", gap: "0.5rem", padding: 0, flexWrap: "wrap" }}>
            <li><Link href="/">{tt.breadcrumbHome}</Link></li>
            <li aria-hidden>›</li>
            <li><Link href="/vs">{tt.breadcrumbComparisons}</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">Viralefy vs {c.name}</li>
          </ol>
        </nav>

        <header className="hero container">
          <h1>Viralefy vs {c.name}</h1>
          <p style={{ color: "var(--muted)", maxWidth: 720, margin: "0.75rem auto 0" }}>
            {c.tagline}{tt.heroSubtitleSuffix}
          </p>
        </header>

        <main className="container" style={{ paddingBottom: "4rem", maxWidth: 960 }}>
          <section className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.85rem 1rem", width: "30%" }}>{tt.thFeature}</th>
                  <th style={{ padding: "0.85rem 1rem", color: "var(--accent)" }}>{tt.thViralefy}</th>
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
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>{tt.ctaHeadline}</h2>
            <p style={{ color: "var(--muted)", maxWidth: 560, margin: "0 auto 1.25rem" }}>
              {tt.ctaSubtitle}
            </p>
            <Link href="/" className="btn btn-primary">{tt.ctaBrowse}</Link>
          </section>

          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "3rem", textAlign: "center", maxWidth: 640, marginInline: "auto" }}>
            {tt.dataAsOf(buildDate)}
          </p>
        </main>
      </article>

      <Footer lang={lang} compact />
    </>
  );
}
