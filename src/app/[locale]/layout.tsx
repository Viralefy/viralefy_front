import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CookieBanner } from "@/components/CookieBanner";
import { GtmLoader } from "@/components/GtmLoader";
import { TrackingHydrator } from "@/components/TrackingHydrator";
import { BOOTSTRAP_JS } from "@/lib/theme-bootstrap";
import { allLocaleSegments, dirFromSegment, htmlLangFromSegment } from "@/i18n/locales";

// Root layout — AGORA sob o segmento `[locale]`. Esta é a virada que destrava o
// ISR de todo o tráfego orgânico/pago: o `<html lang>` vem de `params.locale`
// (compatível com geração estática), NÃO mais de `headers()`/`cookies()` — que
// tornavam a árvore inteira dinâmica e matavam o `revalidate` das landing pages.
//
// O locale é injetado por REWRITE no middleware: a URL pública continua
// `/us/instagram-followers`; internamente vira `/{locale}/us/instagram-followers`.
// hreflang/canonical/sitemap seguem emitindo URLs SEM prefixo — nada muda pro SEO
// já indexado. Ver ADR front-locale-segment-isr.
//
// Tema/moeda saíram do server: o `BOOTSTRAP_JS` (único inline, autorizado por
// hash na CSP) resolve o tema antes do paint e semeia a moeda salva em
// `window.__vf_currency`. `suppressHydrationWarning` no <html> porque o script
// sobrescreve `data-theme` antes do React hidratar.
//
// Twemoji REMOVIDO (2026-06-11): UI usa SVG icons; -120KB JS de terceiros.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Title como template: pages que retornarem `title: "Login"` viram
  // "Login | Viralefy". Pages com SEO próprio usam `title: { absolute: "…" }`.
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

// Pré-renderiza um segmento por locale conhecido (htmlLang dos países ∪ os
// alvos de Accept-Language). Locales fora da lista ainda renderizam on-demand
// (dynamicParams default = true) — isto é otimização, não gate.
export function generateStaticParams(): { locale: string }[] {
  return allLocaleSegments().map((locale) => ({ locale }));
}

// JSON-LD Organization/WebSite NÃO vai aqui: home e country pages emitem o bloco
// completo. Repetir no <head> global causaria nó duplicado @type Organization.

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = htmlLangFromSegment(locale);
  const dir = dirFromSegment(locale);

  return (
    <html lang={lang} dir={dir} data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Resource hints — preconnect abre TCP+TLS cedo pros hosts críticos
            (LCP); dns-prefetch só resolve DNS pros secundários (auth/Turnstile/
            GTM só aparecem pós-interação ou após consent). */}
        <link rel="preconnect" href="https://api.viralefy.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://flagcdn.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.viralefy.com" />
        <link rel="dns-prefetch" href="https://auth.viralefy.com" />
        <link rel="dns-prefetch" href="https://cdn.viralefy.com" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Bootstrap inline ÚNICO — tema (anti-flash) + seed de moeda. Autorizado
            pela CSP via `'sha256-…'` (ver middleware / theme-bootstrap). Sem nonce:
            nonce forçaria render dinâmico e mataria o ISR. */}
        <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP_JS }} />
      </head>
      <body>
        {/* Skip-to-content — WCAG 2.4.1 Bypass Blocks. */}
        <a href="#main" className="skip-link">Skip to content</a>
        {/* GtmLoader monta o GTM em runtime SÓ após consent analytics (LGPD). */}
        <GtmLoader />
        {/* Moeda vem do client: o bootstrap semeou `window.__vf_currency`; o
            Providers lê dali no init (sem cookie no server → sem render dinâmico). */}
        <Providers initialCurrency={null}>
          {/* TrackingHydrator — pageview/landing em CADA nav. Suspense pq
              usePathname/useSearchParams precisam de boundary no Next 15. */}
          <Suspense fallback={null}>
            <TrackingHydrator />
          </Suspense>
          <Header />
          <div id="main" tabIndex={-1} style={{ outline: "none" }}>
            {children}
          </div>
          <WhatsAppButton />
        </Providers>
        <CookieBanner />
      </body>
    </html>
  );
}
