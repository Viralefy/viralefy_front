import { NextRequest, NextResponse } from "next/server";

// Middleware do front. Responsabilidades:
//
// 1. REWRITE de locale: resolve o BCP47 do mercado e reescreve o path pra
//    `/{locale}{path}` (URL pública preservada), servindo o route tree
//    `app/[locale]/…`. É isto que permite o `<html lang>` estático (via param)
//    e destrava o ISR das landing pages. Ver ADR front-locale-segment-isr.
//    Também seta `x-locale`/`x-pathname` (compat pra componentes que ainda liam).
//
// 2. Geo-redirect 1-shot na raiz (BUG-200 do QA round 22) — vide bloco abaixo.
//    Roda ANTES do rewrite; um 302 pra /{cc} não conflita com o rewrite.
//
// 3. CSP ESTÁTICA (ver CSP_STATIC): hash pro único inline, `'self'` pro bundle
//    do Next. Sem nonce (nonce forçaria render dinâmico e mataria o ISR) e sem
//    `'strict-dynamic'` (incompatível com scripts parser-inserted sem nonce).
//    `script-src` continua SEM `'unsafe-inline'`. `style-src` mantém
//    `'unsafe-inline'` (Next 15 injeta styles inline sem propagar nonce).
//
// Resolução do locale:
//   1. Primeiro segmento é country code conhecido (/br, /us, /jp…) → htmlLang dele.
//   2. Senão (rotas globais /pricing, /vs/*, /cities/*…) → Accept-Language.
//   3. Fallback final: "en".
//
// Custo: ~0.1ms por request (locale resolve + rewrite). Sem fetch.

import { COUNTRIES } from "@/i18n/countries";
import { BOOTSTRAP_SHA256 } from "@/lib/theme-bootstrap";
import { allLocaleSegments, localeSegment } from "@/i18n/locales";

// Conjunto de segmentos de locale já-válidos (`en`, `pt-br`, `en-us`…). Se o
// primeiro segmento do path JÁ é um locale, o path é físico (interno) — não
// reescrever de novo (senão `/en` → `/en/en` → país "en" inexistente → 404).
// Nenhum country code colide (países são 2 letras sem hífen; só `en` é bare, e
// não existe país "en").
const LOCALE_SEGMENTS = new Set(allLocaleSegments());

const COUNTRY_LANG = new Map(COUNTRIES.map((c) => [c.code, c.htmlLang]));
const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));

// User-Agents que NUNCA devem ser redirecionados — crawlers precisam ver o
// conteúdo canônico da raiz (sitemap, OG meta) sem desviar pra um país.
const BOT_UA_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview/i;

// Em dev, React/Next precisam de 'unsafe-eval' (reconstrói stacks SSR no
// client). Sem isso o console fica cheio de CSP violations e a DX morre —
// débito aceito apenas em NODE_ENV=development. Mesmo trade-off do backoffice.
const IS_DEV = process.env.NODE_ENV === "development";

