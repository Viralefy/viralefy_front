// Catálogo de categorias com slug SEO por idioma e cópia longa por idioma.
// O `code` é o mesmo do backend (`seguidores`, `engajamento`, …). O slug
// muda por idioma para casar com o vocabulário do mercado — pt usa
// "seguidores", en usa "followers", de usa "follower", etc.
//
// A cópia longa precisa entregar 500+ palavras por idioma. Onde não temos
// tradução dedicada caímos no `en`. Isso casa com `languages.ts`.

import type { LangCode } from "./languages";

// Categorias separadas por primitiva de engagement (likes / comments / shares)
// e por plataforma (instagram / tiktok). Saves do IG caem em
// `compartilhamentos_instagram` — shares e saves são a mesma família de
// "espalhamento" pra fins de SEO e UX.
export type CategoryCode =
  | "seguidores_instagram"
  | "seguidores_tiktok"
  | "curtidas_instagram"
  | "curtidas_tiktok"
  | "comentarios_instagram"
  | "comentarios_tiktok"
  | "compartilhamentos_instagram"
  | "compartilhamentos_tiktok"
  | "visualizacoes_instagram"
  | "visualizacoes_tiktok"
  | "servicos"
  // Recovery: LP própria por país, com formulário ao invés de tabela
  // de pacotes.
  | "recuperacao_perfil";

export const CATEGORY_CODES: CategoryCode[] = [
  "seguidores_instagram",
  "seguidores_tiktok",
  "curtidas_instagram",
  "curtidas_tiktok",
  "comentarios_instagram",
  "comentarios_tiktok",
  "compartilhamentos_instagram",
  "compartilhamentos_tiktok",
  "visualizacoes_instagram",
  "visualizacoes_tiktok",
  "servicos",
  "recuperacao_perfil",
];

// Categorias cujo checkout pós-pagamento abre um ticket de suporte
// automaticamente (handoff manual com o time). Espelha
// `ShouldOpenTicketForCategory` no backend.
export const TICKET_OPENING_CATEGORIES: ReadonlySet<CategoryCode> = new Set<CategoryCode>([
  "recuperacao_perfil",
]);

// Label curto (usado em chips / tabs).
//
// NOTA 2026-06-05: idiomas adicionados no COUNTRY_LANG fix (ms/sr/sq/bs/he/
// bn/ur/sw/am/tl) caem no fallback `en` aqui — extensão p/ esses idiomas é
// trabalho de tradutor profissional (native-script + checagem cultural).
// Não bloqueia indexação porque hreflang + per-lang sitemap continuam
// corretos: o crawler sabe que `/il/instagram-followers` é he-IL ainda que
// o chip diga "Instagram followers" em inglês.
export const CATEGORY_LABEL: Record<CategoryCode, Partial<Record<LangCode, string>>> = {
  seguidores_instagram: {
    en: "Instagram followers", pt: "Seguidores Instagram",
    es: "Seguidores Instagram", fr: "Abonnés Instagram",
    de: "Instagram Follower", it: "Follower Instagram",
    nl: "Instagram volgers", ru: "Подписчики Instagram",
    ja: "Instagramフォロワー", ko: "Instagram 팔로워",
    ar: "متابعو Instagram", hi: "Instagram फॉलोअर्स",
    id: "Pengikut Instagram", vi: "Người theo dõi Instagram",
    th: "ผู้ติดตาม Instagram", tr: "Instagram takipçi",
    uk: "Підписники Instagram",
  },
  seguidores_tiktok: {
    en: "TikTok followers", pt: "Seguidores TikTok",
    es: "Seguidores TikTok", fr: "Abonnés TikTok",
    de: "TikTok Follower", it: "Follower TikTok",
    nl: "TikTok volgers", ru: "Подписчики TikTok",
    ja: "TikTokフォロワー", ko: "TikTok 팔로워",
    ar: "متابعو TikTok", hi: "TikTok फॉलोअर्स",
    id: "Pengikut TikTok", vi: "Người theo dõi TikTok",
    th: "ผู้ติดตาม TikTok", tr: "TikTok takipçi",
    uk: "Підписники TikTok",
  },
  curtidas_instagram: {
    en: "Instagram likes", pt: "Curtidas Instagram",
    es: "Likes Instagram", fr: "Likes Instagram",
    de: "Instagram Likes", it: "Like Instagram",
    nl: "Instagram likes", ru: "Лайки Instagram",
    ja: "Instagramいいね", ko: "Instagram 좋아요",
    ar: "إعجابات Instagram", hi: "Instagram लाइक्स",
    id: "Suka Instagram", vi: "Lượt thích Instagram",
    th: "ไลก์ Instagram", tr: "Instagram beğeni",
    uk: "Лайки Instagram",
  },
  curtidas_tiktok: {
    en: "TikTok likes", pt: "Curtidas TikTok",
    es: "Likes TikTok", fr: "Likes TikTok",
    de: "TikTok Likes", it: "Like TikTok",
    nl: "TikTok likes", ru: "Лайки TikTok",
    ja: "TikTokいいね", ko: "TikTok 좋아요",
    ar: "إعجابات TikTok", hi: "TikTok लाइक्स",
    id: "Suka TikTok", vi: "Lượt thích TikTok",
    th: "ไลก์ TikTok", tr: "TikTok beğeni",
    uk: "Лайки TikTok",
  },
  comentarios_instagram: {
    en: "Instagram comments", pt: "Comentários Instagram",
    es: "Comentarios Instagram", fr: "Commentaires Instagram",
    de: "Instagram Kommentare", it: "Commenti Instagram",
    nl: "Instagram reacties", ru: "Комментарии Instagram",
    ja: "Instagramコメント", ko: "Instagram 댓글",
    ar: "تعليقات Instagram", hi: "Instagram कमेंट्स",
    id: "Komentar Instagram", vi: "Bình luận Instagram",
    th: "คอมเมนต์ Instagram", tr: "Instagram yorum",
    uk: "Коментарі Instagram",
  },
  comentarios_tiktok: {
    en: "TikTok comments", pt: "Comentários TikTok",
    es: "Comentarios TikTok", fr: "Commentaires TikTok",
    de: "TikTok Kommentare", it: "Commenti TikTok",
    nl: "TikTok reacties", ru: "Комментарии TikTok",
    ja: "TikTokコメント", ko: "TikTok 댓글",
    ar: "تعليقات TikTok", hi: "TikTok कमेंट्स",
    id: "Komentar TikTok", vi: "Bình luận TikTok",
    th: "คอมเมนต์ TikTok", tr: "TikTok yorum",
    uk: "Коментарі TikTok",
  },
  compartilhamentos_instagram: {
    en: "Instagram shares", pt: "Compartilhamentos Instagram",
    es: "Compartidos Instagram", fr: "Partages Instagram",
    de: "Instagram Shares", it: "Condivisioni Instagram",
    nl: "Instagram delen", ru: "Репосты Instagram",
    ja: "Instagramシェア", ko: "Instagram 공유",
    ar: "مشاركات Instagram", hi: "Instagram शेयर्स",
    id: "Bagikan Instagram", vi: "Chia sẻ Instagram",
    th: "แชร์ Instagram", tr: "Instagram paylaşım",
    uk: "Поширення Instagram",
  },
  compartilhamentos_tiktok: {
    en: "TikTok shares", pt: "Compartilhamentos TikTok",
    es: "Compartidos TikTok", fr: "Partages TikTok",
    de: "TikTok Shares", it: "Condivisioni TikTok",
    nl: "TikTok delen", ru: "Репосты TikTok",
    ja: "TikTokシェア", ko: "TikTok 공유",
    ar: "مشاركات TikTok", hi: "TikTok शेयर्स",
    id: "Bagikan TikTok", vi: "Chia sẻ TikTok",
    th: "แชร์ TikTok", tr: "TikTok paylaşım",
    uk: "Поширення TikTok",
  },
  visualizacoes_instagram: {
    en: "Instagram views", pt: "Visualizações Instagram",
    es: "Visualizaciones Instagram", fr: "Vues Instagram",
    de: "Instagram Aufrufe", it: "Visualizzazioni Instagram",
    nl: "Instagram weergaven", ru: "Просмотры Instagram",
    ja: "Instagram再生数", ko: "Instagram 조회수",
    ar: "مشاهدات Instagram", hi: "Instagram व्यूज़",
    id: "Tayangan Instagram", vi: "Lượt xem Instagram",
    th: "ยอดดู Instagram", tr: "Instagram görüntüleme",
    uk: "Перегляди Instagram",
  },
  visualizacoes_tiktok: {
    en: "TikTok views", pt: "Visualizações TikTok",
    es: "Visualizaciones TikTok", fr: "Vues TikTok",
    de: "TikTok Aufrufe", it: "Visualizzazioni TikTok",
    nl: "TikTok weergaven", ru: "Просмотры TikTok",
    ja: "TikTok再生数", ko: "TikTok 조회수",
    ar: "مشاهدات TikTok", hi: "TikTok व्यूज़",
    id: "Tayangan TikTok", vi: "Lượt xem TikTok",
    th: "ยอดดู TikTok", tr: "TikTok görüntüleme",
    uk: "Перегляди TikTok",
  },
  servicos: {
    en: "Premium services", pt: "Serviços premium", es: "Servicios premium",
    es_AR: "Servicios premium", fr: "Services premium", de: "Premium-Services",
    it: "Servizi premium", nl: "Premium diensten", pl: "Usługi premium",
    sv: "Premiumtjänster", da: "Premium-tjenester", no: "Premium-tjenester",
    fi: "Premium-palvelut", is: "Premium þjónusta",
    et: "Premium teenused", lv: "Premium pakalpojumi", lt: "Premium paslaugos",
    cs: "Prémiové služby", sk: "Prémiové služby", hu: "Prémium szolgáltatações",
    ro: "Servicii premium", bg: "Премиум услуги", el: "Premium υπηρεσίες",
    hr: "Premium usluge", sl: "Premium storitve", ca: "Serveis premium",
    ru: "Премиум услуги",
  },
  recuperacao_perfil: {
    en: "Account recovery", pt: "Recuperação de perfil",
    es: "Recuperación de cuenta", es_AR: "Recuperación de cuenta",
    fr: "Récupération de compte", de: "Konto-Wiederherstellung",
    it: "Recupero account", nl: "Accountherstel",
    ru: "Восстановление аккаунта", ja: "アカウント復旧", ko: "계정 복구",
    ar: "استرداد الحساب", hi: "अकाउंट रिकवरी",
    id: "Pemulihan akun", vi: "Khôi phục tài khoản",
    th: "กู้คืนบัญชี", tr: "Hesap kurtarma", uk: "Відновлення акаунта",
  },
};

// Slug SEO da categoria por idioma. Cai no inglês (= "followers") se faltar.
export const CATEGORY_SLUG: Record<CategoryCode, Partial<Record<LangCode, string>>> = {
  seguidores_instagram: {
    en: "instagram-followers", pt: "seguidores-instagram",
    es: "seguidores-instagram", fr: "abonnes-instagram",
    de: "instagram-follower", it: "follower-instagram",
    nl: "instagram-volgers", ru: "podpisciki-instagram",
  },
  seguidores_tiktok: {
    en: "tiktok-followers", pt: "seguidores-tiktok",
    es: "seguidores-tiktok", fr: "abonnes-tiktok",
    de: "tiktok-follower", it: "follower-tiktok",
    nl: "tiktok-volgers", ru: "podpisciki-tiktok",
  },
  curtidas_instagram: {
    en: "instagram-likes", pt: "curtidas-instagram",
    es: "likes-instagram", fr: "likes-instagram",
    de: "instagram-likes", it: "like-instagram",
    nl: "instagram-likes", ru: "lajki-instagram",
  },
  curtidas_tiktok: {
    en: "tiktok-likes", pt: "curtidas-tiktok",
    es: "likes-tiktok", fr: "likes-tiktok",
    de: "tiktok-likes", it: "like-tiktok",
    nl: "tiktok-likes", ru: "lajki-tiktok",
  },
  comentarios_instagram: {
    en: "instagram-comments", pt: "comentarios-instagram",
    es: "comentarios-instagram", fr: "commentaires-instagram",
    de: "instagram-kommentare", it: "commenti-instagram",
    nl: "instagram-reacties", ru: "kommentarii-instagram",
  },
  comentarios_tiktok: {
    en: "tiktok-comments", pt: "comentarios-tiktok",
    es: "comentarios-tiktok", fr: "commentaires-tiktok",
    de: "tiktok-kommentare", it: "commenti-tiktok",
    nl: "tiktok-reacties", ru: "kommentarii-tiktok",
  },
  compartilhamentos_instagram: {
    en: "instagram-shares", pt: "compartilhamentos-instagram",
    es: "compartidos-instagram", fr: "partages-instagram",
    de: "instagram-shares", it: "condivisioni-instagram",
    nl: "instagram-delen", ru: "reposty-instagram",
  },
  compartilhamentos_tiktok: {
    en: "tiktok-shares", pt: "compartilhamentos-tiktok",
    es: "compartidos-tiktok", fr: "partages-tiktok",
    de: "tiktok-shares", it: "condivisioni-tiktok",
    nl: "tiktok-delen", ru: "reposty-tiktok",
  },
  visualizacoes_instagram: {
    en: "instagram-views", pt: "visualizacoes-instagram",
    es: "visualizaciones-instagram", fr: "vues-instagram",
    de: "instagram-aufrufe", it: "visualizzazioni-instagram",
    nl: "instagram-weergaven", ru: "prosmotry-instagram",
  },
  visualizacoes_tiktok: {
    en: "tiktok-views", pt: "visualizacoes-tiktok",
    es: "visualizaciones-tiktok", fr: "vues-tiktok",
    de: "tiktok-aufrufe", it: "visualizzazioni-tiktok",
    nl: "tiktok-weergaven", ru: "prosmotry-tiktok",
  },
  servicos: {
    en: "services", pt: "servicos", es: "servicios", es_AR: "servicios",
    fr: "services", de: "services", it: "servizi", nl: "diensten",
    pl: "uslugi", sv: "tjanster", da: "tjenester", no: "tjenester",
    fi: "palvelut", is: "thjonusta", et: "teenused", lv: "pakalpojumi", lt: "paslaugos",
    cs: "sluzby", sk: "sluzby", hu: "szolgaltatasok", ro: "servicii",
    bg: "uslugi", el: "ipiresies", hr: "usluge", sl: "storitve", ca: "serveis",
    ru: "uslugi",
  },
  recuperacao_perfil: {
    en: "account-recovery", pt: "recuperacao-de-perfil",
    es: "recuperacion-de-cuenta", es_AR: "recuperacion-de-cuenta",
    fr: "recuperation-de-compte", de: "konto-wiederherstellung",
    it: "recupero-account", nl: "accountherstel",
    ru: "vosstanovlenie-akkaunta",
  },
};

// Resolve um slug recebido na URL → CategoryCode + idioma esperado.
// Faz a busca reversa em todos os idiomas para aceitar `seguidores` (pt) ou
// `followers` (en) na mesma roteamento.
export function categoryFromSlug(slug: string): CategoryCode | undefined {
  const s = slug.toLowerCase();
  for (const code of CATEGORY_CODES) {
    for (const lang of Object.keys(CATEGORY_SLUG[code]) as LangCode[]) {
      if (CATEGORY_SLUG[code][lang] === s) return code;
    }
  }
  return undefined;
}

export function categorySlug(code: CategoryCode, lang: LangCode): string {
  return CATEGORY_SLUG[code][lang] ?? CATEGORY_SLUG[code].en ?? code;
}

export function categoryLabel(code: CategoryCode, lang: LangCode): string {
  return CATEGORY_LABEL[code][lang] ?? CATEGORY_LABEL[code].en ?? code;
}

// Unit label SEM nome da plataforma — é só a primitiva ("followers", "likes",
// "comments", "shares", "views"). Usada para frases como "1,000 followers" ou
// "1,000 likes" no card de plano, onde a plataforma já está no nome do plano
// e adicioná-la de novo no sufixo fica redundante.
//
// `serviceUnit` é fallback para `servicos` (raramente usado — a UI esconde
// esse sufixo para serviços).
type Primitive = "followers" | "likes" | "comments" | "shares" | "views" | "service";

function primitiveOf(code: CategoryCode): Primitive {
  if (code === "servicos") return "service";
  if (code.startsWith("seguidores")) return "followers";
  if (code.startsWith("curtidas")) return "likes";
  if (code.startsWith("comentarios")) return "comments";
  if (code.startsWith("compartilhamentos")) return "shares";
  return "views";
}

