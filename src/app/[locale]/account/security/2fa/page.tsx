"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  disableUserTwoFA,
  enrollUserTwoFA,
  fetchTwoFAStatus,
  verifyUserTwoFA,
  type TwoFAEnroll,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Icon } from "@/components/Icon";

// Página de security 2FA pra usuário. Mostra:
//   - Estado atual (enrolled? since when?)
//   - Setup wizard quando NÃO enrolled (QR + 8 backup codes + verify)
//   - Disable button quando enrolled (com confirm)
//
// Mesmo padrão visual do admin login wizard — QR via api.qrserver.com,
// download .txt dos backup codes, gate "I've saved these".
export default function UserSecurity2FAPage() {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [enroll, setEnroll] = useState<TwoFAEnroll | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchTwoFAStatus(token)
      .then((s) => setEnrolled(s.enrolled))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load 2FA status"));
  }, [router]);

  async function startEnroll() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const e = await enrollUserTwoFA(token);
      setEnroll(e);
    } catch (er) {
      setError(er instanceof Error ? er.message : "Failed to start enrollment");
    } finally {
      setLoading(false);
    }
  }

  async function onDisable() {
    const token = getToken();
    if (!token) return;
    if (!confirm("Disable 2FA? Your account will be protected only by your password.")) return;
    setLoading(true);
    try {
      await disableUserTwoFA(token);
      setEnrolled(false);
      setEnroll(null);
    } catch (er) {
      setError(er instanceof Error ? er.message : "Failed to disable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 600 }}>
      <Link href="/account" style={{ color: "var(--muted)", fontSize: "0.85rem" }}>← My account</Link>
      <h1 style={{ marginTop: "0.5rem" }}>Two-factor authentication</h1>

      {error && <div className="alert alert-error" style={{ marginTop: "1rem" }}>{error}</div>}

      {enrolled === null && <p style={{ color: "var(--muted)" }}>Loading…</p>}

      {enrolled === true && !enroll && (
        <>
          <div className="card" style={{ marginTop: "1rem", background: "rgba(60,216,125,0.06)", border: "1px solid rgba(60,216,125,0.3)" }}>
            <strong style={{ color: "#3cd87d", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <Icon name="check" size={16} />
              2FA is active
            </strong>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0.4rem 0 0" }}>
              You&apos;ll be asked for a 6-digit code from your authenticator app on every login.
            </p>
          </div>
          <button type="button" className="btn btn-outline" style={{ marginTop: "1rem" }} onClick={onDisable} disabled={loading}>
            Disable 2FA
          </button>
        </>
      )}

      {enrolled === false && !enroll && (
        <>
          <p style={{ color: "var(--muted)", marginTop: "1rem", marginBottom: "1rem" }}>
            Add an extra layer of security to your account. Works with Google Authenticator, Authy, 1Password, or any TOTP-compatible app.
          </p>
          <button type="button" className="btn btn-primary" onClick={startEnroll} disabled={loading}>
            {loading ? "Starting…" : "Set up 2FA"}
          </button>
        </>
      )}

      {enroll && <EnrollWizard data={enroll} onDone={() => { setEnroll(null); setEnrolled(true); }} />}
    </main>
  );
}

function EnrollWizard({ data, onDone }: { data: TwoFAEnroll; onDone: () => void }) {
  const [code, setCode] = useState("");
  const [savedAck, setSavedAck] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function downloadBackupCodes() {
    const text = `Viralefy 2FA backup codes (${new Date().toISOString()})\n\n` +
      data.backup_codes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      "\n\nKeep these safe. Each code works ONCE. Lose them and your account is lost.\n";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "viralefy-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Not logged in");
      await verifyUserTwoFA(token, code);
      onDone();
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.otpauth_url)}`;

  return (
    <div style={{ marginTop: "1rem" }}>
      {err && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{err}</div>}
      <ol style={{ paddingInlineStart: "1.1rem", color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
        <li>Install Google Authenticator, Authy, 1Password, or Bitwarden.</li>
        <li>Scan the QR code (or paste the secret manually).</li>
        <li>Save your backup codes — they are shown only here.</li>
        <li>Enter the 6-digit code to finish setup.</li>
      </ol>
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt="2FA QR code" width={220} height={220} loading="lazy" decoding="async" style={{ borderRadius: "0.5rem", background: "white", padding: "0.25rem" }} />
      </div>
      <details style={{ marginBottom: "1rem" }}>
        <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "var(--muted)" }}>Can&apos;t scan? Paste this secret manually</summary>
        <input readOnly className="input" value={data.secret_base32} style={{ marginTop: "0.4rem", fontFamily: "monospace", fontSize: "0.85rem" }} />
      </details>
      <div className="card" style={{ background: "rgba(255,76,76,0.08)", border: "1px solid rgba(255,76,76,0.3)", marginBottom: "1rem" }}>
        <strong style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
          <Icon name="warning" size={14} />
          Backup codes (shown only once)
        </strong>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem", fontFamily: "monospace", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          {data.backup_codes.map((c) => <span key={c}>{c}</span>)}
        </div>
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
          onClick={downloadBackupCodes}
        >
          <Icon name="download" size={16} />
          Download backup codes
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem", fontSize: "0.85rem" }}>
          <input type="checkbox" checked={savedAck} onChange={(e) => setSavedAck(e.target.checked)} />
          I&apos;ve saved these somewhere safe.
        </label>
      </div>
      <form onSubmit={onSubmit}>
        <label className="label">First 6-digit code from your app</label>
        <input
          className="input"
          autoComplete="one-time-code"
          inputMode="numeric"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          disabled={!savedAck}
        />
        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.8rem" }} disabled={busy || !savedAck}>
          {busy ? "Verifying…" : "Activate 2FA"}
        </button>
      </form>
    </div>
  );
}
