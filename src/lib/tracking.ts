// Tracking: captura first-touch (utm/fbclid/gclid/referrer/landing_url +
// browser context) e persiste em sessionStorage. Disponível pra qualquer
// componente que faça checkout/recovery/register.
//
// Política:
//   - first-touch ganha (UTM da primeira visita persistem mesmo se o
//     usuário navegar pra outra URL sem UTM). Atualiza apenas se vier
//     parâmetro NOVO (não sobrescreve com vazio).
//   - client_id é gerado uma vez e fica em localStorage (cross-session).
//     Usado pra correlacionar visitantes anônimos com compras.
//   - Cookies Meta padrão (_fbp / _fbc) são lidos quando existem — não
//     setamos nós; deixamos o Meta Pixel cuidar disso. Mas a derivação
//     manual de _fbc a partir de fbclid é nosso trabalho (formato
//     `fb.1.<tstamp>.<fbclid>`).

const SS_KEY = "viralefy_tracking";
const LS_CLIENT_ID = "viralefy_client_id";

// Referral sticky cookie — visitante usando ?ref=<code> persiste em
// localStorage por 30 dias. Survives sessions e tabs. Quem se cadastrar/
// pagar nesse intervalo deixa referrer_code no payload de tracking.
const LS_REFERRER_CODE = "viralefy_referrer_code";
const LS_REFERRER_AT = "viralefy_referrer_at";
const REFERRER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

const PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ttclid",
  "msclkid",
  "irclickid",
  "li_fat_id",
] as const;

export type TrackingData = {
  client_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  gclid?: string;
  ttclid?: string;
  msclkid?: string;
  irclickid?: string;
  li_fat_id?: string;
  referrer?: string;
  landing_url?: string;
  landing_at?: string;
  language?: string;
  timezone?: string;
  screen?: string;
  viewport?: string;
  user_agent?: string;
  // Referral sticky (Fase 6.4) — populado pelo helper getStickyReferrerCode
  // a partir de localStorage. Backend lê de tracking.referrer_code no
  // signup e seta users.referred_by_user_id (first-touch).
  referrer_code?: string;
};

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function getOrCreateClientId(): string {
  if (typeof localStorage === "undefined") return uuid();
  let id = localStorage.getItem(LS_CLIENT_ID);
  if (!id) {
    id = uuid();
    try {
      localStorage.setItem(LS_CLIENT_ID, id);
    } catch {
      /* engole — localStorage cheio é raro mas possível */
    }
  }
  return id;
}

// captureReferrerFromURL lê ?ref=<code> e persiste em localStorage por
// 30 dias. Sticky: chamadas subsequentes sem ?ref preservam o valor até
// expirar. Chamadas COM novo ?ref sobrescrevem (campanhas frescas).
function captureReferrerFromURL(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    const ref = new URL(window.location.href).searchParams.get("ref");
    if (!ref) return;
    const code = ref.trim().toUpperCase();
    if (!code) return;
    localStorage.setItem(LS_REFERRER_CODE, code);
    localStorage.setItem(LS_REFERRER_AT, String(Date.now()));
  } catch {
    /* engole — localStorage cheio/desabilitado */
  }
}

// getStickyReferrerCode devolve o referral code ainda válido (TTL 30d).
// Retorna undefined se nunca capturado ou se expirou.
export function getStickyReferrerCode(): string | undefined {
  if (typeof localStorage === "undefined") return undefined;
  try {
    const code = localStorage.getItem(LS_REFERRER_CODE);
    const atStr = localStorage.getItem(LS_REFERRER_AT);
    if (!code || !atStr) return undefined;
    const at = Number.parseInt(atStr, 10);
    if (!Number.isFinite(at) || Date.now() - at > REFERRER_TTL_MS) {
      // Expirado — limpa pra não acumular lixo.
      localStorage.removeItem(LS_REFERRER_CODE);
      localStorage.removeItem(LS_REFERRER_AT);
      return undefined;
    }
    return code;
  } catch {
    return undefined;
  }
}

function read(): TrackingData {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    return raw ? (JSON.parse(raw) as TrackingData) : {};
  } catch {
    return {};
  }
}

function write(data: TrackingData): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(data));
  } catch {
    /* engole — sessionStorage cheio é raro */
  }
}

// initTracking deve rodar uma vez por carregamento de página (no Providers
// useEffect). Lê URL atual, extrai params, merge com first-touch existente
// (UTM novo vence; UTM vazio NÃO apaga existente).
export function initTracking(): TrackingData {
  if (typeof window === "undefined") return {};
  const existing = read();
  const url = new URL(window.location.href);
  const next: TrackingData = { ...existing };

  next.client_id = existing.client_id ?? getOrCreateClientId();

  // Referral sticky — captura ?ref= se presente; survive 30 dias.
  captureReferrerFromURL();
  const refCode = getStickyReferrerCode();
  if (refCode) next.referrer_code = refCode;

  // first-touch wins — só preenche o que ainda não tem.
  if (!next.landing_url) next.landing_url = window.location.href;
  if (!next.landing_at) next.landing_at = new Date().toISOString();
  if (!next.referrer && document.referrer) next.referrer = document.referrer;
  if (!next.language) next.language = navigator.language;
  if (!next.timezone) next.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!next.screen) next.screen = `${window.screen.width}x${window.screen.height}@${window.devicePixelRatio}`;
  if (!next.viewport) next.viewport = `${window.innerWidth}x${window.innerHeight}`;
  if (!next.user_agent) next.user_agent = navigator.userAgent;

  // UTM/click IDs: pega da URL se vierem. UTM novo SOBRESCREVE o anterior
  // (visitante que volta via campanha nova merece atribuição nova).
  let updated = false;
  for (const k of PARAM_KEYS) {
    const v = url.searchParams.get(k);
    if (v) {
      next[k] = v;
      updated = true;
    }
  }

  // fbp/fbc do Meta Pixel — lê dos cookies se já foram setados pelo
  // pixel. Se temos fbclid mas o pixel ainda não setou fbc, derivamos.
  const fbp = readCookie("_fbp");
  if (fbp) next.fbp = fbp;
  const fbc = readCookie("_fbc");
  if (fbc) {
    next.fbc = fbc;
  } else if (next.fbclid && !next.fbc) {
    // Formato Meta: fb.<subdomainIndex>.<creationTime>.<fbclid>
    next.fbc = `fb.1.${Date.now()}.${next.fbclid}`;
  }

  if (updated || JSON.stringify(existing) !== JSON.stringify(next)) {
    write(next);
  }
  return next;
}

// getTracking devolve o snapshot atual (sem alterar). Use em handlers
// de submit/checkout pra enriquecer o payload.
export function getTracking(): TrackingData {
  if (typeof window === "undefined") return {};
  const data = read();
  if (!data.client_id) data.client_id = getOrCreateClientId();
  // Referrer pode ter sido capturado em outra aba/sessão depois do init —
  // sempre re-lê do localStorage pra não perder.
  const refCode = getStickyReferrerCode();
  if (refCode) data.referrer_code = refCode;
  return data;
}