const UNIT_BY_PRIMITIVE: Record<Primitive, Partial<Record<LangCode, string>>> = {
  followers: {
    en: "followers", pt: "seguidores", es: "seguidores", es_AR: "seguidores",
    fr: "abonnés", de: "Follower", it: "follower", nl: "volgers",
    ru: "подписчиков", ja: "フォロワー", ko: "팔로워", ar: "متابع",
    hi: "फॉलोअर्स", id: "pengikut", vi: "người theo dõi", th: "ผู้ติดตาม",
    tr: "takipçi", uk: "підписників",
  },
  likes: {
    en: "likes", pt: "curtidas", es: "likes", es_AR: "likes",
    fr: "likes", de: "Likes", it: "like", nl: "likes",
    ru: "лайков", ja: "いいね", ko: "좋아요", ar: "إعجاب",
    hi: "लाइक्स", id: "suka", vi: "lượt thích", th: "ไลก์",
    tr: "beğeni", uk: "лайків",
  },
  comments: {
    en: "comments", pt: "comentários", es: "comentarios", es_AR: "comentarios",
    fr: "commentaires", de: "Kommentare", it: "commenti", nl: "reacties",
    ru: "комментариев", ja: "コメント", ko: "댓글", ar: "تعليق",
    hi: "कमेंट्स", id: "komentar", vi: "bình luận", th: "คอมเมนต์",
    tr: "yorum", uk: "коментарів",
  },
  shares: {
    en: "shares", pt: "compartilhamentos", es: "compartidos", es_AR: "compartidos",
    fr: "partages", de: "Shares", it: "condivisioni", nl: "delen",
    ru: "репостов", ja: "シェア", ko: "공유", ar: "مشاركة",
    hi: "शेयर्स", id: "bagikan", vi: "chia sẻ", th: "แชร์",
    tr: "paylaşım", uk: "поширень",
  },
  views: {
    en: "views", pt: "visualizações", es: "visualizaciones", es_AR: "visualizaciones",
    fr: "vues", de: "Aufrufe", it: "visualizzazioni", nl: "weergaven",
    ru: "просмотров", ja: "再生", ko: "조회수", ar: "مشاهدة",
    hi: "व्यूज़", id: "tayangan", vi: "lượt xem", th: "ยอดดู",
    tr: "görüntüleme", uk: "переглядів",
  },
  service: {
    en: "service", pt: "serviço", es: "servicio", es_AR: "servicio",
    fr: "service", de: "Service", it: "servizio", nl: "dienst",
    ru: "услуга",
  },
};

// Unit label curto, sem plataforma — vira o sufixo na frase
// "1,000 <unit>" no card de plano. Cai no `en` quando o idioma não tem
// tradução dedicada.
export function categoryUnit(code: CategoryCode, lang: LangCode): string {
  const prim = primitiveOf(code);
  return UNIT_BY_PRIMITIVE[prim][lang] ?? UNIT_BY_PRIMITIVE[prim].en ?? prim;
}

// ---------- Cópia longa (500+ palavras) por categoria e idioma ----------
// As funções aceitam o nome do país para interpolar no texto e tornar cada
// página única o suficiente (variantes mercado-a-mercado). Estrutura:
//   `intro` (parágrafo 1) — gancho;
//   `body` (parágrafos 2–4) — proposta de valor, detalhes, dúvidas;
//   `faq` — 4–6 perguntas/respostas curtas (rich snippet).

export type LongCopy = {
  h1: (countryName: string) => string;
  metaTitle: (countryName: string) => string;
  metaDescription: (countryName: string) => string;
  paragraphs: (countryName: string) => string[]; // cada item vira <p>
  bullets: () => { title: string; body: string }[];
  faq: () => { q: string; a: string }[];
};

// -------- seguidores (en) --------
const COPY_SEGUIDORES_EN: LongCopy = {
  h1: (c) => `Buy Instagram & TikTok followers in ${c}`,
  metaTitle: (c) => `Buy Instagram & TikTok followers in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Buy real followers for Instagram and TikTok in ${c}. Fast delivery, refill guarantee, support in your language. Pay in USD, EUR or crypto.`,
  paragraphs: (c) => [
    `Building an audience from scratch in ${c} is hard. The algorithms behind Instagram and TikTok favor accounts that already look "alive" — accounts with a steady follower count, recurring likes and a baseline of views. New profiles get caught in a chicken-and-egg loop: nobody discovers you because you have no traction, and you have no traction because nobody discovers you. Buying a starter pack of followers is the most direct way to break that loop and put your content in front of a wider reach pool.`,
    `Viralefy ships followers that survive: high-quality profiles drip-fed at a natural pace so the platform never flags your account as buying. Every package is delivered with a refill guarantee — if anyone drops within 30 days we top your count back up at no cost. Our orders for ${c} start from 1 hour of payment confirmation and complete within 24 to 72 hours depending on the volume, with no need to share your password. All we ask is your public @ handle.`,
    `Compared with shady storefronts that drop thousands of bots overnight, Viralefy works in pacing windows that mimic organic growth. A 1,000-follower order is split across several hours; a 10,000-follower order runs over a couple of days. That pattern keeps your engagement ratio healthy and protects the reach you already earned. For creators in ${c} who rely on the algorithm to surface their content, that distinction is everything.`,
    `Pricing is transparent and flat per quantity. There are no subscriptions, no auto-renewals, no upsells in the checkout. You pay once for a package and we deliver it. Payment options cover bank transfer, card, Pix when available, and crypto (USDT, BTC). Receipts and invoices are emailed automatically and the full history stays inside your account so you can re-order with one click.`,
    `If you've never used a growth service before, the cheapest starter package is the safest way to test the waters. Pick a 100- or 250-follower bundle, watch how it lands, and only scale up once you're comfortable with what you see. The pages below let you pick from preset packages or use a slider to dial the exact quantity you want.`,
  ],
  bullets: () => [
    { title: "Real-looking profiles", body: "Followers with profile picture, bio and prior activity — not throwaway egg accounts." },
    { title: "Drip-feed pacing", body: "Deliveries are split over hours/days to mimic organic growth and avoid platform flags." },
    { title: "30-day refill", body: "If anyone unfollows within 30 days, we top your count back up automatically." },
    { title: "No password ever", body: "We only need your public @ handle. Never share your account password with any growth service." },
    { title: "Pay your way", body: "Card, bank transfer, Pix (where available) and crypto (USDT, BTC)." },
  ],
  faq: () => [
    { q: "Is buying followers safe for my Instagram or TikTok account?", a: "Yes, when it's done at a sane pace. Viralefy distributes the order over hours or days so the platform sees a natural growth curve. We never request your password — only your public handle." },
    { q: "How long does delivery take?", a: "Small orders (up to 500) usually finish within 6 hours. Larger orders are split across 24–72 hours to keep the pace natural." },
    { q: "Can I lose the followers later?", a: "Drops are possible on every platform. That's why Viralefy includes a 30-day refill guarantee — we top your count back up at no cost." },
    { q: "Do you need my password?", a: "Never. We never ask for credentials. If anyone offering a growth service asks for your password, walk away." },
    { q: "What payment methods are supported?", a: "Card, bank transfer, local rails (Pix in Brazil), and crypto (USDT and BTC). Invoices are emailed automatically." },
  ],
};

// -------- seguidores (pt) --------
const COPY_SEGUIDORES_PT: LongCopy = {
  h1: (c) => `Comprar seguidores para Instagram e TikTok em ${c}`,
  metaTitle: (c) => `Comprar seguidores para Instagram e TikTok em ${c} | Viralefy`,
  metaDescription: (c) =>
    `Compre seguidores reais para Instagram e TikTok em ${c}. Entrega rápida, garantia de reposição e suporte no seu idioma. Pague em real, USD, EUR ou cripto.`,
  paragraphs: (c) => [
    `Crescer do zero em ${c} é difícil. Os algoritmos do Instagram e do TikTok favorecem perfis que já parecem "vivos" — contas com base estável de seguidores, curtidas recorrentes e um mínimo de visualizações. Perfis novos caem num beco circular: ninguém te descobre porque você não tem tração, e você não ganha tração porque ninguém te descobre. Comprar um pacote inicial de seguidores é o caminho mais direto para sair desse ciclo e colocar seu conteúdo num pool de alcance maior.`,
    `A Viralefy entrega seguidores que ficam: perfis de alta qualidade, distribuídos em ritmo natural para que a plataforma nunca marque sua conta como compradora. Todo pacote vem com garantia de reposição — se alguém deixar de te seguir nos próximos 30 dias, repomos sem custo. Pedidos para ${c} começam em até 1 hora depois da confirmação do pagamento e finalizam em 24 a 72 horas, dependendo do volume, sem precisar da sua senha. Pedimos só o seu @ público.`,
    `Diferente das lojas duvidosas que jogam milhares de bots de uma vez, a Viralefy trabalha em janelas de pacing que imitam o crescimento orgânico. Um pedido de 1.000 seguidores é dividido ao longo de algumas horas; um de 10.000 roda durante dois dias. Esse padrão mantém sua proporção de engajamento saudável e protege o alcance que você já conquistou. Para criadores em ${c} que dependem do algoritmo para distribuir o conteúdo, essa diferença é tudo.`,
    `O preço é direto e fixo por quantidade. Não tem assinatura, não tem renovação automática, não tem upsell escondido no checkout. Você paga uma vez pelo pacote, a gente entrega. As formas de pagamento cobrem boleto, cartão, Pix (no Brasil) e cripto (USDT, BTC). Os recibos chegam automáticos no e-mail e o histórico fica salvo na sua conta para você refazer o pedido com um clique.`,
    `Se você nunca usou um serviço de crescimento, o pacote mais barato é a melhor forma de testar a água. Pegue um starter de 100 ou 250 seguidores, observe o resultado, e só escale quando estiver confortável com o que vê. Logo abaixo você escolhe entre pacotes pré-definidos ou usa o slider para definir a quantidade exata que quer.`,
  ],
  bullets: () => [
    { title: "Perfis com cara de gente", body: "Seguidores com foto, bio e atividade prévia — nada de contas vazias." },
    { title: "Entrega gradual", body: "Distribuído em horas/dias para imitar crescimento orgânico e evitar bandeiras da plataforma." },
    { title: "Reposição por 30 dias", body: "Se alguém te deixar de seguir nos primeiros 30 dias, repomos automaticamente." },
    { title: "Nunca pedimos senha", body: "Só precisamos do seu @ público. Nenhum serviço sério pede a sua senha." },
    { title: "Pague como quiser", body: "Cartão, Pix, boleto e cripto (USDT, BTC)." },
  ],
  faq: () => [
    { q: "É seguro comprar seguidores para o meu Instagram ou TikTok?", a: "Sim, quando feito em ritmo natural. A Viralefy distribui o pedido ao longo de horas ou dias para a plataforma ver uma curva orgânica. Nunca pedimos sua senha — só o seu @ público." },
    { q: "Quanto tempo leva a entrega?", a: "Pedidos pequenos (até 500) costumam terminar em até 6 horas. Pedidos maiores são divididos entre 24 e 72 horas para manter o ritmo natural." },
    { q: "Posso perder os seguidores depois?", a: "Quedas acontecem em qualquer plataforma. Por isso incluímos garantia de reposição por 30 dias — repomos sem custo." },
    { q: "Precisam da minha senha?", a: "Nunca. Não pedimos credencial nenhuma. Se alguém pedir, fuja correndo." },
    { q: "Quais pagamentos vocês aceitam?", a: "Cartão, Pix, boleto e cripto (USDT e BTC). O recibo chega automático no e-mail." },
  ],
};

// -------- seguidores (es) --------
const COPY_SEGUIDORES_ES: LongCopy = {
  h1: (c) => `Comprar seguidores para Instagram y TikTok en ${c}`,
  metaTitle: (c) => `Comprar seguidores para Instagram y TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Compra seguidores reales para Instagram y TikTok en ${c}. Entrega rápida, garantía de reposición y soporte en tu idioma. Paga en USD, EUR o cripto.`,
  paragraphs: (c) => [
    `Crecer desde cero en ${c} es duro. Los algoritmos de Instagram y TikTok favorecen a las cuentas que ya parecen "vivas" — perfiles con una base estable de seguidores, likes recurrentes y un mínimo de visualizaciones. Los perfiles nuevos caen en un círculo vicioso: nadie te descubre porque no tienes tracción y no tienes tracción porque nadie te descubre. Comprar un paquete inicial de seguidores es la forma más directa de romper ese círculo y meter tu contenido en una piscina de alcance mayor.`,
    `Viralefy entrega seguidores que se quedan: perfiles de alta calidad distribuidos a un ritmo natural para que la plataforma nunca marque tu cuenta como compradora. Cada paquete viene con garantía de reposición — si alguien deja de seguirte dentro de 30 días, reponemos sin coste. Los pedidos para ${c} arrancan en menos de 1 hora tras la confirmación del pago y terminan en 24 a 72 horas según el volumen, sin necesidad de compartir tu contraseña. Solo necesitamos tu @ público.`,
    `A diferencia de las tiendas dudosas que lanzan miles de bots de golpe, Viralefy trabaja en ventanas de pacing que imitan el crecimiento orgánico. Un pedido de 1.000 seguidores se reparte en varias horas; uno de 10.000 corre durante un par de días. Ese patrón mantiene tu ratio de engagement sano y protege el alcance que ya tienes. Para creadores en ${c} que dependen del algoritmo para difundir su contenido, esa diferencia lo es todo.`,
    `El precio es transparente y plano por cantidad. Sin suscripciones, sin renovaciones automáticas, sin upsells escondidos en el checkout. Pagas una vez por el paquete y lo entregamos. Las formas de pago cubren tarjeta, transferencia, y cripto (USDT, BTC). Los recibos llegan automáticos al correo y el historial queda guardado en tu cuenta para que repitas el pedido con un clic.`,
    `Si nunca usaste un servicio de crecimiento, el paquete más barato es la mejor forma de probar. Empieza con 100 o 250 seguidores, mira cómo cae, y solo escala cuando te sientas cómodo con lo que ves. Más abajo eliges entre paquetes preestablecidos o usas el deslizador para definir la cantidad exacta.`,
  ],
  bullets: () => [
    { title: "Perfiles con cara de personas", body: "Seguidores con foto, bio y actividad previa — nada de cuentas vacías." },
    { title: "Entrega gradual", body: "Distribuido en horas/días para imitar el crecimiento orgánico." },
    { title: "Reposición de 30 días", body: "Si alguien te deja de seguir en los primeros 30 días, reponemos automáticamente." },
    { title: "Nunca pedimos contraseña", body: "Solo necesitamos tu @ público." },
    { title: "Paga como quieras", body: "Tarjeta, transferencia y cripto (USDT, BTC)." },
  ],
  faq: () => [
    { q: "¿Es seguro comprar seguidores para mi Instagram o TikTok?", a: "Sí, si se hace a ritmo natural. Viralefy distribuye el pedido a lo largo de horas o días para que la plataforma vea una curva orgánica. Nunca pedimos tu contraseña." },
    { q: "¿Cuánto tarda la entrega?", a: "Pedidos pequeños (hasta 500) terminan en menos de 6 horas. Pedidos grandes se reparten en 24–72 horas." },
    { q: "¿Puedo perder los seguidores después?", a: "Las bajas son posibles. Por eso incluimos garantía de reposición de 30 días — reponemos sin coste." },
    { q: "¿Necesitan mi contraseña?", a: "Nunca. No pedimos credenciales. Si alguien te las pide, sospechá." },
    { q: "¿Qué pagos aceptan?", a: "Tarjeta, transferencia y cripto (USDT y BTC)." },
  ],
};

// -------- engajamento --------
const COPY_ENG_EN: LongCopy = {
  h1: (c) => `Buy likes & engagement for Instagram and TikTok in ${c}`,
  metaTitle: (c) => `Buy Instagram & TikTok likes in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Boost any post with real-looking likes and engagement in ${c}. Delivery starts from 1 hour, no password required.`,
  paragraphs: (c) => [
    `Likes are the first social proof a viewer sees. A post with 12 likes reads "amateur"; the same post with 1,200 reads "must be worth a look". The algorithm uses early engagement as one of the strongest ranking signals — a post that gets a strong like-to-impression ratio in the first hour gets pushed harder. That's the window where buying likes pays for itself in ${c}: you raise the floor of the early curve and let the algorithm do the rest.`,
    `Viralefy delivers likes from accounts that have profile pictures, posts and real-looking activity — not the throwaway profiles that platforms scrub during the next sweep. Every like is paced naturally over the first hour so the rise looks organic. If you pair it with a follower package the lift compounds: more followers means a wider impression pool, more likes means a higher CTR on those impressions, and the post climbs faster.`,
    `Engagement packs cover the whole spectrum from a starter 1,000-like boost up to full-stack campaigns with thousands of likes and saved comments per post. Pricing is flat per package — no per-post penalties, no minimum monthly volume. You buy a package, point it at a public URL, and we deliver. If a like drops in the first 30 days we top it back up. Posts in ${c} get priority routing to followers in the right time zone so the early curve falls during peak hours.`,
    `Engagement campaigns work for product launches, reel pushes, contest posts, and "first post of a new account" scenarios where landing well matters more than anything. They don't replace good content — but they do amplify it. A weak post with 10,000 likes is still a weak post; a strong post with 10,000 likes is a viral candidate. Pick the strongest content you have and back it with engagement, not the other way around.`,
    `Below you can pick from preset like packages or use the slider to set the exact volume you want. All deliveries are anonymous and never visible to your audience.`,
  ],
  bullets: () => [
    { title: "First-hour lift", body: "Likes land in the early curve where the algorithm weighs them most." },
    { title: "Real-looking profiles", body: "Active accounts with bio and posts — not the obvious throwaways." },
    { title: "Anonymous", body: "Deliveries are not visible to your audience or to platform automated checks." },
    { title: "30-day refill", body: "Any drop within 30 days is topped back up at no cost." },
    { title: "Compatible with followers", body: "Stack with a follower package for a compounded lift on the same post." },
  ],
  faq: () => [
    { q: "Will the platform detect bought likes?", a: "Likes are paced over the first hour to mimic organic growth. The accounts have profile pictures and activity, not empty-egg patterns." },
    { q: "Do you need the post URL?", a: "Yes — paste the public post or reel URL during checkout. Private posts cannot be reached." },
    { q: "Can I split a package across multiple posts?", a: "Each package targets one post. Run several orders to cover multiple posts." },
    { q: "How fast does delivery start?", a: "Most orders start from 1 hour of payment confirmation." },
  ],
};

