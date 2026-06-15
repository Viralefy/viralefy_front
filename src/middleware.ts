import { NextRequest, NextResponse } from "next/server";

// Middleware do front. Responsabilidades:
//
// 1. Injeta dois headers usáveis pelo RootLayout:
//      x-pathname  → path bruto (pra debugging/SSR-aware components)
//      x-locale    → BCP47 do mercado atual (pra emitir <html lang=…> correto)
//
// 2. Geo-redirect 1-shot na raiz (BUG-200 do QA round 22) — vide bloco abaixo.
//
// 3. CSP com nonce por-request (round 25 Track CC) — gera nonce CSPRNG via
//    `crypto.randomUUID()`, propaga via header de request `x-nonce` (Next 15
//    App Router detecta e injeta automaticamente em scripts da framework e
//    `<Script>` do next/script com prop `nonce`) e emite o
//    `Content-Security-Policy` na response. Elimina o `'unsafe-inline'` de
//    script-src — antes a CSP estava no `next.config.ts` headers() e tinha que
//    permitir inline porque o anti-flash de tema (layout.tsx) e os scripts
//    JSON-LD das pages são inline. Com nonce, cada um recebe o token e
//    `'strict-dynamic'` cobre scripts carregados dinamicamente (GTM, Turnstile).
//
//    `style-src` permanece com `'unsafe-inline'`: Next 15 injeta styles inline
//    sem propagar nonce de forma confiável (next/font, CSS modules em dev,
//    runtime style insertion). Débito documentado — alinhar com o backoffice
//    (mesmo trade-off).
//
// Resolução do locale:
//   1. Se o primeiro segmento é um country code conhecido (/br, /us, /jp…),
//      usa o htmlLang dele. Country-scoped sempre vence.
//   2. Senão, em rotas globais (/pricing, /vs/*, /cities/*, /case-studies…),
//      tenta o Accept-Language: o primeiro idioma com weight > 0 que tenha
//      pack PT/EN suportado. Permite que /br?Accept-Language=pt sirva PT
//      em rotas sem country prefix sem precisar duplicar URL.
//   3. Fallback final: "en".
//
// Custo: ~0.2ms por request (nonce + CSP build + locale resolve). Sem fetch.

import { COUNTRIES } from "@/i18n/countries";

const COUNTRY_LANG = new Map(COUNTRIES.map((c) => [c.code, c.htmlLang]));
const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));

// User-Agents que NUNCA devem ser redirecionados — crawlers precisam ver o
// conteúdo canônico da raiz (sitemap, OG meta) sem desviar pra um país.
const BOT_UA_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview/i;

// Em dev, React/Next precisam de 'unsafe-eval' (reconstrói stacks SSR no
// client). Sem isso o console fica cheio de CSP violations e a DX morre —
// débito aceito apenas em NODE_ENV=development. Mesmo trade-off do backoffice.
const IS_DEV = process.env.NODE_ENV === "development";

function buildCsp(nonce: string): string {
  // Hosts permitidos (espelha o que estava no next.config.ts antes do round 25):
  //   - googletagmanager: GTM JS (script-src + frame-src + connect-src ns.html)
  //   - challenges.cloudflare.com: Turnstile (script-src + frame-src + connect-src)
  //   - flagcdn: PNG de bandeiras (img-src)
  //   - cdn.jsdelivr.net: bibliotecas legacy (storybook etc.) — auditar e remover
  //   - api/auth/cdn.viralefy: backends próprios (connect-src + preconnect)
  //   - google-analytics: GA endpoints (img-src + connect-src)
  //
  // `'strict-dynamic'`: scripts carregados dinamicamente por scripts com nonce
  // herdam confiança — necessário pro GtmLoader que injeta gtm.js em runtime.
  // Quando `'strict-dynamic'` está presente, navegadores modernos IGNORAM as
  // allowlists de host pra script-src (cdn.jsdelivr/googletagmanager/etc.) e
  // confiam só no que vem de scripts já-nonce'd. Mantemos as allowlists pra
  // navegadores sem suporte a `'strict-dynamic'` (fallback CSP1).
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://cdn.jsdelivr.net https://challenges.cloudflare.com${IS_DEV ? " 'unsafe-eval'" : ""}`,
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
  ];
  return directives.join("; ");
}

