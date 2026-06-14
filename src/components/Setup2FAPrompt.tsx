"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchTwoFAStatus, dismissTwoFAPrompt } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Icon } from "./Icon";

// Setup2FAPrompt — nag modal pra usuário ATIVAR 2FA opcional.
//
// Política (vide PHASE-7-PLAN §7.2):
//   - NUNCA mostra antes do 1º pedido `paid + delivery_captured_at != NULL`
//     (backend: should_prompt=false). Sem dado sensível, encher saco =
//     drop de conversão.
//   - Após elegível: backend retorna should_prompt=true. UI mostra o modal
//     SE não tem skip session-level (sessionStorage flag).
//   - Dismiss: incrementa contador + timestamp no backend. Cooldown
//     progressivo (>5 dismiss OU <7d desde último = espera maior).
//   - "Activate now" leva pra /account/security/2fa (enroll wizard).
//
// Component fica em /account/* mount. Render condicional baseado no fetch
// inicial — sem flicker em SSR.
export function Setup2FAPrompt() {
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (typeof window !== "undefined" && sessionStorage.getItem("vf_2fa_prompt_skipped") === "1") {
      return;
    }
    fetchTwoFAStatus(token)
      .then((s) => {
        if (s.should_prompt && !s.enrolled) setOpen(true);
      })
      .catch(() => undefined);
  }, []);

  async function onDismiss() {
    const token = getToken();
    if (!token) return;
    setDismissing(true);
    try {
      await dismissTwoFAPrompt(token);
    } catch {
      // Best-effort: continua fechando mesmo com erro de rede.
    } finally {
      // Skip pelo resto da sessão pra evitar re-prompt se user navega entre tabs.
      try { sessionStorage.setItem("vf_2fa_prompt_skipped", "1"); } catch { /* private mode */ }
      setDismissing(false);
      setOpen(false);
    }
  }

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vf-2fa-prompt-title"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 60, padding: "1rem",
      }}
    >
      <div className="card" style={{ maxWidth: 440, width: "100%" }}>
        <h2 id="vf-2fa-prompt-title" style={{ marginBottom: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          <Icon name="lock" size={20} color="var(--accent, #00fed6)" />
          Protect your account
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "1rem", fontSize: "0.9rem" }}>
          You&apos;ve completed an order with us — your account now has data worth protecting. Two-factor authentication
          (2FA) adds a 6-digit code from your phone on every login, blocking attackers even if they have your password.
        </p>
        <ul style={{ color: "var(--muted)", fontSize: "0.85rem", paddingInlineStart: "1.1rem", marginBottom: "1rem" }}>
          <li>30 seconds to set up.</li>
          <li>Works with Google Authenticator, Authy, 1Password.</li>
          <li>You&apos;ll get 8 backup codes in case you lose your phone.</li>
        </ul>
        <Link
          href="/account/security/2fa"
          className="btn btn-primary"
          style={{ width: "100%", textAlign: "center" }}
          onClick={() => setOpen(false)}
        >
          Activate now →
        </Link>
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: "100%", marginTop: "0.5rem" }}
          onClick={onDismiss}
          disabled={dismissing}
        >
          {dismissing ? "…" : "Maybe later"}
        </button>
      </div>
    </div>
  );
}