const COPY_ENG_PT: LongCopy = {
  h1: (c) => `Comprar curtidas e engajamento em ${c}`,
  metaTitle: (c) => `Comprar curtidas para Instagram e TikTok em ${c} | Viralefy`,
  metaDescription: (c) =>
    `Impulsione qualquer post com curtidas e engajamento reais em ${c}. Início em 1 hora, sem senha.`,
  paragraphs: (c) => [
    `Curtida é a primeira prova social que o usuário vê. Um post com 12 curtidas lê "amador"; o mesmo post com 1.200 lê "deve valer a pena olhar". O algoritmo usa o engajamento inicial como um dos sinais mais fortes de ranqueamento — um post com uma razão curtida/impressão alta na primeira hora ganha empurrão. Essa é a janela em que comprar curtidas em ${c} se paga: você levanta o piso da curva inicial e deixa o algoritmo fazer o resto.`,
    `A Viralefy entrega curtidas vindas de contas com foto, posts e atividade real — não os perfis descartáveis que as plataformas limpam na próxima varredura. Cada curtida é distribuída de forma natural ao longo da primeira hora para a subida parecer orgânica. Combinado com um pacote de seguidores o efeito compõe: mais seguidores = pool de impressões maior, mais curtidas = CTR maior sobre essas impressões, e o post sobe mais rápido.`,
    `Os pacotes de engajamento cobrem todo o espectro, do starter de 1.000 curtidas até campanhas full-stack com milhares de curtidas e comentários por post. Preço fixo por pacote — sem penalidade por post, sem volume mínimo mensal. Você compra um pacote, aponta para uma URL pública, e a gente entrega. Se uma curtida cair nos primeiros 30 dias, repomos. Posts em ${c} têm prioridade de roteamento para perfis no fuso certo, fazendo a curva inicial cair no horário de pico.`,
    `Campanhas de engajamento funcionam para lançamento de produto, push de reels, post de sorteio, e cenários "primeiro post da conta nova" em que cair bem é tudo. Não substituem conteúdo bom — mas amplificam. Um post fraco com 10.000 curtidas continua sendo fraco; um post forte com 10.000 curtidas é candidato a viralizar. Coloque seu melhor conteúdo embaixo da campanha, não o pior.`,
    `Abaixo dá pra escolher entre pacotes pré-definidos ou usar o slider para definir o volume exato. Toda entrega é anônima e invisível pra sua audiência.`,
  ],
  bullets: () => [
    { title: "Empurrão na primeira hora", body: "As curtidas caem na curva inicial onde o algoritmo dá mais peso." },
    { title: "Perfis com cara de gente", body: "Contas ativas com bio e posts — nada de descartáveis óbvios." },
    { title: "Anônimo", body: "A entrega não é visível para a sua audiência nem para checagens automáticas." },
    { title: "Reposição por 30 dias", body: "Qualquer queda nos primeiros 30 dias é reposta sem custo." },
    { title: "Combina com seguidores", body: "Empilhe com pacote de seguidores para empurrar o mesmo post duas vezes." },
  ],
  faq: () => [
    { q: "A plataforma vai detectar?", a: "As curtidas caem ao longo da primeira hora para imitar orgânico. As contas têm foto e atividade, não são perfis vazios." },
    { q: "Vocês precisam da URL do post?", a: "Sim — cole a URL pública do post ou reel no checkout. Posts privados não são alcançáveis." },
    { q: "Posso dividir o pacote em vários posts?", a: "Cada pacote mira um post. Faça vários pedidos pra cobrir vários posts." },
    { q: "Em quanto tempo começa?", a: "A maioria dos pedidos começa em até 1 hora após confirmar o pagamento." },
  ],
};

const COPY_ENG_ES: LongCopy = {
  h1: (c) => `Comprar likes e interacciones para Instagram y TikTok en ${c}`,
  metaTitle: (c) => `Comprar likes para Instagram y TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Impulsa cualquier publicación con likes reales en ${c}. Comienzo en 1 hora, sin contraseña.`,
  paragraphs: (c) => [
    `Los likes son la primera prueba social. Un post con 12 likes parece amateur; el mismo post con 1.200 parece "vale la pena verlo". El algoritmo usa el engagement inicial como una de las señales más fuertes — un post con buena ratio like/impresión en la primera hora se empuja más. Esa es la ventana en que comprar likes en ${c} se paga: levantas el piso de la curva inicial y dejas que el algoritmo haga el resto.`,
    `Viralefy entrega likes desde cuentas con foto, posts y actividad real — no los perfiles desechables que las plataformas limpian en la siguiente barrida. Cada like se distribuye de forma natural a lo largo de la primera hora para que la subida parezca orgánica. Combinado con un paquete de seguidores el efecto se compone.`,
    `Los paquetes cubren todo el espectro, desde un starter de 1.000 likes hasta campañas full-stack con miles de likes y comentarios por post. Precio fijo por paquete — sin penalización por post, sin volumen mínimo. Pagas, apuntas a una URL pública, entregamos. Si un like cae en los primeros 30 días, lo reponemos.`,
    `Las campañas de engagement funcionan para lanzamientos de producto, push de reels, sorteos y "primer post de cuenta nueva" donde aterrizar bien lo es todo. No reemplazan al buen contenido — lo amplifican. Pon tu mejor contenido detrás de la campaña.`,
    `Abajo eliges entre paquetes preestablecidos o usas el deslizador para fijar el volumen exacto. Cada entrega es anónima e invisible para tu audiencia.`,
  ],
  bullets: () => [
    { title: "Empuje en la primera hora", body: "Los likes caen en la curva inicial donde el algoritmo pesa más." },
    { title: "Perfiles reales", body: "Cuentas activas con bio y posts." },
    { title: "Anónimo", body: "La entrega no es visible para tu audiencia." },
    { title: "Reposición de 30 días", body: "Cualquier baja dentro de 30 días se repone gratis." },
    { title: "Combina con seguidores", body: "Apila con un paquete de seguidores para empujar el mismo post dos veces." },
  ],
  faq: () => [
    { q: "¿La plataforma detecta likes comprados?", a: "Los likes caen a lo largo de la primera hora para imitar lo orgánico. Las cuentas tienen foto y actividad." },
    { q: "¿Necesitan la URL del post?", a: "Sí — pega la URL pública del post o reel en el checkout." },
    { q: "¿Puedo repartir el paquete entre varios posts?", a: "Cada paquete apunta a un post. Haz varios pedidos para cubrir varios posts." },
    { q: "¿Cuánto tarda en empezar?", a: "La mayoría arranca en menos de 1 hora." },
  ],
};

// -------- visualizações --------
const COPY_VIEWS_EN: LongCopy = {
  h1: (c) => `Buy Reels, TikTok and Story views in ${c}`,
  metaTitle: (c) => `Buy Instagram & TikTok views in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Boost any video with real-looking views in ${c}. Reels, TikTok and Stories. Delivery starts from 1 hour.`,
  paragraphs: (c) => [
    `View count is the headline metric for any short-form video. A reel sitting at 320 views looks dead; the same reel at 32,000 looks like it's catching fire. Viewers in ${c} use that number as a heuristic to decide whether to watch — and the algorithm uses it as a ranking signal to decide whether to push the video further. Buying views is the cheapest way to raise that baseline.`,
    `Viralefy delivers views that count for the algorithm: full-watch impressions from accounts that have real activity, paced so the rise mirrors organic discovery. Stories views are non-public to your followers; Reels views are public and add directly to the count displayed on your profile. Both work the same way for the algorithm.`,
    `View packs scale from 10k all the way up to 1M+ per video. Pricing is per package and lower than a TikTok or Instagram ad campaign with the same impression count — and the views you get from a paid ad disappear from the public view counter the moment the campaign ends. View campaigns from Viralefy stick.`,
    `For creators in ${c} who post several videos a week, running a small view boost on each new upload is a low-friction way to feed the algorithm the early signal it needs. The 30-day refill applies here too — if views drop they're replaced.`,
    `Pick a preset below or define the exact view count you want with the slider.`,
  ],
  bullets: () => [
    { title: "Counted by the algorithm", body: "Full-watch impressions, not 1-second skips." },
    { title: "Reels & Stories", body: "Works for any short-form format." },
    { title: "Stays on the counter", body: "Unlike paid ads, the count doesn't disappear when the campaign ends." },
    { title: "30-day refill", body: "Any drop within 30 days is replenished." },
    { title: "Per-video pricing", body: "Flat price per package. No subscription." },
  ],
  faq: () => [
    { q: "Do bought views count for monetization?", a: "Views from Viralefy add to your public counter but do not directly contribute to monetization criteria like Reels Bonus eligibility — the platform measures those separately." },
    { q: "How long do views take to arrive?", a: "Small orders (up to 10k) finish in 1–3 hours. Large orders are spread across 24h to keep the curve natural." },
    { q: "Can I buy views for a Story?", a: "Yes — Story views are supported, but only while the Story is live (24h window)." },
    { q: "Will my video reach a wider audience as a result?", a: "Views raise the ranking signal in the algorithm. Whether the video then reaches further depends on watch-time and like ratio." },
  ],
};

const COPY_VIEWS_PT: LongCopy = {
  h1: (c) => `Comprar visualizações de Reels, TikTok e Stories em ${c}`,
  metaTitle: (c) => `Comprar visualizações para Instagram e TikTok em ${c} | Viralefy`,
  metaDescription: (c) =>
    `Impulsione qualquer vídeo com visualizações reais em ${c}. Reels, TikTok e Stories. Início em 1 hora.`,
  paragraphs: (c) => [
    `Visualização é a métrica de manchete de qualquer vídeo curto. Um reel parado em 320 views parece morto; o mesmo reel em 32.000 parece estar pegando fogo. Os espectadores em ${c} usam esse número como heurística pra decidir se assistem — e o algoritmo usa como sinal de ranqueamento pra decidir se empurra o vídeo mais longe. Comprar views é a forma mais barata de subir essa linha de base.`,
    `A Viralefy entrega views que contam para o algoritmo: impressões de assistência completa, vindas de contas com atividade real, distribuídas para a curva imitar descoberta orgânica. Views de Story não aparecem para sua audiência; views de Reels aparecem no contador público. Os dois funcionam igual para o algoritmo.`,
    `Os pacotes vão de 10 mil até 1 milhão+ por vídeo. O preço por pacote é mais baixo que uma campanha de ads no TikTok ou Instagram com o mesmo número de impressões — e as views vindas de anúncio somem do contador público quando a campanha acaba. As views da Viralefy ficam.`,
    `Pra criadores em ${c} que postam vários vídeos por semana, rodar um pequeno boost de views em cada upload novo é uma forma de baixo atrito de alimentar o algoritmo com o sinal inicial que ele precisa. A reposição de 30 dias vale aqui também.`,
    `Escolhe um pacote pronto abaixo ou define a quantidade exata com o slider.`,
  ],
  bullets: () => [
    { title: "Contam pro algoritmo", body: "Impressões de assistência completa, não pulos de 1 segundo." },
    { title: "Reels e Stories", body: "Funciona pra qualquer formato curto." },
    { title: "Ficam no contador", body: "Diferente de ads, a contagem não some quando acaba." },
    { title: "Reposição por 30 dias", body: "Quedas em 30 dias são repostas." },
    { title: "Preço por vídeo", body: "Pacote fixo. Sem assinatura." },
  ],
  faq: () => [
    { q: "Views compradas contam pra monetização?", a: "Somam no contador público mas não contam diretamente pros critérios de monetização como Reels Bonus — a plataforma mede isso à parte." },
    { q: "Quanto demora a entrega?", a: "Pedidos pequenos (até 10k) terminam em 1–3 horas. Pedidos grandes correm em 24h." },
    { q: "Posso comprar views pra Story?", a: "Sim — Stories são suportados, mas só enquanto o Story está no ar (janela de 24h)." },
    { q: "Meu vídeo vai alcançar mais gente?", a: "As views sobem o sinal no algoritmo. Se o vídeo vai mais longe depois disso depende do tempo de visualização e da razão de curtidas." },
  ],
};

const COPY_VIEWS_ES: LongCopy = {
  h1: (c) => `Comprar visualizaciones de Reels, TikTok y Stories en ${c}`,
  metaTitle: (c) => `Comprar visualizaciones para Instagram y TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Impulsa cualquier vídeo con visualizaciones reales en ${c}. Reels, TikTok y Stories. Inicio en 1 hora.`,
  paragraphs: (c) => [
    `La cantidad de vistas es la métrica titular de cualquier vídeo corto. Un reel con 320 vistas parece muerto; el mismo reel con 32.000 parece estar despegando. Los espectadores en ${c} usan ese número como heurística para decidir si miran — y el algoritmo lo usa como señal de ranking para decidir si empuja el vídeo más lejos.`,
    `Viralefy entrega vistas que cuentan para el algoritmo: impresiones de visualización completa desde cuentas con actividad real, distribuidas para que la curva parezca orgánica. Las vistas de Stories no son públicas para tu audiencia; las vistas de Reels son públicas y se suman al contador del perfil.`,
    `Los paquetes van desde 10k hasta 1M+ por vídeo. El precio por paquete es menor que una campaña de ads con el mismo número de impresiones — y las vistas de ads desaparecen cuando termina la campaña. Las de Viralefy se quedan.`,
    `Para creadores en ${c} que postean varios vídeos por semana, correr un pequeño boost de vistas en cada upload nuevo es una forma de baja fricción de alimentar al algoritmo. La reposición de 30 días aplica aquí también.`,
    `Elige un paquete preestablecido abajo o define la cantidad exacta con el deslizador.`,
  ],
  bullets: () => [
    { title: "Cuentan para el algoritmo", body: "Impresiones de visualización completa." },
    { title: "Reels y Stories", body: "Funciona para todo formato corto." },
    { title: "Quedan en el contador", body: "A diferencia de ads, el conteo no se borra." },
    { title: "Reposición de 30 días", body: "Las bajas se reponen." },
    { title: "Precio por vídeo", body: "Paquete fijo. Sin suscripción." },
  ],
  faq: () => [
    { q: "¿Las vistas compradas cuentan para monetización?", a: "Suman al contador público pero no cuentan directamente para criterios de monetización como Reels Bonus." },
    { q: "¿Cuánto tarda la entrega?", a: "Pedidos pequeños (hasta 10k) terminan en 1–3 horas. Grandes en 24h." },
    { q: "¿Vistas para Story?", a: "Sí, pero solo mientras la Story esté activa (24h)." },
    { q: "¿Mi vídeo llegará más lejos?", a: "Las vistas suben la señal del algoritmo. El alcance posterior depende del watch-time y la ratio de likes." },
  ],
};

// -------- serviços premium --------
const COPY_SERV_EN: LongCopy = {
  h1: (c) => `Premium growth services for Instagram & TikTok in ${c}`,
  metaTitle: (c) => `Premium social media management in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Hands-on growth, content strategy and account management for serious creators in ${c}.`,
  paragraphs: (c) => [
    `Premium services are for creators in ${c} who want more than a one-shot follower boost — for accounts that are building a brand and need a continuous strategy. Each retainer covers content planning, performance reviews, hashtag research, posting cadence, and monthly engagement budgets baked in.`,
    `The team works one-on-one with each retained account. We start with an audit of the current numbers (reach, engagement rate, follower demographics, posting cadence), set a 90-day target, and design the content calendar to hit it. Where it makes sense we layer in Viralefy follower and engagement packs to accelerate the curve.`,
    `Pricing is monthly — no long-term lock-in. Cancel anytime with one click from your account. Reports land on the first of every month with the actual numbers, what worked, what didn't, and the plan for the next 30 days.`,
    `If you're considering a premium retainer for a serious project in ${c}, message support before checkout — we'll run a short discovery call to make sure we're the right fit before either side spends a cent.`,
    `For everything else, the self-serve follower, like and view packs already cover the most common needs.`,
  ],
  bullets: () => [
    { title: "Monthly strategy", body: "Content calendar, posting cadence, hashtag research." },
    { title: "Monthly reports", body: "Numbers, what worked, what didn't, plan for next 30 days." },
    { title: "Engagement budget", body: "Follower and engagement packs baked in." },
    { title: "Cancel anytime", body: "No long-term lock-in." },
    { title: "Real account manager", body: "One human owns your account, in your language." },
  ],
  faq: () => [
    { q: "Is this for personal or business accounts?", a: "Both. We work with creators, brands and small businesses." },
    { q: "What's the commitment?", a: "Monthly. Cancel any time." },
    { q: "Do I need to give up account access?", a: "No. We coordinate posting with you. We never log into your account." },
    { q: "How do I start?", a: "Message support before checkout — we run a short discovery call first." },
  ],
};

