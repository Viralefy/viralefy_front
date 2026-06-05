import type { MetadataRoute } from "next";

// robots.txt — abre tudo pra crawlers honestos, indica o sitemap canônico.
// Em HML/POC queremos que Google + Bing + Yandex indexem tudo.
//
// IMPORTANTE: NÃO emitir a directive `Host:`. Era uma extensão legada do
// Yandex (nunca padronizada — RFC 9309 de 2022 só reconhece User-agent,
// Allow, Disallow, Sitemap). Google e Bing reportam "Syntax not understood"
// no validator. O próprio Yandex moderno usa canonical link + sitemap pra
// resolver host preferido, então `Host:` virou ruído puro.
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/account", "/tickets", "/login", "/register", "/api/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
