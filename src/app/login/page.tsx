"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { userLogin } from "@/lib/api";
import { useApp } from "@/components/Providers";
import { Turnstile } from "@/components/Turnstile";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Turnstile token: vazio = ainda não validado (ou env desabilitada).
  // Mandamos como string ("" quando bypassed) — o backend trata bypass
  // pelo lado de TURNSTILE_SECRET_KEY.
  const [turnstileToken, setTurnstileToken] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const session = await userLogin(
        String(fd.get("email")),
        String(fd.get("password")),
        turnstileToken,
      );
      login(session);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: "3rem" }}>
      <div className="card">
        <h1 style={{ marginBottom: "1.25rem" }}>Sign in</h1>
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
          <Turnstile onToken={setTurnstileToken} />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p style={{ color: "var(--muted)", marginTop: "1.25rem", fontSize: "0.9rem" }}>
          {/* underline pra atender WCAG 1.4.1 — link em parágrafo muted
              estava distinguido apenas pela cor. */}
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ textDecoration: "underline" }}>
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