const COPY_SERV_PT: LongCopy = {
  h1: (c) => `Serviços premium de crescimento em ${c}`,
  metaTitle: (c) => `Gestão premium para Instagram e TikTok em ${c} | Viralefy`,
  metaDescription: (c) =>
    `Gestão hands-on, estratégia de conteúdo e crescimento para criadores sérios em ${c}.`,
  paragraphs: (c) => [
    `Serviços premium são pra criadores em ${c} que querem mais que um boost pontual — pra contas que estão construindo uma marca e precisam de estratégia contínua. Cada retainer cobre planejamento de conteúdo, revisões de performance, pesquisa de hashtag, cadência de postagem, e orçamento de engajamento embutido.`,
    `O time trabalha 1-a-1 com cada conta retida. Começamos com auditoria dos números atuais (alcance, taxa de engajamento, demografia, cadência), definimos meta de 90 dias, e desenhamos o calendário pra bater. Onde faz sentido, encaixamos pacotes de seguidores e engajamento da própria Viralefy pra acelerar.`,
    `Cobrança mensal — sem lock-in. Cancela a qualquer momento com um clique pela conta. Relatório cai no primeiro dia de cada mês com os números reais, o que funcionou, o que não, e o plano dos próximos 30 dias.`,
    `Se você tá pensando num retainer premium pra um projeto sério em ${c}, manda mensagem pro suporte antes do checkout — fazemos uma call curta de descoberta pra garantir o encaixe antes de qualquer lado gastar um centavo.`,
    `Pra tudo o mais, os pacotes self-serve de seguidores, curtidas e views já cobrem as necessidades mais comuns.`,
  ],
  bullets: () => [
    { title: "Estratégia mensal", body: "Calendário de conteúdo, cadência, pesquisa de hashtag." },
    { title: "Relatório mensal", body: "Os números reais, plano dos próximos 30 dias." },
    { title: "Orçamento de engajamento", body: "Pacotes de seguidores e engajamento embutidos." },
    { title: "Cancele quando quiser", body: "Sem lock-in." },
    { title: "Gerente humano", body: "Uma pessoa cuida da sua conta, no seu idioma." },
  ],
  faq: () => [
    { q: "Pra conta pessoal ou empresa?", a: "Os dois. A gente atende criador, marca e pequena empresa." },
    { q: "Qual o compromisso?", a: "Mensal. Cancela quando quiser." },
    { q: "Preciso entregar a senha?", a: "Não. A gente coordena postagem com você. Nunca logamos na conta." },
    { q: "Como começo?", a: "Fala com o suporte antes do checkout — fazemos uma call curta primeiro." },
  ],
};

const COPY_SERV_ES: LongCopy = {
  h1: (c) => `Servicios premium de crecimiento en ${c}`,
  metaTitle: (c) => `Gestión premium para Instagram y TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Gestión hands-on, estrategia de contenido y crecimiento para creadores serios en ${c}.`,
  paragraphs: (c) => [
    `Los servicios premium son para creadores en ${c} que quieren más que un impulso puntual — para cuentas que están construyendo una marca y necesitan estrategia continua.`,
    `El equipo trabaja uno-a-uno con cada cuenta. Empezamos con auditoría de los números actuales, definimos una meta de 90 días y diseñamos el calendario de contenido.`,
    `Cobro mensual sin lock-in. Cancela en cualquier momento. Informe el primer día de cada mes.`,
    `Si estás considerando un retainer premium, manda mensaje al soporte antes del checkout para una llamada de descubrimiento.`,
    `Para todo lo demás, los paquetes self-serve cubren las necesidades comunes.`,
  ],
  bullets: () => [
    { title: "Estrategia mensual", body: "Calendario, cadencia, hashtags." },
    { title: "Informe mensual", body: "Los números, plan próximos 30 días." },
    { title: "Presupuesto incluido", body: "Paquetes embebidos." },
    { title: "Cancela cuando quieras", body: "Sin lock-in." },
    { title: "Gerente humano", body: "Una persona, en tu idioma." },
  ],
  faq: () => [
    { q: "¿Personal o empresa?", a: "Ambos." },
    { q: "¿Compromiso?", a: "Mensual." },
    { q: "¿Necesitan mi contraseña?", a: "No." },
    { q: "¿Cómo empiezo?", a: "Mensaje al soporte primero." },
  ],
};

// -------- seguidores (fr) --------
const COPY_SEGUIDORES_FR: LongCopy = {
  h1: (c) => `Acheter des abonnés Instagram et TikTok en ${c}`,
  metaTitle: (c) => `Acheter des abonnés Instagram et TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Achetez de vrais abonnés Instagram et TikTok en ${c}. Livraison rapide, garantie de recharge, support dans votre langue. Paiement en EUR, USD ou crypto.`,
  paragraphs: (c) => [
    `Construire une audience à partir de zéro en ${c} relève du parcours du combattant. Les algorithmes d'Instagram et de TikTok privilégient les comptes qui ont déjà l'air "vivants" — des profils avec un socle stable d'abonnés, des likes récurrents et un minimum de vues. Les nouveaux comptes sont pris dans une boucle absurde : personne ne vous découvre parce que vous n'avez pas de traction, et vous n'avez pas de traction parce que personne ne vous découvre. Acheter un pack de démarrage d'abonnés est la manière la plus directe de briser ce cercle et de pousser votre contenu dans une zone de portée plus large.`,
    `Viralefy livre des abonnés qui restent : des profils de qualité diffusés à un rythme naturel pour que la plateforme ne signale jamais votre compte comme acheteur. Chaque pack est livré avec une garantie de recharge — si quelqu'un se désabonne dans les 30 jours, nous rétablissons votre compteur sans frais. Les commandes pour ${c} démarrent dans l'heure qui suivent la confirmation du paiement et se terminent en 24 à 72 heures selon le volume, sans jamais avoir à partager votre mot de passe. Nous ne demandons que votre @ public.`,
    `Contrairement aux boutiques douteuses qui lâchent des milliers de bots d'un coup, Viralefy travaille en fenêtres de diffusion qui imitent la croissance organique. Une commande de 1 000 abonnés est répartie sur plusieurs heures ; une commande de 10 000 s'étale sur deux jours. Ce schéma maintient votre ratio d'engagement en bonne santé et protège la portée que vous avez déjà gagnée. Pour les créateurs en ${c} qui dépendent de l'algorithme pour diffuser leur contenu, cette distinction fait toute la différence.`,
    `La tarification est transparente et forfaitaire selon la quantité. Pas d'abonnement, pas de renouvellement automatique, pas de vente additionnelle cachée dans le tunnel d'achat. Vous payez une fois pour le pack, nous livrons. Les moyens de paiement couvrent la carte bancaire, le virement, et les cryptos (USDT, BTC). Les reçus arrivent automatiquement par e-mail et l'historique reste enregistré dans votre compte pour que vous puissiez relancer une commande en un clic.`,
    `Si vous n'avez jamais utilisé de service de croissance, le pack le moins cher reste la meilleure façon de tester. Prenez un starter de 100 ou 250 abonnés, observez comment ça se passe, et ne montez en puissance que lorsque vous êtes à l'aise avec ce que vous voyez. Plus bas, vous choisissez entre des packs préconfigurés ou utilisez le curseur pour définir la quantité exacte que vous voulez.`,
  ],
  bullets: () => [
    { title: "Profils crédibles", body: "Abonnés avec photo, bio et activité antérieure — pas de comptes jetables vides." },
    { title: "Diffusion progressive", body: "Livraison étalée sur des heures ou des jours pour imiter une croissance organique." },
    { title: "Recharge 30 jours", body: "Si quelqu'un se désabonne dans les 30 jours, nous rechargeons automatiquement." },
    { title: "Aucun mot de passe", body: "Nous n'avons besoin que de votre @ public. Aucun service sérieux ne demande votre mot de passe." },
    { title: "Paiement flexible", body: "Carte, virement et crypto (USDT, BTC)." },
  ],
  faq: () => [
    { q: "Est-ce risqué d'acheter des abonnés pour mon compte Instagram ou TikTok ?", a: "Non, tant que c'est fait à un rythme raisonnable. Viralefy répartit la commande sur des heures ou des jours pour que la plateforme voie une courbe naturelle. Nous ne demandons jamais votre mot de passe — uniquement votre @ public." },
    { q: "Combien de temps prend la livraison ?", a: "Les petites commandes (jusqu'à 500) se terminent généralement en 6 heures. Les grosses commandes sont réparties sur 24 à 72 heures pour préserver le rythme naturel." },
    { q: "Puis-je perdre des abonnés par la suite ?", a: "Des chutes sont possibles sur toutes les plateformes. C'est pour cela que Viralefy inclut une garantie de recharge de 30 jours — nous rétablissons votre compteur sans frais." },
    { q: "Avez-vous besoin de mon mot de passe ?", a: "Jamais. Nous ne demandons aucun identifiant. Si un prestataire vous demande votre mot de passe, fuyez." },
    { q: "Quels moyens de paiement sont acceptés ?", a: "Carte bancaire, virement et crypto (USDT et BTC). Les factures sont envoyées automatiquement par e-mail." },
  ],
};

// -------- seguidores (de) --------
const COPY_SEGUIDORES_DE: LongCopy = {
  h1: (c) => `Instagram- und TikTok-Follower in ${c} kaufen`,
  metaTitle: (c) => `Instagram- und TikTok-Follower in ${c} kaufen | Viralefy`,
  metaDescription: (c) =>
    `Kaufen Sie echte Follower für Instagram und TikTok in ${c}. Schnelle Lieferung, Nachfüll-Garantie und Support in Ihrer Sprache. Bezahlung in EUR, USD oder Krypto.`,
  paragraphs: (c) => [
    `Eine Reichweite in ${c} von null aufzubauen ist hart. Die Algorithmen von Instagram und TikTok bevorzugen Accounts, die bereits „lebendig" wirken — Profile mit einer stabilen Follower-Basis, wiederkehrenden Likes und einer Grundlast an Aufrufen. Neue Profile geraten in eine klassische Henne-Ei-Schleife: niemand entdeckt dich, weil du keinen Traction hast, und du bekommst keinen Traction, weil dich niemand entdeckt. Ein Starter-Paket Follower zu kaufen ist der direkteste Weg, diese Schleife zu durchbrechen und deine Inhalte in einen größeren Reichweiten-Pool zu schieben.`,
    `Viralefy liefert Follower, die bleiben: hochwertige Profile, die in einem natürlichen Tempo zugeführt werden, damit die Plattform deinen Account niemals als Käufer markiert. Jedes Paket kommt mit einer Nachfüll-Garantie — falls innerhalb von 30 Tagen jemand entfolgt, füllen wir deinen Zähler kostenfrei wieder auf. Bestellungen für ${c} starten innerhalb von 30 Minuten nach Zahlungsbestätigung und sind je nach Volumen in 24 bis 72 Stunden abgeschlossen — ohne dass du dein Passwort herausgeben musst. Wir brauchen nur deinen öffentlichen @-Handle.`,
    `Anders als die zwielichtigen Shops, die über Nacht Tausende Bots ablegen, arbeitet Viralefy in Pacing-Fenstern, die organisches Wachstum nachahmen. Eine Bestellung über 1 000 Follower wird auf mehrere Stunden verteilt; eine Bestellung über 10 000 läuft über zwei Tage. Dieses Muster hält dein Engagement-Verhältnis gesund und schützt die Reichweite, die du bereits aufgebaut hast. Für Creator in ${c}, die auf den Algorithmus angewiesen sind, um ihre Inhalte zu verteilen, ist genau dieser Unterschied entscheidend.`,
    `Die Preisgestaltung ist transparent und pauschal pro Menge. Keine Abos, keine automatischen Verlängerungen, keine versteckten Upsells im Checkout. Du zahlst einmal für ein Paket und wir liefern. Die Zahlungsmittel umfassen Karte, Banküberweisung und Krypto (USDT, BTC). Belege werden automatisch per E-Mail verschickt und die komplette Historie bleibt in deinem Konto gespeichert, damit du Bestellungen mit einem Klick wiederholen kannst.`,
    `Wenn du noch nie einen Growth-Service genutzt hast, ist das günstigste Starter-Paket der sicherste Weg, das Wasser zu testen. Nimm einen 100er- oder 250er-Pack, beobachte das Verhalten und skaliere erst dann hoch, wenn du dich mit dem Ergebnis wohlfühlst. Unten kannst du aus voreingestellten Paketen wählen oder den Slider nutzen, um die exakte Menge festzulegen.`,
  ],
  bullets: () => [
    { title: "Realistische Profile", body: "Follower mit Profilbild, Bio und vorheriger Aktivität — keine leeren Wegwerf-Accounts." },
    { title: "Drip-Feed-Tempo", body: "Lieferung über Stunden oder Tage verteilt, um organisches Wachstum nachzuahmen." },
    { title: "30-Tage-Nachfüllung", body: "Wer innerhalb von 30 Tagen entfolgt, wird automatisch ersetzt." },
    { title: "Niemals Passwort", body: "Wir benötigen nur deinen öffentlichen @-Handle. Kein seriöser Anbieter fragt nach deinem Passwort." },
    { title: "Flexible Zahlung", body: "Karte, Überweisung und Krypto (USDT, BTC)." },
  ],
  faq: () => [
    { q: "Ist es sicher, Follower für meinen Instagram- oder TikTok-Account zu kaufen?", a: "Ja, solange es in einem gesunden Tempo geschieht. Viralefy verteilt die Bestellung über Stunden oder Tage, damit die Plattform eine natürliche Kurve sieht. Wir fragen niemals nach deinem Passwort — nur nach deinem öffentlichen Handle." },
    { q: "Wie lange dauert die Lieferung?", a: "Kleine Bestellungen (bis 500) sind in der Regel innerhalb von 6 Stunden abgeschlossen. Größere Bestellungen werden über 24 bis 72 Stunden gestreckt, um das Tempo natürlich zu halten." },
    { q: "Kann ich Follower später wieder verlieren?", a: "Drops sind auf jeder Plattform möglich. Deshalb beinhaltet Viralefy eine Nachfüll-Garantie von 30 Tagen — wir füllen auf eigene Kosten nach." },
    { q: "Braucht ihr mein Passwort?", a: "Nie. Wir fragen keinerlei Zugangsdaten ab. Wenn dich ein Growth-Anbieter nach deinem Passwort fragt, breche ab." },
    { q: "Welche Zahlungsmethoden werden unterstützt?", a: "Karte, Banküberweisung und Krypto (USDT und BTC). Rechnungen werden automatisch per E-Mail versendet." },
  ],
};

// -------- seguidores (it) --------
const COPY_SEGUIDORES_IT: LongCopy = {
  h1: (c) => `Comprare follower Instagram e TikTok in ${c}`,
  metaTitle: (c) => `Comprare follower Instagram e TikTok in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Compra follower veri per Instagram e TikTok in ${c}. Consegna rapida, garanzia di ripristino e supporto nella tua lingua. Paga in EUR, USD o cripto.`,
  paragraphs: (c) => [
    `Far crescere un pubblico da zero in ${c} è dura. Gli algoritmi di Instagram e TikTok premiano i profili che sembrano già "vivi" — account con una base stabile di follower, like ricorrenti e un minimo di visualizzazioni. I profili nuovi finiscono in un loop circolare: nessuno ti scopre perché non hai trazione, e non hai trazione perché nessuno ti scopre. Comprare un pacchetto iniziale di follower è il modo più diretto di rompere quel cerchio e mettere i tuoi contenuti in un bacino di reach più ampio.`,
    `Viralefy consegna follower che restano: profili di alta qualità distribuiti a ritmo naturale così la piattaforma non segnala mai il tuo account come acquirente. Ogni pacchetto è coperto da garanzia di ripristino — se qualcuno smette di seguirti entro 30 giorni, ripristiniamo il conteggio senza costi. Gli ordini per ${c} partono entro 1 ora dalla conferma del pagamento e si concludono in 24-72 ore in base al volume, senza che tu debba condividere la tua password. Ci serve solo la tua @ pubblica.`,
    `A differenza dei negozi loschi che scaricano migliaia di bot in una sola volta, Viralefy lavora con finestre di pacing che imitano la crescita organica. Un ordine da 1.000 follower viene spalmato su diverse ore; uno da 10.000 gira per un paio di giorni. Questo schema mantiene sano il tuo rapporto di engagement e protegge la reach che hai già conquistato. Per i creator in ${c} che si affidano all'algoritmo per distribuire i contenuti, quella distinzione è tutto.`,
    `Il prezzo è trasparente e a forfait per quantità. Niente abbonamenti, niente rinnovi automatici, niente upsell nascosti al checkout. Paghi una volta per il pacchetto e noi consegniamo. I metodi di pagamento coprono carta, bonifico e cripto (USDT, BTC). Le ricevute arrivano in automatico via e-mail e lo storico resta dentro il tuo account così puoi ripetere l'ordine con un click.`,
    `Se non hai mai usato un servizio di crescita, il pacchetto più economico è il modo più sicuro per testare. Prendi un starter da 100 o 250 follower, osserva come va e scala solo quando ti senti a tuo agio con ciò che vedi. Più sotto puoi scegliere tra pacchetti preconfigurati o usare lo slider per fissare la quantità esatta.`,
  ],
  bullets: () => [
    { title: "Profili credibili", body: "Follower con foto, bio e attività pregressa — niente account vuoti usa-e-getta." },
    { title: "Distribuzione graduale", body: "Consegna spalmata su ore o giorni per imitare crescita organica." },
    { title: "Ripristino 30 giorni", body: "Se qualcuno smette di seguirti nei primi 30 giorni, ripristiniamo automaticamente." },
    { title: "Mai la password", body: "Ci serve solo la tua @ pubblica. Nessun servizio serio chiede la password." },
    { title: "Pagamento flessibile", body: "Carta, bonifico e cripto (USDT, BTC)." },
  ],
  faq: () => [
    { q: "È sicuro comprare follower per il mio Instagram o TikTok?", a: "Sì, quando viene fatto a ritmo sano. Viralefy distribuisce l'ordine su ore o giorni così la piattaforma vede una curva naturale. Non chiediamo mai la tua password — solo la tua @ pubblica." },
    { q: "Quanto dura la consegna?", a: "Gli ordini piccoli (fino a 500) si chiudono di solito in 6 ore. Gli ordini grandi vengono spalmati su 24-72 ore per mantenere il ritmo naturale." },
    { q: "Posso perdere i follower in seguito?", a: "I cali sono possibili su qualunque piattaforma. Per questo Viralefy include una garanzia di ripristino di 30 giorni — ripristiniamo senza costi." },
    { q: "Vi serve la mia password?", a: "Mai. Non chiediamo credenziali. Se qualcuno te le chiede, scappa." },
    { q: "Quali pagamenti accettate?", a: "Carta, bonifico e cripto (USDT e BTC). Le ricevute arrivano automatiche via e-mail." },
  ],
};

