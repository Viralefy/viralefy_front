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

type PageLang = "pt" | "en" | "es" | "fr" | "de" | "ja" | "it" | "ru" | "nl" | "ko";

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
        "it-IT": canonical,
        "ru-RU": canonical,
        "nl-NL": canonical,
        "ko-KR": canonical,
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
