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

type PageLang = "pt" | "en" | "es" | "fr" | "de" | "ja";

async function resolveLang(): Promise<PageLang> {
  const h = await headers();
  const locale = (h.get("x-locale") || "en").toLowerCase();
  if (locale.startsWith("pt")) return "pt";
  if (locale.startsWith("es")) return "es";
  if (locale.startsWith("fr")) return "fr";
  if (locale.startsWith("de")) return "de";
  if (locale.startsWith("ja")) return "ja";
  return "en";
}

function schemaLang(lang: PageLang): string {
  switch (lang) {
    case "pt": return "pt-BR";
    case "es": return "es-ES";
    case "fr": return "fr-FR";
    case "de": return "de-DE";
    case "ja": return "ja-JP";
    default:   return "en";
  }
}
function ogLocale(lang: PageLang): string {
  switch (lang) {
    case "pt": return "pt_BR";
    case "es": return "es_ES";
    case "fr": return "fr_FR";
    case "de": return "de_DE";
    case "ja": return "ja_JP";
    default:   return "en_US";
  }
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

const VS: Record<PageLang, VsPack> = {
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
  es: {
    metaTitle: (name) => `Viralefy vs ${name} — comparación lado a lado`,
    metaDescription: (name) =>
      `Compara Viralefy y ${name} en precio inicial (USDT), tiempo de entrega, reposición, pagos en cripto y soporte humano 24/7.`,
    heroSubtitleSuffix: " Aquí tienes la comparación factual con base en información pública.",
    breadcrumbHome: "Inicio",
    breadcrumbComparisons: "Comparaciones",
    thFeature: "Característica",
    thViralefy: "Viralefy",
    ctaHeadline: "Prueba Viralefy desde 1,00 USD",
    ctaSubtitle: "Elige un mercado, elige un plan y paga en USD, EUR, BRL o cripto. La entrega comienza en minutos.",
    ctaBrowse: "Ver planes",
    dataAsOf: (d) =>
      `Datos basados en información pública hasta el ${d}. Envía correcciones a soporte y actualizaremos esta página.`,
    schemaArticleDesc: (name) => `Comparación factual lado a lado entre Viralefy y ${name}.`,
    rows: {
      startingPrice: "Precio inicial",
      viralefyStartingPrice: "desde 1,00 USD (100 likes de Instagram)",
      avgDelivery: "Tiempo medio de entrega",
      viralefyAvgDelivery: "0–6 horas (la mayoría empieza en minutos)",
      refill: "Garantía de reposición",
      viralefyRefill: "Reposición de 30 días en caso de baja",
      refillNo: "No ofrecido",
      support: "Canal de soporte",
      viralefySupport: "Tickets dentro de la cuenta (gratis, asíncrono)",
      supportNone: "No divulgado",
      crypto: "Pagos en cripto",
      viralefyCrypto: "Sí — USDT, BTC vía Heleket",
      cryptoNo: "No ofrecido",
      cardPix: "Tarjeta + PIX",
      viralefyCardPix: "Stripe (tarjeta) + Abacate Pay (PIX BRL)",
      competitorCard: "Tarjeta (varía)",
      hreflang: "Hreflang + 130 mercados",
      viralefyHreflang: "Sí — matriz hreflang completa en 130 países",
      competitorHreflang: "Limitado o un único mercado",
      multicurrency: "Visualización multimoneda",
      viralefyMulticurrency: "Sí — USD canónico + visualización local en 6 monedas",
      competitorMulticurrency: "Solo USD o una sola moneda fiat",
      competitorWindowSuffix: (h) => `ventana de ${h}h`,
    },
  },
  fr: {
    metaTitle: (name) => `Viralefy vs ${name} — comparatif côte à côte`,
    metaDescription: (name) =>
      `Comparez Viralefy et ${name} sur le prix de départ (USDT), le délai de livraison, la recharge, les paiements crypto et le support humain 24/7.`,
    heroSubtitleSuffix: " Voici un comparatif factuel basé sur des informations publiques.",
    breadcrumbHome: "Accueil",
    breadcrumbComparisons: "Comparatifs",
    thFeature: "Caractéristique",
    thViralefy: "Viralefy",
    ctaHeadline: "Essayez Viralefy à partir de 1,00 $",
    ctaSubtitle: "Choisissez un marché, choisissez une formule, payez en USD, EUR, BRL ou crypto. La livraison démarre en quelques minutes.",
    ctaBrowse: "Voir les formules",
    dataAsOf: (d) =>
      `Données basées sur des informations publiques au ${d}. Envoyez les corrections au support et nous mettrons cette page à jour.`,
    schemaArticleDesc: (name) => `Comparatif factuel côte à côte entre Viralefy et ${name}.`,
    rows: {
      startingPrice: "Prix de départ",
      viralefyStartingPrice: "à partir de 1,00 $ (100 likes Instagram)",
      avgDelivery: "Délai moyen de livraison",
      viralefyAvgDelivery: "0–6 heures (la plupart démarrent en minutes)",
      refill: "Garantie de recharge",
      viralefyRefill: "Recharge 30 jours en cas de perte",
      refillNo: "Non proposé",
      support: "Canal de support",
      viralefySupport: "Tickets dans le compte (gratuit, asynchrone)",
      supportNone: "Non communiqué",
      crypto: "Paiements crypto",
      viralefyCrypto: "Oui — USDT, BTC via Heleket",
      cryptoNo: "Non proposé",
      cardPix: "Carte + PIX",
      viralefyCardPix: "Stripe (carte) + Abacate Pay (PIX BRL)",
      competitorCard: "Carte (variable)",
      hreflang: "Hreflang + 130 marchés",
      viralefyHreflang: "Oui — matrice hreflang complète sur 130 pays",
      competitorHreflang: "Limité ou marché unique",
      multicurrency: "Affichage multidevise",
      viralefyMulticurrency: "Oui — USD canonique + affichage local en 6 devises",
      competitorMulticurrency: "USD ou une seule devise fiat",
      competitorWindowSuffix: (h) => `fenêtre de ${h}h`,
    },
  },
  de: {
    metaTitle: (name) => `Viralefy vs ${name} — direkter Vergleich`,
    metaDescription: (name) =>
      `Vergleichen Sie Viralefy und ${name} bei Einstiegspreis (USDT), Lieferzeit, Nachfüllung, Krypto-Zahlungen und 24/7-Live-Support.`,
    heroSubtitleSuffix: " Hier ist ein sachlicher Vergleich auf Basis öffentlich verfügbarer Informationen.",
    breadcrumbHome: "Start",
    breadcrumbComparisons: "Vergleiche",
    thFeature: "Merkmal",
    thViralefy: "Viralefy",
    ctaHeadline: "Viralefy ab 1,00 $ testen",
    ctaSubtitle: "Markt wählen, Paket wählen, in USD, EUR, BRL oder Krypto bezahlen. Lieferung startet binnen Minuten.",
    ctaBrowse: "Pakete ansehen",
    dataAsOf: (d) =>
      `Daten basieren auf öffentlich verfügbaren Informationen Stand ${d}. Schicken Sie Korrekturen an den Support und wir aktualisieren diese Seite.`,
    schemaArticleDesc: (name) => `Sachlicher direkter Vergleich zwischen Viralefy und ${name}.`,
    rows: {
      startingPrice: "Einstiegspreis",
      viralefyStartingPrice: "ab 1,00 $ USD (100 Instagram-Likes)",
      avgDelivery: "Durchschnittliche Lieferzeit",
      viralefyAvgDelivery: "0–6 Stunden (die meisten Bestellungen starten binnen Minuten)",
      refill: "Auffüll-Garantie",
      viralefyRefill: "30-Tage-Nachfüllung bei Verlust",
      refillNo: "Nicht angeboten",
      support: "Support-Kanal",
      viralefySupport: "Support-Tickets im Konto (kostenlos, asynchron)",
      supportNone: "Nicht angegeben",
      crypto: "Krypto-Zahlungen",
      viralefyCrypto: "Ja — USDT, BTC über Heleket",
      cryptoNo: "Nicht angeboten",
      cardPix: "Karte + PIX",
      viralefyCardPix: "Stripe (Karte) + Abacate Pay (PIX BRL)",
      competitorCard: "Karte (variiert)",
      hreflang: "Hreflang + 130 Märkte",
      viralefyHreflang: "Ja — vollständige Hreflang-Matrix über 130 Länder",
      competitorHreflang: "Begrenzt oder Einzelmarkt",
      multicurrency: "Multiwährungsanzeige",
      viralefyMulticurrency: "Ja — USD kanonisch + lokale Anzeige in 6 Währungen",
      competitorMulticurrency: "Nur USD oder eine einzige Fiat-Währung",
      competitorWindowSuffix: (h) => `${h}h-Zeitfenster`,
    },
  },
  ja: {
    metaTitle: (name) => `Viralefy 対 ${name} — 横並び比較`,
    metaDescription: (name) =>
      `Viralefy と ${name} を、初期価格 (USDT)、配送時間、リフィル、暗号通貨決済、24時間365日の有人サポートで比較します。`,
    heroSubtitleSuffix: " 公開情報に基づく事実ベースの横並び比較です。",
    breadcrumbHome: "ホーム",
    breadcrumbComparisons: "比較",
    thFeature: "項目",
    thViralefy: "Viralefy",
    ctaHeadline: "Viralefy を 1.00 ドルから試す",
    ctaSubtitle: "市場を選び、プランを選び、USD、EUR、BRL、または暗号通貨で支払い。配送は数分以内に開始します。",
    ctaBrowse: "プランを見る",
    dataAsOf: (d) =>
      `${d} 時点の公開情報に基づくデータです。訂正はサポートまでお送りください。本ページを更新します。`,
    schemaArticleDesc: (name) => `Viralefy と ${name} の事実ベース横並び比較。`,
    rows: {
      startingPrice: "初期価格",
      viralefyStartingPrice: "1.00 USD から (Instagram いいね 100件)",
      avgDelivery: "平均配送時間",
      viralefyAvgDelivery: "0〜6時間 (大半は数分以内に開始)",
      refill: "リフィル保証",
      viralefyRefill: "減少時の30日間リフィル",
      refillNo: "提供なし",
      support: "サポート窓口",
      viralefySupport: "アカウント内サポートチケット (無料、非同期)",
      supportNone: "非公開",
      crypto: "暗号通貨決済",
      viralefyCrypto: "あり — Heleket 経由で USDT、BTC",
      cryptoNo: "提供なし",
      cardPix: "カード + PIX",
      viralefyCardPix: "Stripe (カード) + Abacate Pay (PIX BRL)",
      competitorCard: "カード (様々)",
      hreflang: "Hreflang + 130市場",
      viralefyHreflang: "あり — 130か国を網羅する完全な Hreflang マトリクス",
      competitorHreflang: "限定的または単一市場",
      multicurrency: "多通貨表示",
      viralefyMulticurrency: "あり — USD を基軸に6通貨で現地表示",
      competitorMulticurrency: "USD のみ、または単一の法定通貨のみ",
      competitorWindowSuffix: (h) => `${h}時間ウィンドウ`,
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
      languages: {
        "x-default": canonical,
        en: canonical,
        "pt-BR": canonical,
        "es-ES": canonical,
        "fr-FR": canonical,
        "de-DE": canonical,
        "ja-JP": canonical,
      },
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
  const yesByLang: Record<PageLang, string> = {
    pt: "Sim",
    en: "Yes",
    es: "Sí",
    fr: "Oui",
    de: "Ja",
    ja: "あり",
  };
  const yes = yesByLang[lang];
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
