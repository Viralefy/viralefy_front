import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Headers de segurança estáticos. A CSP foi MOVIDA pro middleware no round 25
// (Track CC) porque o front passou a gerar `nonce` per-request — não dá pra
// declarar o nonce estaticamente aqui. Vide `src/middleware.ts` (`buildCsp`).
// O resto (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP)
// continua estático porque não depende do request.
const SECURITY_HEADERS = [
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
    // Cache imutável pra hashed bundles do Next (`_next/static/*` carrega
    // hash no path, então qualquer mudança gera URL nova — seguro fixar 1y).
    // O Next já manda esse header em prod, mas o Caddy/proxy em frente pode
    // reescrever; reafirmar aqui garante o contrato no compose final.
    // BUG-161/162 (perf): força immutable nas builds que vão pro CDN.
    const STATIC_IMMUTABLE = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ];
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/pricing", headers: VARY_ACCEPT_LANG },
      { source: "/vs/:competitor*", headers: VARY_ACCEPT_LANG },
      { source: "/cities/:city*", headers: VARY_ACCEPT_LANG },
      { source: "/case-studies/:path*", headers: VARY_ACCEPT_LANG },
      { source: "/_next/static/:path*", headers: STATIC_IMMUTABLE },
      { source: "/fonts/:path*", headers: STATIC_IMMUTABLE },
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
