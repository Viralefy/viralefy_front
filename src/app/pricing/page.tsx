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

const PRICING: Record<PageLang, PricingPack> = {
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
  es: {
    metaTitle: "Precios transparentes en USDT — Viralefy",
    metaDescription:
      "Compara los precios de Viralefy para seguidores, likes y vistas en Instagram y TikTok. Precios en USDT/USD, sin contraseña, con reposición garantizada.",
    heroTitle: "Precios transparentes en USDT",
    heroSubtitle:
      "Una tabla canónica en USD/USDT para 130 mercados. Las monedas locales son solo visualización — el cobro es siempre en USD estable.",
    tableFollowers: "Seguidores",
    tableLikes: "Likes",
    tableViews: "Vistas",
    thPlatform: "Plataforma",
    uspRefillTitle: "Reposición garantizada",
    uspRefillBody: "Las bajas en los primeros 30 días se reponen automáticamente, sin coste adicional.",
    uspPasswordTitle: "Sin contraseña",
    uspPasswordBody: "Solo pedimos el @ público o el enlace del post — nunca tus credenciales.",
    uspCryptoTitle: "Cripto primero",
    uspCryptoBody: "Paga en USDT, BTC, ETH o más de 50 activos. Precio estable en USD en todo el catálogo.",
    uspSupportTitle: "Soporte 24/7",
    uspSupportBody: "Tickets atendidos por humanos cada día. Respuesta media en menos de 2 horas.",
    browseAll: "Explorar los 130 mercados",
    schemaPageName: "Precios Viralefy",
    schemaPageDesc: "Precios transparentes en USDT para planes de engagement en Instagram y TikTok.",
    breadcrumbHome: "Inicio",
    breadcrumbPricing: "Precios",
  },
  fr: {
    metaTitle: "Tarifs transparents en USDT — Viralefy",
    metaDescription:
      "Comparez les tarifs Viralefy pour les abonnés, likes et vues sur Instagram et TikTok. Prix en USDT/USD, sans mot de passe, avec garantie de recharge.",
    heroTitle: "Tarifs transparents en USDT",
    heroSubtitle:
      "Une grille canonique en USD/USDT sur 130 marchés. Les devises locales sont uniquement affichées — la facturation se fait toujours en USD stable.",
    tableFollowers: "Abonnés",
    tableLikes: "Likes",
    tableViews: "Vues",
    thPlatform: "Plateforme",
    uspRefillTitle: "Garantie de recharge",
    uspRefillBody: "Les pertes dans les 30 jours sont rechargées automatiquement, sans frais.",
    uspPasswordTitle: "Aucun mot de passe",
    uspPasswordBody: "On vous demande uniquement votre @ public ou le lien du post — jamais vos identifiants.",
    uspCryptoTitle: "Crypto en priorité",
    uspCryptoBody: "Payez en USDT, BTC, ETH ou plus de 50 actifs. Prix stable en USD sur tout le catalogue.",
    uspSupportTitle: "Support 24/7",
    uspSupportBody: "Des tickets traités par des humains chaque jour. Réponse moyenne en moins de 2 heures.",
    browseAll: "Explorer les 130 marchés",
    schemaPageName: "Tarifs Viralefy",
    schemaPageDesc: "Tarifs transparents en USDT pour les formules d'engagement sur Instagram et TikTok.",
    breadcrumbHome: "Accueil",
    breadcrumbPricing: "Tarifs",
  },
  de: {
    metaTitle: "Transparente Preise in USDT — Viralefy",
    metaDescription:
      "Vergleichen Sie Viralefy-Preise für Follower, Likes und Views auf Instagram und TikTok. Preise in USDT/USD, ohne Passwort, mit Auffüll-Garantie.",
    heroTitle: "Transparente Preise in USDT",
    heroSubtitle:
      "Eine kanonische Preisliste in USD/USDT für 130 Märkte. Lokale Währungen dienen nur der Anzeige — abgerechnet wird immer in stabilem USD.",
    tableFollowers: "Follower",
    tableLikes: "Likes",
    tableViews: "Views",
    thPlatform: "Plattform",
    uspRefillTitle: "Auffüll-Garantie",
    uspRefillBody: "Verluste innerhalb von 30 Tagen werden automatisch und kostenlos aufgefüllt.",
    uspPasswordTitle: "Kein Passwort nötig",
    uspPasswordBody: "Wir brauchen nur Ihr öffentliches @ oder den Beitrags-Link — niemals Ihre Zugangsdaten.",
    uspCryptoTitle: "Krypto-First",
    uspCryptoBody: "Zahlen Sie in USDT, BTC, ETH oder über 50 Assets. Stabile USD-Preise im gesamten Katalog.",
    uspSupportTitle: "24/7-Support",
    uspSupportBody: "Tickets werden täglich von Menschen beantwortet. Durchschnittliche Antwortzeit unter 2 Stunden.",
    browseAll: "Alle 130 Märkte ansehen",
    schemaPageName: "Viralefy Preise",
    schemaPageDesc: "Transparente Preise in USDT für Engagement-Pakete auf Instagram und TikTok.",
    breadcrumbHome: "Start",
    breadcrumbPricing: "Preise",
  },
  ja: {
    metaTitle: "USDT建ての透明な価格 — Viralefy",
    metaDescription:
      "Instagram と TikTok のフォロワー、いいね、再生数の Viralefy 価格を比較。USDT/USD 建て、パスワード不要、リフィル保証付き。",
    heroTitle: "USDT建ての透明な価格",
    heroSubtitle:
      "130市場に対する USD/USDT の単一価格表。現地通貨は表示のみで、請求は常に安定した USD で行われます。",
    tableFollowers: "フォロワー",
    tableLikes: "いいね",
    tableViews: "再生数",
    thPlatform: "プラットフォーム",
    uspRefillTitle: "リフィル保証",
    uspRefillBody: "30日以内の減少は追加料金なしで自動的に補充されます。",
    uspPasswordTitle: "パスワード不要",
    uspPasswordBody: "必要なのは公開プロフィールまたは投稿の URL のみ — 認証情報は決して求めません。",
    uspCryptoTitle: "クリプト・ファースト",
    uspCryptoBody: "USDT、BTC、ETH など50以上のアセットで支払い可能。カタログ全体で安定した USD 価格。",
    uspSupportTitle: "24時間365日サポート",
    uspSupportBody: "毎日、人によるチケット対応。平均応答時間は2時間以内。",
    browseAll: "130市場をすべて見る",
    schemaPageName: "Viralefy 価格",
    schemaPageDesc: "Instagram と TikTok のエンゲージメントプラン向けの USDT 建て透明な価格。",
    breadcrumbHome: "ホーム",
    breadcrumbPricing: "価格",
  },
  it: {
    metaTitle: "Prezzi trasparenti in USDT — Viralefy",
    metaDescription:
      "Confronta i prezzi Viralefy per follower, like e visualizzazioni su Instagram e TikTok. Prezzi in USDT/USD, senza password, con garanzia di reintegro.",
    heroTitle: "Prezzi trasparenti in USDT",
    heroSubtitle:
      "Un unico listino canonico in USD/USDT per 130 mercati. Le valute locali sono solo a scopo di visualizzazione — l'addebito avviene sempre in USD stabile.",
    tableFollowers: "Follower",
    tableLikes: "Like",
    tableViews: "Visualizzazioni",
    thPlatform: "Piattaforma",
    uspRefillTitle: "Garanzia di reintegro",
    uspRefillBody: "I cali entro 30 giorni vengono reintegrati automaticamente, senza costi aggiuntivi.",
    uspPasswordTitle: "Nessuna password richiesta",
    uspPasswordBody: "Ci serve solo il profilo pubblico o il link al post — mai le Sue credenziali.",
    uspCryptoTitle: "Crypto al primo posto",
    uspCryptoBody: "Paghi in USDT, BTC, ETH o oltre 50 asset. Prezzi stabili in USD su tutto il catalogo.",
    uspSupportTitle: "Supporto 24/7",
    uspSupportBody: "Ticket gestiti da persone reali ogni giorno. Risposta media entro 2 ore.",
    browseAll: "Esplora tutti i 130 mercati",
    schemaPageName: "Prezzi Viralefy",
    schemaPageDesc: "Prezzi trasparenti in USDT per i piani di engagement su Instagram e TikTok.",
    breadcrumbHome: "Home",
    breadcrumbPricing: "Prezzi",
  },
  ru: {
    metaTitle: "Прозрачные цены в USDT — Viralefy",
    metaDescription:
      "Сравните цены Viralefy на подписчиков, лайки и просмотры в Instagram и TikTok. Цены в USDT/USD, без пароля, с гарантией восполнения.",
    heroTitle: "Прозрачные цены в USDT",
    heroSubtitle:
      "Единый канонический прайс в USD/USDT для 130 рынков. Локальные валюты показываются только для удобства — списание всегда в стабильных USD.",
    tableFollowers: "Подписчики",
    tableLikes: "Лайки",
    tableViews: "Просмотры",
    thPlatform: "Платформа",
    uspRefillTitle: "Гарантия восполнения",
    uspRefillBody: "Отписки в течение 30 дней восполняются автоматически и без доплат.",
    uspPasswordTitle: "Без пароля",
    uspPasswordBody: "Нам нужен только публичный профиль или ссылка на пост — никаких учётных данных.",
    uspCryptoTitle: "Сначала крипта",
    uspCryptoBody: "Оплата в USDT, BTC, ETH и более 50 активах. Стабильные цены в USD по всему каталогу.",
    uspSupportTitle: "Поддержка 24/7",
    uspSupportBody: "Тикеты обрабатываются людьми каждый день. Средний ответ — менее 2 часов.",
    browseAll: "Посмотреть все 130 рынков",
    schemaPageName: "Цены Viralefy",
    schemaPageDesc: "Прозрачные цены в USDT на пакеты вовлечения для Instagram и TikTok.",
    breadcrumbHome: "Главная",
    breadcrumbPricing: "Цены",
  },
  nl: {
    metaTitle: "Transparante prijzen in USDT — Viralefy",
    metaDescription:
      "Vergelijk Viralefy-prijzen voor Instagram- en TikTok-volgers, likes en views. Prijzen in USDT/USD, geen wachtwoord nodig, met aanvulgarantie.",
    heroTitle: "Transparante prijzen in USDT",
    heroSubtitle:
      "Eén canonieke prijslijst in USD/USDT voor 130 markten. Lokale valuta's zijn alleen ter weergave — afrekenen gebeurt altijd in stabiele USD.",
    tableFollowers: "Volgers",
    tableLikes: "Likes",
    tableViews: "Views",
    thPlatform: "Platform",
    uspRefillTitle: "Aanvulgarantie",
    uspRefillBody: "Uitval binnen 30 dagen wordt automatisch en zonder extra kosten aangevuld.",
    uspPasswordTitle: "Geen wachtwoord nodig",
    uspPasswordBody: "We hebben alleen je openbare @ of post-link nodig — nooit je inloggegevens.",
    uspCryptoTitle: "Crypto eerst",
    uspCryptoBody: "Betaal in USDT, BTC, ETH of 50+ assets. Stabiele USD-prijzen in de hele catalogus.",
    uspSupportTitle: "24/7-support",
    uspSupportBody: "Elke dag tickets beantwoord door mensen. Gemiddelde reactietijd onder 2 uur.",
    browseAll: "Bekijk alle 130 markten",
    schemaPageName: "Viralefy-prijzen",
    schemaPageDesc: "Transparante prijzen in USDT voor engagement-pakketten op Instagram en TikTok.",
    breadcrumbHome: "Home",
    breadcrumbPricing: "Prijzen",
  },
  ko: {
    metaTitle: "USDT 기반 투명한 가격 — Viralefy",
    metaDescription:
      "Instagram 및 TikTok 팔로워, 좋아요, 조회수에 대한 Viralefy 가격을 비교하세요. USDT/USD 기준, 비밀번호 불필요, 리필 보장 제공.",
    heroTitle: "USDT 기반 투명한 가격",
    heroSubtitle:
      "130개 시장을 아우르는 USD/USDT 단일 가격표입니다. 현지 통화는 표시용일 뿐이며 결제는 항상 안정적인 USD로 진행됩니다.",
    tableFollowers: "팔로워",
    tableLikes: "좋아요",
    tableViews: "조회수",
    thPlatform: "플랫폼",
    uspRefillTitle: "리필 보장",
    uspRefillBody: "30일 이내 이탈은 추가 비용 없이 자동으로 리필됩니다.",
    uspPasswordTitle: "비밀번호 불필요",
    uspPasswordBody: "공개 프로필 또는 게시물 URL만 있으면 됩니다 — 인증 정보는 절대 요구하지 않습니다.",
    uspCryptoTitle: "크립토 우선",
    uspCryptoBody: "USDT, BTC, ETH 등 50개 이상의 자산으로 결제할 수 있습니다. 전체 카탈로그에서 안정적인 USD 가격을 유지합니다.",
    uspSupportTitle: "24시간 연중무휴 지원",
    uspSupportBody: "매일 사람이 직접 티켓에 응대합니다. 평균 응답 시간은 2시간 이내입니다.",
    browseAll: "130개 시장 모두 보기",
    schemaPageName: "Viralefy 가격",
    schemaPageDesc: "Instagram 및 TikTok 인게이지먼트 플랜을 위한 USDT 기반 투명한 가격.",
    breadcrumbHome: "홈",
    breadcrumbPricing: "가격",
  },
};

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