// -------- seguidores (nl) --------
const COPY_SEGUIDORES_NL: LongCopy = {
  h1: (c) => `Instagram- en TikTok-volgers kopen in ${c}`,
  metaTitle: (c) => `Instagram- en TikTok-volgers kopen in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Koop echte volgers voor Instagram en TikTok in ${c}. Snelle levering, aanvulgarantie en support in jouw taal. Betaal in EUR, USD of crypto.`,
  paragraphs: (c) => [
    `Vanaf nul een publiek opbouwen in ${c} is loodzwaar. De algoritmes van Instagram en TikTok bevoordelen accounts die er al "levend" uitzien — profielen met een stabiele volgersbasis, terugkerende likes en een basislaag aan weergaven. Nieuwe profielen belanden in een kip-en-ei-spiraal: niemand ontdekt je omdat je geen tractie hebt, en je krijgt geen tractie omdat niemand je ontdekt. Een starterspakket volgers kopen is de meest directe manier om die lus te doorbreken en je content in een grotere bereikpool te duwen.`,
    `Viralefy levert volgers die blijven: profielen van hoge kwaliteit, in een natuurlijk tempo gedoseerd zodat het platform je account nooit als koper aanmerkt. Elk pakket komt met een aanvulgarantie — als iemand binnen 30 dagen ontvolgt, vullen we je teller gratis weer aan. Bestellingen voor ${c} starten binnen 1 uur na betalingsbevestiging en lopen in 24 tot 72 uur af, afhankelijk van het volume, zonder dat je je wachtwoord hoeft te delen. Wij vragen alleen je openbare @-naam.`,
    `In tegenstelling tot louche winkels die in één keer duizenden bots dumpen, werkt Viralefy met pacing-vensters die organische groei nabootsen. Een order van 1.000 volgers wordt over meerdere uren verdeeld; een order van 10.000 loopt over twee dagen. Dat patroon houdt je engagement-ratio gezond en beschermt het bereik dat je al hebt opgebouwd. Voor creators in ${c} die op het algoritme leunen om hun content uit te serveren, maakt precies dat onderscheid het verschil.`,
    `De prijzen zijn transparant en vast per hoeveelheid. Geen abonnementen, geen automatische verlengingen, geen verborgen upsells in de checkout. Je betaalt één keer voor een pakket en wij leveren. De betaalopties omvatten kaart, bankoverschrijving en crypto (USDT, BTC). Bonnen worden automatisch per e-mail verstuurd en de volledige historie blijft in je account zodat je met één klik kunt herhalen.`,
    `Heb je nog nooit een groei-service gebruikt, dan is het goedkoopste starterspakket de veiligste manier om het water te testen. Pak een bundel van 100 of 250 volgers, kijk hoe het landt, en schaal pas op wanneer je je comfortabel voelt bij wat je ziet. Hieronder kies je tussen vooraf ingestelde pakketten of bepaal je de exacte hoeveelheid met de slider.`,
  ],
  bullets: () => [
    { title: "Echt ogende profielen", body: "Volgers met profielfoto, bio en eerdere activiteit — geen lege wegwerp-accounts." },
    { title: "Geleidelijke levering", body: "Verspreid over uren of dagen om organische groei na te bootsen." },
    { title: "30-dagen aanvulling", body: "Wie binnen 30 dagen ontvolgt, wordt automatisch aangevuld." },
    { title: "Nooit een wachtwoord", body: "We hebben alleen je openbare @-naam nodig. Geen serieuze dienst vraagt om je wachtwoord." },
    { title: "Flexibel betalen", body: "Kaart, overschrijving en crypto (USDT, BTC)." },
  ],
  faq: () => [
    { q: "Is volgers kopen veilig voor mijn Instagram- of TikTok-account?", a: "Ja, mits het in een verstandig tempo gebeurt. Viralefy spreidt de bestelling over uren of dagen zodat het platform een natuurlijke curve ziet. We vragen nooit je wachtwoord — alleen je openbare handle." },
    { q: "Hoe lang duurt de levering?", a: "Kleine bestellingen (tot 500) zijn meestal binnen 6 uur klaar. Grote bestellingen worden over 24 tot 72 uur uitgesmeerd om het tempo natuurlijk te houden." },
    { q: "Kan ik later volgers verliezen?", a: "Drops zijn op elk platform mogelijk. Daarom bevat Viralefy een aanvulgarantie van 30 dagen — we vullen gratis aan." },
    { q: "Hebben jullie mijn wachtwoord nodig?", a: "Nooit. We vragen geen inloggegevens. Vraagt iemand er wel om, loop dan weg." },
    { q: "Welke betaalmethodes worden ondersteund?", a: "Kaart, bankoverschrijving en crypto (USDT en BTC). Facturen worden automatisch per e-mail verstuurd." },
  ],
};

// -------- engajamento (fr) --------
const COPY_ENG_FR: LongCopy = {
  h1: (c) => `Acheter des likes et de l'engagement pour Instagram et TikTok en ${c}`,
  metaTitle: (c) => `Acheter des likes Instagram et TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Boostez n'importe quelle publication avec des likes et de l'engagement crédibles en ${c}. Démarrage sous 1 heure, sans mot de passe.`,
  paragraphs: (c) => [
    `Le like est la première preuve sociale qu'un visiteur voit. Un post à 12 likes a l'air "amateur" ; le même post à 1 200 likes donne envie d'aller voir. L'algorithme utilise l'engagement précoce comme l'un des signaux de classement les plus forts — une publication qui obtient un bon ratio like/impression dans la première heure est poussée plus loin. C'est précisément cette fenêtre où acheter des likes en ${c} se rentabilise : vous relevez le plancher de la courbe initiale et laissez l'algorithme faire le reste.`,
    `Viralefy livre des likes provenant de comptes avec photo de profil, publications et activité réelle — pas les profils jetables que les plateformes nettoient au prochain coup de balai. Chaque like est cadencé naturellement sur la première heure pour que la montée ait l'air organique. Combiné à un pack d'abonnés, l'effet se cumule : plus d'abonnés = pool d'impressions plus large, plus de likes = meilleur CTR sur ces impressions, et le post grimpe plus vite.`,
    `Les packs d'engagement couvrent tout le spectre, du starter à 1 000 likes jusqu'aux campagnes complètes avec des milliers de likes et de commentaires sauvegardés par publication. Le prix est forfaitaire par pack — pas de pénalité par post, pas de volume minimum mensuel. Vous payez, vous indiquez une URL publique, nous livrons. Si un like saute dans les 30 jours, nous rechargeons. Les publications en ${c} bénéficient d'un routage prioritaire vers les abonnés dans le bon fuseau, ce qui place la courbe initiale aux heures de pointe.`,
    `Les campagnes d'engagement fonctionnent pour les lancements produit, les pushs de Reels, les concours, et le scénario "premier post d'un compte tout neuf" où il faut absolument bien atterrir. Elles ne remplacent pas un bon contenu — mais elles l'amplifient. Un post faible avec 10 000 likes reste un post faible ; un post fort avec 10 000 likes est candidat à la viralité. Mettez votre meilleur contenu derrière la campagne, pas le pire.`,
    `Ci-dessous, choisissez entre des packs prédéfinis ou utilisez le curseur pour fixer le volume exact. Toutes les livraisons sont anonymes et invisibles pour votre audience.`,
  ],
  bullets: () => [
    { title: "Boost dans la première heure", body: "Les likes tombent dans la courbe initiale où l'algorithme pèse le plus." },
    { title: "Profils crédibles", body: "Comptes actifs avec bio et publications — pas de jetables évidents." },
    { title: "Anonyme", body: "La livraison n'est pas visible pour votre audience ni pour les vérifications automatiques." },
    { title: "Recharge 30 jours", body: "Toute chute dans les 30 jours est rechargée sans frais." },
    { title: "Compatible avec les abonnés", body: "Empilez avec un pack d'abonnés pour pousser deux fois le même post." },
  ],
  faq: () => [
    { q: "La plateforme va-t-elle détecter les likes achetés ?", a: "Les likes sont cadencés sur la première heure pour imiter une croissance organique. Les comptes ont une photo et de l'activité, pas les patterns d'œufs vides." },
    { q: "Avez-vous besoin de l'URL du post ?", a: "Oui — collez l'URL publique du post ou du Reel pendant le checkout. Les publications privées ne sont pas atteignables." },
    { q: "Puis-je répartir un pack sur plusieurs publications ?", a: "Chaque pack cible une publication. Passez plusieurs commandes pour couvrir plusieurs posts." },
    { q: "À quelle vitesse démarre la livraison ?", a: "La plupart des commandes démarrent dans l'heure suivant la confirmation du paiement." },
  ],
};

// -------- engajamento (de) --------
const COPY_ENG_DE: LongCopy = {
  h1: (c) => `Likes und Engagement für Instagram und TikTok in ${c} kaufen`,
  metaTitle: (c) => `Instagram- und TikTok-Likes in ${c} kaufen | Viralefy`,
  metaDescription: (c) =>
    `Pushe jeden Beitrag mit echt wirkenden Likes und Engagement in ${c}. Start in 30 Minuten, ohne Passwort.`,
  paragraphs: (c) => [
    `Likes sind der erste Social Proof, den ein Betrachter sieht. Ein Post mit 12 Likes wirkt „amateurhaft"; derselbe Post mit 1 200 Likes wirkt „muss man sich anschauen". Der Algorithmus nutzt frühes Engagement als eines der stärksten Ranking-Signale — ein Post mit einem guten Like-zu-Impression-Verhältnis in der ersten Stunde wird härter ausgespielt. Genau dieses Fenster macht es lohnend, in ${c} Likes zu kaufen: du hebst die Bodenlinie der Anfangskurve an und lässt den Algorithmus den Rest erledigen.`,
    `Viralefy liefert Likes von Accounts, die Profilbilder, Posts und realistisch wirkende Aktivität haben — nicht die Wegwerf-Profile, die Plattformen beim nächsten Cleanup wegfegen. Jeder Like wird über die erste Stunde natürlich gestreckt, damit der Anstieg organisch aussieht. In Kombination mit einem Follower-Paket potenziert sich der Lift: mehr Follower bedeutet einen größeren Impressions-Pool, mehr Likes bedeutet eine höhere CTR auf diese Impressions, und der Post klettert schneller.`,
    `Die Engagement-Packs decken das gesamte Spektrum ab, vom Starter mit 1 000 Likes bis hin zu Full-Stack-Kampagnen mit Tausenden von Likes und Speicher-Kommentaren pro Post. Pauschalpreis pro Paket — keine Strafen pro Post, kein monatliches Mindestvolumen. Du kaufst ein Paket, zeigst auf eine öffentliche URL und wir liefern. Sollte innerhalb der ersten 30 Tage ein Like wegfallen, füllen wir wieder auf. Posts in ${c} erhalten ein bevorzugtes Routing zu Followern in der passenden Zeitzone, sodass die Anfangskurve in die Peak-Stunden fällt.`,
    `Engagement-Kampagnen funktionieren für Produkt-Launches, Reels-Pushs, Gewinnspiel-Posts und „erster Post eines neuen Accounts"-Szenarien, in denen ein guter Start alles bedeutet. Sie ersetzen keinen guten Content — aber sie verstärken ihn. Ein schwacher Post mit 10 000 Likes bleibt ein schwacher Post; ein starker Post mit 10 000 Likes ist ein Viral-Kandidat. Setze deinen stärksten Content unter die Kampagne, nicht den schwächsten.`,
    `Unten wählst du zwischen voreingestellten Like-Paketen oder definierst über den Slider das exakte Volumen. Alle Lieferungen sind anonym und für deine Audience nicht sichtbar.`,
  ],
  bullets: () => [
    { title: "Schub in der ersten Stunde", body: "Likes landen in der Anfangskurve, in der der Algorithmus sie am stärksten gewichtet." },
    { title: "Realistische Profile", body: "Aktive Accounts mit Bio und Posts — keine offensichtlichen Wegwerf-Profile." },
    { title: "Anonym", body: "Die Lieferung ist weder für deine Audience noch für automatisierte Plattform-Checks sichtbar." },
    { title: "30-Tage-Nachfüllung", body: "Jeder Drop innerhalb von 30 Tagen wird kostenfrei aufgefüllt." },
    { title: "Kombinierbar mit Followern", body: "Stack mit einem Follower-Paket für gebündelten Lift auf demselben Post." },
  ],
  faq: () => [
    { q: "Erkennt die Plattform gekaufte Likes?", a: "Likes werden über die erste Stunde gestreckt, um organisches Wachstum nachzuahmen. Die Accounts haben Profilbilder und Aktivität, nicht die offensichtlichen Wegwerf-Muster." },
    { q: "Braucht ihr die Post-URL?", a: "Ja — füge die öffentliche URL des Posts oder Reels im Checkout ein. Private Posts sind nicht erreichbar." },
    { q: "Kann ich ein Paket auf mehrere Posts aufteilen?", a: "Jedes Paket zielt auf einen Post. Mache mehrere Bestellungen, um mehrere Posts abzudecken." },
    { q: "Wie schnell startet die Lieferung?", a: "Die meisten Bestellungen starten innerhalb von 30 Minuten nach Zahlungsbestätigung." },
  ],
};

// -------- engajamento (it) --------
const COPY_ENG_IT: LongCopy = {
  h1: (c) => `Comprare like e engagement per Instagram e TikTok in ${c}`,
  metaTitle: (c) => `Comprare like Instagram e TikTok in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Spingi qualunque post con like e engagement credibili in ${c}. Avvio in 1 ora, senza password.`,
  paragraphs: (c) => [
    `Il like è la prima prova sociale che un visitatore vede. Un post con 12 like sa di "amatoriale"; lo stesso post con 1.200 like sembra "vale la pena guardarlo". L'algoritmo usa l'engagement iniziale come uno dei segnali di ranking più forti — un post con un buon rapporto like/impression nella prima ora viene spinto più a fondo. Quella è la finestra in cui comprare like in ${c} si ripaga: alzi il pavimento della curva iniziale e lasci che l'algoritmo faccia il resto.`,
    `Viralefy consegna like da account con foto profilo, post e attività realistica — non i profili usa-e-getta che le piattaforme rimuovono al prossimo giro. Ogni like viene cadenzato naturalmente sulla prima ora così la salita sembra organica. Combinato con un pacchetto follower l'effetto si compone: più follower = pool di impression più ampio, più like = CTR più alto su quelle impression, e il post sale più in fretta.`,
    `I pacchetti di engagement coprono tutto lo spettro, dal starter da 1.000 like fino alle campagne full-stack con migliaia di like e commenti salvati per post. Prezzo forfettario per pacchetto — niente penalità per post, niente volume minimo mensile. Compri un pacchetto, indichi una URL pubblica, noi consegniamo. Se un like cade nei primi 30 giorni, ripristiniamo. I post in ${c} hanno routing prioritario verso follower nel fuso giusto, così la curva iniziale cade nelle ore di punta.`,
    `Le campagne di engagement funzionano per lanci di prodotto, push di reel, post-concorso e scenari "primo post di un account nuovo" dove atterrare bene è tutto. Non sostituiscono il buon contenuto — ma lo amplificano. Un post debole con 10.000 like resta debole; un post forte con 10.000 like è candidato virale. Metti il tuo contenuto migliore sotto la campagna, non il peggiore.`,
    `Sotto puoi scegliere tra pacchetti preimpostati o usare lo slider per definire il volume esatto. Tutte le consegne sono anonime e invisibili al tuo pubblico.`,
  ],
  bullets: () => [
    { title: "Spinta nella prima ora", body: "I like cadono nella curva iniziale dove l'algoritmo pesa di più." },
    { title: "Profili credibili", body: "Account attivi con bio e post — niente usa-e-getta evidenti." },
    { title: "Anonimo", body: "La consegna non è visibile al tuo pubblico né ai controlli automatici." },
    { title: "Ripristino 30 giorni", body: "Ogni calo entro 30 giorni viene ripristinato senza costi." },
    { title: "Compatibile con follower", body: "Stacca con un pacchetto follower per spingere due volte lo stesso post." },
  ],
  faq: () => [
    { q: "La piattaforma rileverà i like comprati?", a: "I like sono cadenzati sulla prima ora per imitare la crescita organica. Gli account hanno foto e attività, non pattern usa-e-getta." },
    { q: "Vi serve l'URL del post?", a: "Sì — incolla l'URL pubblica del post o del reel al checkout. I post privati non sono raggiungibili." },
    { q: "Posso dividere un pacchetto su più post?", a: "Ogni pacchetto mira a un post. Fai più ordini per coprire più post." },
    { q: "Quanto rapida è la partenza?", a: "La maggior parte degli ordini parte entro 1 ora dalla conferma del pagamento." },
  ],
};

