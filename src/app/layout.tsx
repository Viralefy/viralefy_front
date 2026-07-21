import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { THEME_COOKIE, type ResolvedTheme, type Theme } from "@/lib/theme";
import { CURRENCY_COOKIE } from "@/lib/currency";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CookieBanner } from "@/components/CookieBanner";
import { GtmLoader } from "@/components/GtmLoader";
import { TrackingHydrator } from "@/components/TrackingHydrator";
import { getNonce } from "@/lib/csp";

// Layout raiz. `<html lang>` é resolvido por request via header `x-locale`
// que o middleware seta a partir do primeiro segmento do path:
//   /br/...  → "pt-BR"  ;  /jp/... → "ja-JP"  ;  /...  (root global) → "en"
// Fix BUG-39 / BUG-122 / BUG-180 do QA 2026-06-12 (WCAG 3.1.1 + SEO).
//
// Scripts no <head>:
//   1. Anti-flash de tema — inline, executa antes do React hidratar. Lê
//      localStorage.viralefy_theme e seta data-theme no <html>. Sem isso
//      o usuário de light theme veria um flash de dark na primeira pintura.
//   2. GTM — em GtmLoader (client component), pós-consent LGPD Art. 8 §3.
//
// Twemoji REMOVIDO (2026-06-11): UI passou a usar SVG icons (components/Icon)
// e zero emoji unicode em copy. Resultado: -120KB JS de terceiros, -2 RTTs
// (preconnect+script jsdelivr), e renderização determinística cross-OS.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Title como template: pages que retornarem `title: "Login"` viram
  // "Login | Viralefy" na <title>. Pages que retornarem o título completo
  // (Service pages com SEO próprio) usam `title: { absolute: "…" }` para
  // não levar o sufixo " | Viralefy" duplicado.
  title: {
    template: "%s | Viralefy",
    default: "Viralefy — Instagram & TikTok growth",
  },
  description:
    "Real followers, engagement and views for Instagram and TikTok worldwide. Fast delivery, refill guarantee, support in your language.",
  applicationName: "Viralefy",
  authors: [{ name: "Viralefy", url: SITE_URL }],
  creator: "Viralefy",
  publisher: "Viralefy",
  formatDetection: { email: false, address: false, telephone: false },
  // robots default abrir; pages internas privadas (account/, tickets/) já
  // bloqueiam via robots.ts. Bots honestos lêem ambos.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    // `/favicon.ico` foi removido daqui: o arquivo nunca existiu em public/ e
    // o 404 aparecia como erro de console em toda página (reprovava o
    // `errors-in-console` do Lighthouse). Com um `<link rel="icon">` válido
    // declarado, o browser nem chega a pedir /favicon.ico.
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Viralefy",
    locale: "en_US",
    url: SITE_URL,
    images: [{ url: "/og/global", width: 1200, height: 630, alt: "Viralefy" }],
  },
  twitter: {
    card: "summary_large_image",
    // @viralefy é o handle do X/Twitter da marca; ajuste se o handle
    // oficial mudar (o validador da X exige este campo para o card grande).
    site: "@viralefy",
    creator: "@viralefy",
    images: ["/og/global"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "social media marketing",
  keywords: [
    "instagram followers",
    "tiktok followers",
    "instagram engagement",
    "social media growth",
    "buy followers",
    "buy views",
    "real engagement",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1a" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

// Anti-flash script — só roda quando o cookie diz "system". Lê
// prefers-color-scheme do browser e sobrescreve `data-theme`. Quando o
// cookie é "dark" ou "light" o SSR já injetou o atributo correto e este
// script é no-op. Compacto pra cair antes do <body> sem custar bytes.
const ANTI_FLASH_THEME = `
(function() {
  try {
    var ds = document.documentElement.getAttribute('data-theme-pref');
    if (ds === 'system' && window.matchMedia) {
      var m = window.matchMedia('(prefers-color-scheme: light)');
      document.documentElement.setAttribute('data-theme', m.matches ? 'light' : 'dark');
    }
  } catch (e) { /* keep SSR default */ }
})();
`;

// Lê o cookie de tema no server e devolve preferência + tema efetivo.
// `data-theme` recebe o tema efetivo (dark/light) pro CSS aplicar;
// `data-theme-pref` carrega a preferência crua (inclui `system`) pro
// script anti-flash decidir se precisa sobrescrever.
function readThemeCookie(value: string | undefined): { pref: Theme; effective: ResolvedTheme } {
  const v = value === "dark" || value === "light" || value === "system" ? value : "system";
  // SSR não consegue ler prefers-color-scheme. Servimos `dark` como tema
  // efetivo default; o script anti-flash corrige antes do paint quando
  // a preferência é `system` e o browser prefere light.
  const effective: ResolvedTheme = v === "light" ? "light" : "dark";
  return { pref: v, effective };
}

// JSON-LD Organization/WebSite NÃO vai no root layout: home e country pages
// já emitem o bloco completo via buildHomeJsonLd/buildCountryJsonLd. Repetir
// no <head> global causaria nó duplicado @type Organization que validadores
// reportam como "multiple Organization entities" warning.

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const lang = h.get("x-locale") || "en";
  // CSP nonce setado pelo middleware (round 25 Track CC). O <script> anti-flash
  // abaixo é inline e exigia `'unsafe-inline'` na CSP antiga (efetivamente
  // desligando a proteção). Agora carrega o nonce — `'strict-dynamic'` na CSP
  // bloqueia qualquer outro inline injetado por extensão/XSS.
  const nonce = await getNonce();
  const ck = await cookies();
  const { pref: themePref, effective: themeEffective } = readThemeCookie(ck.get(THEME_COOKIE)?.value);
  const currencyCookie = ck.get(CURRENCY_COOKIE)?.value ?? null;
  // RTL — árabe/hebraico/persa. Não temos infra de mirror de layout completo
  // (paddings, ordem de flex etc. são LTR-only), então só emitimos dir="rtl"
  // pra que o browser inverta inline text e bidi marks corretamente. Layout
  // visualmente ficará parcialmente quebrado mas o conteúdo permanece legível
  // — trade-off aceito pra desbloquear conteúdo nesses idiomas. RTL completo
  // (logical properties no CSS) continua pendente.
  const dir = lang.startsWith("ar") || lang.startsWith("he") || lang.startsWith("fa") ? "rtl" : "ltr";
  return (
    <html lang={lang} dir={dir} data-theme={themeEffective} data-theme-pref={themePref}>
      <head>
        {/* Resource hints — BUG-161/162/182/185 (perf). preconnect abre TCP+TLS
            cedo pros hosts críticos (LCP); dns-prefetch só resolve DNS pros
            secundários (auth/Turnstile/GTM só aparecem pós-interação ou após
            consent). Ordem importa: o browser dá orçamento limitado de
            conexões "warm" — gastamos com api+flagcdn (rendem no LCP) e
            deixamos GTM como dns-only. */}
        <link rel="preconnect" href="https://api.viralefy.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://flagcdn.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.viralefy.com" />
        <link rel="dns-prefetch" href="https://auth.viralefy.com" />
        <link rel="dns-prefetch" href="https://cdn.viralefy.com" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Anti-flash tema — antes de tudo. `nonce` vem do middleware via
            header `x-nonce`; sem ele, a CSP `script-src 'strict-dynamic'` em
            prod bloquearia este inline. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: ANTI_FLASH_THEME }} />

        {/* GTM movido pra <GtmLoader /> client component (LGPD Art. 8 §3).
            Só monta o script tag após consent analytics. Google Consent Mode
            v2 default-denied é setado lá. */}
      </head>
      <body>
        {/* Skip-to-content — pula pra <main id="main"> evitando que usuários
            de teclado tenham que tabular por todos os items do header.
            WCAG 2.4.1 Bypass Blocks. BUG-206 do QA 2026-06-12.
            Esconde visualmente mas reaparece com :focus (CSS .skip-link). */}
        <a href="#main" className="skip-link">Skip to content</a>
        {/* GTM noscript removido — LGPD não tem exceção pra "sem JS".
            Visitantes sem JS simplesmente não são medidos (aceitável). */}
        {/* GtmLoader monta o GTM em runtime SÓ após consent analytics. */}
        <GtmLoader />
        <Providers initialCurrency={currencyCookie}>
          {/* TrackingHydrator — dispara pageview/landing em CADA nav do App
              Router. Suspense pq usePathname/useSearchParams precisam de
              boundary no Next 15. */}
          <Suspense fallback={null}>
            <TrackingHydrator />
          </Suspense>
          <Header />
          {/* Wrapper com id=main pra ser o destino do skip-link. tabIndex=-1
              permite que o foco caia aqui via #main mesmo que o filho não
              seja focável. As páginas filhas continuam podendo ter seus
              próprios <main> internos. */}
          <div id="main" tabIndex={-1} style={{ outline: "none" }}>
            {children}
          </div>
          {/* WhatsApp flutuante — só renderiza se NEXT_PUBLIC_WHATSAPP_NUMBER
              estiver setado E o idioma do país atual for pt/es/es_AR. */}
          <WhatsAppButton />
        </Providers>
        {/* GDPR cookie banner — client component; renderiza só quando o
            usuário ainda não tomou decisão (localStorage vazio). */}
        <CookieBanner />
      </body>
    </html>
  );
}
