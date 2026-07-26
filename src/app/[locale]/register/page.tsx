"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { userRegister, type Session, ApiError } from "@/lib/api";
import { useApp } from "@/components/Providers";
import { Turnstile } from "@/components/Turnstile";
import { getTracking } from "@/lib/tracking";
import { Icon } from "@/components/Icon";
import { AuthLayout } from "@/components/AuthLayout";

const AUTH_UI_URL = process.env.NEXT_PUBLIC_AUTH_UI_URL || "https://auth.viralefy.com";

const ALLOWED_RETURN_HOSTS = new Set<string>([
  "www.viralefy.com",
  "viralefy.com",
  "admin.viralefy.com",
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterShell />}>
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterShell() {
  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: "3rem" }}>
      <div className="card">
        <h1 style={{ marginBottom: "1.25rem" }}>Create account</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading…</p>
      </div>
    </main>
  );
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useApp();
  // error pode ser uma string genérica (validação local) OU um ReactNode
  // composto (caso CONFLICT, onde queremos CTA pra Sign in / Reset password).
  // Isso evita o user clicar 3x no submit pq o alerta dizia só "conflict".
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [loading, setLoading] = useState(false);
  const returnTo = sanitizeReturnTo(searchParams?.get("return_to") ?? null);
  const turnstileTokenRef = useRef<string>("");
  const [, setTurnstileToken] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");

  // BUG-185 do QA: placeholder do phone era hard-coded "+55 11 98765-4321"
  // mesmo pra usuários fora do Brasil. Detectamos o país do usuário via
  // localStorage (lastCountry — gravado pelo Header quando navega em rotas
  // /[country]) e ajustamos o placeholder. Fallback +1 (US) quando desconhecido.
  // Lista pequena e curada — só países com storefront ativo + maiores TAMs.
  const PHONE_PLACEHOLDERS: Record<string, string> = {
    br: "+55 11 98765-4321",
    us: "+1 555 123-4567",
    uk: "+44 7700 900123",
    gb: "+44 7700 900123",
    es: "+34 612 345 678",
    fr: "+33 6 12 34 56 78",
    de: "+49 151 23456789",
    it: "+39 312 345 6789",
    jp: "+81 90 1234 5678",
    cn: "+86 131 2345 6789",
  };
  const [phonePlaceholder, setPhonePlaceholder] = useState("+1 555 123-4567");
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const c = (window.localStorage.getItem("viralefy_last_country") || "").toLowerCase();
      if (c && PHONE_PLACEHOLDERS[c]) setPhonePlaceholder(PHONE_PLACEHOLDERS[c]);
    } catch { /* ignora */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BUG-147 do QA: phone aceitava qualquer texto. Validamos formato
  // permissivo (E.164-ish: dígitos, espaço, hifen, parêntese, prefixo +).
  // Tamanho mín. 8 cobre 99% dos planos numéricos sem rejeitar formatos.
  const phoneOk =
    phone.trim() === "" ||
    /^\+?[\d\s().-]{8,20}$/.test(phone.trim());

  // BUG-148: Telegram aceitava qualquer texto. Validamos "@handle" (>=5
  // chars Telegram) ou URL t.me/username.
  const telegramOk =
    telegram.trim() === "" ||
    /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(telegram.trim()) ||
    /^https?:\/\/(t\.me|telegram\.me)\/[a-zA-Z][a-zA-Z0-9_]{4,31}$/i.test(telegram.trim());

  const contactOk = (phone.trim().length > 0 && phoneOk) || (telegram.trim().length > 0 && telegramOk);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthHost()) return;
    const ret = `${window.location.origin}/sso/callback`;
    window.location.replace(`${AUTH_UI_URL}/register?return_to=${encodeURIComponent(ret)}`);
  }, []);

  function handleTurnstileToken(t: string) {
    turnstileTokenRef.current = t;
    setTurnstileToken(t);
  }

  function completeFlow(session: Session) {
    if (isAuthHost() && returnTo) {
      window.location.replace(buildReturnURL(returnTo, session));
      return;
    }
    if (isAuthHost() && !returnTo) {
      // Cadastro feito direto em auth.viralefy.com sem return_to — manda pro front padrão.
      login(session);
      window.location.href = "https://www.viralefy.com/account";
      return;
    }
    login(session);
    router.push("/account");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    // Validação client-side explícita (BUG-42/158 do QA 2026-06-12):
    // browser native validation pode ser bypassada por autofill em alguns
    // navegadores. Damos feedback inline antes de bater no backend.
    if (!name) {
      setError("Enter your full name.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (phone.trim() && !phoneOk) {
      setError(`Phone number doesn't look valid. Use format like ${phonePlaceholder}.`);
      return;
    }
    if (telegram.trim() && !telegramOk) {
      setError("Telegram should be @yourhandle or t.me/yourhandle.");
      return;
    }
    if (!contactOk) {
      setError("Please provide your phone OR Telegram so we can reach you about your order.");
      return;
    }
    setLoading(true);
    setError(null);
    let tok = turnstileTokenRef.current;
    for (let i = 0; i < 30 && !tok; i++) {
      await new Promise((r) => setTimeout(r, 100));
      tok = turnstileTokenRef.current;
    }
    try {
      const session = await userRegister({
        name,
        email,
        password,
        phone: phone.trim() || undefined,
        telegram: telegram.trim() || undefined,
        turnstile_token: tok,
        tracking: getTracking(),
      });
      completeFlow(session);
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        // Email já cadastrado: dá ao user um caminho concreto em vez de
        // só uma mensagem genérica que faz ele clicar de novo.
        const loginHref = "/login" + (returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : "");
        setError(
          <span>
            This email is already registered.{" "}
            <a href={loginHref} style={{ textDecoration: "underline", color: "inherit" }}>
              Sign in
            </a>{" "}
            or{" "}
            <a href="/forgot-password" style={{ textDecoration: "underline", color: "inherit" }}>
              recover your password
            </a>.
          </span>
        );
      } else if (err instanceof ApiError && err.code === "RATE_LIMITED") {
        setError("Too many attempts. Please wait a few seconds and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      brandHeading="Get started in 30 seconds"
      brandLead="Create an account to keep order history, manage profiles per platform, and unlock loyalty rewards on every plan."
      altCta={{ label: "Already have an account?", href: "/login", linkText: "Sign in" }}
    >
      <header style={{ marginBottom: "0.25rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 700 }}>Create account</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0.35rem 0 0" }}>
          Free, takes less than a minute. We&apos;ll never share your contact info.
        </p>
      </header>

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {error && <div className="alert alert-error">{error}</div>}

        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input className="input" id="name" name="name" autoComplete="name" placeholder="Jane Doe" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password (min. 8 characters)</label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="••••••••"
            required
          />
        </div>

        <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "0.85rem", marginTop: "0.25rem" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: "0 0 0.6rem" }}>
            One quick way to reach you about your order — pick whichever you prefer.
          </p>
          <div>
            <label className="label" htmlFor="phone">Phone (with country code)</label>
            <input
              className="input"
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder={phonePlaceholder}
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
              Fill ONE of the two above. Either field is enough.
            </p>
          )}
          {contactOk && (
            <p style={{ color: "#3cd87d", fontSize: "0.75rem", margin: "0.4rem 0 0", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <Icon name="check" size={12} />
              contact channel set
            </p>
          )}
        </div>

        <Turnstile onToken={handleTurnstileToken} />

        {/* Aceite de Termos + Política — exigência LGPD Art. 8º §1
            (consentimento manifestado de forma livre, expressa, informada).
            BUG-35 do QA 2026-06-12. */}
        <label
          className="label"
          htmlFor="terms_accept"
          style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.45, fontWeight: 400 }}
        >
          <input
            id="terms_accept"
            name="terms_accept"
            type="checkbox"
            required
            style={{ marginTop: "0.2rem", accentColor: "var(--accent)" }}
          />
          <span>
            I&apos;ve read and agree to the{" "}
            <a href="/legal/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Terms of Service</a>
            {" "}and{" "}
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Privacy Policy</a>.
          </span>
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading || !contactOk}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
