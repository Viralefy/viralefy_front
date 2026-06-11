"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { completeUserLoginTwoFA, userLogin, type Session } from "@/lib/api";
import { useApp } from "@/components/Providers";
import { Turnstile } from "@/components/Turnstile";

const AUTH_UI_URL = process.env.NEXT_PUBLIC_AUTH_UI_URL || "https://auth.viralefy.com";

// Subdomínios permitidos em return_to (allowlist) — sem isso atacante poderia
// fazer ?return_to=https://evil.com pra roubar o fragment com tokens.
const ALLOWED_RETURN_HOSTS = new Set<string>([
  "www.viralefy.com",
  "viralefy.com",
  "admin.viralefy.com",
  // localhost dev — Next.js dev runs on 3000/3001.
  "localhost",
  "127.0.0.1",
]);

function isAuthHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "auth.viralefy.com" ||
         window.location.hostname.startsWith("auth.");
}

function sanitizeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!ALLOWED_RETURN_HOSTS.has(url.hostname)) return null;
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return null;
    return url.toString();
  } catch {
    return null;
  }
}

// Serializa a session no fragment (#) pra que o callback no destino consuma
// sem nunca passar pelo query-string (logs do servidor não veem fragmentos).
function buildReturnURL(returnTo: string, session: Session): string {
  const params = new URLSearchParams();
  if (session.access_token) params.set("access_token", session.access_token);
  if (session.access_expires_at) params.set("access_expires_at", session.access_expires_at);
  if (session.refresh_token) params.set("refresh_token", session.refresh_token);
  if (session.refresh_expires_at) params.set("refresh_expires_at", session.refresh_expires_at);
  if (session.subject_kind) params.set("subject_kind", session.subject_kind);
  if (session.user) params.set("user", JSON.stringify(session.user));
  if (session.admin) params.set("admin", JSON.stringify(session.admin));
  return `${returnTo}#${params.toString()}`;
}

// Next.js 15 exige Suspense boundary em volta de useSearchParams pra
// permitir o prerender estático. Embrulhamos com Suspense + um fallback
// invisível — o useSearchParams resolve client-side.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginShell() {
  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: "3rem" }}>
      <div className="card">
        <h1 style={{ marginBottom: "1.25rem" }}>Sign in</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading…</p>
      </div>
    </main>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // return_to é validado contra allowlist. Quando rodando em auth.viralefy.com,
  // após login completo redirecionamos pra return_to#<session-fragment>.
  const returnTo = sanitizeReturnTo(searchParams?.get("return_to") ?? null);
  // turnstileTokenRef captura o valor mais recente sem precisar de
  // re-render pra o handler. Sem o ref, a 1ª submissão pega "" porque
  // a closure congelou o state antes do callback do widget rodar.
  const turnstileTokenRef = useRef<string>("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [partialToken, setPartialToken] = useState("");

  // Quando alguém aterrissa em www.viralefy.com/login (bookmark antigo,
  // link de email não migrado), redirecionamos pra auth.viralefy.com/login
  // pra a UI ficar consolidada num lugar só. O destino do callback é
  // /sso/callback do PRÓPRIO host (www.viralefy.com/sso/callback), pra que
  // session caia neste localStorage e a UX continue como antes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthHost()) return; // já estamos no host correto
    const returnTo = `${window.location.origin}/sso/callback`;
    window.location.replace(`${AUTH_UI_URL}/login?return_to=${encodeURIComponent(returnTo)}`);
  }, []);

  function handleTurnstileToken(t: string) {
    turnstileTokenRef.current = t;
    setTurnstileToken(t);
  }

  // completeFlow decide o pós-login:
  //   1. Se rodando em auth.viralefy.com + return_to válido → redirect com
  //      session no fragment URL pra que o subdomínio destino consuma via
  //      /sso/callback e persista em seu próprio localStorage.
  //   2. Senão (login local, ex.: usuário caiu direto em www/login) →
  //      saveSession local e router.push.
  function completeFlow(session: Session) {
    if (isAuthHost() && returnTo) {
      // Importante: window.location replace (não push) pra não deixar
      // history-back voltando ao /login com session no fragment.
      window.location.replace(buildReturnURL(returnTo, session));
      return;
    }
    login(session);
    // Admin sem return_to → cai em /admin externo (padrão sensato pra
    // quando admin acessa /login direto sem origem definida).
    if (session.subject_kind === "admin") {
      window.location.href = "https://admin.viralefy.com/";
      return;
    }
    router.push("/account");
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
      completeFlow(session);
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
      completeFlow(session);
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
