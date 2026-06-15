import { NextRequest, NextResponse } from "next/server";

// Middleware enxuto que injeta dois headers usáveis pelo RootLayout:
//   x-pathname  → path bruto (pra debugging/SSR-aware components)
//   x-locale    → BCP47 do mercado atual (pra emitir <html lang=…> correto)
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
// BUG-200 (QA round 22): adicionado geo-redirect 1-shot na raiz:
//   - Path `/`, sem cookie `vf_geo_redirected`, com `cf-ipcountry`/
//     `x-vercel-ip-country` em allowlist → 302 pra `/{country}` + set cookie.
//   - Crawler bots/healthchecks bypass via UA allowlist.
//   - Cookie expira em 30 dias e o reset acontece se o usuário muda de país.
//
// Custo: ~0.1ms por request. Sem fetch.

import { COUNTRIES } from "@/i18n/countries";

const COUNTRY_LANG = new Map(COUNTRIES.map((c) => [c.code, c.htmlLang]));
const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));

// User-Agents que NUNCA devem ser redirecionados — crawlers precisam ver o
// conteúdo canônico da raiz (sitemap, OG meta) sem desviar pra um país.
const BOT_UA_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview/i;

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

  const headers = new Headers(req.headers);
  headers.set("x-pathname", path);
  headers.set("x-locale", locale);

  const res = NextResponse.next({ request: { headers } });
  // Sinaliza pro CDN/SEO que conteúdo varia por idioma quando não há
  // country no path (rotas globais).
  if (!COUNTRY_LANG.has(seg)) {
    res.headers.set("Vary", "Accept-Language");
  }
  return res;
}

// Roda em TODAS as rotas exceto assets estáticos do Next + arquivos públicos.
// Sem isso o middleware bate em cada chunk JS/CSS, gastando CPU à toa.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap|og|icon.svg|logo.png|sw.js).*)",
  ],
};
