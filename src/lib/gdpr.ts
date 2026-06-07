// GDPR consent helpers. Persistência via localStorage + evento global.
//
// O storefront precisa de um único ponto de verdade pra consentimento de
// cookies (necessary, analytics, marketing). O banner em `CookieBanner.tsx` e
// a página de preferências em `/legal/cookie-preferences` consomem essas
// funções; integrações de tracking (GTM dataLayer, pixels) podem assinar o
// evento `viralefy:gdpr-update` no `window` pra reagir a mudanças sem
// precisar re-ler o storage.

export const GDPR_STORAGE_KEY = "viralefy_gdpr_consent";
export const GDPR_EVENT = "viralefy:gdpr-update";

export type GdprConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO 8601 — momento em que o usuário tomou a decisão. */
  timestamp: string;
};

/**
 * Lê o consentimento salvo. Retorna `null` quando o usuário ainda não
 * decidiu — esse é o sinal pro banner aparecer. Roda safe no server (SSR)
 * devolvendo `null`.
 */
export function getConsent(): GdprConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GDPR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GdprConsent>;
    if (typeof parsed !== "object" || parsed === null) return null;
    // necessary é sempre true; coage por garantia.
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Persiste o consentimento e dispara o evento `viralefy:gdpr-update` com o
 * payload final. Subscribers (tracking layer) usam o detail.
 */
export function setConsent(c: Omit<GdprConsent, "necessary" | "timestamp"> & { timestamp?: string }): GdprConsent {
  const payload: GdprConsent = {
    necessary: true,
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
