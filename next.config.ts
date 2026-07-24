import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Sentry só entra no build (e no bundle client) quando há como reportar: token
// de upload OU DSN. Em HML/POC ambos são vazios, então `withSentryConfig` NÃO é
// aplicado — o SDK `@sentry/nextjs` fica FORA do bundle client (era ~JS morto
// que o Lighthouse flagava como `unused-javascript`). Ligar Sentry = setar
// SENTRY_AUTH_TOKEN (upload de source maps) e/ou NEXT_PUBLIC_SENTRY_DSN.
const SENTRY_ENABLED = Boolean(
  process.env.SENTRY_AUTH_TOKEN || process.env.NEXT_PUBLIC_SENTRY_DSN,
);

// Headers de segurança estáticos. A CSP mora no middleware (`src/middleware.ts`,
// `CSP_STATIC`) — agora ESTÁTICA (hash, sem nonce), pra não forçar render
// dinâmico. O resto (X-Frame-Options, nosniff, Referrer-Policy,
// Permissions-Policy, COOP) continua estático porque não depende do request.
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

  // Source maps de client só quando o Sentry está ligado (há token/DSN) — eles
  // existem pra o Sentry des-minificar stack traces. Sem Sentry (HML/POC) gerar
  // .map é trabalho de build desperdiçado e risco de vazamento; desligado.
  productionBrowserSourceMaps: SENTRY_ENABLED,

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

// withSentryConfig integra source maps + tunnel route + auto-instrument do SDK
// client. Aplicá-lo é o que INJETA o `@sentry/nextjs` no bundle client. Por isso
// só aplicamos quando SENTRY_ENABLED — senão o SDK nem entra no bundle (o ganho
// de peso pro Lighthouse). Ligado, mantém o comportamento anterior.
export default SENTRY_ENABLED
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT_FRONT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disableLogger: true,
      tunnelRoute: "/monitoring",
    })
  : nextConfig;
