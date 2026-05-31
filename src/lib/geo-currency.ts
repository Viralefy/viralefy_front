// Mapa país (ISO 3166-1 alpha-2, qualquer case) → moeda de exibição padrão.
//
// O backend liquida (settlement) sempre em USD/EUR/BRL; este mapa serve
// apenas pra escolher qual delas mostrar como default no primeiro acesso
// de um visitante. Preferência salva em localStorage sempre vence sobre
// detecção geo.
//
// Critério: BR cai em BRL (mercado nativo); zona euro e nórdicos viram EUR;
// LATAM/Anglo/Ásia/Rússia caem em USD. Default fallback = USD.

const COUNTRY_CURRENCY: Record<string, string> = {
  // ---- BRL (Brasil) ----
  br: "BRL",

  // ---- USD (Anglo + Ásia-Pacífico + alguns globais) ----
  us: "USD", ca: "USD", au: "USD", nz: "USD", gb: "USD", ie: "USD",
  sg: "USD", hk: "USD", ph: "USD", in: "USD", pk: "USD", bd: "USD",
  lk: "USD", np: "USD", za: "USD", ng: "USD", ke: "USD",
  jp: "USD", kr: "USD", tw: "USD", my: "USD", id: "USD", vn: "USD",
  th: "USD", cn: "USD",

  // ---- USD (LATAM hispanic — bandeira USD por liquidação) ----
  mx: "USD", ar: "USD", cl: "USD", co: "USD", pe: "USD", ve: "USD",
  ec: "USD", bo: "USD", py: "USD", uy: "USD", cu: "USD", do: "USD",
  pr: "USD", gt: "USD", hn: "USD", sv: "USD", ni: "USD", cr: "USD",
  pa: "USD", ht: "USD", jm: "USD", tt: "USD", bs: "USD", bb: "USD",
  bz: "USD", gy: "USD", sr: "USD",

  // ---- EUR (zona euro + microestados latinos) ----
  es: "EUR", de: "EUR", fr: "EUR", it: "EUR", at: "EUR", nl: "EUR",
  be: "EUR", lu: "EUR", fi: "EUR", ee: "EUR", lv: "EUR", lt: "EUR",
  gr: "EUR", cy: "EUR", mt: "EUR", pt: "EUR", sk: "EUR", si: "EUR",
  hr: "EUR", ad: "EUR", mc: "EUR", sm: "EUR", va: "EUR", gi: "EUR",
  // Nórdicos não-EUR: liquidamos em EUR, mais próximo da experiência local
  // do que jogar USD.
  se: "EUR", dk: "EUR", no: "EUR", is: "EUR",
  // Europa central que não usa euro como moeda nacional, mas é melhor mostrar
  // EUR como referência (turismo, comércio cross-SEPA).
  pl: "EUR", cz: "EUR", hu: "EUR", ro: "EUR", bg: "EUR",
  // Outros europeus
  ch: "EUR", li: "EUR",

  // ---- USD (Rússia + ex-URSS comum) ----
  ru: "USD", by: "USD", kz: "USD", kg: "USD", ua: "USD",
};

/**
 * Retorna a moeda de exibição padrão para um código de país.
 * - Aceita qualquer case (`BR`, `br`, `Br`).
 * - País não mapeado cai em USD.
 */
export function currencyForCountry(code: string | null | undefined): string {
  if (!code) return "USD";
  return COUNTRY_CURRENCY[code.toLowerCase()] ?? "USD";
}

/**
 * Faz parsing de `Accept-Language` (RFC 7231) e tenta extrair um código de
 * país. Ex.: `pt-BR,pt;q=0.9,en;q=0.5` → `BR`. Retorna `null` se nada
 * pareceu um país.
 */
export function countryFromAcceptLanguage(header: string | null | undefined): string | null {
  if (!header) return null;
  // tags são separadas por vírgula; cada tag pode ter `;q=…` e ser BCP47.
  const tags = header.split(",").map((s) => s.trim().split(";")[0]);
  for (const tag of tags) {
    const parts = tag.split("-");
    // procuramos por uma região (2 letras alpha) — geralmente a 2ª parte.
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i];
      if (/^[A-Za-z]{2}$/.test(p)) return p.toUpperCase();
    }
  }
  return null;
}
