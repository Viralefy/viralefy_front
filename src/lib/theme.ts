// Helpers de tema. SSR-safe — funciona quando window/document são undefined.
// O atributo `data-theme` mora no <html> e é setado o mais cedo possível:
//
//   1. SSR — `app/layout.tsx` lê o cookie `vf_theme` via `cookies()` e
//      injeta `data-theme="..."` direto no `<html>`. Anti-flash REAL: o
//      browser já recebe o HTML com o tema certo, sem flicker.
//   2. CSR — `ThemeToggle` chama `setTheme(...)` que escreve no cookie
//      cross-subdomain (`Domain=.viralefy.com`) E no localStorage (cache
//      leve), além de atualizar `<html data-theme>` no DOM.
//
// Cookie é a fonte autoritativa porque resolve dois bugs:
//   - SSR não enxerga localStorage → FOUC + hydration mismatch (BUG-79/111)
//   - Subdomínios (www / auth / admin) precisam compartilhar tema
//
// localStorage segue como cache leve pra clientes legacy (extensões que
// removeram cookies, modo private com cookies bloqueados): se o cookie
// faltar, caímos no LS antes de assumir o default.
//
// Default = `system` (respeita `prefers-color-scheme`). Era hard-coded
// "dark"; agora `system` é o piso e o ThemeToggle alterna explicitamente
// pra light/dark quando o usuário clica.

export type Theme = "dark" | "light" | "system";
/** Tema efetivo após resolver `system` via media query. Sem `system`. */
export type ResolvedTheme = "dark" | "light";

export const THEME_COOKIE = "vf_theme";
export const THEME_STORAGE_KEY = "viralefy_theme";
// 1 ano — sem motivo pra reperguntar.
const COOKIE_MAX_AGE_S = 365 * 24 * 60 * 60;

function isTheme(v: unknown): v is Theme {
  return v === "dark" || v === "light" || v === "system";
}

// Acesso defensivo ao localStorage — checa globalThis pra funcionar em
// ambientes de teste (node:test com shim) e SSR (sem DOM nenhum).
function ls(): Storage | null {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: Storage }).localStorage) {
      return (globalThis as { localStorage: Storage }).localStorage;
    }
  } catch { /* ignora */ }
  return null;
}

// Domínio cross-subdomain pro cookie (espelha `cookieDomain()` de
// `lib/gdpr.ts`). Em dev (localhost / 127.0.0.1 / *.local) deixa vazio
// pra ficar host-only.
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

function setAttr(theme: ResolvedTheme): void {
  try {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch { /* ignora */ }
}

/** Resolve `system` lendo `prefers-color-scheme`. SSR cai em `dark`. */
export function resolveTheme(t: Theme): ResolvedTheme {
  if (t === "dark" || t === "light") return t;
  try {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
  } catch { /* ignora */ }
  return "dark";
}

/**
 * Lê a preferência salva. Ordem: cookie → localStorage → "system".
 * SSR-safe (devolve "system" no server).
 */
export function getTheme(): Theme {
  const fromCookie = readCookie(THEME_COOKIE);
  if (isTheme(fromCookie)) return fromCookie;
  const s = ls();
  if (s) {
    try {
      const v = s.getItem(THEME_STORAGE_KEY);
      if (isTheme(v)) return v;
      // Migra valor legacy ("dark"/"light" sem suporte a "system" — qualquer
      // outra string cai em "system").
      if (v === "dark" || v === "light") return v;
    } catch { /* ignora */ }
  }
  return "system";
}

/** Persiste o tema (cookie + LS) e atualiza o DOM com o tema resolvido. */
export function setTheme(theme: Theme): Theme {
  writeCookie(THEME_COOKIE, theme);
  const s = ls();
  if (s) {
    try { s.setItem(THEME_STORAGE_KEY, theme); } catch { /* ignora */ }
  }
  setAttr(resolveTheme(theme));
  return theme;
}

/**
 * Alterna entre dark e light. "system" cai pro oposto do tema efetivo
 * atual (se o sistema está light → alterna pra dark).
 */
export function toggleTheme(): Theme {
  const cur = getTheme();
  const resolved = resolveTheme(cur);
  return setTheme(resolved === "dark" ? "light" : "dark");
}
