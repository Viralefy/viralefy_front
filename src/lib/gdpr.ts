// GDPR/LGPD consent helpers. Persistência via localStorage + evento global.
//
// O storefront precisa de um único ponto de verdade pra consentimento de
// cookies. Categorias seguem a recomendação da ANPD (Resolução 4/2020):
//
//   - necessary   — sempre ON (sessão, CSRF, anti-fraude essencial); sem opt-in.
//   - preferences — idioma/tema; default ON como "utility cookie", desligável.
//   - analytics   — GTM/GA; DEFAULT OFF (LGPD Art. 8 §3: consent livre).
//   - marketing   — pixels/remarketing; DEFAULT OFF.
//
// O banner em `CookieBanner.tsx` e a página `/legal/cookie-preferences`
// consomem essas funções; integrações de tracking (GTM, /v1/track) assinam o
// evento `viralefy:gdpr-update` no `window` pra reagir a mudanças sem
// precisar re-ler o storage.
//
// Storage versionado (v=2) — bump quando o shape mudar; valores antigos
// (sem `version` ou v=1) são tratados como ausentes e o banner reaparece.
// Bump aconteceu na transição de "analytics default true" pro "default false"
// — usuários que tinham aceito por inércia precisam reconsentir explicitamente.

export const GDPR_STORAGE_KEY = "viralefy_gdpr_consent";
export const GDPR_EVENT = "viralefy:gdpr-update";
export const GDPR_VERSION = 2;

// Re-prompt automático: 12 meses (recomendação ANPD). Consents antigos
// expiram e o banner reaparece — usuário precisa confirmar de novo.
export const GDPR_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export type GdprConsent = {
  /** Versão do shape — bump invalida storage antigo. */
  version: number;
  /** Sempre true; não é opt-out-able. */
  necessary: true;
  /** Cookies de preferência (idioma, tema). */
  preferences: boolean;
  /** Cookies analíticos (GTM, GA). */
  analytics: boolean;
  /** Cookies de marketing/ads (pixels, remarketing). */
  marketing: boolean;
  /** ISO 8601 — momento em que o usuário tomou a decisão. */
  timestamp: string;
};

/**
 * Lê o consentimento salvo. Retorna `null` quando o usuário ainda não
 * decidiu (storage vazio, parseável inválido, versão antiga ou consent
 * expirado — esse é o sinal pro banner aparecer). Roda safe no server
 * (SSR) devolvendo `null`.
 */
export function getConsent(): GdprConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GDPR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GdprConsent>;
    if (typeof parsed !== "object" || parsed === null) return null;
    // Versão antiga (sem version, ou v=1) → trata como ausente.
    if (parsed.version !== GDPR_VERSION) return null;
    // Expirou (>12m) → banner reaparece, usuário precisa reconsentir.
    if (typeof parsed.timestamp === "string") {
      const at = Date.parse(parsed.timestamp);
      if (Number.isFinite(at) && Date.now() - at > GDPR_MAX_AGE_MS) {
        return null;
      }
    }
    return {
      version: GDPR_VERSION,
      necessary: true,
      preferences: parsed.preferences === false ? false : true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Detecta se há um consent SALVO no storage que EXPIROU (>365d) — usado
 * pelo `CookieBanner` pra distinguir "primeira visita" de "renovação anual".
 * Quando renovação, o banner exibe uma mensagem explicativa adicional.
 *
 * Diferença de `getConsent()`:
 *   - `getConsent()` aplica TTL e devolve null pra ambos os casos
 *     (sem decisão / expirado).
 *   - `isConsentExpired()` ignora as outras formas de `null` (storage
 *     vazio, versão antiga) e retorna `true` SOMENTE quando a única
 *     razão pra rejeitar foi a idade.
 *
 * SSR-safe (devolve `false` no server).
 */
export function isConsentExpired(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(GDPR_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<GdprConsent>;
    if (typeof parsed !== "object" || parsed === null) return false;
    if (parsed.version !== GDPR_VERSION) return false;
    if (typeof parsed.timestamp !== "string") return false;
    const at = Date.parse(parsed.timestamp);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at > GDPR_MAX_AGE_MS;
  } catch {
    return false;
  }
}

/** Helper específico pro tracking layer — true só se analytics OK. */
export function hasAnalyticsConsent(): boolean {
  const c = getConsent();
  return c !== null && c.analytics === true;
}

/** Helper específico pra carregar pixels — true só se marketing OK. */
export function hasMarketingConsent(): boolean {
  const c = getConsent();
  return c !== null && c.marketing === true;
}

/**
 * Persiste o consentimento e dispara o evento `viralefy:gdpr-update` com o
 * payload final. Subscribers (tracking layer) usam o detail.
 *
 * Aceita objeto parcial — campos não informados caem no default seguro:
 *   preferences = true (utility, default ON)
 *   analytics   = false (opt-in obrigatório)
 *   marketing   = false (opt-in obrigatório)
 */
export function setConsent(
  c: Partial<Pick<GdprConsent, "preferences" | "analytics" | "marketing">> & { timestamp?: string },
): GdprConsent {
  const payload: GdprConsent = {
    version: GDPR_VERSION,
    necessary: true,
    preferences: c.preferences === false ? false : true,
    analytics: Boolean(c.analytics),
    marketing: Boolean(c.marketing),
    timestamp: c.timestamp ?? new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(GDPR_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent(GDPR_EVENT, { detail: payload }));
    } catch {
      // Storage cheio / Safari private mode: silenciosamente ignora; o banner
      // vai reaparecer no próximo load — comportamento aceitável pro POC HML.
    }
  }
  return payload;
}

/**
 * Limpa o consentimento — usado na página `/legal/cookie-preferences` quando
 * o usuário pede "Reset". O banner volta a aparecer no próximo render.
 */
export function resetConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GDPR_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(GDPR_EVENT, { detail: null }));
  } catch {
    // Ignora — mesmo motivo do setConsent.
  }
}
