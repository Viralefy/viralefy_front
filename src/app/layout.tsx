import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";

// Layout raiz. O `<html lang>` é "en" porque o root agora é a home global;
// páginas de país sobrescrevem o lang no `<article lang>` interno e via
// metadata `htmlLang`. Para evitar flicker do CSR, mantemos o lang base em
// inglês — engines usam tanto o <html lang> quanto o `lang` dos sub-blocos.

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Viralefy — Instagram & TikTok growth",
  description:
    "Real followers, engagement and views for Instagram and TikTok worldwide. Fast delivery, refill guarantee, support in your language.",
};

const GTM_ID = "GTM-K7GQ4H32";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager — inline o mais alto possível.
            `afterInteractive` (default do next/script) injeta a tag <script>
            no <head> assim que o documento começa a hidratar. Para GTM esse
            timing entrega `gtm.js` em ~50–150ms após o HTML parse — o mesmo
            window que o snippet manual entregaria. */}
        <Script id="gtm-head" strategy="afterInteractive">{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
        `}</Script>
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
        </Providers>
      </body>
    </html>
  );
}
