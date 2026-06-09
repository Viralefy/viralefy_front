"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { userRegister } from "@/lib/api";
import { useApp } from "@/components/Providers";
import { Turnstile } from "@/components/Turnstile";
import { getTracking } from "@/lib/tracking";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Ref espelha o state pra leitura sem stale closure (vide /login).
  const turnstileTokenRef = useRef<string>("");
  const [, setTurnstileToken] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");

  const contactOk = phone.trim().length > 0 || telegram.trim().length > 0;

  function handleTurnstileToken(t: string) {
    turnstileTokenRef.current = t;
    setTurnstileToken(t);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!contactOk) {
      setError("Please provide your phone OR Telegram so we can reach you about your order.");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    // Aguarda até 3s pelo Turnstile token — evita 422 na 1ª tentativa.
    let tok = turnstileTokenRef.current;
    for (let i = 0; i < 30 && !tok; i++) {
      await new Promise((r) => setTimeout(r, 100));
      tok = turnstileTokenRef.current;
    }
    try {
      const session = await userRegister({
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        password: String(fd.get("password")),
        phone: phone.trim() || undefined,
        telegram: telegram.trim() || undefined,
        turnstile_token: tok,
        tracking: getTracking(),
      });
      login(session);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: "3rem" }}>
      <div className="card">
        <h1 style={{ marginBottom: "1.25rem" }}>Create account</h1>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input className="input" id="name" name="name" required />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password (min. 8 characters)</label>
            <input className="input" id="password" name="password" type="password" minLength={8} required />
          </div>

          {/* Phone OU Telegram — pelo menos um. Front e back validam. */}
          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "1rem" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: "0 0 0.75rem" }}>
              We need at least one contact channel besides email so we can reach you about your order.
            </p>
            <div>
              <label className="label" htmlFor="phone">Phone (with country code)</label>
              <input
                className="input"
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+55 11 98765-4321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <label className="label" htmlFor="telegram">Telegram</label>
              <input
                className="input"
                id="telegram"
                name="telegram"
                placeholder="@yourhandle or t.me/yourhandle"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
              />
            </div>
            {!contactOk && (
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "0.4rem 0 0" }}>
                Fill ONE of the two above. ✓ either field is enough.
              </p>
            )}
            {contactOk && (
              <p style={{ color: "#3cd87d", fontSize: "0.75rem", margin: "0.4rem 0 0" }}>
                ✓ contact channel set
              </p>
            )}
          </div>

          <Turnstile onToken={handleTurnstileToken} />
          <button type="submit" className="btn btn-primary" disabled={loading || !contactOk}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p style={{ color: "var(--muted)", marginTop: "1.25rem", fontSize: "0.9rem" }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
