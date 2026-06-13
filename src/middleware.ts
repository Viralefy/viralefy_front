import { NextRequest, NextResponse } from "next/server";

// Middleware enxuto que injeta dois headers usáveis pelo RootLayout:
//   x-pathname  → path bruto (pra debugging/SSR-aware components)
//   x-locale    → BCP47 do mercado atual (pra emitir <html lang=…> correto)
//
// O cálculo do locale é stateless: lê o primeiro segmento do path. Se for
// um country code conhecido em COUNTRIES, retorna o htmlLang dele. Caso
// contrário (root, /pricing, /case-studies, /legal, etc.) fica "en".
//
// Custo: ~0.1ms por request (1 split + 1 lookup em Set). Sem fetch.
// Sem cookie. Sem geo-IP — geo só seria usado pra redirect, não pra lang.

import { COUNTRIES } from "@/i18n/countries";

const COUNTRY_LANG = new Map(COUNTRIES.map((c) => [c.code, c.htmlLang]));

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const seg = path.split("/")[1] ?? "";
  const locale = COUNTRY_LANG.get(seg) ?? "en";

  const headers = new Headers(req.headers);
  headers.set("x-pathname", path);
  headers.set("x-locale", locale);

  return NextResponse.next({ request: { headers } });
}

// Roda em TODAS as rotas exceto assets estáticos do Next + arquivos públicos.
// Sem isso o middleware bate em cada chunk JS/CSS, gastando CPU à toa.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap|og|icon.svg|logo.png|sw.js).*)",
  ],
};
