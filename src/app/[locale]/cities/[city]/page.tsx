import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { CITIES, getCity } from "@/lib/cities";
import { toJsonLdGraph } from "@/lib/jsonld";
import { JsonLdScript } from "@/components/JsonLdScript";
import { Flag } from "@/components/Flag";
import { categorySlug } from "@/i18n/categories";
import type { LangCode } from "@/i18n/languages";

// BUG-89 (QA 2026-06-13): página rodava só em EN mesmo em /br/cities/...
// Agora detecta lang via header x-locale e usa pack PT mínimo + fallback EN.
// Track C escolheu pack mínimo (strings principais: hero, breadcrumb, CTAs,
// USPs/feature bullets, schema). Os 4 parágrafos longos de body copy ficam
// como débito: traduzi-los exige revisão de copywriter (preço por cidade,
// landmarks locais em PT, etc.) — encerrar isso em PT é trivial mas merece
// QA dedicado.

type PageLang = "pt" | "en" | "es" | "fr" | "de" | "ja" | "it" | "ru" | "nl" | "ko" | "ar" | "zh" | "hi" | "tr" | "pl" | "sv" | "da" | "no" | "fi" | "he" | "uk" | "cs" | "sk" | "th" | "vi" | "id";

// `headers()` REMOVIDO — anulava o ISR. Idioma vem de `params.locale`. Ver ADR.
function resolveLang(rawLocale: string): PageLang {
  const locale = rawLocale.toLowerCase();
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

type CityPack = {
  metaTitle: (city: string) => string;
  metaDescription: (city: string) => string;
  heroTitle: (city: string) => string;
  heroSubtitle: (city: string) => string;
  ctaSeePlans: (city: string) => string;
  ctaAllCities: string;
  breadcrumbHome: string;
  breadcrumbCities: string;
  whyHeading: (city: string) => string;
  bullets: (city: string, country: string) => string[];
  readyHeading: (city: string) => string;
  readyBody: (country: string) => string;
  readyCta: string;
  bodyP1: (city: string, hoods: string, landmark: string) => string;
  bodyP2: (city: string, population: string) => string;
  bodyP3: string;
  bodyP4: (city: string, hoods: string) => string;
  schemaWebPageName: (city: string) => string;
  schemaServiceName: (city: string) => string;
};

// Round 23 Track XX: PageLang foi expandido em outra Track (he/uk/cs/sk/th/vi/id)
// sem atualizar este Record. Pra desbloquear o build sem regredir i18n, usamos
// `Partial<>` — langs sem pack caem no fallback EN em runtime (lookup com `?? en`).
// Débito explícito: traduzir as 7 langs faltantes pra encerrar BUG-89 totalmente.
const CITY_T: Partial<Record<PageLang, CityPack>> = {
  en: {
    metaTitle: (city) => `Buy Instagram followers in ${city} — local growth | Viralefy`,
    metaDescription: (city) =>
      `Grow your Instagram and TikTok in ${city}. Real followers, likes and views with delivery tuned to local time zones. Pay in USDT/USD and ship in minutes.`,
    heroTitle: (city) => `Buy Instagram followers in ${city}`,
    heroSubtitle: (city) =>
      `Local audience, real engagement, instant delivery — built for creators and brands across ${city}.`,
    ctaSeePlans: (city) => `See ${city} plans`,
    ctaAllCities: "All cities",
    breadcrumbHome: "Home",
    breadcrumbCities: "Cities",
    whyHeading: (city) => `Why creators in ${city} pick Viralefy`,
    bullets: (city) => [
      "Real-looking accounts with profile photos, bios and posting history — no bot signatures.",
      `Delivery drip tuned to ${city} time zone so growth lands during local peak hours.`,
      "USDT/USD pricing — no FX surprises, no card data, no chargebacks.",
      "Refill guarantee against drops for 30 days on every follower package.",
      "Same dashboard for Instagram, TikTok, and recovery requests.",
      `Support in English plus the primary local language of ${city}.`,
    ],
    readyHeading: (city) => `Ready to grow in ${city}?`,
    readyBody: (country) =>
      `Pick a plan tuned to the ${country} market — followers, likes or views, delivered today.`,
    readyCta: "View Instagram follower plans",
    bodyP1: (city, hoods, landmark) =>
      `Whether you are a creator filming around ${landmark}, a small brand pushing pop-ups through ${hoods}, or an agency scaling client accounts across ${city}, audience density is the bottleneck. Viralefy ships Instagram followers, likes, comments and TikTok views with delivery windows aligned to your local time zone — so new social proof lands when your local audience is actually online.`,
    bodyP2: (city, population) =>
      `${city} is one of the most competitive feeds in the world. With more than ${population} residents and a dense creator economy, breaking the algorithm's warm-up phase without an initial push is brutal. Our starter packs cover that gap: a measured ramp of real-looking accounts that earns your post into the explore tab, then organic engagement compounds from there.`,
    bodyP3:
      "Every order is paid in USDT or USD, settled on-chain so there are no chargebacks and no exposed card data. Delivery starts within minutes of confirmation and finishes over hours or days depending on package size — the slow drip is intentional, it mirrors organic patterns so platform safety systems treat the growth as normal. You can monitor delivery from your dashboard and pause or top up any time.",
    bodyP4: (city, hoods) =>
      `The ${city} market trades on aesthetic — what wins in ${hoods} won't win in a suburban feed two cities over. We don't pretend to fix your content. What we do is remove the cold-start tax so the content you already make gets the surface area it deserves. If you are unsure which package fits your stage, our team answers tickets in English and the city's main language.`,
    schemaWebPageName: (city) => `Buy Instagram followers in ${city}`,
    schemaServiceName: (city) => `Instagram & TikTok growth in ${city}`,
  },
  pt: {
    metaTitle: (city) =>
      `Comprar seguidores no Instagram em ${city} — crescimento local | Viralefy`,
    metaDescription: (city) =>
      `Cresça no Instagram e TikTok em ${city}. Seguidores, curtidas e visualizações reais com entrega ajustada ao fuso local. Pague em USDT/USD com entrega em minutos.`,
    heroTitle: (city) => `Comprar seguidores no Instagram em ${city}`,
    heroSubtitle: (city) =>
      `Público local, engajamento real e entrega rápida — feito para criadores e marcas em ${city}.`,
    ctaSeePlans: (city) => `Ver planos para ${city}`,
    ctaAllCities: "Todas as cidades",
    breadcrumbHome: "Início",
    breadcrumbCities: "Cidades",
    whyHeading: (city) => `Por que criadores em ${city} escolhem a Viralefy`,
    bullets: (city) => [
      "Contas com cara de real — foto, bio e histórico de posts. Sem assinatura de bot.",
      `Entrega gota a gota alinhada ao fuso de ${city}, no horário de pico do público local.`,
      "Preços em USDT/USD — sem surpresa cambial, sem dados de cartão, sem chargeback.",
      "Reposição garantida por 30 dias contra quedas em todo pacote de seguidores.",
      "Mesmo painel para Instagram, TikTok e pedidos de reposição.",
      `Atendimento em inglês e no idioma principal de ${city}.`,
    ],
    readyHeading: (city) => `Pronto para crescer em ${city}?`,
    readyBody: (country) =>
      `Escolha um plano ajustado ao mercado ${country} — seguidores, curtidas ou visualizações entregues hoje.`,
    readyCta: "Ver planos de seguidores no Instagram",
    bodyP1: (city, hoods, landmark) =>
      `Seja você um criador gravando perto de ${landmark}, uma marca pequena promovendo pop-ups por ${hoods} ou uma agência escalando contas de clientes em ${city}, a densidade do público é o gargalo. A Viralefy entrega seguidores, curtidas e comentários no Instagram e visualizações no TikTok com janelas de entrega alinhadas ao seu fuso — para que a nova prova social caia quando o seu público local realmente está online.`,
    bodyP2: (city, population) =>
      `${city} é um dos feeds mais competitivos do mundo. Com mais de ${population} habitantes e uma economia criadora densa, quebrar a fase de aquecimento do algoritmo sem um empurrão inicial é brutal. Nossos pacotes iniciais cobrem esse intervalo: uma escalada medida de contas com cara de real que leva seu post ao explorar, e daí o engajamento orgânico se acumula.`,
    bodyP3:
      "Todo pedido é pago em USDT ou USD, liquidado on-chain — sem chargeback e sem expor dados de cartão. A entrega começa em minutos após a confirmação e termina ao longo de horas ou dias, dependendo do tamanho do pacote. O drip lento é proposital: imita o padrão orgânico para que os sistemas de segurança da plataforma tratem o crescimento como normal. Você acompanha tudo pelo painel e pode pausar ou complementar a qualquer momento.",
    bodyP4: (city, hoods) =>
      `O mercado de ${city} se move pela estética — o que vence em ${hoods} não vence num feed suburbano a duas cidades de distância. A gente não promete consertar o seu conteúdo. O que a gente faz é remover o pedágio do cold-start para que o conteúdo que você já produz tenha a superfície de exibição que merece. Em dúvida sobre qual pacote serve para o seu momento, a equipe responde tickets em inglês e no idioma principal da cidade.`,
    schemaWebPageName: (city) => `Comprar seguidores no Instagram em ${city}`,
    schemaServiceName: (city) => `Crescimento no Instagram e TikTok em ${city}`,
  },
  es: {
    metaTitle: (city) => `Comprar seguidores de Instagram en ${city} — crecimiento local | Viralefy`,
    metaDescription: (city) =>
      `Haz crecer tu Instagram y TikTok en ${city}. Seguidores, likes y vistas reales con entrega ajustada al horario local. Paga en USDT/USD y comienza en minutos.`,
    heroTitle: (city) => `Comprar seguidores de Instagram en ${city}`,
    heroSubtitle: (city) =>
      `Audiencia local, engagement real y entrega inmediata — pensado para creadores y marcas en ${city}.`,
    ctaSeePlans: (city) => `Ver planes para ${city}`,
    ctaAllCities: "Todas las ciudades",
    breadcrumbHome: "Inicio",
    breadcrumbCities: "Ciudades",
    whyHeading: (city) => `Por qué los creadores en ${city} eligen Viralefy`,
    bullets: (city) => [
      "Cuentas con apariencia real — foto, bio e historial de publicaciones. Sin firma de bot.",
      `Entrega escalonada según la zona horaria de ${city}, en las horas pico locales.`,
      "Precios en USDT/USD — sin sorpresas cambiarias, sin datos de tarjeta, sin contracargos.",
      "Reposición garantizada por 30 días contra bajas en cada paquete de seguidores.",
      "Mismo panel para Instagram, TikTok y solicitudes de reposición.",
      `Soporte en inglés y en el idioma principal de ${city}.`,
    ],
    readyHeading: (city) => `¿Listo para crecer en ${city}?`,
    readyBody: (country) =>
      `Elige un plan ajustado al mercado ${country} — seguidores, likes o vistas entregados hoy.`,
    readyCta: "Ver planes de seguidores de Instagram",
    bodyP1: (city, hoods, landmark) =>
      `Tanto si eres un creador grabando cerca de ${landmark}, una marca pequeña impulsando pop-ups por ${hoods}, o una agencia escalando cuentas de clientes por ${city}, la densidad de audiencia es el cuello de botella. Viralefy entrega seguidores, likes, comentarios de Instagram y vistas de TikTok con ventanas de entrega alineadas a tu zona horaria local — para que la nueva prueba social caiga cuando tu audiencia local está realmente online.`,
    bodyP2: (city, population) =>
      `${city} es uno de los feeds más competitivos del mundo. Con más de ${population} habitantes y una economía creadora densa, romper la fase de calentamiento del algoritmo sin un empujón inicial es brutal. Nuestros paquetes iniciales cubren ese hueco: una escalada medida de cuentas con apariencia real que lleva tu publicación al explorar, y desde ahí el engagement orgánico se acumula.`,
    bodyP3:
      "Cada pedido se paga en USDT o USD, liquidado on-chain — sin contracargos y sin exponer datos de tarjeta. La entrega comienza en minutos tras la confirmación y termina en horas o días según el tamaño del paquete. El goteo lento es a propósito: imita patrones orgánicos para que los sistemas de seguridad de la plataforma traten el crecimiento como normal. Puedes monitorizar la entrega desde tu panel y pausar o recargar en cualquier momento.",
    bodyP4: (city, hoods) =>
      `El mercado de ${city} se mueve por la estética — lo que gana en ${hoods} no gana en un feed suburbano a dos ciudades de distancia. No prometemos arreglar tu contenido. Lo que hacemos es eliminar el coste del arranque en frío para que el contenido que ya creas obtenga la superficie de exhibición que merece. Si dudas qué paquete encaja en tu etapa, nuestro equipo responde tickets en inglés y en el idioma principal de la ciudad.`,
    schemaWebPageName: (city) => `Comprar seguidores de Instagram en ${city}`,
    schemaServiceName: (city) => `Crecimiento de Instagram y TikTok en ${city}`,
  },
  fr: {
    metaTitle: (city) => `Acheter des abonnés Instagram à ${city} — croissance locale | Viralefy`,
    metaDescription: (city) =>
      `Développez votre Instagram et TikTok à ${city}. Abonnés, likes et vues réels avec livraison calée sur le fuseau local. Payez en USDT/USD et démarrez en quelques minutes.`,
    heroTitle: (city) => `Acheter des abonnés Instagram à ${city}`,
    heroSubtitle: (city) =>
      `Audience locale, engagement réel, livraison immédiate — conçu pour les créateurs et marques à ${city}.`,
    ctaSeePlans: (city) => `Voir les forfaits ${city}`,
    ctaAllCities: "Toutes les villes",
    breadcrumbHome: "Accueil",
    breadcrumbCities: "Villes",
    whyHeading: (city) => `Pourquoi les créateurs à ${city} choisissent Viralefy`,
    bullets: (city) => [
      "Comptes à l'apparence réelle — photo de profil, bio et historique de publications. Aucune signature de bot.",
      `Livraison étalée alignée sur le fuseau horaire de ${city}, sur les heures de pointe locales.`,
      "Prix en USDT/USD — pas de surprise de change, pas de données carte, pas de chargeback.",
      "Garantie de recharge 30 jours contre les pertes sur chaque pack d'abonnés.",
      "Même tableau de bord pour Instagram, TikTok et les demandes de recharge.",
      `Support en anglais et dans la langue principale de ${city}.`,
    ],
    readyHeading: (city) => `Prêt à grandir à ${city} ?`,
    readyBody: (country) =>
      `Choisissez un forfait adapté au marché ${country} — abonnés, likes ou vues livrés aujourd'hui.`,
    readyCta: "Voir les forfaits abonnés Instagram",
    bodyP1: (city, hoods, landmark) =>
      `Que vous soyez un créateur tournant autour de ${landmark}, une petite marque qui pousse des pop-ups à travers ${hoods}, ou une agence qui scale les comptes clients dans ${city}, la densité d'audience est le goulot d'étranglement. Viralefy livre des abonnés, des likes et commentaires Instagram ainsi que des vues TikTok avec des fenêtres de livraison alignées sur votre fuseau local — pour que la nouvelle preuve sociale tombe quand votre audience locale est réellement en ligne.`,
    bodyP2: (city, population) =>
      `${city} est l'un des fils les plus compétitifs au monde. Avec plus de ${population} habitants et une économie créateur dense, casser la phase de chauffe de l'algorithme sans coup de pouce initial est brutal. Nos packs de démarrage couvrent ce vide : une montée mesurée de comptes à l'apparence réelle qui propulse votre post dans l'onglet explore, et l'engagement organique fait boule de neige.`,
    bodyP3:
      "Chaque commande est payée en USDT ou USD, réglée on-chain — donc pas de chargeback ni de données carte exposées. La livraison démarre en quelques minutes après la confirmation et se termine en heures ou jours selon la taille du pack. Le goutte-à-goutte lent est intentionnel : il imite les schémas organiques pour que les systèmes de sécurité de la plateforme traitent la croissance comme normale. Vous suivez la livraison depuis votre tableau de bord et pouvez mettre en pause ou recharger à tout moment.",
    bodyP4: (city, hoods) =>
      `Le marché de ${city} se joue sur l'esthétique — ce qui gagne dans ${hoods} ne gagnera pas dans un feed banlieusard à deux villes de là. Nous ne prétendons pas réparer votre contenu. Ce que nous faisons, c'est supprimer le péage du démarrage à froid pour que le contenu que vous produisez déjà obtienne la surface d'exposition qu'il mérite. En cas d'hésitation sur le pack qui colle à votre étape, notre équipe répond aux tickets en anglais et dans la langue principale de la ville.`,
    schemaWebPageName: (city) => `Acheter des abonnés Instagram à ${city}`,
    schemaServiceName: (city) => `Croissance Instagram et TikTok à ${city}`,
  },
  de: {
    metaTitle: (city) => `Instagram-Follower in ${city} kaufen — lokales Wachstum | Viralefy`,
    metaDescription: (city) =>
      `Lassen Sie Ihr Instagram und TikTok in ${city} wachsen. Echte Follower, Likes und Views mit auf die lokale Zeitzone abgestimmter Lieferung. Zahlung in USDT/USD, Start in Minuten.`,
    heroTitle: (city) => `Instagram-Follower in ${city} kaufen`,
    heroSubtitle: (city) =>
      `Lokale Zielgruppe, echtes Engagement, sofortige Lieferung — gemacht für Creator und Marken in ${city}.`,
    ctaSeePlans: (city) => `${city}-Pakete ansehen`,
    ctaAllCities: "Alle Städte",
    breadcrumbHome: "Start",
    breadcrumbCities: "Städte",
    whyHeading: (city) => `Warum Creator in ${city} Viralefy wählen`,
    bullets: (city) => [
      "Accounts mit echtem Look — Profilbild, Bio und Posting-Historie. Keine Bot-Signaturen.",
      `Schrittweise Lieferung abgestimmt auf die Zeitzone von ${city}, zur lokalen Stoßzeit.`,
      "Preise in USDT/USD — keine Wechselkurs-Überraschungen, keine Kartendaten, keine Chargebacks.",
      "30-Tage-Auffüll-Garantie gegen Verluste bei jedem Follower-Paket.",
      "Ein Dashboard für Instagram, TikTok und Nachfüll-Anfragen.",
      `Support auf Englisch und in der wichtigsten Landessprache von ${city}.`,
    ],
    readyHeading: (city) => `Bereit, in ${city} zu wachsen?`,
    readyBody: (country) =>
      `Wählen Sie ein auf den ${country}-Markt abgestimmtes Paket — Follower, Likes oder Views, heute geliefert.`,
    readyCta: "Instagram-Follower-Pakete ansehen",
    bodyP1: (city, hoods, landmark) =>
      `Egal, ob Sie als Creator rund um ${landmark} filmen, als kleine Marke Pop-ups durch ${hoods} pushen oder als Agentur Kundenkonten in ${city} skalieren — die Reichweitendichte ist der Engpass. Viralefy liefert Instagram-Follower, Likes, Kommentare und TikTok-Views mit Lieferzeitfenstern, die auf Ihre lokale Zeitzone abgestimmt sind — damit neuer Social Proof dann landet, wenn Ihre lokale Zielgruppe wirklich online ist.`,
    bodyP2: (city, population) =>
      `${city} gehört zu den umkämpftesten Feeds der Welt. Bei über ${population} Einwohnern und einer dichten Creator-Ökonomie ist es brutal, die Aufwärmphase des Algorithmus ohne Anschub zu durchbrechen. Unsere Starter-Pakete schließen diese Lücke: ein dosierter Anstieg echt wirkender Accounts, der Ihren Post in den Explore-Tab hebt, und von dort potenziert sich das organische Engagement.`,
    bodyP3:
      "Jede Bestellung wird in USDT oder USD bezahlt und on-chain abgewickelt — keine Chargebacks, keine offengelegten Kartendaten. Die Lieferung startet binnen Minuten nach Bestätigung und endet je nach Paketgröße über Stunden oder Tage. Das langsame Drip ist gewollt: Es ahmt organische Muster nach, damit die Sicherheitssysteme der Plattform das Wachstum als normal einstufen. Sie verfolgen die Lieferung im Dashboard und können jederzeit pausieren oder nachlegen.",
    bodyP4: (city, hoods) =>
      `Der Markt in ${city} läuft über Ästhetik — was in ${hoods} gewinnt, gewinnt nicht in einem Vorstadt-Feed zwei Städte weiter. Wir versprechen nicht, Ihren Content zu reparieren. Was wir tun: Wir nehmen den Cold-Start-Aufschlag weg, damit der Content, den Sie ohnehin produzieren, die Sichtbarkeit bekommt, die er verdient. Wenn Sie unsicher sind, welches Paket zu Ihrer Phase passt, beantwortet unser Team Tickets auf Englisch und in der Hauptsprache der Stadt.`,
    schemaWebPageName: (city) => `Instagram-Follower in ${city} kaufen`,
    schemaServiceName: (city) => `Instagram- und TikTok-Wachstum in ${city}`,
  },
  ja: {
    metaTitle: (city) => `${city}で Instagram フォロワーを購入 — 現地グロース | Viralefy`,
    metaDescription: (city) =>
      `${city}で Instagram と TikTok を成長させましょう。現地タイムゾーンに合わせて配信される本物のフォロワー、いいね、再生数。USDT/USD で支払い、数分で開始。`,
    heroTitle: (city) => `${city}で Instagram フォロワーを購入`,
    heroSubtitle: (city) =>
      `現地のオーディエンス、リアルなエンゲージメント、即時配信 — ${city}のクリエイターとブランド向けに設計。`,
    ctaSeePlans: (city) => `${city}向けプランを見る`,
    ctaAllCities: "すべての都市",
    breadcrumbHome: "ホーム",
    breadcrumbCities: "都市",
    whyHeading: (city) => `${city}のクリエイターが Viralefy を選ぶ理由`,
    bullets: (city) => [
      "プロフィール写真、bio、投稿履歴を備えたリアル感のあるアカウント — ボットの痕跡なし。",
      `${city}のタイムゾーンに合わせた段階的配信で、現地のピーク時間に届きます。`,
      "USDT/USD 建ての価格 — 為替の不意打ち、カード情報、チャージバックなし。",
      "すべてのフォロワーパッケージに30日間のリフィル保証。",
      "Instagram、TikTok、リフィル申請のための同一ダッシュボード。",
      `英語と${city}の主要現地言語でのサポート。`,
    ],
    readyHeading: (city) => `${city}で成長する準備はできましたか?`,
    readyBody: (country) =>
      `${country}市場に合わせたプランをお選びください — フォロワー、いいね、再生数を本日中にお届け。`,
    readyCta: "Instagram フォロワープランを見る",
    bodyP1: (city, hoods, landmark) =>
      `${landmark}周辺で撮影するクリエイターも、${hoods}でポップアップを展開する小規模ブランドも、${city}全域でクライアントのアカウントをスケールする代理店も、ボトルネックはオーディエンスの密度です。Viralefy は Instagram のフォロワー・いいね・コメント、TikTok の再生数を、お客様の現地タイムゾーンに合わせた配信ウィンドウで提供します — 新しい社会的証明が、現地のオーディエンスが実際にオンラインのときに届くようにします。`,
    bodyP2: (city, population) =>
      `${city}は世界で最も競争の激しいフィードのひとつです。${population}人を超える住民と密度の高いクリエイターエコノミーの中で、最初の押し出しなしにアルゴリズムのウォームアップ段階を抜けるのは過酷です。当社のスターターパックはその空白を埋めます: リアル感のあるアカウントを段階的に積み増し、投稿を発見タブへ押し上げ、そこからオーガニックなエンゲージメントが雪だるま式に伸びます。`,
    bodyP3:
      "すべての注文は USDT または USD で支払われ、オンチェーンで決済されます — チャージバックなし、カード情報の露出なし。配信は確認後数分で開始し、パッケージのサイズに応じて数時間から数日かけて完了します。ゆっくりとしたドリップは意図的なもので、オーガニックなパターンを模倣し、プラットフォームのセキュリティシステムが成長を通常のものとして扱うようにします。配信状況はダッシュボードで確認でき、いつでも一時停止や追加注文ができます。",
    bodyP4: (city, hoods) =>
      `${city}の市場は美意識で動きます — ${hoods}で勝つものが、二都市離れた郊外のフィードで勝つとは限りません。私たちはあなたのコンテンツを直すとは約束しません。私たちがすることは、コールドスタートの税金を取り除き、あなたが既に作っているコンテンツに、それに見合う露出面を与えることです。どのパッケージが今の段階に合うか迷ったら、当社チームは英語と都市の主要言語でチケットに対応します。`,
    schemaWebPageName: (city) => `${city}で Instagram フォロワーを購入`,
    schemaServiceName: (city) => `${city}での Instagram と TikTok のグロース`,
  },
  it: {
    metaTitle: (city) => `Comprare follower Instagram a ${city} — crescita locale | Viralefy`,
    metaDescription: (city) =>
      `Faccia crescere il Suo Instagram e TikTok a ${city}. Follower, like e visualizzazioni reali con consegna allineata al fuso orario locale. Paghi in USDT/USD e parta in pochi minuti.`,
    heroTitle: (city) => `Comprare follower Instagram a ${city}`,
    heroSubtitle: (city) =>
      `Pubblico locale, engagement reale, consegna immediata — pensato per creator e brand a ${city}.`,
    ctaSeePlans: (city) => `Vedi i piani per ${city}`,
    ctaAllCities: "Tutte le città",
    breadcrumbHome: "Home",
    breadcrumbCities: "Città",
    whyHeading: (city) => `Perché i creator a ${city} scelgono Viralefy`,
    bullets: (city) => [
      "Account dall'aspetto reale — foto profilo, bio e cronologia post. Nessuna firma da bot.",
      `Consegna a goccia allineata al fuso orario di ${city}, nelle ore di punta locali.`,
      "Prezzi in USDT/USD — niente sorprese sul cambio, niente dati di carta, niente chargeback.",
      "Garanzia di reintegro 30 giorni contro i cali su ogni pacchetto di follower.",
      "Stessa dashboard per Instagram, TikTok e richieste di reintegro.",
      `Supporto in inglese e nella principale lingua locale di ${city}.`,
    ],
    readyHeading: (city) => `Pronto a crescere a ${city}?`,
    readyBody: (country) =>
      `Scelga un piano calibrato sul mercato ${country} — follower, like o visualizzazioni, consegnati oggi.`,
    readyCta: "Vedi i piani follower Instagram",
    bodyP1: (city, hoods, landmark) =>
      `Che Lei sia un creator che gira intorno a ${landmark}, un piccolo brand che spinge pop-up per ${hoods} o un'agenzia che scala account clienti a ${city}, il collo di bottiglia è la densità di pubblico. Viralefy consegna follower, like e commenti su Instagram e visualizzazioni TikTok con finestre di consegna allineate al Suo fuso orario locale — così la nuova social proof arriva quando il Suo pubblico locale è davvero online.`,
    bodyP2: (city, population) =>
      `${city} è uno dei feed più competitivi al mondo. Con oltre ${population} abitanti e un'economia creator densa, rompere la fase di riscaldamento dell'algoritmo senza una spinta iniziale è brutale. I nostri pacchetti starter coprono quel vuoto: una salita misurata di account dall'aspetto reale che porta il Suo post negli esplora, e da lì l'engagement organico si moltiplica.`,
    bodyP3:
      "Ogni ordine è pagato in USDT o USD, regolato on-chain — niente chargeback e nessun dato di carta esposto. La consegna parte in pochi minuti dalla conferma e termina in ore o giorni a seconda della dimensione del pacchetto. Il drip lento è voluto: imita pattern organici perché i sistemi di sicurezza della piattaforma trattino la crescita come normale. Monitora la consegna dalla dashboard e può mettere in pausa o aggiungere in qualsiasi momento.",
    bodyP4: (city, hoods) =>
      `Il mercato di ${city} si muove sull'estetica — ciò che vince a ${hoods} non vincerà in un feed di periferia due città più in là. Non promettiamo di sistemare i Suoi contenuti. Quello che facciamo è rimuovere il dazio del cold start perché i contenuti che già produce abbiano la superficie di esposizione che meritano. Se ha dubbi su quale pacchetto sia adatto al Suo momento, il nostro team risponde ai ticket in inglese e nella lingua principale della città.`,
    schemaWebPageName: (city) => `Comprare follower Instagram a ${city}`,
    schemaServiceName: (city) => `Crescita Instagram e TikTok a ${city}`,
  },
  ru: {
    metaTitle: (city) => `Купить подписчиков Instagram в ${city} — локальный рост | Viralefy`,
    metaDescription: (city) =>
      `Развивайте Instagram и TikTok в ${city}. Реальные подписчики, лайки и просмотры с доставкой по местному часовому поясу. Оплата в USDT/USD, старт за минуты.`,
    heroTitle: (city) => `Купить подписчиков Instagram в ${city}`,
    heroSubtitle: (city) =>
      `Локальная аудитория, реальное вовлечение, мгновенный старт — сделано для авторов и брендов в ${city}.`,
    ctaSeePlans: (city) => `Тарифы для ${city}`,
    ctaAllCities: "Все города",
    breadcrumbHome: "Главная",
    breadcrumbCities: "Города",
    whyHeading: (city) => `Почему авторы в ${city} выбирают Viralefy`,
    bullets: (city) => [
      "Аккаунты с реальным видом — фото профиля, био и история постов. Без следов ботов.",
      `Капельная доставка с привязкой к часовому поясу города ${city}, в часы пика местной аудитории.`,
      "Цены в USDT/USD — без сюрпризов курса, без данных карты, без чарджбэков.",
      "Гарантия восполнения 30 дней при отписках на каждом пакете подписчиков.",
      "Единая панель для Instagram, TikTok и заявок на восполнение.",
      `Поддержка на английском и основном местном языке города ${city}.`,
    ],
    readyHeading: (city) => `Готовы расти в городе ${city}?`,
    readyBody: (country) =>
      `Выберите тариф под рынок ${country} — подписчики, лайки или просмотры, доставка сегодня.`,
    readyCta: "Смотреть тарифы на подписчиков Instagram",
    bodyP1: (city, hoods, landmark) =>
      `Будь Вы автор, снимающий у ${landmark}, маленький бренд, продвигающий поп-апы по ${hoods}, или агентство, масштабирующее клиентские аккаунты по городу ${city}, узкое место — плотность аудитории. Viralefy доставляет подписчиков, лайки и комментарии в Instagram и просмотры в TikTok в окнах, привязанных к Вашему местному часовому поясу — чтобы новый социальный сигнал приходил тогда, когда Ваша аудитория действительно онлайн.`,
    bodyP2: (city, population) =>
      `${city} — один из самых конкурентных лент в мире. При более чем ${population} жителях и плотной экономике авторов пробить разогрев алгоритма без стартового толчка крайне сложно. Наши стартовые пакеты закрывают этот разрыв: дозированный прирост аккаунтов с реальным видом, который выводит пост в рекомендации, а дальше органика разгоняется сама.`,
    bodyP3:
      "Каждый заказ оплачивается в USDT или USD и проводится в блокчейне — никаких чарджбэков и раскрытия данных карты. Доставка стартует за минуты после подтверждения и завершается за часы или дни в зависимости от размера пакета. Медленный дрип — это намеренно: он повторяет органические паттерны, чтобы системы безопасности платформы воспринимали рост как естественный. Вы видите доставку в панели и можете в любой момент поставить на паузу или докупить.",
    bodyP4: (city, hoods) =>
      `Рынок города ${city} живёт эстетикой — то, что выигрывает в ${hoods}, не выиграет в пригородной ленте через два города. Мы не обещаем починить Ваш контент. Что мы делаем — снимаем налог холодного старта, чтобы контент, который Вы уже создаёте, получал ту площадь показа, которую заслуживает. Если не уверены, какой пакет подходит Вашему этапу, наша команда отвечает на тикеты на английском и основном языке города.`,
    schemaWebPageName: (city) => `Купить подписчиков Instagram в ${city}`,
    schemaServiceName: (city) => `Рост в Instagram и TikTok в ${city}`,
  },
  nl: {
    metaTitle: (city) => `Instagram-volgers kopen in ${city} — lokale groei | Viralefy`,
    metaDescription: (city) =>
      `Laat je Instagram en TikTok groeien in ${city}. Echte volgers, likes en views met levering afgestemd op de lokale tijdzone. Betaal in USDT/USD en start binnen minuten.`,
    heroTitle: (city) => `Instagram-volgers kopen in ${city}`,
    heroSubtitle: (city) =>
      `Lokaal publiek, echte engagement, directe levering — gemaakt voor creators en merken in ${city}.`,
    ctaSeePlans: (city) => `Bekijk ${city}-pakketten`,
    ctaAllCities: "Alle steden",
    breadcrumbHome: "Home",
    breadcrumbCities: "Steden",
    whyHeading: (city) => `Waarom creators in ${city} voor Viralefy kiezen`,
    bullets: (city) => [
      "Accounts die er echt uitzien — profielfoto, bio en posting-historie. Geen bot-signaturen.",
      `Gespreide levering afgestemd op de tijdzone van ${city}, op de lokale piekuren.`,
      "Prijzen in USDT/USD — geen valutaverrassingen, geen kaartgegevens, geen chargebacks.",
      "30 dagen aanvulgarantie tegen uitval op elk volgerspakket.",
      "Hetzelfde dashboard voor Instagram, TikTok en aanvulverzoeken.",
      `Support in het Engels en in de belangrijkste lokale taal van ${city}.`,
    ],
    readyHeading: (city) => `Klaar om te groeien in ${city}?`,
    readyBody: (country) =>
      `Kies een pakket afgestemd op de markt ${country} — volgers, likes of views, vandaag geleverd.`,
    readyCta: "Bekijk Instagram-volgerspakketten",
    bodyP1: (city, hoods, landmark) =>
      `Of je nu een creator bent die rond ${landmark} filmt, een klein merk dat pop-ups pusht door ${hoods}, of een agency dat klantaccounts opschaalt door ${city} — publieksdichtheid is de bottleneck. Viralefy levert Instagram-volgers, -likes, -comments en TikTok-views met leverwindows afgestemd op jouw lokale tijdzone — zodat nieuwe social proof binnenkomt wanneer jouw lokale publiek écht online is.`,
    bodyP2: (city, population) =>
      `${city} is een van de meest competitieve feeds ter wereld. Met meer dan ${population} inwoners en een dichte creator-economie is de opwarmfase van het algoritme breken zonder eerste duwtje brute. Onze starterpakketten dichten dat gat: een gedoseerde opbouw van echt ogende accounts die je post de explore-tab in tilt, waarna organische engagement vanzelf doorbouwt.`,
    bodyP3:
      "Elke order wordt betaald in USDT of USD en on-chain afgerekend — geen chargebacks en geen blootgestelde kaartgegevens. Levering start binnen minuten na bevestiging en eindigt over uren of dagen, afhankelijk van pakketgrootte. De langzame drip is bewust: hij imiteert organische patronen zodat de veiligheidssystemen van het platform de groei als normaal behandelen. Je volgt de levering vanuit je dashboard en kunt op elk moment pauzeren of bijbestellen.",
    bodyP4: (city, hoods) =>
      `De markt in ${city} draait op esthetiek — wat wint in ${hoods}, wint niet in een buitenwijk-feed twee steden verderop. We doen niet alsof we jouw content gaan repareren. Wat we wél doen: de cold-start-tol weghalen zodat de content die je al maakt het podium krijgt dat het verdient. Twijfel je welk pakket bij jouw fase past, dan beantwoordt ons team tickets in het Engels en in de hoofdtaal van de stad.`,
    schemaWebPageName: (city) => `Instagram-volgers kopen in ${city}`,
    schemaServiceName: (city) => `Instagram- en TikTok-groei in ${city}`,
  },
  ko: {
    metaTitle: (city) => `${city}에서 Instagram 팔로워 구매 — 현지 성장 | Viralefy`,
    metaDescription: (city) =>
      `${city}에서 Instagram과 TikTok을 성장시키십시오. 현지 시간대에 맞춘 실제 팔로워, 좋아요, 조회수를 제공합니다. USDT/USD로 결제하며 몇 분 안에 시작됩니다.`,
    heroTitle: (city) => `${city}에서 Instagram 팔로워 구매`,
    heroSubtitle: (city) =>
      `현지 오디언스, 실제 인게이지먼트, 즉시 배송 — ${city}의 크리에이터와 브랜드를 위해 설계되었습니다.`,
    ctaSeePlans: (city) => `${city} 플랜 보기`,
    ctaAllCities: "모든 도시",
    breadcrumbHome: "홈",
    breadcrumbCities: "도시",
    whyHeading: (city) => `${city}의 크리에이터가 Viralefy를 선택하는 이유`,
    bullets: (city) => [
      "프로필 사진, 자기소개, 게시 이력을 갖춘 실제 같은 계정 — 봇 흔적이 없습니다.",
      `${city}의 시간대에 맞춘 단계적 배송으로 현지 피크 시간에 도달합니다.`,
      "USDT/USD 가격 — 환율로 인한 예상치 못한 비용, 카드 정보, 차지백이 없습니다.",
      "모든 팔로워 패키지에 대해 30일 이탈 보장 리필을 제공합니다.",
      "Instagram, TikTok, 리필 요청을 동일한 대시보드에서 관리합니다.",
      `영어 및 ${city}의 주요 현지 언어로 지원합니다.`,
    ],
    readyHeading: (city) => `${city}에서 성장할 준비가 되셨습니까?`,
    readyBody: (country) =>
      `${country} 시장에 맞춘 플랜을 선택하십시오 — 팔로워, 좋아요, 조회수를 오늘 안에 전달합니다.`,
    readyCta: "Instagram 팔로워 플랜 보기",
    bodyP1: (city, hoods, landmark) =>
      `${landmark} 주변에서 촬영하는 크리에이터든, ${hoods}에서 팝업을 진행하는 작은 브랜드든, ${city} 전역의 클라이언트 계정을 확장하는 에이전시든 병목은 오디언스 밀도입니다. Viralefy는 Instagram 팔로워, 좋아요, 댓글과 TikTok 조회수를 귀하의 현지 시간대에 맞춘 배송 윈도우로 제공합니다 — 새로운 소셜 프루프가 현지 오디언스가 실제로 온라인일 때 도달하도록 합니다.`,
    bodyP2: (city, population) =>
      `${city}는 세계에서 가장 경쟁이 치열한 피드 중 하나입니다. ${population}명 이상의 주민과 밀도 높은 크리에이터 경제 속에서 초기 추진력 없이 알고리즘의 워밍업 단계를 돌파하는 것은 매우 어렵습니다. 당사의 스타터 패키지는 그 공백을 메웁니다: 실제 같은 계정의 측정된 증가가 게시물을 탐색 탭으로 끌어올리고, 그 이후 오가닉 인게이지먼트가 누적됩니다.`,
    bodyP3:
      "모든 주문은 USDT 또는 USD로 결제되며 온체인에서 정산됩니다 — 차지백도, 노출되는 카드 정보도 없습니다. 배송은 결제 확인 후 몇 분 안에 시작되며 패키지 규모에 따라 몇 시간에서 며칠에 걸쳐 완료됩니다. 느린 드립은 의도된 것으로, 오가닉 패턴을 모방하여 플랫폼 보안 시스템이 성장을 정상으로 인식하도록 합니다. 대시보드에서 배송을 모니터링하고 언제든지 일시 중지하거나 추가 주문하실 수 있습니다.",
    bodyP4: (city, hoods) =>
      `${city} 시장은 미적 감각에 의해 움직입니다 — ${hoods}에서 통하는 것이 두 도시 떨어진 교외 피드에서는 통하지 않습니다. 저희는 귀하의 콘텐츠를 고쳐드리겠다고 약속하지 않습니다. 저희가 하는 일은 콜드 스타트 비용을 제거하여 귀하가 이미 만들고 있는 콘텐츠가 마땅한 노출 면적을 얻도록 하는 것입니다. 어떤 패키지가 현재 단계에 맞는지 확신이 서지 않으신다면, 저희 팀이 영어와 도시의 주요 언어로 티켓에 응답합니다.`,
    schemaWebPageName: (city) => `${city}에서 Instagram 팔로워 구매`,
    schemaServiceName: (city) => `${city}의 Instagram 및 TikTok 성장`,
  },
  ar: {
    metaTitle: (city) => `شراء متابعي Instagram في ${city} — نمو محلي | Viralefy`,
    metaDescription: (city) =>
      `نمِّ حسابك على Instagram وTikTok في ${city}. متابعون وإعجابات ومشاهدات حقيقية مع تسليم مضبوط على التوقيت المحلي. ادفع بـ USDT/USD وابدأ خلال دقائق.`,
    heroTitle: (city) => `شراء متابعي Instagram في ${city}`,
    heroSubtitle: (city) =>
      `جمهور محلي، تفاعل حقيقي، تسليم فوري — مصمم للمبدعين والعلامات في ${city}.`,
    ctaSeePlans: (city) => `عرض خطط ${city}`,
    ctaAllCities: "كل المدن",
    breadcrumbHome: "الرئيسية",
    breadcrumbCities: "المدن",
    whyHeading: (city) => `لماذا يختار صنّاع المحتوى في ${city} Viralefy`,
    bullets: (city) => [
      "حسابات بمظهر حقيقي — صورة بروفايل، وصف، وسجل منشورات. لا توقيع للبوتات.",
      `تسليم تدريجي مضبوط على المنطقة الزمنية لـ ${city} ليصل في ذروة الحضور المحلي.`,
      "تسعير بـ USDT/USD — بدون مفاجآت صرف، بدون بيانات بطاقة، بدون ردّ مبالغ.",
      "ضمان تعويض النقص لمدة 30 يومًا على كل باقة متابعين.",
      "لوحة تحكم واحدة لـ Instagram وTikTok وطلبات التعويض.",
      `دعم بالإنجليزية وباللغة المحلية الرئيسية لـ ${city}.`,
    ],
    readyHeading: (city) => `جاهز للنمو في ${city}؟`,
    readyBody: (country) =>
      `اختر باقة مضبوطة على سوق ${country} — متابعون أو إعجابات أو مشاهدات، تُسلَّم اليوم.`,
    readyCta: "عرض باقات متابعي Instagram",
    bodyP1: (city, hoods, landmark) =>
      `سواء كنت صانع محتوى تصوّر بالقرب من ${landmark}، أو علامة صغيرة تروّج لمتاجر مؤقتة في ${hoods}، أو وكالة تُوسّع حسابات عملاء عبر ${city}، فإن كثافة الجمهور هي عنق الزجاجة. توفّر Viralefy متابعين وإعجابات وتعليقات على Instagram ومشاهدات TikTok مع نوافذ تسليم متوافقة مع منطقتك الزمنية المحلية — لتصل الإشارة الاجتماعية الجديدة حين يكون جمهورك المحلي متصلًا فعلًا.`,
    bodyP2: (city, population) =>
      `${city} من أكثر الـ feeds تنافسية في العالم. مع أكثر من ${population} ساكن واقتصاد صنّاع محتوى مكثّف، يصبح اختراق مرحلة الإحماء في الخوارزمية دون دفعة أولى أمرًا قاسيًا. تسد باقاتنا التمهيدية هذه الفجوة: تصاعد محسوب لحسابات بمظهر حقيقي يضع منشورك في تبويب الاستكشاف، ثم يتراكم التفاعل العضوي من هناك.`,
    bodyP3:
      "كل طلب يُدفع بـ USDT أو USD ويُسوّى on-chain — لا ردّ مبالغ ولا بيانات بطاقة مكشوفة. يبدأ التسليم خلال دقائق من التأكيد وينتهي خلال ساعات أو أيام حسب حجم الباقة. التدفّق البطيء مقصود: يحاكي الأنماط العضوية ليتعامل نظام أمان المنصة مع النمو على أنه طبيعي. يمكنك مراقبة التسليم من لوحتك وإيقافه أو زيادته في أي وقت.",
    bodyP4: (city, hoods) =>
      `سوق ${city} يتحرّك بالجمالية — ما ينجح في ${hoods} لا ينجح في feed ضاحوي على بُعد مدينتين. لا نزعم أنّنا سنُصلح محتواك. ما نفعله هو إزالة ضريبة البداية الباردة كي يحصل المحتوى الذي تنشره أصلًا على مساحة العرض التي يستحقها. إن لم تكن متأكدًا أيّ باقة تناسب مرحلتك، يجيب فريقنا عن التذاكر بالإنجليزية واللغة الرئيسية للمدينة.`,
    schemaWebPageName: (city) => `شراء متابعي Instagram في ${city}`,
    schemaServiceName: (city) => `نمو Instagram وTikTok في ${city}`,
  },
  zh: {
    metaTitle: (city) => `在${city}购买 Instagram 粉丝 — 本地增长 | Viralefy`,
    metaDescription: (city) =>
      `在${city}发展您的 Instagram 与 TikTok。真实粉丝、点赞和播放量,交付时段对齐本地时区。USDT/USD 计价,数分钟内开始。`,
    heroTitle: (city) => `在${city}购买 Instagram 粉丝`,
    heroSubtitle: (city) =>
      `本地受众、真实互动、即时交付 — 为${city}的创作者和品牌而打造。`,
    ctaSeePlans: (city) => `查看${city}套餐`,
    ctaAllCities: "全部城市",
    breadcrumbHome: "首页",
    breadcrumbCities: "城市",
    whyHeading: (city) => `${city}的创作者为何选择 Viralefy`,
    bullets: (city) => [
      "真实感账号 — 含头像、简介与发帖历史。无机器人痕迹。",
      `对齐${city}时区的滴灌式交付,投放在本地高峰时段。`,
      "USDT/USD 计价 — 无汇率意外、无卡片信息、无拒付。",
      "每个粉丝套餐均提供 30 天掉量补单保障。",
      "Instagram、TikTok 与补单申请共用同一控制台。",
      `提供英语及${city}主要本地语言的客服支持。`,
    ],
    readyHeading: (city) => `准备好在${city}增长了吗?`,
    readyBody: (country) =>
      `选择适配${country}市场的套餐 — 粉丝、点赞或播放量,今日送达。`,
    readyCta: "查看 Instagram 粉丝套餐",
    bodyP1: (city, hoods, landmark) =>
      `无论您是在${landmark}附近拍摄的创作者,在${hoods}推广快闪的小品牌,还是在${city}全域扩张客户账号的代理商,瓶颈始终是受众密度。Viralefy 按您所在的本地时区提供 Instagram 粉丝、点赞、评论与 TikTok 播放量的交付窗口 — 让新的社交证明在本地受众真正在线时落地。`,
    bodyP2: (city, population) =>
      `${city}是全球竞争最激烈的内容流之一。当人口超过 ${population} 且创作者经济密度极高时,在没有初始推力的情况下突破算法预热阶段极其艰难。我们的起步套餐恰好补上这段空缺:适度递增的真实感账号,将您的帖子推进探索页,之后自然互动便会自我累积。`,
    bodyP3:
      "每个订单均以 USDT 或 USD 支付,并通过链上结算 — 无拒付、无暴露的卡片信息。确认后数分钟即开始交付,根据套餐规模在数小时至数天内完成。缓慢滴灌是刻意为之:它模拟自然增长模式,使平台的安全系统将其视为正常。您可在控制台监控交付,并随时暂停或追加。",
    bodyP4: (city, hoods) =>
      `${city}市场靠美学驱动 — 在${hoods}流行的并不一定能在两座城外的郊区流量中胜出。我们不承诺替您修补内容。我们要做的,是消除冷启动税,让您本就在做的内容获得应有的曝光面。如果不确定哪种套餐适合当前阶段,我们的团队会用英语和该城市的主要语言回复工单。`,
    schemaWebPageName: (city) => `在${city}购买 Instagram 粉丝`,
    schemaServiceName: (city) => `${city}的 Instagram 与 TikTok 增长`,
  },
  hi: {
    metaTitle: (city) => `${city} में Instagram फॉलोअर्स खरीदें — स्थानीय ग्रोथ | Viralefy`,
    metaDescription: (city) =>
      `${city} में अपना Instagram और TikTok बढ़ाएं। असली फॉलोअर्स, लाइक्स और व्यूज़ — स्थानीय समय क्षेत्र के अनुसार डिलीवरी। USDT/USD में भुगतान करें और मिनटों में शुरू करें।`,
    heroTitle: (city) => `${city} में Instagram फॉलोअर्स खरीदें`,
    heroSubtitle: (city) =>
      `स्थानीय दर्शक, असली एंगेजमेंट, तुरंत डिलीवरी — ${city} के क्रिएटर्स और ब्रांड्स के लिए बनाया गया।`,
    ctaSeePlans: (city) => `${city} के प्लान देखें`,
    ctaAllCities: "सभी शहर",
    breadcrumbHome: "होम",
    breadcrumbCities: "शहर",
    whyHeading: (city) => `${city} के क्रिएटर्स Viralefy क्यों चुनते हैं`,
    bullets: (city) => [
      "असली दिखने वाले अकाउंट — प्रोफ़ाइल फोटो, बायो और पोस्टिंग हिस्ट्री के साथ। कोई बॉट साइन नहीं।",
      `${city} के समय क्षेत्र के अनुसार चरणबद्ध डिलीवरी, स्थानीय पीक समय पर पहुँचती है।`,
      "USDT/USD में कीमतें — कोई FX झटका नहीं, कोई कार्ड डेटा नहीं, कोई चार्जबैक नहीं।",
      "हर फॉलोअर पैकेज पर 30-दिन की रिफिल गारंटी।",
      "Instagram, TikTok और रिफिल अनुरोधों के लिए एक ही डैशबोर्ड।",
      `अंग्रेज़ी और ${city} की मुख्य स्थानीय भाषा में सहायता।`,
    ],
    readyHeading: (city) => `${city} में बढ़ने के लिए तैयार हैं?`,
    readyBody: (country) =>
      `${country} बाज़ार के अनुरूप एक प्लान चुनें — फॉलोअर्स, लाइक्स या व्यूज़, आज डिलीवर।`,
    readyCta: "Instagram फॉलोअर प्लान देखें",
    bodyP1: (city, hoods, landmark) =>
      `चाहे आप ${landmark} के पास शूट करने वाले क्रिएटर हों, ${hoods} में पॉप-अप चलाने वाला छोटा ब्रांड हों, या ${city} में क्लाइंट अकाउंट्स बढ़ा रही एजेंसी हों, बाधा हमेशा दर्शकों की घनत्व होती है। Viralefy आपके स्थानीय समय क्षेत्र के अनुरूप डिलीवरी विंडो के साथ Instagram फॉलोअर्स, लाइक्स, कमेंट्स और TikTok व्यूज़ देती है — ताकि नई सोशल प्रूफ तब उतरे जब आपका स्थानीय दर्शक वाकई ऑनलाइन हो।`,
    bodyP2: (city, population) =>
      `${city} दुनिया के सबसे प्रतिस्पर्धी फीड्स में से एक है। ${population} से अधिक निवासियों और घनी क्रिएटर अर्थव्यवस्था के बीच, बिना शुरुआती धक्के के एल्गोरिदम की वार्म-अप अवस्था पार करना कठिन है। हमारे स्टार्टर पैक यह अंतर भरते हैं: असली दिखने वाले अकाउंट्स की मापी हुई बढ़ोतरी जो आपकी पोस्ट को एक्सप्लोर टैब तक पहुँचाती है, और वहाँ से ऑर्गेनिक एंगेजमेंट खुद बढ़ता है।`,
    bodyP3:
      "हर ऑर्डर USDT या USD में भुगतान होता है और on-chain सेटल होता है — कोई चार्जबैक नहीं, कोई कार्ड डेटा उजागर नहीं। पुष्टि के मिनटों के भीतर डिलीवरी शुरू होती है और पैकेज के आकार के अनुसार घंटों या दिनों में पूरी होती है। धीमी ड्रिप जान-बूझकर है: यह ऑर्गेनिक पैटर्न की नकल करती है ताकि प्लेटफ़ॉर्म के सुरक्षा सिस्टम इस ग्रोथ को सामान्य मानें। आप डैशबोर्ड से डिलीवरी देख सकते हैं और कभी भी रोक या टॉप-अप कर सकते हैं।",
    bodyP4: (city, hoods) =>
      `${city} का बाज़ार सौंदर्यबोध पर चलता है — जो ${hoods} में जीतता है, वही दो शहर दूर के उपनगरीय फीड में नहीं जीतेगा। हम आपका कंटेंट ठीक करने का दावा नहीं करते। हम कोल्ड-स्टार्ट का बोझ हटाते हैं ताकि जो कंटेंट आप पहले से बना रहे हैं उसे योग्य प्रदर्शन क्षेत्र मिले। यदि असमंजस हो कि कौन-सा पैकेज आपके चरण के लिए सही है, हमारी टीम अंग्रेज़ी और शहर की मुख्य भाषा में टिकट का जवाब देती है।`,
    schemaWebPageName: (city) => `${city} में Instagram फॉलोअर्स खरीदें`,
    schemaServiceName: (city) => `${city} में Instagram और TikTok ग्रोथ`,
  },
  tr: {
    metaTitle: (city) => `${city}'de Instagram takipçi satın al — yerel büyüme | Viralefy`,
    metaDescription: (city) =>
      `${city}'de Instagram ve TikTok'unu büyüt. Yerel saat dilimine ayarlı teslimatla gerçek takipçi, beğeni ve görüntüleme. USDT/USD ile öde, dakikalar içinde başla.`,
    heroTitle: (city) => `${city}'de Instagram takipçi satın al`,
    heroSubtitle: (city) =>
      `Yerel kitle, gerçek etkileşim, anında teslimat — ${city}'deki içerik üreticileri ve markalar için tasarlandı.`,
    ctaSeePlans: (city) => `${city} planlarını gör`,
    ctaAllCities: "Tüm şehirler",
    breadcrumbHome: "Ana sayfa",
    breadcrumbCities: "Şehirler",
    whyHeading: (city) => `${city}'deki içerik üreticileri neden Viralefy'ı seçiyor`,
    bullets: (city) => [
      "Gerçek görünümlü hesaplar — profil fotoğrafı, biyografi ve paylaşım geçmişi. Bot imzası yok.",
      `${city} saat dilimine ayarlı kademeli teslimat, yerel zirve saatlerinde ulaşır.`,
      "USDT/USD fiyatlandırma — döviz sürprizi yok, kart verisi yok, chargeback yok.",
      "Her takipçi paketinde düşüşlere karşı 30 günlük yenileme garantisi.",
      "Instagram, TikTok ve yenileme talepleri için tek panel.",
      `İngilizce ve ${city}'nin başlıca yerel dilinde destek.`,
    ],
    readyHeading: (city) => `${city}'de büyümeye hazır mısın?`,
    readyBody: (country) =>
      `${country} pazarına ayarlı bir plan seç — takipçi, beğeni veya görüntüleme, bugün teslim.`,
    readyCta: "Instagram takipçi planlarını gör",
    bodyP1: (city, hoods, landmark) =>
      `${landmark} çevresinde çekim yapan bir içerik üretici de olsan, ${hoods}'da pop-up itelemeye çalışan küçük bir marka da, ${city} genelinde müşteri hesaplarını ölçeklendiren bir ajans da, darboğaz kitle yoğunluğudur. Viralefy, Instagram takipçi, beğeni, yorum ve TikTok görüntülemelerini yerel saat dilimine hizalı teslimat pencereleriyle gönderir — böylece yeni sosyal kanıt, yerel kitlen gerçekten çevrimiçiyken iner.`,
    bodyP2: (city, population) =>
      `${city}, dünyanın en rekabetçi feed'lerinden biridir. ${population}'i aşan nüfus ve yoğun bir içerik üretici ekonomisi içinde algoritmanın ısınma evresini ilk itki olmadan kırmak ağırdır. Başlangıç paketlerimiz bu boşluğu kapatır: gerçek görünümlü hesapların ölçülü artışı, paylaşımını keşfet sekmesine taşır; organik etkileşim oradan kendiliğinden büyür.`,
    bodyP3:
      "Her sipariş USDT veya USD ile ödenir ve zincir üzerinde uzlaştırılır — chargeback yok, açığa çıkan kart verisi yok. Teslimat, onaydan sonra dakikalar içinde başlar ve paket boyutuna göre saatler ya da günler içinde tamamlanır. Yavaş damlama bilinçlidir: organik kalıpları taklit eder, böylece platformun güvenlik sistemleri büyümeyi normal kabul eder. Teslimatı panelden izleyebilir, istediğin an duraklatabilir ya da takviye edebilirsin.",
    bodyP4: (city, hoods) =>
      `${city} pazarı estetikle döner — ${hoods}'da kazanan, iki şehir ötedeki banliyö feed'inde kazanmaz. İçeriğini düzelteceğimizi iddia etmiyoruz. Yaptığımız şey, soğuk başlangıç vergisini kaldırmak; zaten ürettiğin içerik, hak ettiği gösterim alanını alsın diye. Hangi paketin aşamana uygun olduğundan emin değilsen, ekibimiz biletlere İngilizce ve şehrin başlıca dilinde yanıt verir.`,
    schemaWebPageName: (city) => `${city}'de Instagram takipçi satın al`,
    schemaServiceName: (city) => `${city}'de Instagram ve TikTok büyümesi`,
  },
  pl: {
    metaTitle: (city) => `Kup obserwujących na Instagramie w ${city} — lokalny wzrost | Viralefy`,
    metaDescription: (city) =>
      `Rozwijaj swojego Instagrama i TikToka w ${city}. Prawdziwi obserwujący, polubienia i wyświetlenia z dostawą dopasowaną do lokalnej strefy czasowej. Płać w USDT/USD i startuj w ciągu kilku minut.`,
    heroTitle: (city) => `Kup obserwujących na Instagramie w ${city}`,
    heroSubtitle: (city) =>
      `Lokalna publiczność, realne zaangażowanie, błyskawiczna dostawa — stworzone dla twórców i marek w ${city}.`,
    ctaSeePlans: (city) => `Zobacz plany dla ${city}`,
    ctaAllCities: "Wszystkie miasta",
    breadcrumbHome: "Strona główna",
    breadcrumbCities: "Miasta",
    whyHeading: (city) => `Dlaczego twórcy w ${city} wybierają Viralefy`,
    bullets: (city) => [
      "Konta wyglądające autentycznie — zdjęcie profilowe, bio i historia postów. Bez śladów bota.",
      `Dostawa kropla po kropli zsynchronizowana ze strefą czasową ${city}, w godzinach szczytu lokalnej publiczności.`,
      "Ceny w USDT/USD — bez niespodzianek kursowych, bez danych karty, bez chargebacków.",
      "30-dniowa gwarancja uzupełnienia spadków w każdym pakiecie obserwujących.",
      "Ten sam panel dla Instagrama, TikToka i zgłoszeń uzupełnienia.",
      `Wsparcie po angielsku oraz w głównym lokalnym języku miasta ${city}.`,
    ],
    readyHeading: (city) => `Gotowy, by rosnąć w ${city}?`,
    readyBody: (country) =>
      `Wybierz plan dopasowany do rynku ${country} — obserwujący, polubienia lub wyświetlenia dostarczane jeszcze dziś.`,
    readyCta: "Zobacz plany obserwujących na Instagramie",
    bodyP1: (city, hoods, landmark) =>
      `Niezależnie od tego, czy jesteś twórcą kręcącym wokół ${landmark}, małą marką promującą pop-upy w ${hoods}, czy agencją skalującą konta klientów w ${city}, wąskim gardłem jest gęstość publiczności. Viralefy dostarcza obserwujących, polubienia i komentarze na Instagramie oraz wyświetlenia na TikToku w oknach dostawy dopasowanych do Twojej lokalnej strefy czasowej — tak, by nowy dowód społeczny pojawiał się wtedy, gdy Twoja lokalna publiczność naprawdę jest online.`,
    bodyP2: (city, population) =>
      `${city} to jeden z najbardziej konkurencyjnych feedów na świecie. Przy ponad ${population} mieszkańcach i gęstej gospodarce twórców przebicie się przez fazę rozgrzewki algorytmu bez początkowego pchnięcia jest brutalne. Nasze pakiety startowe wypełniają tę lukę: wymierzony przyrost autentycznie wyglądających kont, który wpycha Twój post do zakładki Eksploruj, a stamtąd organiczne zaangażowanie nabiera tempa samo z siebie.`,
    bodyP3:
      "Każde zamówienie opłacane jest w USDT lub USD i rozliczane on-chain — bez chargebacków i bez ujawniania danych karty. Dostawa rusza w ciągu kilku minut od potwierdzenia, a kończy się w ciągu godzin lub dni zależnie od wielkości pakietu. Wolny drip jest celowy: naśladuje organiczne wzorce, by systemy bezpieczeństwa platformy traktowały wzrost jako naturalny. Dostawę śledzisz z panelu i w każdej chwili możesz wstrzymać lub doładować.",
    bodyP4: (city, hoods) =>
      `Rynek miasta ${city} kręci się wokół estetyki — to, co wygrywa w ${hoods}, nie wygra w podmiejskim feedzie dwie miejscowości dalej. Nie obiecujemy, że naprawimy Twoje treści. To, co robimy, to zdjęcie podatku od zimnego startu, by treści, które już tworzysz, dostały powierzchnię ekspozycji, na jaką zasługują. Jeśli nie masz pewności, który pakiet pasuje do Twojego etapu, nasz zespół odpowiada na zgłoszenia po angielsku i w głównym języku miasta.`,
    schemaWebPageName: (city) => `Kup obserwujących na Instagramie w ${city}`,
    schemaServiceName: (city) => `Wzrost na Instagramie i TikToku w ${city}`,
  },
  sv: {
    metaTitle: (city) => `Köp Instagram-följare i ${city} — lokal tillväxt | Viralefy`,
    metaDescription: (city) =>
      `Väx ditt Instagram och TikTok i ${city}. Riktiga följare, gillningar och visningar med leverans anpassad till lokal tidszon. Betala i USDT/USD och kom igång på minuter.`,
    heroTitle: (city) => `Köp Instagram-följare i ${city}`,
    heroSubtitle: (city) =>
      `Lokal publik, äkta engagemang, omedelbar leverans — byggt för kreatörer och varumärken i ${city}.`,
    ctaSeePlans: (city) => `Se paket för ${city}`,
    ctaAllCities: "Alla städer",
    breadcrumbHome: "Hem",
    breadcrumbCities: "Städer",
    whyHeading: (city) => `Varför kreatörer i ${city} väljer Viralefy`,
    bullets: (city) => [
      "Konton som ser äkta ut — profilbild, bio och inläggshistorik. Inga botspår.",
      `Stegvis leverans anpassad till ${city} tidszon, träffar lokal högtrafik.`,
      "Priser i USDT/USD — inga växelkursöverraskningar, inga kortuppgifter, inga chargebacks.",
      "30 dagars påfyllningsgaranti vid tapp i varje följarpaket.",
      "Samma instrumentpanel för Instagram, TikTok och påfyllningsförfrågningar.",
      `Support på engelska samt på ${city} främsta lokala språk.`,
    ],
    readyHeading: (city) => `Redo att växa i ${city}?`,
    readyBody: (country) =>
      `Välj ett paket anpassat till marknaden ${country} — följare, gillningar eller visningar, levererade idag.`,
    readyCta: "Se Instagram-följarpaket",
    bodyP1: (city, hoods, landmark) =>
      `Oavsett om du är en kreatör som filmar runt ${landmark}, ett litet varumärke som pushar pop-ups genom ${hoods}, eller en byrå som skalar kundkonton över ${city}, är publikens täthet flaskhalsen. Viralefy levererar Instagram-följare, gillningar och kommentarer samt TikTok-visningar med leveransfönster anpassade till din lokala tidszon — så att nytt socialt bevis landar när din lokala publik faktiskt är online.`,
    bodyP2: (city, population) =>
      `${city} är ett av världens mest konkurrensutsatta flöden. Med över ${population} invånare och en tät kreatörsekonomi är det brutalt att bryta algoritmens uppvärmningsfas utan en första knuff. Våra startpaket täcker det gapet: en uppmätt ökning av äkta utseende konton som lyfter ditt inlägg in i utforska-fliken, varifrån organiskt engagemang sedan byggs på av sig självt.`,
    bodyP3:
      "Varje order betalas i USDT eller USD och avräknas on-chain — inga chargebacks och inga blottade kortuppgifter. Leveransen startar inom minuter efter bekräftelse och avslutas över timmar eller dagar beroende på paketstorlek. Det långsamma droppet är avsiktligt: det härmar organiska mönster så att plattformens säkerhetssystem behandlar tillväxten som normal. Du följer leveransen från din panel och kan pausa eller fylla på när som helst.",
    bodyP4: (city, hoods) =>
      `Marknaden i ${city} drivs av estetik — det som vinner i ${hoods} vinner inte i ett förortsflöde två städer bort. Vi låtsas inte fixa ditt innehåll. Det vi gör är att ta bort kallstartsskatten så att innehållet du redan gör får den exponeringsyta det förtjänar. Om du är osäker på vilket paket som passar din fas svarar vårt team på ärenden på engelska och stadens huvudspråk.`,
    schemaWebPageName: (city) => `Köp Instagram-följare i ${city}`,
    schemaServiceName: (city) => `Instagram- och TikTok-tillväxt i ${city}`,
  },
  da: {
    metaTitle: (city) => `Køb Instagram-følgere i ${city} — lokal vækst | Viralefy`,
    metaDescription: (city) =>
      `Få dit Instagram og TikTok til at vokse i ${city}. Ægte følgere, likes og visninger med levering tilpasset lokal tidszone. Betal i USDT/USD og start på minutter.`,
    heroTitle: (city) => `Køb Instagram-følgere i ${city}`,
    heroSubtitle: (city) =>
      `Lokalt publikum, ægte engagement, omgående levering — bygget til skabere og brands i ${city}.`,
    ctaSeePlans: (city) => `Se pakker for ${city}`,
    ctaAllCities: "Alle byer",
    breadcrumbHome: "Hjem",
    breadcrumbCities: "Byer",
    whyHeading: (city) => `Hvorfor skabere i ${city} vælger Viralefy`,
    bullets: (city) => [
      "Konti der ser ægte ud — profilbillede, bio og opslagshistorik. Ingen bot-spor.",
      `Drypvis levering tilpasset ${city} tidszone, rammer lokal spidsbelastning.`,
      "Priser i USDT/USD — ingen valutaoverraskelser, ingen kortdata, ingen chargebacks.",
      "30 dages genopfyldningsgaranti mod tab på hver følgerpakke.",
      "Samme dashboard for Instagram, TikTok og genopfyldningsanmodninger.",
      `Support på engelsk og på ${city} primære lokale sprog.`,
    ],
    readyHeading: (city) => `Klar til at vokse i ${city}?`,
    readyBody: (country) =>
      `Vælg en pakke tilpasset ${country}-markedet — følgere, likes eller visninger, leveret i dag.`,
    readyCta: "Se Instagram-følgerpakker",
    bodyP1: (city, hoods, landmark) =>
      `Uanset om du er en skaber, der filmer omkring ${landmark}, et lille brand, der promoverer pop-ups gennem ${hoods}, eller et bureau, der skalerer kundekonti på tværs af ${city}, er publikumstætheden flaskehalsen. Viralefy leverer Instagram-følgere, likes, kommentarer og TikTok-visninger med leveringsvinduer tilpasset din lokale tidszone — så ny social proof lander, når dit lokale publikum faktisk er online.`,
    bodyP2: (city, population) =>
      `${city} er et af verdens mest konkurrencemæssigt prægede feeds. Med over ${population} indbyggere og en tæt skabertøkonomi er det brutalt at bryde algoritmens opvarmningsfase uden et indledende skub. Vores starterpakker dækker det hul: en afmålt stigning af konti der ser ægte ud, som løfter dit opslag ind i udforsk-fanen, hvorefter organisk engagement bygger oven på.`,
    bodyP3:
      "Hver ordre betales i USDT eller USD og afregnes on-chain — ingen chargebacks og ingen blottede kortdata. Levering starter inden for få minutter efter bekræftelse og afsluttes over timer eller dage afhængigt af pakkens størrelse. Det langsomme dryp er bevidst: det efterligner organiske mønstre, så platformens sikkerhedssystemer behandler væksten som normal. Du følger leveringen fra dit dashboard og kan pause eller fylde på når som helst.",
    bodyP4: (city, hoods) =>
      `Markedet i ${city} drives af æstetik — det der vinder i ${hoods} vinder ikke i et forstadsfeed to byer længere væk. Vi lover ikke at fikse dit indhold. Det vi gør, er at fjerne koldstartsafgiften, så indholdet du allerede laver får den eksponeringsflade det fortjener. Hvis du er usikker på hvilken pakke der passer din fase, svarer vores team på sager på engelsk og byens primære sprog.`,
    schemaWebPageName: (city) => `Køb Instagram-følgere i ${city}`,
    schemaServiceName: (city) => `Instagram- og TikTok-vækst i ${city}`,
  },
  no: {
    metaTitle: (city) => `Kjøp Instagram-følgere i ${city} — lokal vekst | Viralefy`,
    metaDescription: (city) =>
      `Få Instagram og TikTok til å vokse i ${city}. Ekte følgere, likes og visninger med levering tilpasset lokal tidssone. Betal i USDT/USD og start på minutter.`,
    heroTitle: (city) => `Kjøp Instagram-følgere i ${city}`,
    heroSubtitle: (city) =>
      `Lokalt publikum, ekte engasjement, umiddelbar levering — bygget for skapere og merker i ${city}.`,
    ctaSeePlans: (city) => `Se pakker for ${city}`,
    ctaAllCities: "Alle byer",
    breadcrumbHome: "Hjem",
    breadcrumbCities: "Byer",
    whyHeading: (city) => `Hvorfor skapere i ${city} velger Viralefy`,
    bullets: (city) => [
      "Kontoer som ser ekte ut — profilbilde, bio og innleggshistorikk. Ingen bot-spor.",
      `Drypvis levering tilpasset ${city} tidssone, treffer lokal høytrafikk.`,
      "Priser i USDT/USD — ingen valutaoverraskelser, ingen kortdata, ingen chargebacks.",
      "30 dagers påfyllingsgaranti mot tap på hver følgerpakke.",
      "Samme dashbord for Instagram, TikTok og påfyllingsforespørsler.",
      `Støtte på engelsk og på ${city} primære lokale språk.`,
    ],
    readyHeading: (city) => `Klar til å vokse i ${city}?`,
    readyBody: (country) =>
      `Velg en pakke tilpasset ${country}-markedet — følgere, likes eller visninger, levert i dag.`,
    readyCta: "Se Instagram-følgerpakker",
    bodyP1: (city, hoods, landmark) =>
      `Enten du er en skaper som filmer rundt ${landmark}, et lite merke som promoterer pop-ups gjennom ${hoods}, eller et byrå som skalerer kundekontoer over ${city}, er publikumstettheten flaskehalsen. Viralefy leverer Instagram-følgere, likes, kommentarer og TikTok-visninger med leveringsvinduer tilpasset din lokale tidssone — slik at nytt sosialt bevis lander når ditt lokale publikum faktisk er på nett.`,
    bodyP2: (city, population) =>
      `${city} er en av verdens mest konkurranseutsatte feeder. Med over ${population} innbyggere og en tett skapertøkonomi er det brutalt å bryte algoritmens oppvarmingsfase uten et innledende dytt. Våre startpakker dekker det gapet: en avmålt økning av kontoer som ser ekte ut, som løfter innlegget ditt inn i utforsk-fanen, og derfra bygger organisk engasjement seg selv opp.`,
    bodyP3:
      "Hver bestilling betales i USDT eller USD og avregnes on-chain — ingen chargebacks og ingen eksponerte kortdata. Levering starter innen få minutter etter bekreftelse og avsluttes over timer eller dager avhengig av pakkens størrelse. Den langsomme dryppingen er tilsiktet: den etterligner organiske mønstre slik at plattformens sikkerhetssystemer behandler veksten som normal. Du følger leveringen fra dashbordet ditt og kan pause eller fylle på når som helst.",
    bodyP4: (city, hoods) =>
      `Markedet i ${city} drives av estetikk — det som vinner i ${hoods} vinner ikke i en forstadsfeed to byer unna. Vi later ikke som om vi fikser innholdet ditt. Det vi gjør er å fjerne kaldstartsskatten slik at innholdet du allerede lager får eksponeringsflaten det fortjener. Hvis du er usikker på hvilken pakke som passer fasen din, svarer teamet vårt på saker på engelsk og byens hovedspråk.`,
    schemaWebPageName: (city) => `Kjøp Instagram-følgere i ${city}`,
    schemaServiceName: (city) => `Instagram- og TikTok-vekst i ${city}`,
  },
  fi: {
    metaTitle: (city) => `Osta Instagram-seuraajia kaupungissa ${city} — paikallinen kasvu | Viralefy`,
    metaDescription: (city) =>
      `Kasvata Instagramia ja TikTokia kaupungissa ${city}. Aitoja seuraajia, tykkäyksiä ja katseluja paikalliseen aikavyöhykkeeseen sopivalla toimituksella. Maksa USDT/USD ja aloita minuuteissa.`,
    heroTitle: (city) => `Osta Instagram-seuraajia kaupungissa ${city}`,
    heroSubtitle: (city) =>
      `Paikallinen yleisö, aito sitoutuminen, välitön toimitus — rakennettu kaupungin ${city} sisällöntuottajille ja brändeille.`,
    ctaSeePlans: (city) => `Katso paketit kaupungille ${city}`,
    ctaAllCities: "Kaikki kaupungit",
    breadcrumbHome: "Etusivu",
    breadcrumbCities: "Kaupungit",
    whyHeading: (city) => `Miksi sisällöntuottajat kaupungissa ${city} valitsevat Viralefyn`,
    bullets: (city) => [
      "Aidolta näyttävät tilit — profiilikuva, bio ja julkaisuhistoria. Ei botin jälkiä.",
      `Vaiheittainen toimitus, joka on virittynyt kaupungin ${city} aikavyöhykkeeseen, osuu paikalliseen huipputuntiin.`,
      "Hinnat USDT/USD:nä — ei valuuttayllätyksiä, ei korttitietoja, ei takaisinvelotuksia.",
      "30 päivän täydennystakuu menetyksiä vastaan jokaisessa seuraajapaketissa.",
      "Sama hallintapaneeli Instagramille, TikTokille ja täydennyspyynnöille.",
      `Tuki englanniksi ja kaupungin ${city} pääasiallisella paikallisella kielellä.`,
    ],
    readyHeading: (city) => `Valmis kasvamaan kaupungissa ${city}?`,
    readyBody: (country) =>
      `Valitse markkinaan ${country} sopiva paketti — seuraajia, tykkäyksiä tai katseluja, toimitettu tänään.`,
    readyCta: "Katso Instagram-seuraajapaketit",
    bodyP1: (city, hoods, landmark) =>
      `Olitpa sisällöntuottaja, joka kuvaa kohteen ${landmark} ympärillä, pieni brändi, joka mainostaa pop-up-tapahtumia alueilla ${hoods}, tai toimisto, joka skaalaa asiakastilejä kaupungissa ${city}, pullonkaulana on yleisön tiheys. Viralefy toimittaa Instagram-seuraajia, tykkäyksiä, kommentteja ja TikTok-katseluja toimitusikkunoissa, jotka on sovitettu paikalliseen aikavyöhykkeeseesi — jotta uusi sosiaalinen todiste osuu silloin, kun paikallinen yleisösi on todella verkossa.`,
    bodyP2: (city, population) =>
      `${city} on yksi maailman kilpailluimmista syötteistä. Yli ${population} asukkaan ja tiheän sisällöntuottajatalouden keskellä algoritmin lämmittelyvaiheen läpäiseminen ilman alkuvauhtia on raakaa. Aloituspakettimme paikkaavat tämän aukon: mitattu nousu aidolta näyttäviä tilejä, joka työntää julkaisusi tutki-välilehdelle, josta orgaaninen sitoutuminen kasaantuu itsestään.`,
    bodyP3:
      "Jokainen tilaus maksetaan USDT:nä tai USD:nä ja selvitetään ketjussa — ei takaisinvelotuksia eikä paljastettuja korttitietoja. Toimitus alkaa muutamassa minuutissa vahvistuksen jälkeen ja päättyy tuntien tai päivien aikana paketin koon mukaan. Hidas tippa on tarkoituksellinen: se jäljittelee orgaanisia kuvioita, jotta alustan turvajärjestelmät käsittelevät kasvua normaalina. Voit seurata toimitusta hallintapaneelista ja keskeyttää tai täydentää milloin tahansa.",
    bodyP4: (city, hoods) =>
      `Kaupungin ${city} markkinoita ohjaa estetiikka — se mikä voittaa alueilla ${hoods} ei voita kahden kaupungin päässä olevassa esikaupunkisyötteessä. Emme väitä korjaavamme sisältöäsi. Se mitä teemme on poistaa kylmäkäynnistyksen vero, jotta jo tekemäsi sisältö saa sen näkyvyyden, jonka se ansaitsee. Jos olet epävarma, mikä paketti sopii vaiheeseesi, tiimimme vastaa tiketteihin englanniksi ja kaupungin pääkielellä.`,
    schemaWebPageName: (city) => `Osta Instagram-seuraajia kaupungissa ${city}`,
    schemaServiceName: (city) => `Instagram- ja TikTok-kasvu kaupungissa ${city}`,
  },
  he: {
    metaTitle: (city) => `קנו עוקבים באינסטגרם ב${city} — צמיחה מקומית | Viralefy`,
    metaDescription: (city) =>
      `הצמיחו את האינסטגרם והטיקטוק שלכם ב${city}. עוקבים, לייקים וצפיות אמיתיים עם אספקה המכווננת לאזור הזמן המקומי. שלמו ב-USDT/USD והתחילו תוך דקות.`,
    heroTitle: (city) => `קנו עוקבים באינסטגרם ב${city}`,
    heroSubtitle: (city) =>
      `קהל מקומי, מעורבות אמיתית, אספקה מיידית — נבנה ליוצרים ומותגים ב${city}.`,
    ctaSeePlans: (city) => `הצג חבילות ל${city}`,
    ctaAllCities: "כל הערים",
    breadcrumbHome: "דף הבית",
    breadcrumbCities: "ערים",
    whyHeading: (city) => `למה יוצרים ב${city} בוחרים ב-Viralefy`,
    bullets: (city) => [
      "חשבונות שנראים אמיתיים — תמונת פרופיל, ביו והיסטוריית פרסומים. ללא חתימת בוט.",
      `אספקה הדרגתית המכווננת לאזור הזמן של ${city}, מגיעה בשעות השיא המקומיות.`,
      "תמחור ב-USDT/USD — ללא הפתעות שער חליפין, ללא נתוני כרטיס, ללא ביטולי חיוב.",
      "אחריות מילוי מחדש ל-30 יום מול ירידות בכל חבילת עוקבים.",
      "אותה לוח בקרה לאינסטגרם, טיקטוק ובקשות מילוי מחדש.",
      `תמיכה באנגלית ובשפה המקומית העיקרית של ${city}.`,
    ],
    readyHeading: (city) => `מוכנים לצמוח ב${city}?`,
    readyBody: (country) =>
      `בחרו חבילה המתאימה לשוק ${country} — עוקבים, לייקים או צפיות, מסופקים היום.`,
    readyCta: "צפו בחבילות עוקבים באינסטגרם",
    bodyP1: (city, hoods, landmark) =>
      `בין אם אתם יוצרים המצלמים סביב ${landmark}, מותג קטן שמקדם פופ-אפים ב${hoods}, או סוכנות המרחיבה חשבונות לקוחות ברחבי ${city}, צפיפות הקהל היא צוואר הבקבוק. Viralefy מספקת עוקבים, לייקים ותגובות באינסטגרם וצפיות בטיקטוק עם חלונות אספקה המותאמים לאזור הזמן המקומי שלכם — כך שההוכחה החברתית החדשה נוחתת כשהקהל המקומי שלכם באמת מחובר.`,
    bodyP2: (city, population) =>
      `${city} הוא אחד הפידים התחרותיים ביותר בעולם. עם יותר מ-${population} תושבים וכלכלת יוצרים צפופה, פריצת שלב החימום של האלגוריתם ללא דחיפה ראשונית היא אכזרית. חבילות הסטרטר שלנו מכסות את הפער הזה: עלייה מדודה של חשבונות שנראים אמיתיים שמכניסה את הפוסט שלכם לטאב גלה, ומשם המעורבות האורגנית מצטברת.`,
    bodyP3:
      "כל הזמנה משולמת ב-USDT או USD ומסולקת on-chain — ללא ביטולי חיוב וללא חשיפת נתוני כרטיס. האספקה מתחילה תוך דקות לאחר האישור ומסתיימת לאורך שעות או ימים בהתאם לגודל החבילה. הטפטוף האיטי מכוון: הוא מחקה דפוסים אורגניים כדי שמערכות הבטיחות של הפלטפורמה יתייחסו לצמיחה כרגילה. אתם עוקבים אחר האספקה מלוח הבקרה ויכולים להשהות או להוסיף בכל עת.",
    bodyP4: (city, hoods) =>
      `שוק ${city} נע לפי אסתטיקה — מה שמנצח ב${hoods} לא ינצח בפיד פרברי שתי ערים משם. אנחנו לא מתיימרים לתקן את התוכן שלכם. מה שאנחנו עושים זה להסיר את מס ההפעלה הקרה כדי שהתוכן שאתם כבר מייצרים יקבל את שטח התצוגה שמגיע לו. אם אינכם בטוחים איזו חבילה מתאימה לשלב שלכם, הצוות שלנו עונה לפניות באנגלית ובשפה הראשית של העיר.`,
    schemaWebPageName: (city) => `קנו עוקבים באינסטגרם ב${city}`,
    schemaServiceName: (city) => `צמיחת אינסטגרם וטיקטוק ב${city}`,
  },
  uk: {
    metaTitle: (city) => `Купити підписників Instagram у ${city} — локальне зростання | Viralefy`,
    metaDescription: (city) =>
      `Розвивайте Instagram і TikTok у ${city}. Справжні підписники, лайки та перегляди з доставкою за місцевим часовим поясом. Оплата в USDT/USD, старт за лічені хвилини.`,
    heroTitle: (city) => `Купити підписників Instagram у ${city}`,
    heroSubtitle: (city) =>
      `Локальна аудиторія, справжня залученість, миттєвий старт — створено для авторів і брендів у ${city}.`,
    ctaSeePlans: (city) => `Тарифи для ${city}`,
    ctaAllCities: "Усі міста",
    breadcrumbHome: "Головна",
    breadcrumbCities: "Міста",
    whyHeading: (city) => `Чому автори в ${city} обирають Viralefy`,
    bullets: (city) => [
      "Акаунти зі справжнім виглядом — фото профілю, біо та історія публікацій. Без слідів ботів.",
      `Крапельна доставка з прив'язкою до часового поясу міста ${city}, у години піку місцевої аудиторії.`,
      "Ціни в USDT/USD — без сюрпризів курсу, без даних картки, без чарджбеків.",
      "Гарантія поповнення 30 днів при відписках на кожному пакеті підписників.",
      "Єдина панель для Instagram, TikTok і заявок на поповнення.",
      `Підтримка англійською та основною місцевою мовою міста ${city}.`,
    ],
    readyHeading: (city) => `Готові зростати в місті ${city}?`,
    readyBody: (country) =>
      `Оберіть тариф під ринок ${country} — підписники, лайки або перегляди, доставка сьогодні.`,
    readyCta: "Дивитися тарифи на підписників Instagram",
    bodyP1: (city, hoods, landmark) =>
      `Чи ви автор, який знімає біля ${landmark}, маленький бренд, що просуває поп-апи в ${hoods}, чи агенція, що масштабує клієнтські акаунти містом ${city}, вузьке місце — щільність аудиторії. Viralefy доставляє підписників, лайки та коментарі в Instagram і перегляди в TikTok у вікнах, прив'язаних до вашого місцевого часового поясу — щоб новий соціальний сигнал приходив тоді, коли ваша аудиторія дійсно онлайн.`,
    bodyP2: (city, population) =>
      `${city} — одна з найконкурентніших стрічок у світі. За понад ${population} мешканців і щільної економіки авторів пробити розігрів алгоритму без стартового поштовху вкрай складно. Наші стартові пакети закривають цей розрив: дозований приріст акаунтів зі справжнім виглядом, який виводить пост у рекомендації, а далі органіка розганяється сама.`,
    bodyP3:
      "Кожне замовлення оплачується в USDT або USD і проводиться в блокчейні — жодних чарджбеків і розкриття даних картки. Доставка стартує за лічені хвилини після підтвердження та завершується за години чи дні залежно від розміру пакета. Повільний дрип — це навмисно: він повторює органічні патерни, щоб системи безпеки платформи сприймали зростання як природне. Ви бачите доставку в панелі та можете будь-коли поставити на паузу або докупити.",
    bodyP4: (city, hoods) =>
      `Ринок міста ${city} живе естетикою — те, що виграє в ${hoods}, не виграє в приміській стрічці через два міста. Ми не обіцяємо полагодити ваш контент. Що ми робимо — знімаємо податок холодного старту, щоб контент, який ви вже створюєте, отримував ту площу показу, на яку заслуговує. Якщо не впевнені, який пакет підходить вашому етапу, наша команда відповідає на тікети англійською та основною мовою міста.`,
    schemaWebPageName: (city) => `Купити підписників Instagram у ${city}`,
    schemaServiceName: (city) => `Зростання в Instagram і TikTok у ${city}`,
  },
  cs: {
    metaTitle: (city) => `Koupit sledující na Instagramu v ${city} — lokální růst | Viralefy`,
    metaDescription: (city) =>
      `Růst na Instagramu a TikToku v ${city}. Skuteční sledující, lajky a zhlédnutí s doručením naladěným na místní časové pásmo. Plaťte v USDT/USD a startujte během minut.`,
    heroTitle: (city) => `Koupit sledující na Instagramu v ${city}`,
    heroSubtitle: (city) =>
      `Lokální publikum, skutečné zapojení, okamžité doručení — postaveno pro tvůrce a značky v ${city}.`,
    ctaSeePlans: (city) => `Zobrazit plány pro ${city}`,
    ctaAllCities: "Všechna města",
    breadcrumbHome: "Domů",
    breadcrumbCities: "Města",
    whyHeading: (city) => `Proč si tvůrci v ${city} volí Viralefy`,
    bullets: (city) => [
      "Účty s autentickým vzhledem — profilová fotka, bio a historie příspěvků. Žádný botí podpis.",
      `Postupné doručení sladěné s časovým pásmem ${city}, dopadá v místní špičce.`,
      "Ceny v USDT/USD — žádná měnová překvapení, žádné kartové údaje, žádné chargebacky.",
      "30denní záruka doplnění proti úbytkům u každého balíčku sledujících.",
      "Stejný dashboard pro Instagram, TikTok i žádosti o doplnění.",
      `Podpora v angličtině a v hlavním místním jazyce města ${city}.`,
    ],
    readyHeading: (city) => `Připraveni růst v ${city}?`,
    readyBody: (country) =>
      `Vyberte plán naladěný na trh ${country} — sledující, lajky nebo zhlédnutí, dodané ještě dnes.`,
    readyCta: "Zobrazit plány sledujících na Instagramu",
    bodyP1: (city, hoods, landmark) =>
      `Ať jste tvůrce, který natáčí kolem ${landmark}, malá značka tlačící pop-upy přes ${hoods}, nebo agentura škálující klientské účty napříč ${city}, úzkým hrdlem je hustota publika. Viralefy doručuje sledující, lajky a komentáře na Instagramu a zhlédnutí na TikToku v doručovacích oknech sladěných s vaším místním časovým pásmem — aby nový sociální důkaz dopadl tehdy, když je vaše místní publikum skutečně online.`,
    bodyP2: (city, population) =>
      `${city} patří mezi nejkonkurenčnější feedy na světě. Při více než ${population} obyvatelích a husté tvůrčí ekonomice je prolomení rozehřívací fáze algoritmu bez počátečního strčení brutální. Naše startovací balíčky tuto mezeru zaplňují: měřený nárůst autenticky vypadajících účtů, který dostane váš příspěvek do záložky Prozkoumat, a odtud se organické zapojení sbalíčkuje samo.`,
    bodyP3:
      "Každá objednávka se platí v USDT nebo USD a vyúčtovává se on-chain — žádné chargebacky, žádné odhalené kartové údaje. Doručení startuje během minut po potvrzení a končí během hodin nebo dní podle velikosti balíčku. Pomalé kapání je záměrné: napodobuje organické vzorce, aby bezpečnostní systémy platformy považovaly růst za normální. Doručení sledujete z dashboardu a kdykoli můžete pozastavit nebo dorovnat.",
    bodyP4: (city, hoods) =>
      `Trh ${city} jede na estetice — to, co vyhraje v ${hoods}, nevyhraje v předměstském feedu dvě města dál. Neslibujeme, že opravíme váš obsah. To, co děláme, je sundat daň ze startu zastudena, aby obsah, který už tvoříte, dostal expoziční plochu, kterou si zaslouží. Pokud si nejste jistí, který balíček sedí vaší fázi, náš tým odpovídá na tikety v angličtině a hlavním jazyce města.`,
    schemaWebPageName: (city) => `Koupit sledující na Instagramu v ${city}`,
    schemaServiceName: (city) => `Růst Instagramu a TikToku v ${city}`,
  },
  sk: {
    metaTitle: (city) => `Kúpiť sledujúcich na Instagrame v ${city} — lokálny rast | Viralefy`,
    metaDescription: (city) =>
      `Rast na Instagrame a TikToku v ${city}. Skutoční sledujúci, lajky a zhliadnutia s doručením naladeným na miestne časové pásmo. Plaťte v USDT/USD a štartujte v priebehu minút.`,
    heroTitle: (city) => `Kúpiť sledujúcich na Instagrame v ${city}`,
    heroSubtitle: (city) =>
      `Miestne publikum, skutočné zapojenie, okamžité doručenie — postavené pre tvorcov a značky v ${city}.`,
    ctaSeePlans: (city) => `Zobraziť plány pre ${city}`,
    ctaAllCities: "Všetky mestá",
    breadcrumbHome: "Domov",
    breadcrumbCities: "Mestá",
    whyHeading: (city) => `Prečo si tvorcovia v ${city} volia Viralefy`,
    bullets: (city) => [
      "Účty s autentickým vzhľadom — profilová fotka, bio a história príspevkov. Žiadny podpis bota.",
      `Postupné doručenie zladené s časovým pásmom ${city}, dopadá v miestnej špičke.`,
      "Ceny v USDT/USD — žiadne menové prekvapenia, žiadne kartové údaje, žiadne chargebacky.",
      "30-dňová záruka doplnenia proti úbytkom v každom balíčku sledujúcich.",
      "Rovnaký dashboard pre Instagram, TikTok aj žiadosti o doplnenie.",
      `Podpora v angličtine a v hlavnom miestnom jazyku mesta ${city}.`,
    ],
    readyHeading: (city) => `Pripravení rásť v ${city}?`,
    readyBody: (country) =>
      `Vyberte plán naladený na trh ${country} — sledujúci, lajky alebo zhliadnutia, doručené ešte dnes.`,
    readyCta: "Zobraziť plány sledujúcich na Instagrame",
    bodyP1: (city, hoods, landmark) =>
      `Či ste tvorca, ktorý natáča okolo ${landmark}, malá značka tlačiaca pop-upy cez ${hoods}, alebo agentúra škálujúca klientske účty naprieč ${city}, úzkym hrdlom je hustota publika. Viralefy doručuje sledujúcich, lajky a komentáre na Instagrame a zhliadnutia na TikToku v doručovacích oknách zladených s vaším miestnym časovým pásmom — aby nový sociálny dôkaz dopadol vtedy, keď je vaše miestne publikum naozaj online.`,
    bodyP2: (city, population) =>
      `${city} patrí medzi najkonkurenčnejšie feedy na svete. Pri viac ako ${population} obyvateľoch a hustej tvorivej ekonomike je prelomenie zahrievacej fázy algoritmu bez počiatočného postrčenia kruté. Naše štartovacie balíčky túto medzeru zapĺňajú: meraný nárast autenticky vyzerajúcich účtov, ktorý dostane váš príspevok do karty Preskúmať, a odtiaľ sa organické zapojenie nabaľuje samo.`,
    bodyP3:
      "Každá objednávka sa platí v USDT alebo USD a vyúčtuje sa on-chain — žiadne chargebacky, žiadne odhalené kartové údaje. Doručenie štartuje v priebehu minút po potvrdení a končí v priebehu hodín alebo dní podľa veľkosti balíčka. Pomalé kvapkanie je zámerné: napodobňuje organické vzorce, aby bezpečnostné systémy platformy považovali rast za normálny. Doručenie sledujete z dashboardu a kedykoľvek môžete pozastaviť alebo dorovnať.",
    bodyP4: (city, hoods) =>
      `Trh ${city} ide na estetike — to, čo vyhrá v ${hoods}, nevyhrá v predmestskom feede dve mestá ďalej. Nesľubujeme, že opravíme váš obsah. Robíme to, že snímeme daň zo studeného štartu, aby obsah, ktorý už tvoríte, dostal expozičnú plochu, ktorú si zaslúži. Ak si nie ste istí, ktorý balíček sedí vašej fáze, náš tím odpovedá na tikety v angličtine a hlavnom jazyku mesta.`,
    schemaWebPageName: (city) => `Kúpiť sledujúcich na Instagrame v ${city}`,
    schemaServiceName: (city) => `Rast Instagramu a TikToku v ${city}`,
  },
  th: {
    metaTitle: (city) => `ซื้อผู้ติดตาม Instagram ใน ${city} — การเติบโตท้องถิ่น | Viralefy`,
    metaDescription: (city) =>
      `ขยาย Instagram และ TikTok ของคุณใน ${city} ผู้ติดตาม ไลก์ และการเข้าชมจริงพร้อมการจัดส่งที่ปรับให้เข้ากับเขตเวลาท้องถิ่น ชำระด้วย USDT/USD และเริ่มได้ภายในไม่กี่นาที`,
    heroTitle: (city) => `ซื้อผู้ติดตาม Instagram ใน ${city}`,
    heroSubtitle: (city) =>
      `ผู้ชมท้องถิ่น การมีส่วนร่วมจริง การจัดส่งทันที — สร้างมาเพื่อครีเอเตอร์และแบรนด์ใน ${city}`,
    ctaSeePlans: (city) => `ดูแผนสำหรับ ${city}`,
    ctaAllCities: "ทุกเมือง",
    breadcrumbHome: "หน้าแรก",
    breadcrumbCities: "เมือง",
    whyHeading: (city) => `ทำไมครีเอเตอร์ใน ${city} จึงเลือก Viralefy`,
    bullets: (city) => [
      "บัญชีที่ดูจริง — มีภาพโปรไฟล์ ไบโอ และประวัติการโพสต์ ไม่มีลายเซ็นของบอท",
      `การจัดส่งแบบทยอยที่ปรับให้ตรงกับเขตเวลาของ ${city} ไปถึงในช่วงเวลาที่ผู้ชมท้องถิ่นใช้งานสูงสุด`,
      "ราคาเป็น USDT/USD — ไม่มีความประหลาดใจเรื่องอัตราแลกเปลี่ยน ไม่มีข้อมูลบัตร ไม่มีการคืนเงิน",
      "รับประกันการเติม 30 วันต่อการลดลงในทุกแพ็คเกจผู้ติดตาม",
      "แดชบอร์ดเดียวกันสำหรับ Instagram, TikTok และคำขอเติม",
      `การสนับสนุนเป็นภาษาอังกฤษและภาษาท้องถิ่นหลักของ ${city}`,
    ],
    readyHeading: (city) => `พร้อมจะเติบโตใน ${city} แล้วหรือยัง?`,
    readyBody: (country) =>
      `เลือกแผนที่ปรับเข้ากับตลาด ${country} — ผู้ติดตาม ไลก์ หรือการเข้าชม จัดส่งวันนี้`,
    readyCta: "ดูแผนผู้ติดตาม Instagram",
    bodyP1: (city, hoods, landmark) =>
      `ไม่ว่าคุณจะเป็นครีเอเตอร์ที่ถ่ายทำรอบ ${landmark} แบรนด์เล็กที่ผลักดันป๊อปอัพผ่าน ${hoods} หรือเอเจนซีที่ขยายบัญชีลูกค้าทั่ว ${city} ความหนาแน่นของผู้ชมคือคอขวด Viralefy จัดส่งผู้ติดตาม ไลก์ ความคิดเห็นบน Instagram และการเข้าชม TikTok ในช่วงเวลาการจัดส่งที่ปรับให้ตรงกับเขตเวลาท้องถิ่นของคุณ — เพื่อให้หลักฐานทางสังคมใหม่ลงในเวลาที่ผู้ชมท้องถิ่นของคุณออนไลน์จริง`,
    bodyP2: (city, population) =>
      `${city} เป็นหนึ่งในฟีดที่แข่งขันสูงที่สุดในโลก ด้วยผู้อยู่อาศัยมากกว่า ${population} คนและเศรษฐกิจครีเอเตอร์ที่หนาแน่น การทะลุระยะอุ่นเครื่องของอัลกอริทึมโดยไม่มีแรงผลักดันเริ่มต้นเป็นเรื่องโหดร้าย แพ็คเกจเริ่มต้นของเราเติมเต็มช่องว่างนั้น: การเพิ่มขึ้นที่วัดได้ของบัญชีที่ดูจริงซึ่งดันโพสต์ของคุณไปยังแท็บสำรวจ จากนั้นการมีส่วนร่วมแบบออร์แกนิคจะทบต้นจากที่นั่น`,
    bodyP3:
      "ทุกคำสั่งซื้อชำระเป็น USDT หรือ USD และเคลียร์บนเชน — ไม่มีการคืนเงินและไม่มีการเปิดเผยข้อมูลบัตร การจัดส่งเริ่มภายในไม่กี่นาทีหลังจากการยืนยันและสิ้นสุดภายในไม่กี่ชั่วโมงหรือไม่กี่วันขึ้นอยู่กับขนาดแพ็คเกจ การหยดช้าเป็นความตั้งใจ: เลียนแบบรูปแบบออร์แกนิคเพื่อให้ระบบความปลอดภัยของแพลตฟอร์มถือว่าการเติบโตเป็นเรื่องปกติ คุณสามารถตรวจสอบการจัดส่งจากแดชบอร์ดและหยุดชั่วคราวหรือเติมได้ตลอดเวลา",
    bodyP4: (city, hoods) =>
      `ตลาด ${city} เคลื่อนไหวด้วยสุนทรียศาสตร์ — สิ่งที่ชนะใน ${hoods} จะไม่ชนะในฟีดชานเมืองสองเมืองห่างไป เราไม่ได้สัญญาว่าจะแก้ไขเนื้อหาของคุณ สิ่งที่เราทำคือเอาภาษีการเริ่มเย็นออก เพื่อให้เนื้อหาที่คุณสร้างอยู่แล้วได้รับพื้นที่การแสดงผลที่สมควรได้รับ หากไม่แน่ใจว่าแพ็คเกจใดเหมาะกับเวทีของคุณ ทีมงานของเราตอบตั๋วเป็นภาษาอังกฤษและภาษาหลักของเมือง`,
    schemaWebPageName: (city) => `ซื้อผู้ติดตาม Instagram ใน ${city}`,
    schemaServiceName: (city) => `การเติบโตของ Instagram และ TikTok ใน ${city}`,
  },
  vi: {
    metaTitle: (city) => `Mua người theo dõi Instagram tại ${city} — tăng trưởng địa phương | Viralefy`,
    metaDescription: (city) =>
      `Phát triển Instagram và TikTok của bạn tại ${city}. Người theo dõi, lượt thích và lượt xem thật với việc giao hàng được điều chỉnh theo múi giờ địa phương. Thanh toán bằng USDT/USD và bắt đầu trong vài phút.`,
    heroTitle: (city) => `Mua người theo dõi Instagram tại ${city}`,
    heroSubtitle: (city) =>
      `Khán giả địa phương, tương tác thật, giao hàng tức thì — được xây dựng cho những người sáng tạo và thương hiệu tại ${city}.`,
    ctaSeePlans: (city) => `Xem các gói cho ${city}`,
    ctaAllCities: "Tất cả thành phố",
    breadcrumbHome: "Trang chủ",
    breadcrumbCities: "Thành phố",
    whyHeading: (city) => `Vì sao người sáng tạo tại ${city} chọn Viralefy`,
    bullets: (city) => [
      "Tài khoản trông thật — ảnh đại diện, tiểu sử và lịch sử đăng bài. Không có dấu hiệu bot.",
      `Giao nhỏ giọt được điều chỉnh theo múi giờ của ${city}, đến vào giờ cao điểm địa phương.`,
      "Giá tính bằng USDT/USD — không bất ngờ về tỉ giá, không dữ liệu thẻ, không hoàn tiền.",
      "Bảo hành bù đắp 30 ngày cho các đợt sụt giảm trên mọi gói người theo dõi.",
      "Cùng một bảng điều khiển cho Instagram, TikTok và các yêu cầu bù đắp.",
      `Hỗ trợ bằng tiếng Anh và ngôn ngữ địa phương chính của ${city}.`,
    ],
    readyHeading: (city) => `Sẵn sàng phát triển tại ${city}?`,
    readyBody: (country) =>
      `Chọn một gói phù hợp với thị trường ${country} — người theo dõi, lượt thích hoặc lượt xem, được giao hôm nay.`,
    readyCta: "Xem các gói người theo dõi Instagram",
    bodyP1: (city, hoods, landmark) =>
      `Dù bạn là người sáng tạo quay phim quanh ${landmark}, một thương hiệu nhỏ đẩy pop-up qua ${hoods}, hay một agency mở rộng tài khoản khách hàng khắp ${city}, mật độ khán giả là nút thắt. Viralefy giao người theo dõi, lượt thích và bình luận Instagram cùng lượt xem TikTok trong các khung giao hàng được điều chỉnh theo múi giờ địa phương của bạn — để bằng chứng xã hội mới đáp xuống khi khán giả địa phương thực sự đang online.`,
    bodyP2: (city, population) =>
      `${city} là một trong những bảng tin cạnh tranh nhất thế giới. Với hơn ${population} cư dân và một nền kinh tế người sáng tạo dày đặc, việc phá vỡ giai đoạn khởi động của thuật toán mà không có cú đẩy ban đầu là tàn khốc. Các gói khởi đầu của chúng tôi lấp khoảng trống đó: một sự gia tăng có đo lường của các tài khoản trông thật, đẩy bài đăng của bạn vào tab khám phá, và từ đó tương tác tự nhiên tự tích lũy.`,
    bodyP3:
      "Mỗi đơn hàng được thanh toán bằng USDT hoặc USD và quyết toán on-chain — không có hoàn tiền và không lộ dữ liệu thẻ. Giao hàng bắt đầu trong vài phút sau khi xác nhận và kết thúc trong vài giờ hoặc vài ngày tùy kích thước gói. Việc nhỏ giọt chậm là có chủ đích: nó mô phỏng các mẫu tự nhiên để các hệ thống bảo mật của nền tảng coi sự tăng trưởng là bình thường. Bạn theo dõi việc giao hàng từ bảng điều khiển của mình và có thể tạm dừng hoặc bổ sung bất cứ lúc nào.",
    bodyP4: (city, hoods) =>
      `Thị trường ${city} vận hành trên thẩm mỹ — thứ thắng ở ${hoods} sẽ không thắng trong một bảng tin ngoại ô hai thành phố cách đó. Chúng tôi không hứa sẽ sửa nội dung của bạn. Điều chúng tôi làm là loại bỏ thuế khởi động lạnh để nội dung bạn đã làm có được diện tích trình bày mà nó xứng đáng. Nếu bạn không chắc gói nào phù hợp với giai đoạn của mình, đội ngũ của chúng tôi trả lời các phiếu bằng tiếng Anh và ngôn ngữ chính của thành phố.`,
    schemaWebPageName: (city) => `Mua người theo dõi Instagram tại ${city}`,
    schemaServiceName: (city) => `Tăng trưởng Instagram và TikTok tại ${city}`,
  },
  id: {
    metaTitle: (city) => `Beli pengikut Instagram di ${city} — pertumbuhan lokal | Viralefy`,
    metaDescription: (city) =>
      `Kembangkan Instagram dan TikTok Anda di ${city}. Pengikut, suka, dan tayangan asli dengan pengiriman yang disesuaikan dengan zona waktu lokal. Bayar dengan USDT/USD dan mulai dalam hitungan menit.`,
    heroTitle: (city) => `Beli pengikut Instagram di ${city}`,
    heroSubtitle: (city) =>
      `Audiens lokal, keterlibatan asli, pengiriman instan — dibangun untuk kreator dan merek di ${city}.`,
    ctaSeePlans: (city) => `Lihat paket untuk ${city}`,
    ctaAllCities: "Semua kota",
    breadcrumbHome: "Beranda",
    breadcrumbCities: "Kota",
    whyHeading: (city) => `Mengapa kreator di ${city} memilih Viralefy`,
    bullets: (city) => [
      "Akun yang terlihat asli — foto profil, bio, dan riwayat posting. Tidak ada tanda bot.",
      `Pengiriman bertahap yang diselaraskan dengan zona waktu ${city}, tiba pada jam sibuk lokal.`,
      "Harga dalam USDT/USD — tidak ada kejutan kurs, tidak ada data kartu, tidak ada chargeback.",
      "Jaminan pengisian ulang 30 hari terhadap penurunan pada setiap paket pengikut.",
      "Dasbor yang sama untuk Instagram, TikTok, dan permintaan pengisian ulang.",
      `Dukungan dalam bahasa Inggris dan bahasa lokal utama dari ${city}.`,
    ],
    readyHeading: (city) => `Siap berkembang di ${city}?`,
    readyBody: (country) =>
      `Pilih paket yang disesuaikan dengan pasar ${country} — pengikut, suka, atau tayangan, dikirim hari ini.`,
    readyCta: "Lihat paket pengikut Instagram",
    bodyP1: (city, hoods, landmark) =>
      `Baik Anda seorang kreator yang merekam di sekitar ${landmark}, merek kecil yang mendorong pop-up melalui ${hoods}, atau agensi yang menskalakan akun klien di seluruh ${city}, kepadatan audiens adalah hambatannya. Viralefy mengirimkan pengikut, suka, dan komentar Instagram serta tayangan TikTok dengan jendela pengiriman yang diselaraskan dengan zona waktu lokal Anda — sehingga bukti sosial baru mendarat ketika audiens lokal Anda benar-benar online.`,
    bodyP2: (city, population) =>
      `${city} adalah salah satu feed paling kompetitif di dunia. Dengan lebih dari ${population} penduduk dan ekonomi kreator yang padat, menembus fase pemanasan algoritma tanpa dorongan awal sangat brutal. Paket pemula kami menutupi celah itu: peningkatan terukur dari akun yang terlihat asli yang mendorong posting Anda ke tab jelajahi, dan dari sana keterlibatan organik bertumpuk dengan sendirinya.`,
    bodyP3:
      "Setiap pesanan dibayar dalam USDT atau USD dan diselesaikan on-chain — tidak ada chargeback dan tidak ada data kartu yang terungkap. Pengiriman dimulai dalam hitungan menit setelah konfirmasi dan selesai dalam jam atau hari tergantung ukuran paket. Tetesan lambat ini disengaja: meniru pola organik agar sistem keamanan platform memperlakukan pertumbuhan sebagai hal normal. Anda dapat memantau pengiriman dari dasbor dan menjeda atau menambah kapan saja.",
    bodyP4: (city, hoods) =>
      `Pasar ${city} bergerak oleh estetika — yang menang di ${hoods} tidak akan menang di feed pinggiran dua kota berikutnya. Kami tidak menjanjikan akan memperbaiki konten Anda. Yang kami lakukan adalah menghapus pajak cold start sehingga konten yang sudah Anda buat mendapatkan ruang tampil yang layak. Jika Anda tidak yakin paket mana yang cocok untuk tahap Anda, tim kami menjawab tiket dalam bahasa Inggris dan bahasa utama kota tersebut.`,
    schemaWebPageName: (city) => `Beli pengikut Instagram di ${city}`,
    schemaServiceName: (city) => `Pertumbuhan Instagram dan TikTok di ${city}`,
  },
};

// Programmatic SEO city LP. 50 rotas estáticas; cada uma fala da cidade
// com bairros/landmarks reais antes de redirecionar pro funnel do país.

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Bairros/landmarks plausíveis (factual) — usados na cópia. Cidades sem
// entrada caem num parágrafo genérico baseado em região.
const LOCAL_FLAVOR: Record<string, { neighborhoods: string[]; landmark: string }> = {
  "new-york-city": { neighborhoods: ["Manhattan", "Brooklyn", "Queens", "Williamsburg"], landmark: "Times Square" },
  "los-angeles": { neighborhoods: ["Hollywood", "Venice Beach", "Santa Monica", "Silver Lake"], landmark: "the Hollywood Sign" },
  "chicago": { neighborhoods: ["the Loop", "Wicker Park", "Lincoln Park"], landmark: "Millennium Park" },
  "houston": { neighborhoods: ["Montrose", "Midtown", "the Heights"], landmark: "Buffalo Bayou" },
  "miami": { neighborhoods: ["South Beach", "Wynwood", "Brickell"], landmark: "Ocean Drive" },
  "toronto": { neighborhoods: ["Queen West", "Yorkville", "Kensington Market"], landmark: "the CN Tower" },
  "vancouver": { neighborhoods: ["Gastown", "Yaletown", "Kitsilano"], landmark: "Stanley Park" },
  "london": { neighborhoods: ["Shoreditch", "Camden", "Soho", "Notting Hill"], landmark: "the Thames" },
  "manchester": { neighborhoods: ["the Northern Quarter", "Ancoats", "Deansgate"], landmark: "Manchester Piccadilly" },
  "birmingham-uk": { neighborhoods: ["Digbeth", "the Jewellery Quarter"], landmark: "the Bullring" },
  "paris": { neighborhoods: ["Le Marais", "Saint-Germain", "Montmartre", "the 11th"], landmark: "the Seine" },
  "lyon": { neighborhoods: ["Vieux Lyon", "Croix-Rousse", "Confluence"], landmark: "the Saône riverfront" },
  "marseille": { neighborhoods: ["Le Panier", "Cours Julien"], landmark: "the Vieux-Port" },
  "madrid": { neighborhoods: ["Malasaña", "Chueca", "La Latina"], landmark: "Gran Vía" },
  "barcelona": { neighborhoods: ["El Born", "Gràcia", "Poblenou"], landmark: "Las Ramblas" },
  "berlin": { neighborhoods: ["Kreuzberg", "Neukölln", "Mitte", "Prenzlauer Berg"], landmark: "the Spree" },
  "munich": { neighborhoods: ["Schwabing", "Maxvorstadt", "Glockenbach"], landmark: "the Englischer Garten" },
  "hamburg": { neighborhoods: ["St. Pauli", "Sternschanze", "HafenCity"], landmark: "the Elbphilharmonie" },
  "rome": { neighborhoods: ["Trastevere", "Monti", "Testaccio"], landmark: "the Tiber" },
  "milan": { neighborhoods: ["Brera", "Navigli", "Porta Nuova"], landmark: "the Duomo" },
  "amsterdam": { neighborhoods: ["De Pijp", "Jordaan", "Oud-West"], landmark: "the canal ring" },
  "brussels": { neighborhoods: ["Ixelles", "Saint-Gilles", "Sainte-Catherine"], landmark: "the Grand Place" },
  "dublin": { neighborhoods: ["Temple Bar", "Portobello", "Stoneybatter"], landmark: "the Liffey" },
  "lisbon": { neighborhoods: ["Bairro Alto", "Alfama", "Príncipe Real"], landmark: "the Tagus" },
  "vienna": { neighborhoods: ["Neubau", "Leopoldstadt", "Mariahilf"], landmark: "the Ringstraße" },
  "zurich": { neighborhoods: ["Kreis 4", "Kreis 5", "Niederdorf"], landmark: "Lake Zurich" },
  "stockholm": { neighborhoods: ["Södermalm", "Vasastan", "Östermalm"], landmark: "Gamla Stan" },
  "copenhagen": { neighborhoods: ["Vesterbro", "Nørrebro", "Christianshavn"], landmark: "Nyhavn" },
  "warsaw": { neighborhoods: ["Praga", "Powiśle", "Mokotów"], landmark: "the Vistula" },
  "sydney": { neighborhoods: ["Surry Hills", "Newtown", "Bondi"], landmark: "the Opera House" },
  "melbourne": { neighborhoods: ["Fitzroy", "Brunswick", "St Kilda"], landmark: "the Yarra" },
  "sao-paulo": { neighborhoods: ["Vila Madalena", "Pinheiros", "Jardins", "Itaim"], landmark: "Avenida Paulista" },
  "rio-de-janeiro": { neighborhoods: ["Ipanema", "Leblon", "Copacabana", "Botafogo"], landmark: "Sugarloaf" },
  "mexico-city": { neighborhoods: ["Roma", "Condesa", "Polanco", "Coyoacán"], landmark: "the Zócalo" },
  "buenos-aires": { neighborhoods: ["Palermo", "Recoleta", "San Telmo"], landmark: "the Obelisco" },
  "bogota": { neighborhoods: ["Chapinero", "La Candelaria", "Usaquén"], landmark: "Monserrate" },
  "santiago": { neighborhoods: ["Providencia", "Bellavista", "Lastarria"], landmark: "Cerro San Cristóbal" },
  "lima": { neighborhoods: ["Miraflores", "Barranco", "San Isidro"], landmark: "the Malecón" },
  "dubai": { neighborhoods: ["Downtown", "Dubai Marina", "JBR", "Business Bay"], landmark: "the Burj Khalifa" },
  "riyadh": { neighborhoods: ["Olaya", "Al Malqa", "Diplomatic Quarter"], landmark: "Kingdom Centre" },
  "tel-aviv": { neighborhoods: ["Florentin", "Neve Tzedek", "Rothschild"], landmark: "the Tayelet" },
  "istanbul": { neighborhoods: ["Beyoğlu", "Karaköy", "Kadıköy"], landmark: "the Bosphorus" },
  "cairo": { neighborhoods: ["Zamalek", "Maadi", "Downtown"], landmark: "the Nile" },
  "mumbai": { neighborhoods: ["Bandra", "Andheri", "Lower Parel"], landmark: "Marine Drive" },
  "delhi": { neighborhoods: ["Hauz Khas", "Connaught Place", "Saket"], landmark: "India Gate" },
  "bangalore": { neighborhoods: ["Indiranagar", "Koramangala", "HSR Layout"], landmark: "Cubbon Park" },
  "tokyo": { neighborhoods: ["Shibuya", "Shinjuku", "Harajuku", "Daikanyama"], landmark: "the Shibuya Crossing" },
  "seoul": { neighborhoods: ["Gangnam", "Hongdae", "Itaewon", "Seongsu"], landmark: "the Han River" },
  "singapore": { neighborhoods: ["Tiong Bahru", "Tanjong Pagar", "Holland Village"], landmark: "Marina Bay" },
  "bangkok": { neighborhoods: ["Sukhumvit", "Thonglor", "Ari"], landmark: "the Chao Phraya" },
};

// ISR (round 23 Track XX): página detalhe — generateStaticParams + revalidate.
// Como usa `headers()` pra i18n, Next 15 mantém `ƒ` até o i18n virar client-side.
// Cache via Caddy compensa (Track JJ).
export const revalidate = 1800;

// Rota GLOBAL (EN-only). BOTTOM-UP {locale:"en", city}: só o locale canônico `en`
// (o Next não propaga o param do `[locale]` pai — testado). Demais locales
// on-demand (ISR). Evita city×locale no build.
export async function generateStaticParams(): Promise<{ locale: string; city: string }[]> {
  return CITIES.map((c) => ({ locale: "en", city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; city: string }> }): Promise<Metadata> {
  const { locale, city: slug } = await params;
  const city = getCity(slug);
  if (!city) return { title: "City not found" };

  const url = siteUrl();
  const meta = indexableMeta();
  const lang = resolveLang(locale);
  // Fallback EN pra langs sem pack (he/uk/cs/sk/th/vi/id — débito Track XX).
  const tt = CITY_T[lang] ?? CITY_T.en!;
  const title = tt.metaTitle(city.name);
  const description = tt.metaDescription(city.name);
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/cities/${city.slug}`,
      languages: {
        "x-default": `/cities/${city.slug}`,
        en: `/cities/${city.slug}`,
        "pt-BR": `/cities/${city.slug}`,
        "es-ES": `/cities/${city.slug}`,
        "fr-FR": `/cities/${city.slug}`,
        "de-DE": `/cities/${city.slug}`,
        "ja-JP": `/cities/${city.slug}`,
        "it-IT": `/cities/${city.slug}`,
        "ru-RU": `/cities/${city.slug}`,
        "nl-NL": `/cities/${city.slug}`,
        "ko-KR": `/cities/${city.slug}`,
        ar: `/cities/${city.slug}`,
        "zh-Hans": `/cities/${city.slug}`,
        "hi-IN": `/cities/${city.slug}`,
        "tr-TR": `/cities/${city.slug}`,
        "pl-PL": `/cities/${city.slug}`,
        "sv-SE": `/cities/${city.slug}`,
        "da-DK": `/cities/${city.slug}`,
        "nb-NO": `/cities/${city.slug}`,
        "fi-FI": `/cities/${city.slug}`,
        "he-IL": `/cities/${city.slug}`,
        "uk-UA": `/cities/${city.slug}`,
        "cs-CZ": `/cities/${city.slug}`,
        "sk-SK": `/cities/${city.slug}`,
        "th-TH": `/cities/${city.slug}`,
        "vi-VN": `/cities/${city.slug}`,
        "id-ID": `/cities/${city.slug}`,
      },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title,
      description,
      locale: ogLocale(lang),
      type: "article",
      url: `${url}/cities/${city.slug}`,
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
  };
}

// "central <city>" fallback varia por idioma — quando uma cidade não tem
// LOCAL_FLAVOR específica, queremos uma frase idiomática em cada língua
// (BUG city-fallback: antes só dizia "central <city>" e ficava esquisito
// embebido nos parágrafos PT/ES/FR/DE/JA).
function neighborhoodsText(
  slug: string,
  city: string,
  lang: PageLang,
): { hoods: string; landmark: string } {
  const flavor = LOCAL_FLAVOR[slug];
  if (!flavor) {
    // Round 23 Track XX: Partial pra acomodar langs novas (he/uk/cs/sk/th/vi/id)
    // sem ainda ter tradução — fallback EN no acesso.
    const fallbackHoods: Partial<Record<PageLang, string>> = {
      en: `central ${city}`,
      pt: `o centro de ${city}`,
      es: `el centro de ${city}`,
      fr: `le centre de ${city}`,
      de: `das Zentrum von ${city}`,
      ja: `${city}の中心部`,
      it: `il centro di ${city}`,
      ru: `центр города ${city}`,
      nl: `het centrum van ${city}`,
      ko: `${city}의 중심부`,
      ar: `وسط ${city}`,
      zh: `${city}市中心`,
      hi: `${city} का केंद्र`,
      tr: `${city} merkezi`,
      pl: `centrum ${city}`,
      sv: `centrala ${city}`,
      da: `${city} centrum`,
      no: `${city} sentrum`,
      fi: `${city}n keskusta`,
      he: `מרכז ${city}`,
      uk: `центр ${city}`,
      cs: `centrum ${city}`,
      sk: `centrum ${city}`,
      th: `ใจกลาง ${city}`,
      vi: `trung tâm ${city}`,
      id: `pusat kota ${city}`,
    };
    return { hoods: fallbackHoods[lang] ?? fallbackHoods.en ?? `central ${city}`, landmark: `${city}` };
  }
  const list = flavor.neighborhoods;
  const last = list[list.length - 1];
  const head = list.slice(0, -1).join(", ");
  const connector: Partial<Record<PageLang, string>> = {
    en: " and ",
    pt: " e ",
    es: " y ",
    fr: " et ",
    de: " und ",
    ja: "、",
    it: " e ",
    ru: " и ",
    nl: " en ",
    ko: ", ",
    ar: " و ",
    zh: "、",
    hi: " और ",
    tr: " ve ",
    pl: " i ",
    sv: " och ",
    da: " og ",
    no: " og ",
    fi: " ja ",
    he: " ו",
    uk: " і ",
    cs: " a ",
    sk: " a ",
    th: " และ ",
    vi: " và ",
    id: " dan ",
  };
  return {
    hoods: list.length > 1 ? `${head}${connector[lang] ?? connector.en ?? " and "}${last}` : last,
    landmark: flavor.landmark,
  };
}

export default async function CityPage({ params }: { params: Promise<{ locale: string; city: string }> }) {
  const { locale, city: slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();

  const url = siteUrl();
  const pageUrl = `${url}/cities/${city.slug}`;
  const lang = resolveLang(locale);
  // Fallback EN pra langs sem pack (he/uk/cs/sk/th/vi/id — débito Track XX).
  const tt = CITY_T[lang] ?? CITY_T.en!;
  // Locale do toLocaleString segue lang (BUG-89): em PT vira "12.300.000".
  const localeFmtByLang: Partial<Record<PageLang, string>> = {
    pt: "pt-BR",
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ja: "ja-JP",
    it: "it-IT",
    ru: "ru-RU",
    nl: "nl-NL",
    ko: "ko-KR",
    ar: "ar-SA",
    zh: "zh-CN",
    hi: "hi-IN",
    tr: "tr-TR",
    pl: "pl-PL",
    sv: "sv-SE",
    da: "da-DK",
    no: "nb-NO",
    fi: "fi-FI",
    he: "he-IL",
    uk: "uk-UA",
    cs: "cs-CZ",
    sk: "sk-SK",
    th: "th-TH",
    vi: "vi-VN",
    id: "id-ID",
  };
  const populationFmt = city.population.toLocaleString(localeFmtByLang[lang] ?? "en-US");
  // BUG-90/163 do QA 2026-06-12: ctaHref apontava pra alias EN
  // (/br/instagram-followers) que gerava conteúdo duplicado sem 301 — o
  // canonical próprio mascarava o problema. Agora gera o slug localizado
  // a partir do htmlLang da cidade.
  const cityLang = (city.htmlLang.split("-")[0] || "en") as LangCode;
  const ctaSlug = categorySlug("seguidores_instagram", cityLang);
  const ctaHref = `/${city.country}/${ctaSlug}`;
  const { hoods, landmark } = neighborhoodsText(city.slug, city.name, lang);

  // BUG-191: consolida WebPage + BreadcrumbList + Service em UM @graph.
  const jsonld = toJsonLdGraph([
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      name: tt.schemaWebPageName(city.name),
      url: pageUrl,
      inLanguage: schemaLang(lang),
      isPartOf: { "@id": `${url}/#website` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tt.breadcrumbHome, item: url },
        { "@type": "ListItem", position: 2, name: tt.breadcrumbCities, item: `${url}/cities` },
        { "@type": "ListItem", position: 3, name: city.name, item: pageUrl },
      ],
    },
    {
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: tt.schemaServiceName(city.name),
      serviceType: "Social media growth",
      provider: {
        "@type": "Organization",
        name: "Viralefy",
        url,
      },
      areaServed: {
        "@type": "Place",
        name: city.name,
        address: { "@type": "PostalAddress", addressCountry: city.country.toUpperCase() },
      },
      url: pageUrl,
    },
  ]);

  return (
    <>
      <JsonLdScript data={jsonld} />

      <article lang={schemaLang(lang)}>
        {/* BUG-164 do QA 2026-06-12: páginas de cidade não tinham breadcrumb,
            quebrando navegação contextual + Schema breadcrumb estava ausente. */}
        <nav aria-label="Breadcrumb" className="container" style={{ paddingTop: "0.75rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <ol style={{ listStyle: "none", display: "flex", gap: "0.5rem", padding: 0, flexWrap: "wrap" }}>
            <li><Link href="/">{tt.breadcrumbHome}</Link></li>
            <li aria-hidden>›</li>
            <li><Link href="/cities">{tt.breadcrumbCities}</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">{city.name}</li>
          </ol>
        </nav>
        <header className="hero container" style={{ textAlign: "center", maxWidth: 820, margin: "0 auto", padding: "1.5rem 1rem 1.5rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <Flag code={city.country} width={80} title={city.name} style={{ borderRadius: "4px" }} nameIsAdjacent />
          </div>
          <h1 style={{ fontSize: "2.4rem", lineHeight: 1.15, margin: "0 0 1rem" }}>
            {tt.heroTitle(city.name)}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", margin: "0 auto", maxWidth: 640 }}>
            {tt.heroSubtitle(city.name)}
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={ctaHref} className="btn btn-primary">{tt.ctaSeePlans(city.name)}</Link>
            <Link href="/cities" className="btn btn-outline">{tt.ctaAllCities}</Link>
          </div>
        </header>

        <main className="container" style={{ maxWidth: 820, paddingBottom: "4rem" }}>
          <section style={{ marginTop: "2rem", lineHeight: 1.7, color: "var(--text)" }}>
            <p>{tt.bodyP1(city.name, hoods, landmark)}</p>
            <p>{tt.bodyP2(city.name, populationFmt)}</p>
            <p>{tt.bodyP3}</p>
            <p>{tt.bodyP4(city.name, hoods)}</p>
          </section>

          <section style={{ marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.3rem", margin: "0 0 1rem" }}>{tt.whyHeading(city.name)}</h2>
            <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.7, color: "var(--text)" }}>
              {tt.bullets(city.name, city.country.toUpperCase()).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </section>

          <section className="card" style={{ marginTop: "2.5rem", padding: "1.5rem", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem" }}>{tt.readyHeading(city.name)}</h2>
            <p style={{ color: "var(--muted)", margin: "0 0 1.25rem" }}>
              {tt.readyBody(city.country.toUpperCase())}
            </p>
            <Link href={ctaHref} className="btn btn-primary">{tt.readyCta}</Link>
          </section>
        </main>
      </article>

      <Footer lang={lang} compact />
    </>
  );
}
