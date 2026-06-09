"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { completeUserLoginTwoFA, userLogin } from "@/lib/api";
import { useApp } from "@/components/Providers";
import { Turnstile } from "@/components/Turnstile";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // turnstileTokenRef captura o valor mais recente sem precisar de
  // re-render pra o handler. Sem o ref, a 1ª submissão pega "" porque
  // a closure congelou o state antes do callback do widget rodar.
  const turnstileTokenRef = useRef<string>("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [partialToken, setPartialToken] = useState("");

  function handleTurnstileToken(t: string) {
    turnstileTokenRef.current = t;
    setTurnstileToken(t);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    // Espera até 3s pelo Turnstile token (lê do ref, vê updates async).
    // Sem isso, usuário que clica antes do widget carregar pega 422.
    let tok = turnstileTokenRef.current;
    for (let i = 0; i < 30 && !tok; i++) {
      await new Promise((r) => setTimeout(r, 100));
      tok = turnstileTokenRef.current;
    }
    try {
      const session = await userLogin(
        String(fd.get("email")),
        String(fd.get("password")),
        tok,
      );
      // 2FA gate (opt-in pro user): backend retorna twofa_required quando
      // user fez enroll prévio. Token vem vazio; cliente precisa do código.
      if (session.twofa_required && session.partial_token) {
        setPartialToken(session.partial_token);
        return;
      }
      login(session);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const session = await completeUserLoginTwoFA(partialToken, String(fd.get("code")));
      login(session);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: "3rem" }}>
      <div className="card">
        <h1 style={{ marginBottom: "1.25rem" }}>{partialToken ? "Two-factor code" : "Sign in"}</h1>

        {partialToken ? (
          <form onSubmit={onSubmitCode} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {error && <div className="alert alert-error">{error}</div>}
            <div>
              <label className="label" htmlFor="code">6-digit code or backup code</label>
              <input
                className="input"
                id="code"
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
                placeholder="123456 or BACKUPCODE"
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Verifying…" : "Continue"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { setPartialToken(""); setError(null); }}
            >
              ← Use a different account
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {error && <div className="alert alert-error">{error}</div>}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input className="input" id="email" name="email" type="email" required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input className="input" id="password" name="password" type="password" required />
            </div>
            <Turnstile onToken={handleTurnstileToken} />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "0.5rem 0 0", textAlign: "center" }}>
              {turnstileToken ? "" : "Aguarde 2-3s para a verificação anti-bot."}
            </p>
          </form>
        )}

        {!partialToken && (
          <p style={{ color: "var(--muted)", marginTop: "1.25rem", fontSize: "0.9rem" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ textDecoration: "underline" }}>
              Create account
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
