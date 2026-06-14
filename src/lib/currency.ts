// Persistência da moeda de exibição. Mesmo padrão de `theme.ts`:
//
//   - Cookie `vf_currency` cross-subdomain (`Domain=.viralefy.com`) é a
//     fonte autoritativa. O server lê via `cookies()` em `layout.tsx` e
//     passa pra `Providers` como `initialCurrency`. Sem isso o SSR não
//     conhece a preferência e o primeiro paint mostra o default global
//     (USDT), causando o pulo USD→USDT relatado em BUG-79/111.
//
//   - localStorage segue como fallback secundário pra clientes legacy
//     (extensões que limpam cookies, modo private). Cookie sempre vence.
//
//   - Evento `vf-currency-changed` é emitido a cada mudança pra que
//     consumidores que cachearam o valor (ex.: CheckoutModal aberto)
//     possam reagir sem depender só do re-render do Provider.

export const CURRENCY_COOKIE = "vf_currency";
export const CURRENCY_STORAGE_KEY = "viralefy_currency";
export const CURRENCY_CHANGED_EVENT = "vf-currency-changed";
const COOKIE_MAX_AGE_S = 365 * 24 * 60 * 60;

// Espelha `cookieDomain()` de `lib/gdpr.ts`. Em dev cai em host-only.
function cookieDomain(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return "";
  const parts = host.split(".");
  if (parts.length < 2) return "";
  return "." + parts.slice(-2).join(".");
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const raw = document.cookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(`${name}=`));
    if (!raw) return null;
    return decodeURIComponent(raw.slice(name.length + 1));
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  try {
    const domain = cookieDomain();
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
    const domainPart = domain ? `; Domain=${domain}` : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_S}; SameSite=Lax${domainPart}${secure}`;
  } catch { /* ignora */ }
}

/** Lê a moeda salva no cliente. Cookie vence; LS é fallback. */
export function getStoredCurrency(): string | null {
  const fromCookie = readCookie(CURRENCY_COOKIE);
  if (fromCookie && /^[A-Z0-9]{2,8}$/.test(fromCookie)) return fromCookie;
  try {
    if (typeof window !== "undefined") {
      const v = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (v && /^[A-Z0-9]{2,8}$/.test(v)) return v;
    }
  } catch { /* ignora */ }
  return null;
}

/** Persiste a moeda (cookie + LS) e emite `vf-currency-changed`. */
export function storeCurrency(code: string): void {
  if (!/^[A-Z0-9]{2,8}$/.test(code)) return;
  writeCookie(CURRENCY_COOKIE, code);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
      window.dispatchEvent(new CustomEvent(CURRENCY_CHANGED_EVENT, { detail: code }));
    }
  } catch { /* ignora */ }
}
