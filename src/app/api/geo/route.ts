// GET /api/geo
//
// Resolve país e moeda de exibição a partir dos headers do request:
//   1. `CF-IPCountry` (Cloudflare) — preferido.
//   2. `X-Vercel-IP-Country` — caso o deploy seja no Vercel.
//   3. Fallback: parsing de `Accept-Language` pra extrair a região.
//
// O cliente (`Providers`) chama isso uma vez no mount se o visitante ainda
// não tem preferência salva em localStorage. Resposta tem cache curto pra
// não esmagar a CDN — geo do visitante muda raramente entre requests.

import { NextResponse } from "next/server";
import { countryFromAcceptLanguage, currencyForCountry } from "@/lib/geo-currency";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const h = req.headers;
  const country =
    h.get("cf-ipcountry") ||
    h.get("x-vercel-ip-country") ||
    countryFromAcceptLanguage(h.get("accept-language")) ||
    null;

  const currency = currencyForCountry(country);

  return NextResponse.json({
    data: {
      country: country ? country.toUpperCase() : null,
      currency,
    },
  });
}
