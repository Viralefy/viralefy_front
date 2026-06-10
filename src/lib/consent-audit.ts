// consent-audit.ts — POSTa decisões de consentimento pro backend pra
// gravar em `user_consent_log` (audit trail LGPD Art. 8 §6: comprovação
// da prestação de consentimento).
//
// Endpoint: POST /v1/me/consent (público — não exige auth; aceita
// user_id quando há sessão pra correlacionar). Backend grava IP + UA
// independentemente do consent porque o audit log de consent É a base
// legal pro próprio tratamento (legítimo interesse Art. 7 IX +
// obrigação legal Art. 7 II — comprovação).
//
// Best-effort: falhas silenciosamente engolidas — não bloqueia UI.
// Usa fetch keepalive pra sobreviver navegações.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type ConsentAuditEntry = {
  version: number;
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  /** Origem da escolha — qual botão o usuário clicou. */
  source: "accept_all" | "essential_only" | "custom";
};

export async function recordConsent(entry: ConsentAuditEntry): Promise<void> {
  if (typeof fetch === "undefined") return;
  try {
    await fetch(`${API_URL}/v1/me/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      keepalive: true,
      credentials: "include",
    });
  } catch {
    // Silencioso — o consent local já foi gravado em localStorage.
    // O audit log é redundante; falha aqui não impede o opt-in/out.
  }
}
