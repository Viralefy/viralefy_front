import type { Metadata } from "next";
import { withGlobalGraph } from "@/lib/jsonld";
import { JsonLdScript } from "@/components/JsonLdScript";
import CookiePreferencesClient from "./CookiePreferencesClient";

// Round 25 Track CC: server component wrapper. O JSON-LD precisa do `nonce`
// da CSP per-request, e CSP/`nonce` só são acessíveis em server components.
// O conteúdo interativo (toggles, useState, navigator.language) continua em
// CookiePreferencesClient.tsx ("use client").
//
// O `inLanguage` do schema vai como "en" canônico (o detector real é
// client-side via navigator.language e ajusta a UI). Para o crawler, EN
// canônico é suficiente — esta página é hub legal, sem SEO localizado.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const PAGE_PATH = "/legal/cookie-preferences";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Cookie preferences | Viralefy",
  description:
    "Review and update your cookie preferences for Viralefy. Manage preferences, analytics and marketing cookies, or reset your choices.",
  alternates: { canonical: PAGE_URL },
};

export default function CookiePreferencesPage() {
  // BUG-191 / Track CC: withGlobalGraph prepende Org+WebSite ao @graph (sem
  // isso, WebPage.isPartOf vira ponteiro pendurado pro validador).
  const jsonLd = withGlobalGraph(
    [
      {
        "@type": "WebPage",
        "@id": `${PAGE_URL}#webpage`,
        url: PAGE_URL,
        name: "Cookie preferences | Viralefy",
        description:
          "Review and update your cookie preferences for Viralefy. Manage preferences, analytics and marketing cookies, or reset your choices.",
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Legal", item: `${SITE_URL}/legal/privacy` },
          { "@type": "ListItem", position: 3, name: "Cookie preferences", item: PAGE_URL },
        ],
      },
    ],
    { siteUrl: SITE_URL, inLanguage: "en" },
  );

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <CookiePreferencesClient />
    </>
  );
}
