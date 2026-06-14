import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Headers de segurança — recomendações OWASP + relaxa o que GTM/Flag-CDN/
// Turnstile precisam:
//   - flagcdn.com: PNGs de bandeiras de país (img-src). Substituiu emoji
//     unicode 🇺🇸 que ficava branco em Linux/Win sem fonte color emoji.
//   - GTM JS: googletagmanager.com (script-src) + dataLayer (frame-src ns.html)
//   - Turnstile (Cloudflare): challenges.cloudflare.com em script-src (api.js),
//     frame-src (iframe do desafio) e connect-src (siteverify postback).
//   - cdn.jsdelivr.net mantido em img-src/script-src por bibliotecas legacy
//     (storybook, etc.) — pode sair depois de auditoria. NÃO está mais sendo
//     usado pra Twemoji (removido 2026-06-11).
//   - Próprio: 'self' pra script/style/conexão de API
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdn.jsdelivr.net https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://flagcdn.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.viralefy.com https://auth.viralefy.com https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://challenges.cloudflare.com",
      "frame-src https://www.googletagmanager.com https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // X-Powered-By já é desabilitado via `poweredByHeader: false` abaixo.
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Sobe sourcemaps no client bundle pra Sentry conseguir des-minificar
  // stack traces. Sentry CLI faz upload + remove os .map do output final
  // no CI (passo `releases finalize`), então não vazam pro CDN público.
  productionBrowserSourceMaps: true,

  async headers() {
    // Vary: Accept-Language em rotas globais (sem country prefix). O
    // middleware seta x-locale baseado em Accept-Language nessas rotas;
    // pra cache (CDN, browser) saber que a resposta varia por idioma,
    // o Vary precisa estar explícito. O middleware tenta setar mas o
    // pipeline interno do Next sobrescreve com o Vary do RSC; aqui
    // entra no compose final via config (ordem de precedência maior).
    const VARY_ACCEPT_LANG = [
      { key: "Vary", value: "Accept-Language, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding" },
    ];
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/pricing", headers: VARY_ACCEPT_LANG },
      { source: "/vs/:competitor*", headers: VARY_ACCEPT_LANG },
      { source: "/cities/:city*", headers: VARY_ACCEPT_LANG },
      { source: "/case-studies/:path*", headers: VARY_ACCEPT_LANG },
    ];
  },

  async redirects() {
    return [
      { source: "/pt/seguidores-brasileiros", destination: "/br", permanent: true },
      { source: "/en/american-followers", destination: "/us", permanent: true },
      { source: "/es/seguidores-reales", destination: "/es", permanent: true },
      { source: "/fr/abonnes-instagram", destination: "/fr", permanent: true },
      { source: "/de/instagram-follower-kaufen", destination: "/de", permanent: true },
      { source: "/it/follower-instagram", destination: "/it", permanent: true },
      // Aliases comuns que viraram 404 — backups pra usuários que adivinham
      // a URL e bookmarks de marketing externos (BUG-78/38 do QA 2026-06-12).
      // "saves" e "salvamentos" são tratados como categoria de
      // compartilhamentos no DB; servicos-premium é o antigo slug de /servicos.
      { source: "/:country/salvamentos-instagram", destination: "/:country/compartilhamentos-instagram", permanent: true },
      { source: "/:country/salvamentos-instagram/:slug", destination: "/:country/compartilhamentos-instagram/:slug", permanent: true },
      { source: "/:country/saves-instagram", destination: "/:country/compartilhamentos-instagram", permanent: true },
      { source: "/:country/saves-tiktok", destination: "/:country/compartilhamentos-tiktok", permanent: true },
      { source: "/:country/servicos-premium", destination: "/:country/servicos", permanent: true },
      { source: "/:country/servicos-premium/:slug", destination: "/:country/servicos/:slug", permanent: true },
      // Link clássico de rodapé que ainda aparece em emails antigos.
      { source: "/system-status", destination: "/status", permanent: true },
    ];
  },
};

// withSentryConfig integra source maps + tunnel route + auto-instrument SDK.
// Sem SENTRY_AUTH_TOKEN, o upload de source maps é skipped (build não falha).
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT_FRONT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Bundle só sobe se houver token; sem ele, build segue sem upload.
  disableLogger: true,
  tunnelRoute: "/monitoring",
  // sourcemaps: { disable: true } se quiser pular upload no build CI.
});
