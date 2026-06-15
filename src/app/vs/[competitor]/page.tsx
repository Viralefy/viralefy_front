import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { indexableMeta, indexableDates } from "@/lib/seo-meta";
import { COMPETITORS, getCompetitor, type Competitor } from "@/lib/competitors";
import { toJsonLdGraph } from "@/lib/jsonld";
import { JsonLdScript } from "@/components/JsonLdScript";
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

type PageLang = "pt" | "en" | "es" | "fr" | "de" | "ja" | "it" | "ru" | "nl" | "ko" | "ar" | "zh" | "hi" | "tr" | "pl" | "sv" | "da" | "no" | "fi" | "he" | "uk" | "cs" | "sk" | "th" | "vi" | "id";

async function resolveLang(): Promise<PageLang> {
  const h = await headers();
  const locale = (h.get("x-locale") || "en").toLowerCase();
  if (locale.startsWith("pt")) return "pt";
  if (locale.startsWith("es")) return "es";
  if (locale.startsWith("fr")) return "fr";
  if (locale.startsWith("de")) return "de";
  if (locale.startsWith("ja")) return "ja";
  if (locale.startsWith("it")) return "it";
  if (locale.startsWith("ru")) return "ru";
  if (locale.startsWith("nl")) return "nl";
  if (locale.startsWith("ko")) return "ko";
  if (locale.startsWith("ar")) return "ar";
  if (locale.startsWith("zh")) return "zh";
  if (locale.startsWith("hi")) return "hi";
  if (locale.startsWith("tr")) return "tr";
  if (locale.startsWith("pl")) return "pl";
  if (locale.startsWith("sv")) return "sv";
  if (locale.startsWith("da")) return "da";
  if (locale.startsWith("no") || locale.startsWith("nb")) return "no";
  if (locale.startsWith("fi")) return "fi";
  if (locale.startsWith("he") || locale.startsWith("iw")) return "he";
  if (locale.startsWith("uk")) return "uk";
  if (locale.startsWith("cs")) return "cs";
  if (locale.startsWith("sk")) return "sk";
  if (locale.startsWith("th")) return "th";
  if (locale.startsWith("vi")) return "vi";
  if (locale.startsWith("id")) return "id";
  return "en";
}