function detectAcceptLanguage(req: NextRequest): string | null {
  const h = req.headers.get("accept-language");
  if (!h) return null;
  // Parse Accept-Language: pt-BR,pt;q=0.9,en;q=0.8 → ["pt-BR","pt","en"]
  const tags = h
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      const weight = q ? parseFloat(q.slice(2)) : 1;
      return { tag: tag.toLowerCase(), weight: Number.isFinite(weight) ? weight : 0 };
    })
    .filter((t) => t.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  for (const { tag } of tags) {
    if (tag.startsWith("pt")) return "pt-BR";
    if (tag.startsWith("es")) return "es-ES";
    if (tag.startsWith("fr")) return "fr-FR";
    if (tag.startsWith("de")) return "de-DE";
    if (tag.startsWith("ja")) return "ja-JP";
    if (tag.startsWith("it")) return "it-IT";
    if (tag.startsWith("ru")) return "ru-RU";
    if (tag.startsWith("nl")) return "nl-NL";
    if (tag.startsWith("ko")) return "ko-KR";
    if (tag.startsWith("ar")) return "ar-SA";
    if (tag.startsWith("zh")) return "zh-CN";
    if (tag.startsWith("hi")) return "hi-IN";
    if (tag.startsWith("tr")) return "tr-TR";
    if (tag.startsWith("pl")) return "pl-PL";
    if (tag.startsWith("sv")) return "sv-SE";
    if (tag.startsWith("da")) return "da-DK";
    if (tag.startsWith("nb") || tag.startsWith("no")) return "nb-NO";
    if (tag.startsWith("fi")) return "fi-FI";
    if (tag.startsWith("he") || tag.startsWith("iw")) return "he-IL";
    if (tag.startsWith("uk")) return "uk-UA";
    if (tag.startsWith("cs")) return "cs-CZ";
    if (tag.startsWith("sk")) return "sk-SK";
    if (tag.startsWith("th")) return "th-TH";
    if (tag.startsWith("vi")) return "vi-VN";
    if (tag.startsWith("id")) return "id-ID";
    if (tag.startsWith("en")) return "en";
  }
  return null;
}

// detectCountry tenta extrair o ISO 3166-1 alpha-2 do request via headers de
// edge networks. Retorna lowercase ou null. NUNCA confia em IP DIY — só nos
// headers que CF/Vercel inserem, que são forjáveis por usuário externo mas
// não são vetor de attack aqui (impacto = redirect 302, não auth).
function detectCountry(req: NextRequest): string | null {
  const raw =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    "";
  if (!raw || raw === "XX" || raw === "T1") return null; // CF usa XX/T1 pra Tor
  return raw.toLowerCase();
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const seg = path.split("/")[1] ?? "";

  // BUG-200: geo-redirect na raiz. Só dispara quando:
  //   - path é exatamente `/` (não `/pricing`, não `/vs/...`)
  //   - sem query string que indique link explícito (`?nogeo=1` opt-out)
  //   - cookie de "já redirecionei" ausente
  //   - UA não é bot/crawler (preserva SEO da raiz canônica)
  //   - header de geo presente E país está na nossa allowlist
  if (path === "/" && req.method === "GET") {
    const optOut = req.nextUrl.searchParams.has("nogeo");
    const already = req.cookies.get("vf_geo_redirected")?.value;
    const ua = req.headers.get("user-agent") || "";
    const isBot = BOT_UA_RE.test(ua);
    if (!optOut && !already && !isBot) {
      const cc = detectCountry(req);
      if (cc && COUNTRY_CODES.has(cc)) {
        const url = req.nextUrl.clone();
        url.pathname = `/${cc}`;
        const redirect = NextResponse.redirect(url, 302);
        // 30d — quando expira o usuário pode ser re-redirecionado caso o
        // IP atual indique outro país (ex.: viagem).
        redirect.cookies.set("vf_geo_redirected", "1", {
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
          sameSite: "lax",
          httpOnly: false, // o front pode ler pra exibir "voltar pra raiz"
        });
        return redirect;
      }
    }
  }

  let locale = COUNTRY_LANG.get(seg);
  if (!locale) {
    locale = detectAcceptLanguage(req) ?? "en";
  }

  // Nonce CSPRNG por request. `crypto.randomUUID()` está disponível no Edge
  // runtime do Next.js. Base64 encurta um pouco e evita hifens que alguns
  // validators de CSP rejeitam. Nonce DEVE ser único por request — não cachear,
  // não reusar entre requests.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const headers = new Headers(req.headers);
  headers.set("x-pathname", path);
  headers.set("x-locale", locale);
  // Propaga o nonce pro App Router via header de request. Next.js detecta
  // `x-nonce` e aplica automaticamente em:
  //   - scripts da framework (React/Next runtime)
  //   - bundles JS de page
  //   - <Script nonce={nonce}> do next/script (GtmLoader usa esse caminho)
  // Server components/layouts leem via `(await headers()).get("x-nonce")`
  // pra passar a `<script>` puro (anti-flash, JSON-LD). Ver `@/lib/csp`.
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers } });
  // CSP também no header da response — é assim que o browser aplica.
  res.headers.set("Content-Security-Policy", csp);
  // Sinaliza pro CDN/SEO que conteúdo varia por idioma quando não há
  // country no path (rotas globais).
  if (!COUNTRY_LANG.has(seg)) {
    res.headers.set("Vary", "Accept-Language");
  }
  return res;
}

// Roda em TODAS as rotas exceto assets estáticos do Next + arquivos públicos.
// Sem isso o middleware bate em cada chunk JS/CSS, gastando CPU à toa.
// `/monitoring` (Sentry tunnel route do next.config) também excluído — não
// precisa de CSP por-request e gerar nonce ali quebra o cache do tunnel.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap|og|icon.svg|logo.png|sw.js|monitoring).*)",
  ],
};
