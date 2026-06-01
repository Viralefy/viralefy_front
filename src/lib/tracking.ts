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
  return data;
}