// -------- engajamento (nl) --------
const COPY_ENG_NL: LongCopy = {
  h1: (c) => `Likes en engagement kopen voor Instagram en TikTok in ${c}`,
  metaTitle: (c) => `Instagram- en TikTok-likes kopen in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Geef elk bericht een boost met echt ogende likes en engagement in ${c}. Start binnen 1 uur, zonder wachtwoord.`,
  paragraphs: (c) => [
    `Likes zijn het eerste sociale bewijs dat een bezoeker ziet. Een post met 12 likes leest als "amateur"; dezelfde post met 1.200 likes leest als "die moet ik bekijken". Het algoritme gebruikt vroeg engagement als een van de sterkste rangschikkingsignalen — een post met een sterke like-impressie-ratio in het eerste uur wordt harder geduwd. Dat is precies het venster waarin likes kopen in ${c} zichzelf terugverdient: je tilt de bodem van de beginkromme op en laat het algoritme de rest doen.`,
    `Viralefy levert likes van accounts met profielfoto, posts en realistische activiteit — niet de wegwerp-profielen die platforms in de volgende opruimronde wegvegen. Elke like wordt natuurlijk gedoseerd over het eerste uur, zodat de stijging er organisch uitziet. In combinatie met een volgerspakket versterkt het effect: meer volgers = grotere impressiepool, meer likes = hogere CTR op die impressies, en de post klimt sneller.`,
    `Engagement-pakketten dekken het hele spectrum, van een starter van 1.000 likes tot fullstack-campagnes met duizenden likes en opgeslagen reacties per post. Vaste prijs per pakket — geen boete per post, geen maandelijks minimumvolume. Je koopt een pakket, wijst een openbare URL aan, wij leveren. Valt er binnen 30 dagen een like weg, dan vullen we aan. Posts in ${c} krijgen prioritaire routering naar volgers in de juiste tijdzone, zodat de beginkromme in de piekuren valt.`,
    `Engagement-campagnes werken voor productlanceringen, Reels-pushes, prijsvraagposts en "eerste post van een nieuw account"-scenario's waar goed landen alles is. Ze vervangen geen sterke content — ze versterken die. Een zwakke post met 10.000 likes blijft een zwakke post; een sterke post met 10.000 likes is een viral-kandidaat. Zet je beste content onder de campagne, niet je zwakste.`,
    `Hieronder kies je tussen voorgedefinieerde like-pakketten of bepaal je het exacte volume met de slider. Alle leveringen zijn anoniem en niet zichtbaar voor je publiek.`,
  ],
  bullets: () => [
    { title: "Boost in het eerste uur", body: "Likes landen in de beginkromme waar het algoritme het zwaarst weegt." },
    { title: "Echt ogende profielen", body: "Actieve accounts met bio en posts — geen voor de hand liggende wegwerp-accounts." },
    { title: "Anoniem", body: "De levering is niet zichtbaar voor je publiek of voor geautomatiseerde platformchecks." },
    { title: "30-dagen aanvulling", body: "Elke daling binnen 30 dagen wordt kosteloos aangevuld." },
    { title: "Combineerbaar met volgers", body: "Stapel met een volgerspakket voor een gebundelde boost op dezelfde post." },
  ],
  faq: () => [
    { q: "Detecteert het platform gekochte likes?", a: "Likes worden over het eerste uur gedoseerd om organische groei na te bootsen. De accounts hebben profielfoto's en activiteit, geen lege wegwerp-patronen." },
    { q: "Hebben jullie de post-URL nodig?", a: "Ja — plak de openbare URL van de post of Reel in de checkout. Privé-posts zijn niet bereikbaar." },
    { q: "Kan ik een pakket verdelen over meerdere posts?", a: "Elk pakket richt zich op één post. Plaats meerdere bestellingen om meerdere posts te dekken." },
    { q: "Hoe snel start de levering?", a: "De meeste bestellingen starten binnen 1 uur na bevestiging van de betaling." },
  ],
};

// -------- visualizacoes (fr) --------
const COPY_VIEWS_FR: LongCopy = {
  h1: (c) => `Acheter des vues Reels, TikTok et Stories en ${c}`,
  metaTitle: (c) => `Acheter des vues Instagram et TikTok en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Boostez n'importe quelle vidéo avec des vues crédibles en ${c}. Reels, TikTok et Stories. Démarrage sous 1 heure.`,
  paragraphs: (c) => [
    `Le compteur de vues est la métrique d'en-tête de toute vidéo courte. Un Reel posé à 320 vues a l'air mort ; le même Reel à 32 000 vues a l'air d'être en train de prendre feu. Les spectateurs en ${c} utilisent ce chiffre comme heuristique pour décider de regarder ou non — et l'algorithme l'utilise comme signal de classement pour décider de pousser la vidéo plus loin. Acheter des vues est le moyen le moins coûteux de relever cette ligne de base.`,
    `Viralefy livre des vues qui comptent pour l'algorithme : impressions de visionnage complet provenant de comptes avec activité réelle, cadencées pour que la montée reflète une découverte organique. Les vues de Story ne sont pas publiques pour vos abonnés ; les vues de Reels sont publiques et s'ajoutent directement au compteur affiché sur votre profil. Les deux fonctionnent de la même façon pour l'algorithme.`,
    `Les packs de vues vont de 10 k jusqu'à 1 M+ par vidéo. Le prix par pack est inférieur à une campagne d'ads sur TikTok ou Instagram pour le même nombre d'impressions — et les vues issues d'une publicité payée disparaissent du compteur public dès que la campagne se termine. Les vues Viralefy restent.`,
    `Pour les créateurs en ${c} qui publient plusieurs vidéos par semaine, lancer un petit boost de vues sur chaque nouvel upload est un moyen à faible friction de nourrir l'algorithme avec le signal précoce dont il a besoin. La recharge 30 jours s'applique ici aussi — si des vues chutent, elles sont remplacées.`,
    `Choisissez un pack prédéfini ci-dessous ou définissez le nombre exact de vues avec le curseur.`,
  ],
  bullets: () => [
    { title: "Comptées par l'algorithme", body: "Impressions de visionnage complet, pas des sauts d'une seconde." },
    { title: "Reels et Stories", body: "Fonctionne pour tout format court." },
    { title: "Restent au compteur", body: "Contrairement aux publicités, le compteur ne disparaît pas en fin de campagne." },
    { title: "Recharge 30 jours", body: "Toute chute dans les 30 jours est rétablie." },
    { title: "Tarif par vidéo", body: "Prix forfaitaire par pack. Pas d'abonnement." },
  ],
  faq: () => [
    { q: "Les vues achetées comptent-elles pour la monétisation ?", a: "Les vues Viralefy s'ajoutent à votre compteur public mais ne contribuent pas directement aux critères de monétisation comme l'éligibilité au Reels Bonus — la plateforme les mesure séparément." },
    { q: "Combien de temps mettent les vues à arriver ?", a: "Les petites commandes (jusqu'à 10 k) se terminent en 1 à 3 heures. Les grosses commandes sont étalées sur 24 h pour garder une courbe naturelle." },
    { q: "Puis-je acheter des vues pour une Story ?", a: "Oui — les vues de Story sont prises en charge, mais uniquement pendant que la Story est en ligne (fenêtre de 24 h)." },
    { q: "Ma vidéo va-t-elle atteindre une audience plus large ?", a: "Les vues relèvent le signal de classement dans l'algorithme. Que la vidéo aille ensuite plus loin dépend du temps de visionnage et du ratio de likes." },
  ],
};

// -------- visualizacoes (de) --------
const COPY_VIEWS_DE: LongCopy = {
  h1: (c) => `Reels-, TikTok- und Story-Aufrufe in ${c} kaufen`,
  metaTitle: (c) => `Instagram- und TikTok-Aufrufe in ${c} kaufen | Viralefy`,
  metaDescription: (c) =>
    `Push jedes Video mit echt wirkenden Aufrufen in ${c}. Reels, TikTok und Stories. Start in 30 Minuten.`,
  paragraphs: (c) => [
    `Die Aufrufzahl ist die Schlagzeile jedes Kurzvideos. Ein Reel mit 320 Aufrufen wirkt tot; dasselbe Reel mit 32 000 Aufrufen wirkt, als würde es Feuer fangen. Zuschauer in ${c} nutzen diese Zahl als Heuristik, um zu entscheiden, ob sie schauen — und der Algorithmus nutzt sie als Ranking-Signal, um zu entscheiden, ob er das Video weiter pusht. Aufrufe zu kaufen ist der günstigste Weg, diese Grundlinie anzuheben.`,
    `Viralefy liefert Aufrufe, die für den Algorithmus zählen: Full-Watch-Impressionen von Accounts mit echter Aktivität, so getaktet, dass der Anstieg organisch wirkt. Story-Aufrufe sind für deine Follower nicht öffentlich; Reels-Aufrufe sind öffentlich und werden direkt dem auf deinem Profil angezeigten Zähler gutgeschrieben. Beide funktionieren für den Algorithmus identisch.`,
    `Die View-Packs skalieren von 10 k bis 1 M+ pro Video. Der Preis pro Paket liegt unter einer TikTok- oder Instagram-Werbekampagne mit derselben Impressions-Zahl — und die Aufrufe aus einer bezahlten Anzeige verschwinden in dem Moment, in dem die Kampagne endet, aus dem öffentlichen Zähler. View-Kampagnen von Viralefy bleiben.`,
    `Für Creator in ${c}, die mehrere Videos pro Woche posten, ist ein kleiner View-Boost auf jedem neuen Upload ein Weg mit niedriger Reibung, dem Algorithmus das frühe Signal zu liefern, das er braucht. Die 30-Tage-Nachfüllung gilt auch hier — fallen Aufrufe weg, werden sie ersetzt.`,
    `Wähle unten ein Preset oder definiere mit dem Slider die exakte Aufrufzahl, die du willst.`,
  ],
  bullets: () => [
    { title: "Vom Algorithmus gezählt", body: "Full-Watch-Impressionen, keine 1-Sekunden-Skips." },
    { title: "Reels und Stories", body: "Funktioniert für jedes Kurzformat." },
    { title: "Bleibt im Zähler", body: "Anders als bei bezahlten Ads verschwindet die Zahl nach Kampagnenende nicht." },
    { title: "30-Tage-Nachfüllung", body: "Jeder Drop innerhalb von 30 Tagen wird wieder aufgefüllt." },
    { title: "Preis pro Video", body: "Pauschalpreis pro Paket. Kein Abo." },
  ],
  faq: () => [
    { q: "Zählen gekaufte Aufrufe für die Monetarisierung?", a: "Aufrufe von Viralefy addieren sich auf deinem öffentlichen Zähler, fließen aber nicht direkt in Monetarisierungs-Kriterien wie die Reels-Bonus-Berechtigung ein — die Plattform misst diese gesondert." },
    { q: "Wie lange dauert es, bis die Aufrufe ankommen?", a: "Kleine Bestellungen (bis 10 k) sind in 1–3 Stunden abgeschlossen. Große Bestellungen werden über 24 Stunden gestreckt, um die Kurve natürlich zu halten." },
    { q: "Kann ich Aufrufe für eine Story kaufen?", a: "Ja — Story-Aufrufe werden unterstützt, aber nur solange die Story online ist (24-Stunden-Fenster)." },
    { q: "Erreicht mein Video dadurch ein breiteres Publikum?", a: "Aufrufe heben das Ranking-Signal im Algorithmus an. Ob das Video dann weiter reicht, hängt von Watch-Time und Like-Ratio ab." },
  ],
};

// -------- visualizacoes (it) --------
const COPY_VIEWS_IT: LongCopy = {
  h1: (c) => `Comprare visualizzazioni di Reels, TikTok e Stories in ${c}`,
  metaTitle: (c) => `Comprare visualizzazioni Instagram e TikTok in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Spingi qualunque video con visualizzazioni credibili in ${c}. Reels, TikTok e Stories. Avvio in 1 ora.`,
  paragraphs: (c) => [
    `Il conteggio delle visualizzazioni è la metrica titolo di qualunque video breve. Un reel fermo a 320 view sembra morto; lo stesso reel a 32.000 view sembra stia prendendo fuoco. Gli spettatori in ${c} usano quel numero come euristica per decidere se guardare — e l'algoritmo lo usa come segnale di ranking per decidere se spingere il video oltre. Comprare visualizzazioni è il modo più economico per alzare quella linea di base.`,
    `Viralefy consegna visualizzazioni che contano per l'algoritmo: impression di visione completa da account con attività reale, cadenzate perché la salita rispecchi una scoperta organica. Le visualizzazioni di Stories non sono pubbliche per il tuo pubblico; quelle dei Reels sono pubbliche e si sommano direttamente al contatore mostrato sul profilo. Entrambe funzionano allo stesso modo per l'algoritmo.`,
    `I pacchetti di view vanno da 10 k fino a 1 M+ per video. Il prezzo per pacchetto è inferiore a una campagna ads su TikTok o Instagram con lo stesso numero di impression — e le view ottenute da un annuncio sponsorizzato spariscono dal contatore pubblico nel momento in cui la campagna finisce. Le view di Viralefy restano.`,
    `Per i creator in ${c} che pubblicano più video a settimana, lanciare un piccolo boost di visualizzazioni su ogni nuovo upload è un modo a bassa frizione per nutrire l'algoritmo del segnale iniziale di cui ha bisogno. Il ripristino di 30 giorni si applica anche qui — se le view calano, vengono sostituite.`,
    `Scegli un preset qui sotto o definisci il numero esatto di view con lo slider.`,
  ],
  bullets: () => [
    { title: "Conteggiate dall'algoritmo", body: "Impression di visione completa, non skip da un secondo." },
    { title: "Reels e Stories", body: "Funziona per qualunque formato breve." },
    { title: "Restano nel contatore", body: "A differenza degli ads, il conteggio non sparisce a fine campagna." },
    { title: "Ripristino 30 giorni", body: "Ogni calo entro 30 giorni viene ripristinato." },
    { title: "Prezzo per video", body: "Prezzo forfettario per pacchetto. Nessun abbonamento." },
  ],
  faq: () => [
    { q: "Le visualizzazioni comprate contano per la monetizzazione?", a: "Le view di Viralefy si sommano al contatore pubblico ma non contribuiscono direttamente a criteri di monetizzazione come l'idoneità al Reels Bonus — la piattaforma le misura separatamente." },
    { q: "Quanto ci mettono ad arrivare?", a: "Gli ordini piccoli (fino a 10 k) si chiudono in 1-3 ore. Gli ordini grandi vengono spalmati su 24 h per mantenere la curva naturale." },
    { q: "Posso comprare visualizzazioni per una Story?", a: "Sì — le view delle Story sono supportate, ma solo finché la Story è online (finestra di 24 h)." },
    { q: "Il mio video raggiungerà un pubblico più ampio?", a: "Le visualizzazioni alzano il segnale di ranking nell'algoritmo. Se il video poi va più lontano dipende dal tempo di visione e dal rapporto di like." },
  ],
};

