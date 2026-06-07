// visitor.ts — identidade anônima persistente do visitante.
//
// Geramos um UUID random na primeira visita e persistimos em DOIS lugares:
//   1. localStorage  — survives across tabs, primary source.
//   2. cookie 1y     — fallback quando localStorage está bloqueado (private
//                      browsing, iframe sandbox) e expõe o ID pro server caso
//                      no futuro queiramos ler server-side.
//
// O ID é puramente anônimo (sem PII). Usado pelo A/B testing harness pra
// sticky variant assignment — o mesmo visitor sempre cai na mesma variant
// entre páginas e sessões.
//
// SSR-safe: getVisitorId() retorna string vazia quando chamado fora do
// browser (window undefined). Callers devem chamar dentro de useEffect.

const KEY = "vf_vid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const pairs = document.cookie.split(";");
  for (const raw of pairs) {
    const [k, ...rest] = raw.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

function newUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback non-crypto pra ambientes muito antigos. Bom o suficiente
  // pra ID anônimo — não usado em segurança.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}

// getVisitorId — devolve o UUID estável do visitante. Cria na primeira
// chamada do browser. Idempotente. Retorna "" no SSR.
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const fromLS = window.localStorage.getItem(KEY);
    if (fromLS) {
      // Garante que o cookie está sincronizado (TTL renovado a cada visit).
      writeCookie(KEY, fromLS, ONE_YEAR_SECONDS);
      return fromLS;
    }
  } catch {
    // localStorage bloqueado — cai pro cookie.
  }
  const fromCookie = readCookie(KEY);
  if (fromCookie) {
    try {
      window.localStorage.setItem(KEY, fromCookie);
    } catch {
      // ignore
    }
    return fromCookie;
  }
  const fresh = newUUID();
  try {
    window.localStorage.setItem(KEY, fresh);
  } catch {
    // ignore
  }
  writeCookie(KEY, fresh, ONE_YEAR_SECONDS);
  return fresh;
}