// CSP ESTÁTICA (sem nonce) — o preço de habilitar ISR nas landing pages.
//
// Antes (round 25) a CSP usava `nonce` per-request + `'strict-dynamic'`. Mas
// nonce é um valor por-request que precisa ser lido no render (`headers()`),
// e QUALQUER `headers()` no root layout torna a árvore inteira DINÂMICA —
// matando o ISR de todo o tráfego orgânico/pago. nonce e ISR são mutuamente
// exclusivos, e o ISR é o objetivo. Então voltamos à CSP clássica:
//
//   - inline executável: exatamente UM (`BOOTSTRAP_JS`), autorizado por
//     `'sha256-…'` estático. O resto é JSON-LD (`type="application/ld+json"`,
//     dado não-executável → fora de script-src).
//   - scripts do próprio Next (`/_next/static/*`): cobertos por `'self'`.
//   - `'strict-dynamic'` REMOVIDO: ele é incompatível com scripts
//     parser-inserted sem nonce (bloquearia o bundle do Next). Sem ele, a
//     confiança volta a ser por ALLOWLIST DE HOST. Consequência p/ tráfego
//     pago: tags que o GTM injeta de TERCEIROS (Meta/TikTok/Google Ads) não
//     herdam mais confiança automática — cada host precisa ser adicionado
//     ABAIXO antes de habilitar esses pixels em prod. Hoje (HML/POC) o GTM
//     carrega só gtm.js (googletagmanager) + GA, ambos já na allowlist.
//   - `'unsafe-inline'` continua AUSENTE de script-src (o hash cobre o único
//     inline) — a proteção contra XSS inline se mantém.
// Em dev NÃO incluímos o hash: HMR/overlay do Next injeta inline scripts sem
// hash, e a REGRA da CSP2+ é que a presença de um hash/nonce faz o browser
// IGNORAR `'unsafe-inline'`. Então dev usa `'unsafe-inline' 'unsafe-eval'`
// (sem hash) pra DX; prod usa o hash estrito (sem unsafe-inline).
const SCRIPT_SRC = IS_DEV
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdn.jsdelivr.net https://challenges.cloudflare.com"
  : `script-src 'self' '${BOOTSTRAP_SHA256}' https://www.googletagmanager.com https://cdn.jsdelivr.net https://challenges.cloudflare.com`;

const CSP_STATIC: string = [
  "default-src 'self'",
  SCRIPT_SRC,
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
].join("; ");

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

  // CSP agora é ESTÁTICA (ver CSP_STATIC) — sem nonce per-request. Isso é o
  // que destrava o ISR: o layout não precisa mais ler `x-nonce` via headers(),
  // então nada aqui força render dinâmico. O inline único é autorizado por
  // `'sha256-…'`; o bundle do Next por `'self'`.
  const headers = new Headers(req.headers);
  headers.set("x-pathname", path);
  headers.set("x-locale", locale);
  headers.set("Content-Security-Policy", CSP_STATIC);

  // REWRITE (não redirect) pra injetar o locale no path físico, preservando a
  // URL pública. `/us/instagram-followers` → serve `/{locale}/us/instagram-…`
  // do route tree `app/[locale]/…`, mas o browser continua vendo a URL sem
  // prefixo. É isto que casa o `<html lang>` estático (via param) com o SEO já
  // indexado (hreflang/canonical/sitemap seguem sem prefixo). A página fica
  // ISR: cada URL pública mapeia deterministicamente pra 1 path físico.
  //
  // Se o path JÁ começa com um locale (acesso direto ao path físico interno,
  // não-canônico), NÃO reescreve de novo — serve como está (o canonical da
  // página aponta pra URL pública, então SEO consolida). Evita o duplo-prefixo.
  let res: NextResponse;
  if (LOCALE_SEGMENTS.has(seg)) {
    res = NextResponse.next({ request: { headers } });
  } else {
    const rewritten = req.nextUrl.clone();
    rewritten.pathname = `/${localeSegment(locale)}${path}`;
    res = NextResponse.rewrite(rewritten, { request: { headers } });
  }
  // CSP também no header da response — é assim que o browser aplica.
  res.headers.set("Content-Security-Policy", CSP_STATIC);
  // Sinaliza pro CDN/SEO que conteúdo varia por idioma quando não há
  // country no path (rotas globais).
  if (!COUNTRY_LANG.has(seg)) {
    res.headers.set("Vary", "Accept-Language");
  }
  return res;
}

// Roda em TODAS as rotas de PÁGINA exceto assets/handlers. `api`, `og`,
// `sitemap*`, `robots`, `monitoring` ficam FORA porque são route handlers no
// top-level (não sob `[locale]`) — reescrevê-los pra `/{locale}/api/…` quebraria
// a rota. Sem esses excludes o rewrite mataria as APIs e o sitemap.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|favicon.ico|robots.txt|sitemap.xml|sitemap|og|icon.svg|logo.png|sw.js|monitoring).*)",
  ],
};