// -------- visualizacoes (nl) --------
const COPY_VIEWS_NL: LongCopy = {
  h1: (c) => `Reels-, TikTok- en Story-weergaven kopen in ${c}`,
  metaTitle: (c) => `Instagram- en TikTok-weergaven kopen in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Geef elke video een boost met echt ogende weergaven in ${c}. Reels, TikTok en Stories. Start binnen 1 uur.`,
  paragraphs: (c) => [
    `Het weergavenaantal is de koptekstmetric van elke korte video. Een Reel die op 320 weergaven blijft hangen lijkt dood; dezelfde Reel op 32.000 lijkt vlam te vatten. Kijkers in ${c} gebruiken dat getal als vuistregel om te beslissen of ze kijken — en het algoritme gebruikt het als rangschikkingsignaal om te beslissen of het de video verder duwt. Weergaven kopen is de goedkoopste manier om die basislijn op te tillen.`,
    `Viralefy levert weergaven die meetellen voor het algoritme: volledig uitgekeken impressies van accounts met echte activiteit, gedoseerd zodat de stijging organische ontdekking nabootst. Story-weergaven zijn niet publiek zichtbaar voor je volgers; Reels-weergaven zijn wel publiek en tellen rechtstreeks op bij de teller op je profiel. Beide werken voor het algoritme op dezelfde manier.`,
    `De view-pakketten schalen van 10 k tot meer dan 1 M per video. De prijs per pakket ligt onder die van een TikTok- of Instagram-advertentiecampagne met hetzelfde aantal impressies — en weergaven uit een betaalde advertentie verdwijnen op het moment dat de campagne eindigt uit de openbare teller. View-campagnes van Viralefy blijven staan.`,
    `Voor creators in ${c} die meerdere video's per week posten, is een kleine view-boost op elke nieuwe upload een laagdrempelige manier om het algoritme het vroege signaal te geven dat het nodig heeft. De 30-dagen-aanvulling geldt hier ook — vallen weergaven weg, dan worden ze vervangen.`,
    `Kies hieronder een voorinstelling of bepaal het exacte aantal weergaven met de slider.`,
  ],
  bullets: () => [
    { title: "Geteld door het algoritme", body: "Volledig uitgekeken impressies, geen overslagen van één seconde." },
    { title: "Reels en Stories", body: "Werkt voor elk kort format." },
    { title: "Blijven op de teller", body: "Anders dan bij advertenties verdwijnt de teller niet aan het einde van de campagne." },
    { title: "30-dagen aanvulling", body: "Elke daling binnen 30 dagen wordt aangevuld." },
    { title: "Prijs per video", body: "Vaste prijs per pakket. Geen abonnement." },
  ],
  faq: () => [
    { q: "Tellen gekochte weergaven mee voor monetisatie?", a: "Weergaven van Viralefy tellen op bij je openbare teller, maar dragen niet direct bij aan monetisatiecriteria zoals de Reels Bonus-geschiktheid — het platform meet die apart." },
    { q: "Hoe lang duurt het tot de weergaven binnenkomen?", a: "Kleine bestellingen (tot 10 k) lopen in 1 tot 3 uur af. Grote bestellingen worden over 24 uur uitgesmeerd om de curve natuurlijk te houden." },
    { q: "Kan ik weergaven voor een Story kopen?", a: "Ja — Story-weergaven worden ondersteund, maar alleen zolang de Story online staat (venster van 24 uur)." },
    { q: "Bereikt mijn video hierdoor een breder publiek?", a: "Weergaven tillen het rangschikkingsignaal in het algoritme op. Of de video daarna verder reikt hangt af van de kijktijd en de like-ratio." },
  ],
};

// -------- servicos (fr) --------
const COPY_SERV_FR: LongCopy = {
  h1: (c) => `Services premium de croissance Instagram et TikTok en ${c}`,
  metaTitle: (c) => `Gestion premium de réseaux sociaux en ${c} | Viralefy`,
  metaDescription: (c) =>
    `Gestion hands-on, stratégie de contenu et croissance pour les créateurs sérieux en ${c}.`,
  paragraphs: (c) => [
    `Les services premium sont pensés pour les créateurs en ${c} qui veulent plus qu'un coup de boost ponctuel — pour les comptes qui construisent une marque et qui ont besoin d'une stratégie continue. Chaque mandat couvre la planification éditoriale, l'analyse de performance, la recherche de hashtags, la cadence de publication et un budget mensuel d'engagement intégré.`,
    `L'équipe travaille en un-à-un avec chaque compte sous mandat. On commence par un audit des chiffres actuels (portée, taux d'engagement, données démographiques des abonnés, cadence de publication), on fixe un objectif à 90 jours, puis on construit le calendrier éditorial qui le tient. Là où c'est pertinent, on superpose des packs Viralefy d'abonnés et d'engagement pour accélérer la courbe.`,
    `La tarification est mensuelle — pas d'engagement long terme. Vous résiliez à tout moment d'un clic depuis votre compte. Les rapports tombent le premier du mois avec les chiffres réels, ce qui a marché, ce qui n'a pas marché, et le plan des 30 prochains jours.`,
    `Si vous envisagez un mandat premium pour un projet sérieux en ${c}, écrivez au support avant de passer au checkout — on prévoit un court appel de découverte pour s'assurer du bon fit avant que l'une des parties ne dépense un centime.`,
    `Pour tout le reste, les packs self-serve d'abonnés, de likes et de vues couvrent déjà les besoins les plus courants.`,
  ],
  bullets: () => [
    { title: "Stratégie mensuelle", body: "Calendrier éditorial, cadence de publication, recherche de hashtags." },
    { title: "Rapports mensuels", body: "Chiffres, ce qui a marché, ce qui n'a pas marché, plan des 30 prochains jours." },
    { title: "Budget engagement", body: "Packs d'abonnés et d'engagement intégrés au mandat." },
    { title: "Résiliable à tout moment", body: "Pas d'engagement long terme." },
    { title: "Account manager humain", body: "Une personne dédiée pour votre compte, dans votre langue." },
  ],
  faq: () => [
    { q: "C'est pour des comptes perso ou pro ?", a: "Les deux. On travaille avec des créateurs, des marques et des petites entreprises." },
    { q: "Quel est l'engagement ?", a: "Mensuel. Résiliable à tout moment." },
    { q: "Dois-je céder l'accès à mon compte ?", a: "Non. On coordonne la publication avec vous. On ne se connecte jamais à votre compte." },
    { q: "Comment je démarre ?", a: "Écrivez au support avant le checkout — on prévoit un court appel de découverte d'abord." },
  ],
};

// -------- servicos (de) --------
const COPY_SERV_DE: LongCopy = {
  h1: (c) => `Premium-Wachstumsservices für Instagram und TikTok in ${c}`,
  metaTitle: (c) => `Premium Social-Media-Management in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Hands-on-Wachstum, Content-Strategie und Account-Management für ambitionierte Creator in ${c}.`,
  paragraphs: (c) => [
    `Premium-Services richten sich an Creator in ${c}, die mehr wollen als einen einmaligen Follower-Boost — an Accounts, die eine Marke aufbauen und eine kontinuierliche Strategie brauchen. Jedes Retainer-Paket umfasst Content-Planung, Performance-Reviews, Hashtag-Recherche, Posting-Kadenz und ein monatliches Engagement-Budget direkt mit eingebaut.`,
    `Das Team arbeitet eins-zu-eins mit jedem betreuten Account. Wir starten mit einem Audit der aktuellen Zahlen (Reichweite, Engagement-Rate, Follower-Demografie, Posting-Kadenz), setzen ein 90-Tage-Ziel und entwerfen den Content-Kalender, der dieses Ziel hält. Wo es sinnvoll ist, legen wir Viralefy-Follower- und Engagement-Packs darüber, um die Kurve zu beschleunigen.`,
    `Die Abrechnung ist monatlich — kein Long-Term-Lock-in. Jederzeit mit einem Klick im Account kündbar. Reports landen am Ersten jedes Monats mit den tatsächlichen Zahlen, was funktioniert hat, was nicht, und dem Plan für die nächsten 30 Tage.`,
    `Wenn du für ein ernsthaftes Projekt in ${c} ein Premium-Retainer in Betracht ziehst, schreibe vor dem Checkout den Support an — wir machen einen kurzen Discovery-Call, um sicherzustellen, dass es passt, bevor eine der beiden Seiten einen Cent ausgibt.`,
    `Für alles andere decken die Self-Serve-Packs für Follower, Likes und Aufrufe die gängigsten Bedürfnisse bereits ab.`,
  ],
  bullets: () => [
    { title: "Monatliche Strategie", body: "Content-Kalender, Posting-Kadenz, Hashtag-Recherche." },
    { title: "Monatliche Reports", body: "Zahlen, was funktionierte, was nicht, Plan für die nächsten 30 Tage." },
    { title: "Engagement-Budget", body: "Follower- und Engagement-Packs sind im Retainer enthalten." },
    { title: "Jederzeit kündbar", body: "Kein Long-Term-Lock-in." },
    { title: "Echter Account Manager", body: "Ein Mensch betreut deinen Account, in deiner Sprache." },
  ],
  faq: () => [
    { q: "Ist das für private oder geschäftliche Accounts?", a: "Beides. Wir arbeiten mit Creators, Marken und kleinen Unternehmen." },
    { q: "Wie ist die Bindung?", a: "Monatlich. Jederzeit kündbar." },
    { q: "Muss ich den Account-Zugang abgeben?", a: "Nein. Wir koordinieren das Posting mit dir. Wir loggen uns nie in deinen Account ein." },
    { q: "Wie starte ich?", a: "Schreibe vor dem Checkout den Support an — wir machen einen kurzen Discovery-Call zuerst." },
  ],
};

// -------- servicos (it) --------
const COPY_SERV_IT: LongCopy = {
  h1: (c) => `Servizi premium di crescita Instagram e TikTok in ${c}`,
  metaTitle: (c) => `Gestione premium social in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Gestione hands-on, strategia di contenuto e crescita per creator seri in ${c}.`,
  paragraphs: (c) => [
    `I servizi premium sono pensati per i creator in ${c} che vogliono di più di un boost una tantum — per gli account che stanno costruendo un brand e hanno bisogno di una strategia continua. Ogni retainer copre pianificazione contenuti, revisioni di performance, ricerca hashtag, cadenza di pubblicazione e un budget mensile di engagement incluso.`,
    `Il team lavora uno-a-uno con ogni account gestito. Si parte con un audit dei numeri attuali (reach, engagement rate, demografia dei follower, cadenza di pubblicazione), si fissa un obiettivo a 90 giorni e si disegna il calendario editoriale che lo regge. Dove ha senso, si stratificano pacchetti Viralefy di follower e engagement per accelerare la curva.`,
    `Fatturazione mensile — niente lock-in a lungo termine. Disdetta in qualsiasi momento con un click dal tuo account. I report arrivano il primo del mese con i numeri reali, cosa ha funzionato, cosa no, e il piano dei prossimi 30 giorni.`,
    `Se stai valutando un retainer premium per un progetto serio in ${c}, scrivi al supporto prima del checkout — facciamo una breve call di discovery per essere sicuri che il fit ci sia prima che una delle due parti spenda un centesimo.`,
    `Per tutto il resto, i pacchetti self-serve di follower, like e visualizzazioni coprono già le esigenze più comuni.`,
  ],
  bullets: () => [
    { title: "Strategia mensile", body: "Calendario editoriale, cadenza di pubblicazione, ricerca hashtag." },
    { title: "Report mensili", body: "Numeri, cosa ha funzionato, cosa no, piano dei prossimi 30 giorni." },
    { title: "Budget engagement", body: "Pacchetti follower ed engagement inclusi nel retainer." },
    { title: "Disdetta libera", body: "Nessun lock-in a lungo termine." },
    { title: "Account manager umano", body: "Una persona segue il tuo account, nella tua lingua." },
  ],
  faq: () => [
    { q: "È per account personali o aziendali?", a: "Entrambi. Lavoriamo con creator, brand e piccole imprese." },
    { q: "Qual è l'impegno?", a: "Mensile. Disdetta in qualsiasi momento." },
    { q: "Devo cedere l'accesso all'account?", a: "No. Coordiniamo la pubblicazione con te. Non entriamo mai nel tuo account." },
    { q: "Come comincio?", a: "Scrivi al supporto prima del checkout — facciamo prima una breve call di discovery." },
  ],
};

// -------- servicos (nl) --------
const COPY_SERV_NL: LongCopy = {
  h1: (c) => `Premium groeidiensten voor Instagram en TikTok in ${c}`,
  metaTitle: (c) => `Premium social media management in ${c} | Viralefy`,
  metaDescription: (c) =>
    `Hands-on groei, contentstrategie en accountmanagement voor serieuze creators in ${c}.`,
  paragraphs: (c) => [
    `Premium-diensten zijn voor creators in ${c} die meer willen dan een eenmalige volgersboost — voor accounts die een merk opbouwen en een doorlopende strategie nodig hebben. Elke retainer dekt contentplanning, performance-reviews, hashtag-onderzoek, postingcadans en een ingebakken maandbudget voor engagement.`,
    `Het team werkt één-op-één met elke account onder retainer. We beginnen met een audit van de huidige cijfers (bereik, engagement-ratio, volgersdemografie, postingcadans), stellen een doel op 90 dagen en ontwerpen de contentkalender die het haalt. Waar het zinvol is, leggen we er Viralefy volger- en engagementpakketten overheen om de curve te versnellen.`,
    `Maandelijkse facturering — geen langetermijn-lock-in. Op elk moment opzegbaar met één klik vanuit je account. Rapporten landen op de eerste van elke maand met de echte cijfers, wat werkte, wat niet, en het plan voor de volgende 30 dagen.`,
    `Overweeg je een premium retainer voor een serieus project in ${c}, stuur dan voor de checkout een bericht naar support — we plannen een korte discovery-call om de fit te checken voordat een van beide partijen een cent uitgeeft.`,
    `Voor al het andere dekken de self-serve pakketten met volgers, likes en weergaven de meeste behoeften al af.`,
  ],
  bullets: () => [
    { title: "Maandelijkse strategie", body: "Contentkalender, postingcadans, hashtag-onderzoek." },
    { title: "Maandelijkse rapporten", body: "De cijfers, wat werkte, wat niet, plan voor de komende 30 dagen." },
    { title: "Engagement-budget", body: "Volgers- en engagementpakketten zitten in de retainer." },
    { title: "Altijd opzegbaar", body: "Geen langetermijn-lock-in." },
    { title: "Een echte accountmanager", body: "Eén persoon beheert je account, in jouw taal." },
  ],
  faq: () => [
    { q: "Is dit voor persoonlijke of zakelijke accounts?", a: "Beide. We werken met creators, merken en kleine bedrijven." },
    { q: "Wat is de verplichting?", a: "Maandelijks. Op elk moment opzegbaar." },
    { q: "Moet ik mijn accounttoegang afgeven?", a: "Nee. We coördineren publicaties met jou. We loggen nooit op je account in." },
    { q: "Hoe begin ik?", a: "Stuur voor de checkout een bericht naar support — we doen eerst een korte discovery-call." },
  ],
};

// -------- seguidores (ru) --------
const COPY_SEGUIDORES_RU: LongCopy = {
  h1: (c) => `Купить подписчиков Instagram и TikTok в ${c}`,
  metaTitle: (c) => `Купить подписчиков Instagram и TikTok в ${c} | Viralefy`,
  metaDescription: (c) =>
    `Покупайте реальных подписчиков для Instagram и TikTok в ${c}. Быстрая доставка, гарантия восполнения, поддержка на вашем языке. Оплата в USD, EUR или криптовалютой.`,
  paragraphs: (c) => [
    `Собрать аудиторию с нуля в ${c} — задача не из лёгких. Алгоритмы Instagram и TikTok отдают предпочтение аккаунтам, которые уже выглядят «живыми»: профилям со стабильной базой подписчиков, регулярными лайками и минимальным потоком просмотров. Новые профили попадают в замкнутый круг — вас никто не находит, потому что у вас нет тяги, и тяги нет, потому что вас никто не находит. Покупка стартового пакета подписчиков — самый прямой способ разорвать этот круг и вывести ваш контент в более широкий пул охвата.`,
    `Viralefy поставляет подписчиков, которые остаются: качественные профили подаются в естественном темпе, чтобы платформа никогда не пометила ваш аккаунт как «покупательский». Каждый пакет идёт с гарантией восполнения — если кто-то отпишется в течение 30 дней, мы бесплатно вернём счётчик к исходному значению. Заказы для ${c} стартуют в течение 30 минут после подтверждения оплаты и завершаются за 24–72 часа в зависимости от объёма, без необходимости передавать пароль. Нам нужен только ваш публичный @-ник.`,
    `В отличие от сомнительных лавок, которые сбрасывают тысячи ботов за одну ночь, Viralefy работает в окнах темпа, имитирующих органический рост. Заказ на 1 000 подписчиков растягивается на несколько часов; заказ на 10 000 идёт пару дней. Такая схема сохраняет здоровое соотношение вовлечённости и защищает уже заработанный охват. Для авторов в ${c}, которые рассчитывают на алгоритм, чтобы донести контент до зрителя, именно эта разница решает всё.`,
    `Цены прозрачные и фиксированные по количеству. Никаких подписок, автопродлений или скрытых апселлов на оформлении заказа. Вы платите один раз за пакет — мы доставляем. Способы оплаты: карта, банковский перевод и криптовалюта (USDT, BTC). Чеки приходят на e-mail автоматически, а полная история сохраняется в вашем аккаунте, чтобы повторить заказ можно было одним кликом.`,
    `Если вы ещё не пользовались сервисами роста, самый дешёвый стартовый пакет — безопасный способ протестировать воду. Возьмите набор на 100 или 250 подписчиков, посмотрите, как он ляжет, и наращивайте объём только тогда, когда будете уверены в том, что видите. Ниже на странице можно выбрать готовые пакеты или задать точное количество с помощью ползунка.`,
  ],
  bullets: () => [
    { title: "Реалистичные профили", body: "Подписчики с аватаром, био и предшествующей активностью — никаких пустых одноразовых аккаунтов." },
    { title: "Постепенная подача", body: "Доставка распределяется на часы и дни, чтобы имитировать органический рост и не вызывать флагов платформы." },
    { title: "Восполнение 30 дней", body: "Если кто-то отпишется в течение 30 дней, мы автоматически вернём счётчик к исходному значению." },
    { title: "Никогда не просим пароль", body: "Нам нужен только ваш публичный @-ник. Ни один серьёзный сервис не запросит у вас пароль." },
    { title: "Оплата как удобно", body: "Карта, банковский перевод и криптовалюта (USDT, BTC)." },
  ],
  faq: () => [
    { q: "Безопасно ли покупать подписчиков для аккаунта Instagram или TikTok?", a: "Да, если делать это в разумном темпе. Viralefy распределяет заказ на часы или дни, чтобы платформа видела естественную кривую роста. Мы никогда не запрашиваем пароль — только ваш публичный @-ник." },
    { q: "Сколько времени занимает доставка?", a: "Небольшие заказы (до 500) обычно завершаются за 6 часов. Крупные заказы растягиваются на 24–72 часа, чтобы сохранить естественный темп." },
    { q: "Могу ли я потерять подписчиков позже?", a: "Отписки возможны на любой платформе. Поэтому Viralefy включает гарантию восполнения на 30 дней — мы возвращаем счётчик без доплат." },
    { q: "Нужен ли вам мой пароль?", a: "Никогда. Мы не запрашиваем никаких учётных данных. Если сервис роста просит пароль — уходите." },
    { q: "Какие способы оплаты поддерживаются?", a: "Карта, банковский перевод и криптовалюта (USDT и BTC). Счета приходят на e-mail автоматически." },
  ],
};

