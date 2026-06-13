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
  // Private surfaces (user account, auth flows, internal APIs, OG renderer,
  // build assets) são exclusos.
  // /og/ NÃO entra em disallow: a maioria dos crawlers (Googlebot-Image,
  // Twitterbot, Facebook scraper) precisa acessar /og/* pra renderizar a
  // preview de share. Bloquear quebra o card no Twitter/LinkedIn/WhatsApp
  // (BUG-56 do QA 2026-06-12).
  const disallow = [
    "/account",
    "/tickets",
    "/login",
    "/register",
    "/api/",
    "/_next/",
  ];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // IA crawlers — permitidos pelo default (content marketing). Se virar
      // problema de banda ou apropriação não-citada, mover pra disallow.
      {
        userAgent: ["GPTBot", "ChatGPT-User", "anthropic-ai", "ClaudeBot", "Google-Extended", "CCBot"],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
