"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConsent, setConsent, type GdprConsent } from "@/lib/gdpr";

// Banner GDPR. Aparece quando `localStorage["viralefy_gdpr_consent"]` é
// inexistente (== null). 3 botões diretos no banner — "Accept all",
// "Reject non-essential", "Manage" — e um modal de "Manage" com 3 toggles
// (necessary always on, analytics, marketing).
//
// O componente é montado no root layout antes de </body>; layout é server
// component mas o banner é client e hidrata normalmente.

type Mode = "hidden" | "banner" | "manage";

export function CookieBanner() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  // Decide on mount: se já houver consent, fica hidden; caso contrário banner.
  // Roda só client (useEffect garante).
  useEffect(() => {
    const current = getConsent();
    setMode(current === null ? "banner" : "hidden");
  }, []);

  function commit(c: Pick<GdprConsent, "analytics" | "marketing">) {
    setConsent(c);
    setMode("hidden");
  }

  if (mode === "hidden") return null;

  return (
    <>
      {mode === "banner" && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            padding: "1rem",
            background: "var(--surface)",
            borderTop: "1px solid var(--border-strong)",
            boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div
            className="container"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--text)" }}>
                We use cookies
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.4 }}>
                Necessary cookies keep the site working. Analytics and marketing cookies help us
                understand traffic. You can change preferences anytime. See our{" "}
                <Link href="/legal/privacy" style={{ color: "var(--accent)" }}>privacy policy</Link>{" "}
                and{" "}
                <Link href="/legal/cookies" style={{ color: "var(--accent)" }}>cookie policy</Link>.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMode("manage")}
              >
                Manage
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => commit({ analytics: false, marketing: false })}
              >
                Reject non-essential
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => commit({ analytics: true, marketing: true })}
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "manage" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            background: "rgba(0, 0, 0, 0.55)",
            display: "grid",
            placeItems: "center",
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 520,
              width: "100%",
              padding: "1.5rem",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem", color: "var(--text)" }}>
              Cookie preferences
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Choose which cookies we may use. Necessary cookies are required for the site to work
              and cannot be disabled.
            </p>

            <ToggleRow
              label="Necessary"
              description="Authentication, cart, security. Always active."
              checked={true}
              disabled
              onChange={() => {}}
            />
            <ToggleRow
              label="Analytics"
              description="Traffic, performance and aggregated usage metrics."
              checked={analytics}
              onChange={setAnalytics}
            />
            <ToggleRow
              label="Marketing"
              description="Ad measurement and remarketing audiences."
              checked={marketing}
              onChange={setMarketing}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.25rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMode("banner")}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => commit({ analytics, marketing })}
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "1rem",
        alignItems: "center",
        padding: "0.75rem 0",
        borderTop: "1px solid var(--border)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <span>
        <span style={{ display: "block", fontWeight: 600, color: "var(--text)" }}>{label}</span>
        <span style={{ display: "block", fontSize: "0.85rem", color: "var(--muted)" }}>
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        style={{ width: 20, height: 20, accentColor: "var(--accent)" }}
      />
    </label>
  );
}
