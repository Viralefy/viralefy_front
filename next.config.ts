import type { NextConfig } from "next";

// Headers de segurança — recomendações OWASP + relaxa o que GTM/Twemoji/SVG
// CDN/Turnstile precisam:
//   - Twemoji SVG: cdn.jsdelivr.net (img-src)
//   - GTM JS: googletagmanager.com (script-src) + dataLayer (frame-src ns.html)
//   - Turnstile (Cloudflare): challenges.cloudflare.com em script-src (api.js),
//     frame-src (iframe do desafio) e connect-src (siteverify postback).
//   - Próprio: 'self' pra script/style/conexão de API
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdn.jsdelivr.net https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://cdn.jsdelivr.net https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.viralefy.com https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://challenges.cloudflare.com",
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

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
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
    ];
  },
};

export default nextConfig;
