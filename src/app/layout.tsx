import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";

// Layout raiz. `<html lang>` é "en" (root é home global em inglês); páginas
// de país sobrescrevem o lang no `<article lang>` interno.
//
// Três scripts ficam no <head>:
//   1. Anti-flash de tema — inline, executa antes do React hidratar. Lê
//      localStorage.viralefy_theme e seta data-theme no <html>. Sem isso
//      o usuário de light theme veria um flash de dark na primeira pintura.
//   2. Google Tag Manager — inline conforme snippet oficial.
//   3. Twemoji — substitui emoji unicode por <img> SVG na CDN da jsdelivr;
//      fix universal pras bandeirinhas brancas em sistemas sem fonte de
//      emoji color (e.g. Debian/Ubuntu sem fonts-noto-color-emoji).

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
  authors: [{ name: "Viralefy" }],
  creator: "Viralefy",
  publisher: "Viralefy",
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [{ url: "/favicon.ico" }],
    apple: [{ url: "/logo.png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Viralefy",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const GTM_ID = "GTM-K7GQ4H32";

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

// Twemoji parse loop com MutationObserver pra cobrir Next.js client nav.
const TWEMOJI_INIT = `
(function() {
  function parse() {
    if (window.twemoji) {
      try {
        window.twemoji.parse(document.body, {
          folder: 'svg',
          ext: '.svg',
          base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/',
          className: 'emoji',
        });
      } catch (e) { /* engole — se falhar caímos no fallback de fonte */ }
    }
  }
  function schedule() {
    if (window.__vfyTimer) clearTimeout(window.__vfyTimer);
    window.__vfyTimer = setTimeout(parse, 80);
  }
  function init() {
    parse();
    if (window.MutationObserver) {
      new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* 1. Anti-flash tema — antes de tudo */}
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_THEME }} />

        {/* 2. Google Tag Manager — inline o mais alto possível */}
        <Script id="gtm-head" strategy="afterInteractive">{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
        `}</Script>

        {/* 3. Twemoji — CDN + init loop. Tag SVG via jdecked/twemoji (mantido). */}
        <Script
          src="https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <Script id="twemoji-init" strategy="afterInteractive">{TWEMOJI_INIT}</Script>
      </head>
      <body>
        {/* GTM noscript — primeira coisa dentro do <body> */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Providers>
          <Header />
          {children}
          {/* WhatsApp flutuante — só renderiza se NEXT_PUBLIC_WHATSAPP_NUMBER
              estiver setado E o idioma do país atual for pt/es/es_AR. */}
          <WhatsAppButton />
        </Providers>
        {/*
          TODO: backend cron will pick this up — adds a column
          `notified_abandoned_at` to orders table and runs hourly to e-mail
          carrinhos abandonados (criamos `order` mas o pagamento não foi
          confirmado em N horas). Nada a fazer do lado front aqui — esta nota
          fica como lembrete para o time backend.
        */}
      </body>
    </html>
  );
}