function schemaLang(lang: PageLang): string {
  switch (lang) {
    case "pt": return "pt-BR";
    case "es": return "es-ES";
    case "fr": return "fr-FR";
    case "de": return "de-DE";
    case "ja": return "ja-JP";
    case "it": return "it-IT";
    case "ru": return "ru-RU";
    case "nl": return "nl-NL";
    case "ko": return "ko-KR";
    case "ar": return "ar";
    case "zh": return "zh-Hans";
    case "hi": return "hi-IN";
    case "tr": return "tr-TR";
    case "pl": return "pl-PL";
    case "sv": return "sv-SE";
    case "da": return "da-DK";
    case "no": return "nb-NO";
    case "fi": return "fi-FI";
    case "he": return "he-IL";
    case "uk": return "uk-UA";
    case "cs": return "cs-CZ";
    case "sk": return "sk-SK";
    case "th": return "th-TH";
    case "vi": return "vi-VN";
    case "id": return "id-ID";
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
    case "it": return "it_IT";
    case "ru": return "ru_RU";
    case "nl": return "nl_NL";
    case "ko": return "ko_KR";
    case "ar": return "ar_AR";
    case "zh": return "zh_CN";
    case "hi": return "hi_IN";
    case "tr": return "tr_TR";
    case "pl": return "pl_PL";
    case "sv": return "sv_SE";
    case "da": return "da_DK";
    case "no": return "nb_NO";
    case "fi": return "fi_FI";
    case "he": return "he_IL";
    case "uk": return "uk_UA";
    case "cs": return "cs_CZ";
    case "sk": return "sk_SK";
    case "th": return "th_TH";
    case "vi": return "vi_VN";
    case "id": return "id_ID";
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
  it: {
    metaTitle: (name) => `Viralefy vs ${name} — confronto fianco a fianco`,
    metaDescription: (name) =>
      `Confronti Viralefy e ${name} su prezzo iniziale (USDT), tempi di consegna, reintegro, pagamenti in crypto e supporto umano 24/7.`,
    heroSubtitleSuffix: " Di seguito un confronto fattuale basato su informazioni pubblicamente disponibili.",
    breadcrumbHome: "Home",
    breadcrumbComparisons: "Confronti",
    thFeature: "Caratteristica",
    thViralefy: "Viralefy",
    ctaHeadline: "Provi Viralefy a partire da 1,00 $",
    ctaSubtitle: "Scelga un mercato, scelga un piano, paghi in USD, EUR, BRL o crypto. La consegna parte in pochi minuti.",
    ctaBrowse: "Vedi i piani",
    dataAsOf: (d) =>
      `Dati basati su informazioni pubbliche al ${d}. Invii eventuali correzioni al supporto e aggiorneremo questa pagina.`,
    schemaArticleDesc: (name) => `Confronto fattuale fianco a fianco tra Viralefy e ${name}.`,
    rows: {
      startingPrice: "Prezzo iniziale",
      viralefyStartingPrice: "da 1,00 $ USD (100 like Instagram)",
      avgDelivery: "Tempo medio di consegna",
      viralefyAvgDelivery: "0–6 ore (la maggior parte parte in pochi minuti)",
      refill: "Garanzia di reintegro",
      viralefyRefill: "Reintegro 30 giorni in caso di calo",
      refillNo: "Non offerto",
      support: "Canale di supporto",
      viralefySupport: "Ticket in-account (gratuito, asincrono)",
      supportNone: "Non comunicato",
      crypto: "Pagamenti in crypto",
      viralefyCrypto: "Sì — USDT, BTC tramite Heleket",
      cryptoNo: "Non offerto",
      cardPix: "Carta + PIX",
      viralefyCardPix: "Stripe (carta) + Abacate Pay (PIX BRL)",
      competitorCard: "Carta (variabile)",
      hreflang: "Hreflang + 130 mercati",
      viralefyHreflang: "Sì — matrice hreflang completa su 130 paesi",
      competitorHreflang: "Limitato o mercato singolo",
      multicurrency: "Visualizzazione multivaluta",
      viralefyMulticurrency: "Sì — USD canonico + visualizzazione locale in 6 valute",
      competitorMulticurrency: "Solo USD o una sola valuta fiat",
      competitorWindowSuffix: (h) => `finestra di ${h}h`,
    },
  },
  ru: {
    metaTitle: (name) => `Viralefy vs ${name} — сравнение бок о бок`,
    metaDescription: (name) =>
      `Сравните Viralefy и ${name} по стартовой цене (USDT), времени доставки, восполнению, оплате криптой и поддержке 24/7.`,
    heroSubtitleSuffix: " Ниже — фактологическое сравнение на основе общедоступной информации.",
    breadcrumbHome: "Главная",
    breadcrumbComparisons: "Сравнения",
    thFeature: "Параметр",
    thViralefy: "Viralefy",
    ctaHeadline: "Попробуйте Viralefy от 1,00 $",
    ctaSubtitle: "Выберите рынок, выберите тариф, платите в USD, EUR, BRL или крипте. Доставка стартует за считаные минуты.",
    ctaBrowse: "Посмотреть тарифы",
    dataAsOf: (d) =>
      `Данные основаны на общедоступной информации по состоянию на ${d}. Присылайте правки в поддержку — мы обновим эту страницу.`,
    schemaArticleDesc: (name) => `Фактологическое сравнение Viralefy и ${name} бок о бок.`,
    rows: {
      startingPrice: "Стартовая цена",
      viralefyStartingPrice: "от 1,00 $ USD (за 100 лайков в Instagram)",
      avgDelivery: "Среднее время доставки",
      viralefyAvgDelivery: "0–6 часов (большинство заказов стартуют за минуты)",
      refill: "Гарантия восполнения",
      viralefyRefill: "Восполнение в течение 30 дней при отписках",
      refillNo: "Не предлагается",
      support: "Канал поддержки",
      viralefySupport: "Тикеты внутри аккаунта (бесплатно, асинхронно)",
      supportNone: "Не раскрыто",
      crypto: "Оплата криптой",
      viralefyCrypto: "Да — USDT, BTC через Heleket",
      cryptoNo: "Не предлагается",
      cardPix: "Карта + PIX",
      viralefyCardPix: "Stripe (карта) + Abacate Pay (PIX BRL)",
      competitorCard: "Карта (варьируется)",
      hreflang: "Hreflang + 130 рынков",
      viralefyHreflang: "Да — полная матрица hreflang по 130 странам",
      competitorHreflang: "Ограничено или один рынок",
      multicurrency: "Мультивалютное отображение",
      viralefyMulticurrency: "Да — USD как канон + локальное отображение в 6 валютах",
      competitorMulticurrency: "Только USD или одна фиатная валюта",
      competitorWindowSuffix: (h) => `окно ${h} ч`,
    },
  },
  nl: {
    metaTitle: (name) => `Viralefy vs ${name} — directe vergelijking`,
    metaDescription: (name) =>
      `Vergelijk Viralefy en ${name} op startprijs (USDT), levertijd, aanvulling, crypto-betalingen en 24/7 menselijke support.`,
    heroSubtitleSuffix: " Hieronder een feitelijke vergelijking op basis van openbaar beschikbare informatie.",
    breadcrumbHome: "Home",
    breadcrumbComparisons: "Vergelijkingen",
    thFeature: "Kenmerk",
    thViralefy: "Viralefy",
    ctaHeadline: "Probeer Viralefy vanaf $ 1,00",
    ctaSubtitle: "Kies een markt, kies een pakket, betaal in USD, EUR, BRL of crypto. De levering start binnen enkele minuten.",
    ctaBrowse: "Bekijk pakketten",
    dataAsOf: (d) =>
      `Gegevens gebaseerd op openbare informatie per ${d}. Stuur correcties naar support en we werken deze pagina bij.`,
    schemaArticleDesc: (name) => `Feitelijke directe vergelijking tussen Viralefy en ${name}.`,
    rows: {
      startingPrice: "Startprijs",
      viralefyStartingPrice: "vanaf $ 1,00 USD (100 Instagram-likes)",
      avgDelivery: "Gemiddelde levertijd",
      viralefyAvgDelivery: "0–6 uur (de meeste orders starten binnen minuten)",
      refill: "Aanvulgarantie",
      viralefyRefill: "30 dagen aanvulling bij uitval",
      refillNo: "Niet aangeboden",
      support: "Supportkanaal",
      viralefySupport: "Tickets in het account (gratis, asynchroon)",
      supportNone: "Niet vermeld",
      crypto: "Crypto-betalingen",
      viralefyCrypto: "Ja — USDT, BTC via Heleket",
      cryptoNo: "Niet aangeboden",
      cardPix: "Kaart + PIX",
      viralefyCardPix: "Stripe (kaart) + Abacate Pay (PIX BRL)",
      competitorCard: "Kaart (wisselt)",
      hreflang: "Hreflang + 130 markten",
      viralefyHreflang: "Ja — volledige hreflang-matrix over 130 landen",
      competitorHreflang: "Beperkt of één markt",
      multicurrency: "Multivaluta-weergave",
      viralefyMulticurrency: "Ja — USD als canon + lokale weergave in 6 valuta's",
      competitorMulticurrency: "Alleen USD of één fiatvaluta",
      competitorWindowSuffix: (h) => `venster van ${h} u`,
    },
  },
  ko: {
    metaTitle: (name) => `Viralefy vs ${name} — 나란히 비교`,
    metaDescription: (name) =>
      `Viralefy와 ${name}를 시작 가격(USDT), 배송 시간, 리필, 암호화폐 결제, 24시간 사람 지원 측면에서 비교합니다.`,
    heroSubtitleSuffix: " 공개된 정보를 바탕으로 한 사실 기반의 나란히 비교입니다.",
    breadcrumbHome: "홈",
    breadcrumbComparisons: "비교",
    thFeature: "항목",
    thViralefy: "Viralefy",
    ctaHeadline: "$1.00부터 Viralefy를 사용해 보십시오",
    ctaSubtitle: "시장을 선택하고 플랜을 선택한 뒤 USD, EUR, BRL 또는 암호화폐로 결제하십시오. 배송은 몇 분 안에 시작됩니다.",
    ctaBrowse: "플랜 보기",
    dataAsOf: (d) =>
      `${d} 기준 공개 정보를 바탕으로 한 데이터입니다. 수정 사항은 지원팀으로 보내 주시면 페이지를 업데이트하겠습니다.`,
    schemaArticleDesc: (name) => `Viralefy와 ${name}의 사실 기반 나란히 비교입니다.`,
    rows: {
      startingPrice: "시작 가격",
      viralefyStartingPrice: "$1.00 USD부터 (Instagram 좋아요 100개)",
      avgDelivery: "평균 배송 시간",
      viralefyAvgDelivery: "0–6시간 (대부분의 주문은 몇 분 안에 시작됩니다)",
      refill: "리필 보장",
      viralefyRefill: "이탈 시 30일 리필 제공",
      refillNo: "제공되지 않습니다",
      support: "지원 채널",
      viralefySupport: "계정 내 지원 티켓 (무료, 비동기)",
      supportNone: "공개되지 않았습니다",
      crypto: "암호화폐 결제",
      viralefyCrypto: "지원합니다 — Heleket을 통해 USDT, BTC",
      cryptoNo: "제공되지 않습니다",
      cardPix: "카드 + PIX",
      viralefyCardPix: "Stripe (카드) + Abacate Pay (PIX BRL)",
      competitorCard: "카드 (상이함)",
      hreflang: "Hreflang + 130개 시장",
      viralefyHreflang: "지원합니다 — 130개국 전체 hreflang 매트릭스",
      competitorHreflang: "제한적이거나 단일 시장",
      multicurrency: "다중 통화 표시",
      viralefyMulticurrency: "지원합니다 — USD 기준 + 6개 통화 현지 표시",
      competitorMulticurrency: "USD 또는 단일 법정 통화만",
      competitorWindowSuffix: (h) => `${h}시간 윈도우`,
    },
  },
  ar: {
    metaTitle: (name) => `Viralefy مقابل ${name} — مقارنة جنبًا إلى جنب`,
    metaDescription: (name) =>
      `قارن بين Viralefy و${name} في السعر الابتدائي (USDT) ووقت التسليم وتعويض النقص ومدفوعات العملات المشفرة والدعم البشري على مدار الساعة.`,
    heroSubtitleSuffix: " فيما يلي مقارنة وقائعية مبنية على معلومات متاحة للعموم.",
    breadcrumbHome: "الرئيسية",
    breadcrumbComparisons: "المقارنات",
    thFeature: "الميزة",
    thViralefy: "Viralefy",
    ctaHeadline: "جرّب Viralefy بدءًا من $1.00",
    ctaSubtitle: "اختر السوق، اختر الخطة، وادفع بالدولار الأمريكي أو اليورو أو الريال البرازيلي أو العملات المشفرة. يبدأ التسليم خلال دقائق.",
    ctaBrowse: "تصفّح الخطط",
    dataAsOf: (d) =>
      `بيانات مبنية على معلومات عامة حتى ${d}. أرسل أي تصحيحات إلى الدعم وسنُحدّث هذه الصفحة.`,
    schemaArticleDesc: (name) => `مقارنة وقائعية جنبًا إلى جنب بين Viralefy و${name}.`,
    rows: {
      startingPrice: "السعر الابتدائي",
      viralefyStartingPrice: "بدءًا من $1.00 USD (100 إعجاب على Instagram)",
      avgDelivery: "متوسط وقت التسليم",
      viralefyAvgDelivery: "0–6 ساعات (تبدأ معظم الطلبات خلال دقائق)",
      refill: "ضمان تعويض النقص",
      viralefyRefill: "تعويض النقص لمدة 30 يومًا",
      refillNo: "غير متوفر",
      support: "قناة الدعم",
      viralefySupport: "تذاكر دعم داخل الحساب (مجاني، غير متزامن)",
      supportNone: "غير معلن",
      crypto: "الدفع بالعملات المشفرة",
      viralefyCrypto: "نعم — USDT و BTC عبر Heleket",
      cryptoNo: "غير متوفر",
      cardPix: "بطاقة + PIX",
      viralefyCardPix: "Stripe (بطاقة) + Abacate Pay (PIX بالريال البرازيلي)",
      competitorCard: "بطاقة (يختلف)",
      hreflang: "Hreflang + 130 سوقًا",
      viralefyHreflang: "نعم — مصفوفة hreflang كاملة عبر 130 دولة",
      competitorHreflang: "محدود أو سوق واحد",
      multicurrency: "عرض متعدد العملات",
      viralefyMulticurrency: "نعم — USD معياري + عرض محلي بـ 6 عملات",
      competitorMulticurrency: "USD فقط أو عملة قانونية واحدة",
      competitorWindowSuffix: (h) => `نافذة ${h} ساعة`,
    },
  },
  zh: {
    metaTitle: (name) => `Viralefy 对比 ${name} — 并列比较`,
    metaDescription: (name) =>
      `从起步价格(USDT)、交付时间、补单、加密货币支付以及 24/7 真人客服等维度,比较 Viralefy 与 ${name}。`,
    heroSubtitleSuffix: " 以下基于公开信息进行客观并列比较。",
    breadcrumbHome: "首页",
    breadcrumbComparisons: "比较",
    thFeature: "项目",
    thViralefy: "Viralefy",
    ctaHeadline: "$1.00 起体验 Viralefy",
    ctaSubtitle: "选择市场、选择套餐,使用 USD、EUR、BRL 或加密货币支付。交付在数分钟内启动。",
    ctaBrowse: "浏览套餐",
    dataAsOf: (d) =>
      `数据基于截至 ${d} 的公开信息。如有勘误请发至客服,我们将更新本页。`,
    schemaArticleDesc: (name) => `Viralefy 与 ${name} 的事实性并列比较。`,
    rows: {
      startingPrice: "起步价格",
      viralefyStartingPrice: "$1.00 USD 起(100 个 Instagram 点赞)",
      avgDelivery: "平均交付时间",
      viralefyAvgDelivery: "0–6 小时(多数订单数分钟内启动)",
      refill: "补单保障",
      viralefyRefill: "掉量后 30 天内自动补单",
      refillNo: "不提供",
      support: "客服渠道",
      viralefySupport: "账户内工单(免费,异步)",
      supportNone: "未披露",
      crypto: "加密货币支付",
      viralefyCrypto: "支持 — 通过 Heleket 支持 USDT、BTC",
      cryptoNo: "不提供",
      cardPix: "银行卡 + PIX",
      viralefyCardPix: "Stripe(银行卡)+ Abacate Pay(PIX BRL)",
      competitorCard: "银行卡(因平台而异)",
      hreflang: "Hreflang + 130 个市场",
      viralefyHreflang: "支持 — 覆盖 130 国的完整 hreflang 矩阵",
      competitorHreflang: "有限或单一市场",
      multicurrency: "多币种展示",
      viralefyMulticurrency: "支持 — 以 USD 为基准 + 6 种货币本地展示",
      competitorMulticurrency: "仅 USD 或单一法币",
      competitorWindowSuffix: (h) => `${h} 小时窗口`,
    },
  },
  hi: {
    metaTitle: (name) => `Viralefy बनाम ${name} — साथ-साथ तुलना`,
    metaDescription: (name) =>
      `Viralefy और ${name} की तुलना शुरुआती कीमत (USDT), डिलीवरी समय, रिफिल, क्रिप्टो भुगतान और 24/7 मानवीय सहायता पर करें।`,
    heroSubtitleSuffix: " नीचे सार्वजनिक रूप से उपलब्ध जानकारी पर आधारित तथ्यात्मक तुलना है।",
    breadcrumbHome: "होम",
    breadcrumbComparisons: "तुलना",
    thFeature: "विशेषता",
    thViralefy: "Viralefy",
    ctaHeadline: "$1.00 से Viralefy आज़माएँ",
    ctaSubtitle: "एक बाज़ार चुनें, एक प्लान चुनें, और USD, EUR, BRL या क्रिप्टो में भुगतान करें। डिलीवरी मिनटों में शुरू होती है।",
    ctaBrowse: "प्लान देखें",
    dataAsOf: (d) =>
      `${d} तक की सार्वजनिक जानकारी पर आधारित डेटा। सुधार के लिए सहायता को संदेश भेजें और हम यह पृष्ठ अपडेट करेंगे।`,
    schemaArticleDesc: (name) => `Viralefy और ${name} के बीच तथ्यात्मक साथ-साथ तुलना।`,
    rows: {
      startingPrice: "शुरुआती कीमत",
      viralefyStartingPrice: "$1.00 USD से (100 Instagram लाइक्स)",
      avgDelivery: "औसत डिलीवरी समय",
      viralefyAvgDelivery: "0–6 घंटे (अधिकांश ऑर्डर मिनटों में शुरू)",
      refill: "रिफिल गारंटी",
      viralefyRefill: "गिरावट पर 30-दिन की रिफिल",
      refillNo: "उपलब्ध नहीं",
      support: "सहायता चैनल",
      viralefySupport: "खाते के भीतर सपोर्ट टिकट (निःशुल्क, asynchronous)",
      supportNone: "घोषित नहीं",
      crypto: "क्रिप्टो भुगतान",
      viralefyCrypto: "हाँ — Heleket के माध्यम से USDT, BTC",
      cryptoNo: "उपलब्ध नहीं",
      cardPix: "कार्ड + PIX",
      viralefyCardPix: "Stripe (कार्ड) + Abacate Pay (PIX BRL)",
      competitorCard: "कार्ड (बदलता है)",
      hreflang: "Hreflang + 130 बाज़ार",
      viralefyHreflang: "हाँ — 130 देशों में पूर्ण hreflang मैट्रिक्स",
      competitorHreflang: "सीमित या केवल एक बाज़ार",
      multicurrency: "बहु-मुद्रा प्रदर्शन",
      viralefyMulticurrency: "हाँ — USD मानक + 6 मुद्राओं में स्थानीय प्रदर्शन",
      competitorMulticurrency: "केवल USD या एकल फ़िएट मुद्रा",
      competitorWindowSuffix: (h) => `${h} घंटे की विंडो`,
    },
  },
  tr: {
    metaTitle: (name) => `Viralefy vs ${name} — yan yana karşılaştırma`,
    metaDescription: (name) =>
      `Viralefy ile ${name} arasında başlangıç fiyatı (USDT), teslimat süresi, yenileme, kripto ödeme ve 7/24 insan destek açısından karşılaştırma.`,
    heroSubtitleSuffix: " Aşağıda kamuya açık bilgilere dayanan olgusal bir karşılaştırma yer alıyor.",
    breadcrumbHome: "Ana sayfa",
    breadcrumbComparisons: "Karşılaştırmalar",
    thFeature: "Özellik",
    thViralefy: "Viralefy",
    ctaHeadline: "Viralefy'i $1.00'dan deneyin",
    ctaSubtitle: "Bir pazar ve bir plan seçin; USD, EUR, BRL veya kripto ile ödeyin. Teslimat birkaç dakika içinde başlar.",
    ctaBrowse: "Planlara göz at",
    dataAsOf: (d) =>
      `Veriler ${d} tarihine kadar olan kamuya açık bilgilere dayanmaktadır. Düzeltmeleri destek ekibine iletin, bu sayfayı güncelleyelim.`,
    schemaArticleDesc: (name) => `Viralefy ile ${name} arasında olgusal yan yana karşılaştırma.`,
    rows: {
      startingPrice: "Başlangıç fiyatı",
      viralefyStartingPrice: "$1.00 USD'den (100 Instagram beğeni)",
      avgDelivery: "Ortalama teslimat süresi",
      viralefyAvgDelivery: "0–6 saat (siparişlerin çoğu dakikalar içinde başlar)",
      refill: "Yenileme garantisi",
      viralefyRefill: "Düşüşler için 30 günlük yenileme",
      refillNo: "Sunulmuyor",
      support: "Destek kanalı",
      viralefySupport: "Hesap içi destek biletleri (ücretsiz, asenkron)",
      supportNone: "Açıklanmadı",
      crypto: "Kripto ödemeler",
      viralefyCrypto: "Evet — Heleket üzerinden USDT, BTC",
      cryptoNo: "Sunulmuyor",
      cardPix: "Kart + PIX",
      viralefyCardPix: "Stripe (kart) + Abacate Pay (PIX BRL)",
      competitorCard: "Kart (değişken)",
      hreflang: "Hreflang + 130 pazar",
      viralefyHreflang: "Evet — 130 ülkede tam hreflang matrisi",
      competitorHreflang: "Sınırlı veya tek pazar",
      multicurrency: "Çoklu para birimi gösterimi",
      viralefyMulticurrency: "Evet — kanonik USD + 6 para biriminde yerel gösterim",
      competitorMulticurrency: "Yalnızca USD veya tek bir fiat para birimi",
      competitorWindowSuffix: (h) => `${h} saatlik pencere`,
    },
  },
  pl: {
    metaTitle: (name) => `Viralefy vs ${name} — porównanie obok siebie`,
    metaDescription: (name) =>
      `Porównaj Viralefy i ${name} pod kątem ceny startowej (USDT), czasu dostawy, uzupełnienia, płatności krypto i wsparcia 24/7.`,
    heroSubtitleSuffix: " Poniżej obiektywne porównanie oparte na publicznie dostępnych informacjach.",
    breadcrumbHome: "Strona główna",
    breadcrumbComparisons: "Porównania",
    thFeature: "Funkcja",
    thViralefy: "Viralefy",
    ctaHeadline: "Wypróbuj Viralefy już od 1,00 $",
    ctaSubtitle: "Wybierz rynek, wybierz plan i zapłać w USD, EUR, BRL lub krypto. Dostawa rusza w ciągu kilku minut.",
    ctaBrowse: "Przeglądaj plany",
    dataAsOf: (d) =>
      `Dane oparte na informacjach publicznych na dzień ${d}. Prześlij poprawki do wsparcia, a zaktualizujemy tę stronę.`,
    schemaArticleDesc: (name) => `Obiektywne porównanie obok siebie pomiędzy Viralefy a ${name}.`,
    rows: {
      startingPrice: "Cena startowa",
      viralefyStartingPrice: "od 1,00 $ USD (100 polubień na Instagramie)",
      avgDelivery: "Średni czas dostawy",
      viralefyAvgDelivery: "0–6 godzin (większość zamówień rusza w ciągu minut)",
      refill: "Gwarancja uzupełnienia",
      viralefyRefill: "30-dniowe uzupełnienie spadków",
      refillNo: "Niedostępne",
      support: "Kanał wsparcia",
      viralefySupport: "Zgłoszenia w panelu konta (bezpłatne, asynchroniczne)",
      supportNone: "Nieujawnione",
      crypto: "Płatności krypto",
      viralefyCrypto: "Tak — USDT, BTC przez Heleket",
      cryptoNo: "Niedostępne",
      cardPix: "Karta + PIX",
      viralefyCardPix: "Stripe (karta) + Abacate Pay (PIX BRL)",
      competitorCard: "Karta (różnie)",
      hreflang: "Hreflang + 130 rynków",
      viralefyHreflang: "Tak — pełna matryca hreflang dla 130 krajów",
      competitorHreflang: "Ograniczony lub jeden rynek",
      multicurrency: "Wyświetlanie wielowalutowe",
      viralefyMulticurrency: "Tak — kanoniczne USD + lokalne wyświetlanie w 6 walutach",
      competitorMulticurrency: "Tylko USD lub jedna waluta fiat",
      competitorWindowSuffix: (h) => `okno ${h} godz.`,
    },
  },
  sv: {
    metaTitle: (name) => `Viralefy vs ${name} — sida vid sida-jämförelse`,
    metaDescription: (name) =>
      `Jämför Viralefy och ${name} på startpris (USDT), leveranstid, påfyllning, kryptobetalningar och support dygnet runt.`,
    heroSubtitleSuffix: " Här är en saklig sida vid sida-jämförelse baserad på offentligt tillgänglig information.",
    breadcrumbHome: "Hem",
    breadcrumbComparisons: "Jämförelser",
    thFeature: "Funktion",
    thViralefy: "Viralefy",
    ctaHeadline: "Testa Viralefy från 1,00 $",
    ctaSubtitle: "Välj en marknad, välj ett paket och betala i USD, EUR, BRL eller krypto. Leveransen startar inom några minuter.",
    ctaBrowse: "Bläddra bland paket",
    dataAsOf: (d) =>
      `Data baserad på offentlig information per ${d}. Skicka korrigeringar till supporten så uppdaterar vi sidan.`,
    schemaArticleDesc: (name) => `Saklig sida vid sida-jämförelse mellan Viralefy och ${name}.`,
    rows: {
      startingPrice: "Startpris",
      viralefyStartingPrice: "från 1,00 $ USD (100 gillningar på Instagram)",
      avgDelivery: "Genomsnittlig leveranstid",
      viralefyAvgDelivery: "0–6 timmar (de flesta order startar inom minuter)",
      refill: "Påfyllningsgaranti",
      viralefyRefill: "30 dagars påfyllning vid tapp",
      refillNo: "Erbjuds inte",
      support: "Supportkanal",
      viralefySupport: "Supportärenden i kontot (gratis, asynkront)",
      supportNone: "Ej angivet",
      crypto: "Kryptobetalningar",
      viralefyCrypto: "Ja — USDT, BTC via Heleket",
      cryptoNo: "Erbjuds inte",
      cardPix: "Kort + PIX",
      viralefyCardPix: "Stripe (kort) + Abacate Pay (PIX BRL)",
      competitorCard: "Kort (varierar)",
      hreflang: "Hreflang + 130 marknader",
      viralefyHreflang: "Ja — komplett hreflang-matris över 130 länder",
      competitorHreflang: "Begränsat eller en enda marknad",
      multicurrency: "Flervalutavisning",
      viralefyMulticurrency: "Ja — USD som kanon + lokal visning i 6 valutor",
      competitorMulticurrency: "Endast USD eller en enda fiatvaluta",
      competitorWindowSuffix: (h) => `${h} h-fönster`,
    },
  },
  da: {
    metaTitle: (name) => `Viralefy vs ${name} — side om side-sammenligning`,
    metaDescription: (name) =>
      `Sammenlign Viralefy og ${name} på startpris (USDT), leveringstid, genopfyldning, krypto-betalinger og 24/7 menneskelig support.`,
    heroSubtitleSuffix: " Her er en faktuel sammenligning baseret på offentligt tilgængelige oplysninger.",
    breadcrumbHome: "Hjem",
    breadcrumbComparisons: "Sammenligninger",
    thFeature: "Funktion",
    thViralefy: "Viralefy",
    ctaHeadline: "Køb Viralefy fra $1,00",
    ctaSubtitle: "Vælg et marked, vælg en pakke, og betal i USD, EUR, BRL eller krypto. Leveringen starter inden for få minutter.",
    ctaBrowse: "Se pakker",
    dataAsOf: (d) =>
      `Data baseret på offentlige oplysninger pr. ${d}. Send rettelser til support, så opdaterer vi denne side.`,
    schemaArticleDesc: (name) => `Faktuel side om side-sammenligning mellem Viralefy og ${name}.`,
    rows: {
      startingPrice: "Startpris",
      viralefyStartingPrice: "fra $1,00 USD (100 Instagram-likes)",
      avgDelivery: "Gennemsnitlig leveringstid",
      viralefyAvgDelivery: "0–6 timer (de fleste ordrer starter inden for få minutter)",
      refill: "Genopfyldningsgaranti",
      viralefyRefill: "30 dages genopfyldning ved tab",
      refillNo: "Tilbydes ikke",
      support: "Supportkanal",
      viralefySupport: "Supportsager i kontoen (gratis, asynkrone)",
      supportNone: "Ikke oplyst",
      crypto: "Krypto-betalinger",
      viralefyCrypto: "Ja — USDT, BTC via Heleket",
      cryptoNo: "Tilbydes ikke",
      cardPix: "Kort + PIX",
      viralefyCardPix: "Stripe (kort) + Abacate Pay (PIX BRL)",
      competitorCard: "Kort (varierer)",
      hreflang: "Hreflang + 130 markeder",
      viralefyHreflang: "Ja — komplet hreflang-matrix på tværs af 130 lande",
      competitorHreflang: "Begrænset eller enkelt marked",
      multicurrency: "Multivaluta-visning",
      viralefyMulticurrency: "Ja — kanonisk USD + lokal visning i 6 valutaer",
      competitorMulticurrency: "Kun USD eller én fiatvaluta",
      competitorWindowSuffix: (h) => `${h} t-vindue`,
    },
  },
  no: {
    metaTitle: (name) => `Viralefy vs ${name} — side ved side-sammenligning`,
    metaDescription: (name) =>
      `Sammenlign Viralefy og ${name} på startpris (USDT), leveringstid, påfylling, kryptobetalinger og menneskelig støtte døgnet rundt.`,
    heroSubtitleSuffix: " Her er en saklig sammenligning basert på offentlig tilgjengelig informasjon.",
    breadcrumbHome: "Hjem",
    breadcrumbComparisons: "Sammenligninger",
    thFeature: "Funksjon",
    thViralefy: "Viralefy",
    ctaHeadline: "Kjøp Viralefy fra $1,00",
    ctaSubtitle: "Velg et marked, velg en pakke, og betal i USD, EUR, BRL eller krypto. Leveringen starter innen få minutter.",
    ctaBrowse: "Se pakker",
    dataAsOf: (d) =>
      `Data basert på offentlig informasjon per ${d}. Send rettelser til støtte, så oppdaterer vi denne siden.`,
    schemaArticleDesc: (name) => `Saklig side ved side-sammenligning mellom Viralefy og ${name}.`,
    rows: {
      startingPrice: "Startpris",
      viralefyStartingPrice: "fra $1,00 USD (100 Instagram-likes)",
      avgDelivery: "Gjennomsnittlig leveringstid",
      viralefyAvgDelivery: "0–6 timer (de fleste ordrer starter innen få minutter)",
      refill: "Påfyllingsgaranti",
      viralefyRefill: "30 dagers påfylling ved tap",
      refillNo: "Tilbys ikke",
      support: "Støttekanal",
      viralefySupport: "Støttesaker i kontoen (gratis, asynkrone)",
      supportNone: "Ikke oppgitt",
      crypto: "Kryptobetalinger",
      viralefyCrypto: "Ja — USDT, BTC via Heleket",
      cryptoNo: "Tilbys ikke",
      cardPix: "Kort + PIX",
      viralefyCardPix: "Stripe (kort) + Abacate Pay (PIX BRL)",
      competitorCard: "Kort (varierer)",
      hreflang: "Hreflang + 130 markeder",
      viralefyHreflang: "Ja — komplett hreflang-matrise over 130 land",
      competitorHreflang: "Begrenset eller ett marked",
      multicurrency: "Flervaluta-visning",
      viralefyMulticurrency: "Ja — kanonisk USD + lokal visning i 6 valutaer",
      competitorMulticurrency: "Bare USD eller én fiatvaluta",
      competitorWindowSuffix: (h) => `${h} t-vindu`,
    },
  },
  fi: {
    metaTitle: (name) => `Viralefy vs ${name} — vierekkäinen vertailu`,
    metaDescription: (name) =>
      `Vertaa Viralefyä ja ${name}-palvelua aloitushinnan (USDT), toimitusajan, täydennyksen, kryptomaksujen ja 24/7 ihmisten tuen osalta.`,
    heroSubtitleSuffix: " Alla on asiallinen vertailu, joka perustuu julkisesti saatavilla oleviin tietoihin.",
    breadcrumbHome: "Etusivu",
    breadcrumbComparisons: "Vertailut",
    thFeature: "Ominaisuus",
    thViralefy: "Viralefy",
    ctaHeadline: "Osta Viralefy alkaen 1,00 $",
    ctaSubtitle: "Valitse markkina ja paketti, maksa USD:nä, EUR:na, BRL:nä tai kryptolla. Toimitus alkaa muutamassa minuutissa.",
    ctaBrowse: "Selaa paketteja",
    dataAsOf: (d) =>
      `Tiedot perustuvat julkiseen tietoon ${d} mennessä. Lähetä korjaukset tukeen, niin päivitämme tämän sivun.`,
    schemaArticleDesc: (name) => `Asiallinen vierekkäinen vertailu Viralefyn ja ${name}:n välillä.`,
    rows: {
      startingPrice: "Aloitushinta",
      viralefyStartingPrice: "alkaen 1,00 $ USD (100 Instagram-tykkäystä)",
      avgDelivery: "Keskimääräinen toimitusaika",
      viralefyAvgDelivery: "0–6 tuntia (suurin osa tilauksista alkaa muutamassa minuutissa)",
      refill: "Täydennystakuu",
      viralefyRefill: "30 päivän täydennys menetyksen yhteydessä",
      refillNo: "Ei tarjolla",
      support: "Tukikanava",
      viralefySupport: "Tukitiketit tilin sisällä (ilmainen, asynkroninen)",
      supportNone: "Ei ilmoitettu",
      crypto: "Kryptomaksut",
      viralefyCrypto: "Kyllä — USDT, BTC Heleketin kautta",
      cryptoNo: "Ei tarjolla",
      cardPix: "Kortti + PIX",
      viralefyCardPix: "Stripe (kortti) + Abacate Pay (PIX BRL)",
      competitorCard: "Kortti (vaihtelee)",
      hreflang: "Hreflang + 130 markkinaa",
      viralefyHreflang: "Kyllä — täydellinen hreflang-matriisi 130 maassa",
      competitorHreflang: "Rajoitettu tai yksittäinen markkina",
      multicurrency: "Monivaluuttainen näyttö",
      viralefyMulticurrency: "Kyllä — kanoninen USD + paikallinen näyttö 6 valuutassa",
      competitorMulticurrency: "Vain USD tai yksi fiat-valuutta",
      competitorWindowSuffix: (h) => `${h} t -ikkuna`,
    },
  },
  he: {
    metaTitle: (name) => `Viralefy מול ${name} — השוואה זה לצד זה`,
    metaDescription: (name) =>
      `השוו את Viralefy ו-${name} במחיר התחלתי (USDT), זמן אספקה, מילוי מחדש, תשלומי קריפטו ותמיכה אנושית 24/7.`,
    heroSubtitleSuffix: " להלן השוואה עובדתית המבוססת על מידע ציבורי.",
    breadcrumbHome: "דף הבית",
    breadcrumbComparisons: "השוואות",
    thFeature: "מאפיין",
    thViralefy: "Viralefy",
    ctaHeadline: "נסו את Viralefy החל מ-$1.00",
    ctaSubtitle: "בחרו שוק, בחרו חבילה, ושלמו ב-USD, EUR, BRL או קריפטו. האספקה מתחילה תוך דקות.",
    ctaBrowse: "עיינו בחבילות",
    dataAsOf: (d) =>
      `נתונים מבוססים על מידע ציבורי נכון ל-${d}. שלחו תיקונים לתמיכה ונעדכן את הדף הזה.`,
    schemaArticleDesc: (name) => `השוואה עובדתית זה לצד זה בין Viralefy ל-${name}.`,
    rows: {
      startingPrice: "מחיר התחלתי",
      viralefyStartingPrice: "החל מ-$1.00 USD (100 לייקים באינסטגרם)",
      avgDelivery: "זמן אספקה ממוצע",
      viralefyAvgDelivery: "0–6 שעות (רוב ההזמנות מתחילות תוך דקות)",
      refill: "אחריות מילוי מחדש",
      viralefyRefill: "מילוי מחדש ל-30 יום במקרה של ירידה",
      refillNo: "לא מוצע",
      support: "ערוץ תמיכה",
      viralefySupport: "פניות תמיכה בחשבון (חינם, אסינכרוני)",
      supportNone: "לא נחשף",
      crypto: "תשלומי קריפטו",
      viralefyCrypto: "כן — USDT, BTC דרך Heleket",
      cryptoNo: "לא מוצע",
      cardPix: "כרטיס + PIX",
      viralefyCardPix: "Stripe (כרטיס) + Abacate Pay (PIX BRL)",
      competitorCard: "כרטיס (משתנה)",
      hreflang: "Hreflang + 130 שווקים",
      viralefyHreflang: "כן — מטריצת hreflang מלאה ב-130 מדינות",
      competitorHreflang: "מוגבל או שוק יחיד",
      multicurrency: "תצוגה במספר מטבעות",
      viralefyMulticurrency: "כן — USD קנוני + תצוגה מקומית ב-6 מטבעות",
      competitorMulticurrency: "רק USD או מטבע פיאט יחיד",
      competitorWindowSuffix: (h) => `חלון של ${h} שעות`,
    },
  },
  uk: {
    metaTitle: (name) => `Viralefy проти ${name} — порівняння поруч`,
    metaDescription: (name) =>
      `Порівняйте Viralefy та ${name} за стартовою ціною (USDT), часом доставки, поповненням, оплатою криптою та підтримкою 24/7.`,
    heroSubtitleSuffix: " Нижче — фактологічне порівняння на основі загальнодоступної інформації.",
    breadcrumbHome: "Головна",
    breadcrumbComparisons: "Порівняння",
    thFeature: "Параметр",
    thViralefy: "Viralefy",
    ctaHeadline: "Спробуйте Viralefy від $1.00",
    ctaSubtitle: "Оберіть ринок, оберіть тариф, платіть у USD, EUR, BRL або крипті. Доставка стартує за лічені хвилини.",
    ctaBrowse: "Переглянути тарифи",
    dataAsOf: (d) =>
      `Дані ґрунтуються на загальнодоступній інформації станом на ${d}. Надсилайте правки до підтримки — ми оновимо цю сторінку.`,
    schemaArticleDesc: (name) => `Фактологічне порівняння Viralefy та ${name} поруч.`,
    rows: {
      startingPrice: "Стартова ціна",
      viralefyStartingPrice: "від $1.00 USD (за 100 вподобайок в Instagram)",
      avgDelivery: "Середній час доставки",
      viralefyAvgDelivery: "0–6 годин (більшість замовлень стартують за хвилини)",
      refill: "Гарантія поповнення",
      viralefyRefill: "Поповнення протягом 30 днів у разі відписок",
      refillNo: "Не пропонується",
      support: "Канал підтримки",
      viralefySupport: "Тікети всередині акаунта (безкоштовно, асинхронно)",
      supportNone: "Не розкрито",
      crypto: "Оплата криптою",
      viralefyCrypto: "Так — USDT, BTC через Heleket",
      cryptoNo: "Не пропонується",
      cardPix: "Картка + PIX",
      viralefyCardPix: "Stripe (картка) + Abacate Pay (PIX BRL)",
      competitorCard: "Картка (варіюється)",
      hreflang: "Hreflang + 130 ринків",
      viralefyHreflang: "Так — повна матриця hreflang у 130 країнах",
      competitorHreflang: "Обмежено або один ринок",
      multicurrency: "Мультивалютне відображення",
      viralefyMulticurrency: "Так — USD як канон + локальне відображення у 6 валютах",
      competitorMulticurrency: "Лише USD або одна фіатна валюта",
      competitorWindowSuffix: (h) => `вікно ${h} год`,
    },
  },
  cs: {
    metaTitle: (name) => `Viralefy vs ${name} — srovnání vedle sebe`,
    metaDescription: (name) =>
      `Porovnejte Viralefy a ${name} z hlediska počáteční ceny (USDT), doby dodání, doplnění, plateb v kryptu a lidské podpory 24/7.`,
    heroSubtitleSuffix: " Níže je věcné srovnání založené na veřejně dostupných informacích.",
    breadcrumbHome: "Domů",
    breadcrumbComparisons: "Srovnání",
    thFeature: "Vlastnost",
    thViralefy: "Viralefy",
    ctaHeadline: "Vyzkoušejte Viralefy od $1.00",
    ctaSubtitle: "Vyberte trh, vyberte plán a plaťte v USD, EUR, BRL nebo kryptu. Dodání začíná během minut.",
    ctaBrowse: "Procházet plány",
    dataAsOf: (d) =>
      `Data vycházejí z veřejně dostupných informací k ${d}. Opravy posílejte na podporu a stránku aktualizujeme.`,
    schemaArticleDesc: (name) => `Věcné srovnání vedle sebe mezi Viralefy a ${name}.`,
    rows: {
      startingPrice: "Počáteční cena",
      viralefyStartingPrice: "od $1.00 USD (100 lajků na Instagramu)",
      avgDelivery: "Průměrná doba dodání",
      viralefyAvgDelivery: "0–6 hodin (většina objednávek startuje během minut)",
      refill: "Záruka doplnění",
      viralefyRefill: "30denní doplnění při úbytku",
      refillNo: "Nenabízí se",
      support: "Kanál podpory",
      viralefySupport: "Tikety v účtu (zdarma, asynchronní)",
      supportNone: "Nezveřejněno",
      crypto: "Platby v kryptu",
      viralefyCrypto: "Ano — USDT, BTC přes Heleket",
      cryptoNo: "Nenabízí se",
      cardPix: "Karta + PIX",
      viralefyCardPix: "Stripe (karta) + Abacate Pay (PIX BRL)",
      competitorCard: "Karta (různí se)",
      hreflang: "Hreflang + 130 trhů",
      viralefyHreflang: "Ano — kompletní matice hreflang ve 130 zemích",
      competitorHreflang: "Omezený nebo jediný trh",
      multicurrency: "Vícevalutové zobrazení",
      viralefyMulticurrency: "Ano — kanonické USD + místní zobrazení v 6 měnách",
      competitorMulticurrency: "Pouze USD nebo jedna fiat měna",
      competitorWindowSuffix: (h) => `okno ${h} h`,
    },
  },
  sk: {
    metaTitle: (name) => `Viralefy vs ${name} — porovnanie vedľa seba`,
    metaDescription: (name) =>
      `Porovnajte Viralefy a ${name} z hľadiska počiatočnej ceny (USDT), času doručenia, doplnenia, platieb v krypte a ľudskej podpory 24/7.`,
    heroSubtitleSuffix: " Nižšie je vecné porovnanie založené na verejne dostupných informáciách.",
    breadcrumbHome: "Domov",
    breadcrumbComparisons: "Porovnania",
    thFeature: "Vlastnosť",
    thViralefy: "Viralefy",
    ctaHeadline: "Vyskúšajte Viralefy od $1.00",
    ctaSubtitle: "Vyberte trh, vyberte plán a plaťte v USD, EUR, BRL alebo krypte. Doručenie sa začína v priebehu minút.",
    ctaBrowse: "Prezerať plány",
    dataAsOf: (d) =>
      `Údaje vychádzajú z verejne dostupných informácií k ${d}. Opravy pošlite na podporu a stránku aktualizujeme.`,
    schemaArticleDesc: (name) => `Vecné porovnanie vedľa seba medzi Viralefy a ${name}.`,
    rows: {
      startingPrice: "Počiatočná cena",
      viralefyStartingPrice: "od $1.00 USD (100 lajkov na Instagrame)",
      avgDelivery: "Priemerný čas doručenia",
      viralefyAvgDelivery: "0–6 hodín (väčšina objednávok štartuje v priebehu minút)",
      refill: "Záruka doplnenia",
      viralefyRefill: "30-dňové doplnenie pri úbytku",
      refillNo: "Neponúka sa",
      support: "Kanál podpory",
      viralefySupport: "Tikety v účte (zdarma, asynchrónne)",
      supportNone: "Nezverejnené",
      crypto: "Platby v krypte",
      viralefyCrypto: "Áno — USDT, BTC cez Heleket",
      cryptoNo: "Neponúka sa",
      cardPix: "Karta + PIX",
      viralefyCardPix: "Stripe (karta) + Abacate Pay (PIX BRL)",
      competitorCard: "Karta (líši sa)",
      hreflang: "Hreflang + 130 trhov",
      viralefyHreflang: "Áno — kompletná matica hreflang v 130 krajinách",
      competitorHreflang: "Obmedzený alebo jediný trh",
      multicurrency: "Viacmenové zobrazenie",
      viralefyMulticurrency: "Áno — kanonické USD + miestne zobrazenie v 6 menách",
      competitorMulticurrency: "Iba USD alebo jedna fiat mena",
      competitorWindowSuffix: (h) => `okno ${h} h`,
    },
  },
  th: {
    metaTitle: (name) => `Viralefy เทียบกับ ${name} — เปรียบเทียบเคียงข้างกัน`,
    metaDescription: (name) =>
      `เปรียบเทียบ Viralefy และ ${name} ในด้านราคาเริ่มต้น (USDT) เวลาการจัดส่ง การเติม การชำระเงินด้วยคริปโต และการสนับสนุนจากมนุษย์ 24/7`,
    heroSubtitleSuffix: " ด้านล่างเป็นการเปรียบเทียบเชิงข้อเท็จจริงโดยอ้างอิงข้อมูลที่เปิดเผยต่อสาธารณะ",
    breadcrumbHome: "หน้าแรก",
    breadcrumbComparisons: "การเปรียบเทียบ",
    thFeature: "คุณสมบัติ",
    thViralefy: "Viralefy",
    ctaHeadline: "ลอง Viralefy เริ่มต้น $1.00",
    ctaSubtitle: "เลือกตลาด เลือกแผน และชำระเงินด้วย USD, EUR, BRL หรือคริปโต การจัดส่งเริ่มภายในไม่กี่นาที",
    ctaBrowse: "ดูแผนทั้งหมด",
    dataAsOf: (d) =>
      `ข้อมูลอ้างอิงจากข้อมูลสาธารณะ ณ วันที่ ${d} ส่งการแก้ไขมาที่ฝ่ายสนับสนุน เราจะอัปเดตหน้านี้`,
    schemaArticleDesc: (name) => `การเปรียบเทียบเชิงข้อเท็จจริงเคียงข้างกันระหว่าง Viralefy และ ${name}`,
    rows: {
      startingPrice: "ราคาเริ่มต้น",
      viralefyStartingPrice: "เริ่มต้น $1.00 USD (100 ไลก์ Instagram)",
      avgDelivery: "เวลาจัดส่งเฉลี่ย",
      viralefyAvgDelivery: "0–6 ชั่วโมง (คำสั่งซื้อส่วนใหญ่เริ่มภายในไม่กี่นาที)",
      refill: "รับประกันการเติม",
      viralefyRefill: "เติมใหม่ 30 วันเมื่อมีการลดลง",
      refillNo: "ไม่มีให้บริการ",
      support: "ช่องทางสนับสนุน",
      viralefySupport: "ตั๋วสนับสนุนในบัญชี (ฟรี, ไม่ประสานเวลา)",
      supportNone: "ไม่เปิดเผย",
      crypto: "การชำระเงินด้วยคริปโต",
      viralefyCrypto: "ใช่ — USDT, BTC ผ่าน Heleket",
      cryptoNo: "ไม่มีให้บริการ",
      cardPix: "บัตร + PIX",
      viralefyCardPix: "Stripe (บัตร) + Abacate Pay (PIX BRL)",
      competitorCard: "บัตร (แตกต่างกันไป)",
      hreflang: "Hreflang + 130 ตลาด",
      viralefyHreflang: "ใช่ — เมทริกซ์ hreflang เต็มรูปแบบใน 130 ประเทศ",
      competitorHreflang: "จำกัดหรือตลาดเดียว",
      multicurrency: "การแสดงผลหลายสกุลเงิน",
      viralefyMulticurrency: "ใช่ — USD เป็นมาตรฐาน + แสดงผลท้องถิ่น 6 สกุลเงิน",
      competitorMulticurrency: "USD เท่านั้นหรือสกุลเงินเฟียตเดียว",
      competitorWindowSuffix: (h) => `หน้าต่าง ${h} ชั่วโมง`,
    },
  },
  vi: {
    metaTitle: (name) => `Viralefy so với ${name} — so sánh cạnh nhau`,
    metaDescription: (name) =>
      `So sánh Viralefy và ${name} về giá khởi điểm (USDT), thời gian giao hàng, bù đắp, thanh toán bằng crypto và hỗ trợ con người 24/7.`,
    heroSubtitleSuffix: " Dưới đây là so sánh thực tế dựa trên thông tin công khai.",
    breadcrumbHome: "Trang chủ",
    breadcrumbComparisons: "So sánh",
    thFeature: "Tính năng",
    thViralefy: "Viralefy",
    ctaHeadline: "Dùng thử Viralefy từ $1.00",
    ctaSubtitle: "Chọn một thị trường, chọn một gói, thanh toán bằng USD, EUR, BRL hoặc crypto. Giao hàng bắt đầu trong vài phút.",
    ctaBrowse: "Duyệt các gói",
    dataAsOf: (d) =>
      `Dữ liệu dựa trên thông tin công khai tính đến ${d}. Gửi đính chính tới bộ phận hỗ trợ và chúng tôi sẽ cập nhật trang này.`,
    schemaArticleDesc: (name) => `So sánh thực tế cạnh nhau giữa Viralefy và ${name}.`,
    rows: {
      startingPrice: "Giá khởi điểm",
      viralefyStartingPrice: "từ $1.00 USD (100 lượt thích Instagram)",
      avgDelivery: "Thời gian giao hàng trung bình",
      viralefyAvgDelivery: "0–6 giờ (hầu hết đơn hàng bắt đầu trong vài phút)",
      refill: "Bảo hành bù đắp",
      viralefyRefill: "Bù đắp 30 ngày khi giảm sút",
      refillNo: "Không cung cấp",
      support: "Kênh hỗ trợ",
      viralefySupport: "Phiếu hỗ trợ trong tài khoản (miễn phí, bất đồng bộ)",
      supportNone: "Không công bố",
      crypto: "Thanh toán crypto",
      viralefyCrypto: "Có — USDT, BTC qua Heleket",
      cryptoNo: "Không cung cấp",
      cardPix: "Thẻ + PIX",
      viralefyCardPix: "Stripe (thẻ) + Abacate Pay (PIX BRL)",
      competitorCard: "Thẻ (thay đổi)",
      hreflang: "Hreflang + 130 thị trường",
      viralefyHreflang: "Có — ma trận hreflang đầy đủ tại 130 quốc gia",
      competitorHreflang: "Hạn chế hoặc một thị trường duy nhất",
      multicurrency: "Hiển thị đa tiền tệ",
      viralefyMulticurrency: "Có — USD chuẩn + hiển thị địa phương ở 6 loại tiền tệ",
      competitorMulticurrency: "Chỉ USD hoặc một loại tiền pháp định duy nhất",
      competitorWindowSuffix: (h) => `cửa sổ ${h} giờ`,
    },
  },
  id: {
    metaTitle: (name) => `Viralefy vs ${name} — perbandingan berdampingan`,
    metaDescription: (name) =>
      `Bandingkan Viralefy dan ${name} dalam hal harga awal (USDT), waktu pengiriman, pengisian ulang, pembayaran kripto, dan dukungan manusia 24/7.`,
    heroSubtitleSuffix: " Berikut perbandingan faktual berdasarkan informasi yang tersedia untuk umum.",
    breadcrumbHome: "Beranda",
    breadcrumbComparisons: "Perbandingan",
    thFeature: "Fitur",
    thViralefy: "Viralefy",
    ctaHeadline: "Coba Viralefy mulai $1.00",
    ctaSubtitle: "Pilih pasar, pilih paket, bayar dengan USD, EUR, BRL atau kripto. Pengiriman dimulai dalam hitungan menit.",
    ctaBrowse: "Lihat paket",
    dataAsOf: (d) =>
      `Data berdasarkan informasi publik per ${d}. Kirim koreksi ke dukungan dan kami akan memperbarui halaman ini.`,
    schemaArticleDesc: (name) => `Perbandingan faktual berdampingan antara Viralefy dan ${name}.`,
    rows: {
      startingPrice: "Harga awal",
      viralefyStartingPrice: "mulai $1.00 USD (100 suka Instagram)",
      avgDelivery: "Waktu pengiriman rata-rata",
      viralefyAvgDelivery: "0–6 jam (sebagian besar pesanan dimulai dalam hitungan menit)",
      refill: "Jaminan pengisian ulang",
      viralefyRefill: "Pengisian ulang 30 hari untuk penurunan",
      refillNo: "Tidak ditawarkan",
      support: "Saluran dukungan",
      viralefySupport: "Tiket dukungan dalam akun (gratis, asinkron)",
      supportNone: "Tidak diungkapkan",
      crypto: "Pembayaran kripto",
      viralefyCrypto: "Ya — USDT, BTC via Heleket",
      cryptoNo: "Tidak ditawarkan",
      cardPix: "Kartu + PIX",
      viralefyCardPix: "Stripe (kartu) + Abacate Pay (PIX BRL)",
      competitorCard: "Kartu (bervariasi)",
      hreflang: "Hreflang + 130 pasar",
      viralefyHreflang: "Ya — matriks hreflang lengkap di 130 negara",
      competitorHreflang: "Terbatas atau pasar tunggal",
      multicurrency: "Tampilan multimata uang",
      viralefyMulticurrency: "Ya — USD kanonis + tampilan lokal dalam 6 mata uang",
      competitorMulticurrency: "Hanya USD atau satu mata uang fiat",
      competitorWindowSuffix: (h) => `jendela ${h} jam`,
    },
  },
};

// ISR (round 23 Track XX): SSG + revalidate. `headers()` força `ƒ` no Next 15
// até refactor de i18n. Cache via Caddy compensa enquanto isso.
export const revalidate = 1800;

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
        "it-IT": canonical,
        "ru-RU": canonical,
        "nl-NL": canonical,
        "ko-KR": canonical,
        ar: canonical,
        "zh-Hans": canonical,
        "hi-IN": canonical,
        "tr-TR": canonical,
        "pl-PL": canonical,
        "sv-SE": canonical,
        "da-DK": canonical,
        "nb-NO": canonical,
        "fi-FI": canonical,
        "he-IL": canonical,
        "uk-UA": canonical,
        "cs-CZ": canonical,
        "sk-SK": canonical,
        "th-TH": canonical,
        "vi-VN": canonical,
        "id-ID": canonical,
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
    it: "Sì",
    ru: "Да",
    nl: "Ja",
    ko: "지원",
    ar: "نعم",
    zh: "支持",
    hi: "हाँ",
    tr: "Evet",
    pl: "Tak",
    sv: "Ja",
    da: "Ja",
    no: "Ja",
    fi: "Kyllä",
    he: "כן",
    uk: "Так",
    cs: "Ano",
    sk: "Áno",
    th: "ใช่",
    vi: "Có",
    id: "Ya",
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

  // BUG-191: consolida BreadcrumbList + Article em UM @graph.
  const jsonld = toJsonLdGraph([
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tt.breadcrumbHome, item: url },
        { "@type": "ListItem", position: 2, name: tt.breadcrumbComparisons, item: `${url}/vs` },
        { "@type": "ListItem", position: 3, name: `Viralefy vs ${c.name}`, item: pageUrl },
      ],
    },
    {
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
  ]);

  return (
    <>
      <JsonLdScript data={jsonld} />

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
