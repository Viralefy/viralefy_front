import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CookieBanner } from "@/components/CookieBanner";
import { GtmLoader } from "@/components/GtmLoader";
import { TrackingHydrator } from "@/components/TrackingHydrator";

// Layout raiz. `<html lang>` é "en" (root é home global em inglês); páginas
// de país sobrescrevem o lang no `<article lang>` interno.
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
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
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

// Anti-flash inline. Executa antes do <body> aparecer.
const ANTI_FLASH_THEME = `
(function() {
  try {
    var t = localStorage.getItem('viralefy_theme');
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

// JSON-LD Organization/WebSite NÃO vai no root layout: home e country pages
// já emitem o bloco completo via buildHomeJsonLd/buildCountryJsonLd. Repetir
// no <head> global causaria nó duplicado @type Organization que validadores
// reportam como "multiple Organization entities" warning.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Anti-flash tema — antes de tudo */}
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_THEME }} />

        {/* GTM movido pra <GtmLoader /> client component (LGPD Art. 8 §3).
            Só monta o script tag após consent analytics. Google Consent Mode
            v2 default-denied é setado lá. */}
      </head>
      <body>
        {/* GTM noscript removido — LGPD não tem exceção pra "sem JS".
            Visitantes sem JS simplesmente não são medidos (aceitável). */}
        {/* GtmLoader monta o GTM em runtime SÓ após consent analytics. */}
        <GtmLoader />
        <Providers>
          {/* TrackingHydrator — dispara pageview/landing em CADA nav do App
              Router. Suspense pq usePathname/useSearchParams precisam de
              boundary no Next 15. */}
          <Suspense fallback={null}>
            <TrackingHydrator />
          </Suspense>
          <Header />
          {children}
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