// -------- engajamento (ru) --------
const COPY_ENG_RU: LongCopy = {
  h1: (c) => `Купить лайки и вовлечённость для Instagram и TikTok в ${c}`,
  metaTitle: (c) => `Купить лайки Instagram и TikTok в ${c} | Viralefy`,
  metaDescription: (c) =>
    `Усильте любой пост реалистичными лайками и вовлечённостью в ${c}. Старт через 30 минут, без пароля.`,
  paragraphs: (c) => [
    `Лайк — это первое социальное доказательство, которое видит зритель. Пост с 12 лайками читается как «любительский»; тот же пост с 1 200 лайками — как «стоит посмотреть». Алгоритм использует раннюю вовлечённость как один из самых сильных сигналов ранжирования: пост, набравший высокое соотношение «лайки/показы» в первый час, продвигается дальше. Именно это окно делает покупку лайков в ${c} оправданной — вы поднимаете нижнюю границу начальной кривой, а алгоритм доделывает остальное.`,
    `Viralefy доставляет лайки с аккаунтов, у которых есть аватары, посты и реалистичная активность, — а не одноразовые профили, которые платформы вычищают при следующей зачистке. Каждый лайк подаётся естественным темпом в течение первого часа, чтобы подъём выглядел органично. В связке с пакетом подписчиков эффект складывается: больше подписчиков — шире пул показов, больше лайков — выше CTR на этих показах, и пост поднимается быстрее.`,
    `Пакеты вовлечённости охватывают весь спектр — от стартового буста на 1 000 лайков до полноценных кампаний с тысячами лайков и сохранённых комментариев на пост. Цена фиксированная за пакет — никаких штрафов за пост, никакого минимального месячного объёма. Вы покупаете пакет, указываете публичный URL — мы доставляем. Если в первые 30 дней лайк отвалится, мы восполним. Посты в ${c} получают приоритетную маршрутизацию к подписчикам в нужном часовом поясе, поэтому начальная кривая приходится на пиковые часы.`,
    `Кампании вовлечённости работают для запусков продуктов, продвижения Reels, конкурсных постов и сценариев «первый пост нового аккаунта», где важно красиво стартовать. Они не заменяют хороший контент — они его усиливают. Слабый пост с 10 000 лайков остаётся слабым; сильный пост с 10 000 лайков становится кандидатом в вирус. Ставьте под кампанию ваш сильнейший контент, а не самый слабый.`,
    `Ниже можно выбрать готовые пакеты лайков или задать ползунком точный объём. Все доставки анонимны и невидимы для вашей аудитории.`,
  ],
  bullets: () => [
    { title: "Импульс в первый час", body: "Лайки попадают в начальную кривую, где алгоритм взвешивает их сильнее всего." },
    { title: "Реалистичные профили", body: "Активные аккаунты с био и постами — никаких очевидных «пустышек»." },
    { title: "Анонимно", body: "Доставка не видна ни вашей аудитории, ни автоматическим проверкам платформы." },
    { title: "Восполнение 30 дней", body: "Любая просадка в течение 30 дней компенсируется бесплатно." },
    { title: "Совместимо с подписчиками", body: "Сложите с пакетом подписчиков, чтобы получить совмещённый импульс на одном и том же посте." },
  ],
  faq: () => [
    { q: "Заметит ли платформа купленные лайки?", a: "Лайки распределяются по первому часу, имитируя органический рост. У аккаунтов есть аватары и активность — это не паттерн «яиц без профиля»." },
    { q: "Нужен ли вам URL поста?", a: "Да — вставьте публичный URL поста или Reel при оформлении. Приватные посты недоступны." },
    { q: "Можно разбить один пакет на несколько постов?", a: "Каждый пакет нацелен на один пост. Чтобы охватить несколько — оформите несколько заказов." },
    { q: "Как быстро начинается доставка?", a: "Большинство заказов стартуют в течение 30 минут после подтверждения оплаты." },
  ],
};

// -------- visualizacoes (ru) --------
const COPY_VIEWS_RU: LongCopy = {
  h1: (c) => `Купить просмотры Reels, TikTok и Stories в ${c}`,
  metaTitle: (c) => `Купить просмотры Instagram и TikTok в ${c} | Viralefy`,
  metaDescription: (c) =>
    `Усильте любое видео реалистичными просмотрами в ${c}. Reels, TikTok и Stories. Старт через 30 минут.`,
  paragraphs: (c) => [
    `Счётчик просмотров — главная заголовочная метрика любого короткого видео. Reel на 320 просмотрах выглядит мёртвым; тот же Reel на 32 000 — будто разгорается. Зрители в ${c} используют это число как эвристику при решении, смотреть ли вообще, а алгоритм — как сигнал ранжирования, чтобы решить, продвигать ли видео дальше. Покупка просмотров — самый дешёвый способ поднять эту базовую линию.`,
    `Viralefy доставляет просмотры, которые засчитываются алгоритмом: показы с полным просмотром, с аккаунтов с реальной активностью, поданные в темпе, повторяющем органическое открытие. Просмотры Stories не видны вашим подписчикам; просмотры Reels публичны и идут напрямую в счётчик, отображаемый в профиле. Для алгоритма оба формата работают одинаково.`,
    `Пакеты просмотров масштабируются от 10 тыс. до 1 млн+ на видео. Цена за пакет ниже, чем рекламная кампания в TikTok или Instagram с тем же количеством показов, — а просмотры, полученные через платную рекламу, исчезают из публичного счётчика, как только кампания заканчивается. Просмотры от Viralefy остаются.`,
    `Для авторов в ${c}, которые публикуют по нескольку видео в неделю, небольшой буст просмотров на каждой новой загрузке — это малозатратный способ дать алгоритму нужный ранний сигнал. Гарантия восполнения на 30 дней действует и здесь — если просмотры просядут, мы заменим.`,
    `Выберите готовый пакет ниже или задайте точное количество просмотров ползунком.`,
  ],
  bullets: () => [
    { title: "Считаются алгоритмом", body: "Показы с полным просмотром, а не пропуски за секунду." },
    { title: "Reels и Stories", body: "Работает с любым форматом короткого видео." },
    { title: "Остаются на счётчике", body: "В отличие от платной рекламы, счётчик не обнуляется после окончания кампании." },
    { title: "Восполнение 30 дней", body: "Любая просадка в течение 30 дней восполняется." },
    { title: "Цена за видео", body: "Фиксированная цена за пакет. Без подписки." },
  ],
  faq: () => [
    { q: "Учитываются ли купленные просмотры в монетизации?", a: "Просмотры от Viralefy добавляются к публичному счётчику, но напрямую не влияют на критерии монетизации вроде права на Reels Bonus — платформа измеряет их отдельно." },
    { q: "Сколько идёт доставка?", a: "Небольшие заказы (до 10 тыс.) завершаются за 1–3 часа. Крупные растягиваются на 24 часа, чтобы кривая выглядела естественно." },
    { q: "Можно купить просмотры для Stories?", a: "Да — Stories поддерживаются, но только пока сториз в эфире (окно 24 часа)." },
    { q: "Дойдёт ли моё видео до более широкой аудитории?", a: "Просмотры поднимают сигнал ранжирования в алгоритме. А продвинется ли видео дальше — зависит от времени удержания и доли лайков." },
  ],
};

// -------- servicos (ru) --------
const COPY_SERV_RU: LongCopy = {
  h1: (c) => `Премиум-услуги роста для Instagram и TikTok в ${c}`,
  metaTitle: (c) => `Премиум-управление соцсетями в ${c} | Viralefy`,
  metaDescription: (c) =>
    `Управление аккаунтом, контент-стратегия и рост вручную для серьёзных авторов в ${c}.`,
  paragraphs: (c) => [
    `Премиум-услуги — для авторов в ${c}, которым нужен не разовый буст подписчиков, а непрерывная стратегия — для аккаунтов, которые строят бренд. В каждый ретейнер включены планирование контента, разборы эффективности, исследование хештегов, ритм публикаций и встроенный ежемесячный бюджет на вовлечённость.`,
    `Команда работает один-на-один с каждым клиентским аккаунтом. Мы начинаем с аудита текущих показателей (охват, уровень вовлечённости, демография подписчиков, частота публикаций), ставим цель на 90 дней и проектируем контент-календарь под её достижение. Где это уместно, мы добавляем пакеты подписчиков и вовлечённости Viralefy, чтобы ускорить кривую.`,
    `Оплата ежемесячная — без долгосрочной привязки. Отмена в один клик из аккаунта в любое время. Отчёты приходят первого числа каждого месяца с реальными цифрами, разбором того, что сработало, а что нет, и планом на ближайшие 30 дней.`,
    `Если вы рассматриваете премиум-ретейнер под серьёзный проект в ${c}, напишите в поддержку до оплаты — мы проведём короткий ознакомительный созвон, чтобы убедиться, что мы подходим друг другу, прежде чем кто-либо потратит хоть копейку.`,
    `Для всего остального самообслуживаемые пакеты подписчиков, лайков и просмотров уже закрывают самые распространённые задачи.`,
  ],
  bullets: () => [
    { title: "Ежемесячная стратегия", body: "Контент-календарь, ритм публикаций, исследование хештегов." },
    { title: "Ежемесячные отчёты", body: "Цифры, что сработало, что нет, план на ближайшие 30 дней." },
    { title: "Бюджет на вовлечённость", body: "Пакеты подписчиков и вовлечённости уже включены." },
    { title: "Отмена в любой момент", body: "Без долгосрочной привязки." },
    { title: "Живой аккаунт-менеджер", body: "Один человек ведёт ваш аккаунт — на вашем языке." },
  ],
  faq: () => [
    { q: "Это для личных или бизнес-аккаунтов?", a: "Для обоих. Мы работаем с авторами, брендами и малым бизнесом." },
    { q: "Какие обязательства?", a: "Ежемесячная оплата. Отмена в любой момент." },
    { q: "Нужно ли отдавать доступ к аккаунту?", a: "Нет. Мы согласовываем публикации с вами. Мы никогда не заходим в ваш аккаунт." },
    { q: "С чего начать?", a: "Напишите в поддержку до оформления — сначала проведём короткий ознакомительный созвон." },
  ],
};

// Tabela final — categoria × idioma → cópia. Fallback: en.
// As 6 categorias por plataforma reaproveitam o mesmo LongCopy do tipo de
// produto (a cópia já menciona Instagram e TikTok juntos), evitando duplicação.
export const COPY: Record<CategoryCode, Partial<Record<LangCode, LongCopy>>> = {
  seguidores_instagram: {
    en: COPY_SEGUIDORES_EN, pt: COPY_SEGUIDORES_PT, es: COPY_SEGUIDORES_ES, es_AR: COPY_SEGUIDORES_ES,
    fr: COPY_SEGUIDORES_FR, de: COPY_SEGUIDORES_DE, it: COPY_SEGUIDORES_IT, nl: COPY_SEGUIDORES_NL,
    ru: COPY_SEGUIDORES_RU,
  },
  seguidores_tiktok: {
    en: COPY_SEGUIDORES_EN, pt: COPY_SEGUIDORES_PT, es: COPY_SEGUIDORES_ES, es_AR: COPY_SEGUIDORES_ES,
    fr: COPY_SEGUIDORES_FR, de: COPY_SEGUIDORES_DE, it: COPY_SEGUIDORES_IT, nl: COPY_SEGUIDORES_NL,
    ru: COPY_SEGUIDORES_RU,
  },
  // Likes / Comments / Shares dividem o mesmo bloco de cópia base
  // (engagement). O CategoryGroupedGrid e a [category]/page.tsx tiram o nome
  // da primitiva do label local (CATEGORY_LABEL), então a página fica
  // semanticamente correta mesmo reaproveitando o COPY genérico.
  curtidas_instagram: {
    en: COPY_ENG_EN, pt: COPY_ENG_PT, es: COPY_ENG_ES, es_AR: COPY_ENG_ES,
    fr: COPY_ENG_FR, de: COPY_ENG_DE, it: COPY_ENG_IT, nl: COPY_ENG_NL,
    ru: COPY_ENG_RU,
  },
  curtidas_tiktok: {
    en: COPY_ENG_EN, pt: COPY_ENG_PT, es: COPY_ENG_ES, es_AR: COPY_ENG_ES,
    fr: COPY_ENG_FR, de: COPY_ENG_DE, it: COPY_ENG_IT, nl: COPY_ENG_NL,
    ru: COPY_ENG_RU,
  },
  comentarios_instagram: {
    en: COPY_ENG_EN, pt: COPY_ENG_PT, es: COPY_ENG_ES, es_AR: COPY_ENG_ES,
    fr: COPY_ENG_FR, de: COPY_ENG_DE, it: COPY_ENG_IT, nl: COPY_ENG_NL,
    ru: COPY_ENG_RU,
  },
  comentarios_tiktok: {
    en: COPY_ENG_EN, pt: COPY_ENG_PT, es: COPY_ENG_ES, es_AR: COPY_ENG_ES,
    fr: COPY_ENG_FR, de: COPY_ENG_DE, it: COPY_ENG_IT, nl: COPY_ENG_NL,
    ru: COPY_ENG_RU,
  },
  compartilhamentos_instagram: {
    en: COPY_ENG_EN, pt: COPY_ENG_PT, es: COPY_ENG_ES, es_AR: COPY_ENG_ES,
    fr: COPY_ENG_FR, de: COPY_ENG_DE, it: COPY_ENG_IT, nl: COPY_ENG_NL,
    ru: COPY_ENG_RU,
  },
  compartilhamentos_tiktok: {
    en: COPY_ENG_EN, pt: COPY_ENG_PT, es: COPY_ENG_ES, es_AR: COPY_ENG_ES,
    fr: COPY_ENG_FR, de: COPY_ENG_DE, it: COPY_ENG_IT, nl: COPY_ENG_NL,
    ru: COPY_ENG_RU,
  },
  visualizacoes_instagram: {
    en: COPY_VIEWS_EN, pt: COPY_VIEWS_PT, es: COPY_VIEWS_ES, es_AR: COPY_VIEWS_ES,
    fr: COPY_VIEWS_FR, de: COPY_VIEWS_DE, it: COPY_VIEWS_IT, nl: COPY_VIEWS_NL,
    ru: COPY_VIEWS_RU,
  },
  visualizacoes_tiktok: {
    en: COPY_VIEWS_EN, pt: COPY_VIEWS_PT, es: COPY_VIEWS_ES, es_AR: COPY_VIEWS_ES,
    fr: COPY_VIEWS_FR, de: COPY_VIEWS_DE, it: COPY_VIEWS_IT, nl: COPY_VIEWS_NL,
    ru: COPY_VIEWS_RU,
  },
  servicos: {
    en: COPY_SERV_EN, pt: COPY_SERV_PT, es: COPY_SERV_ES, es_AR: COPY_SERV_ES,
    fr: COPY_SERV_FR, de: COPY_SERV_DE, it: COPY_SERV_IT, nl: COPY_SERV_NL,
    ru: COPY_SERV_RU,
  },
  // 4 categorias novas reaproveitam o COPY de serviços premium como base —
  // são produtos de alto-toque que se beneficiam do mesmo gancho copy
  // ("hands-on growth"). Os labels (CATEGORY_LABEL) já carregam a
  // identidade visual da categoria.
  recuperacao_perfil: {
    en: COPY_SERV_EN, pt: COPY_SERV_PT, es: COPY_SERV_ES, es_AR: COPY_SERV_ES,
    fr: COPY_SERV_FR, de: COPY_SERV_DE, it: COPY_SERV_IT, nl: COPY_SERV_NL,
    ru: COPY_SERV_RU,
  },
};

export function copyFor(category: CategoryCode, lang: LangCode): LongCopy {
  return COPY[category][lang] ?? COPY[category].en ?? COPY_SEGUIDORES_EN;
}
