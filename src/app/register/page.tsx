"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { userRegister } from "@/lib/api";
import { useApp } from "@/components/Providers";
import { Turnstile } from "@/components/Turnstile";
import { getTracking } from "@/lib/tracking";
import { Icon } from "@/components/Icon";
import { AuthLayout } from "@/components/AuthLayout";

const AUTH_UI_URL = process.env.NEXT_PUBLIC_AUTH_UI_URL || "https://auth.viralefy.com";

function isAuthHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "auth.viralefy.com" ||
         window.location.hostname.startsWith("auth.");
}

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

  // Mesma política do /login: registros fora do auth host caem em
  // auth.viralefy.com pra unificar UX. Voltam pelo /sso/callback.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthHost()) return;
    const returnTo = `${window.location.origin}/sso/callback`;
    window.location.replace(`${AUTH_UI_URL}/register?return_to=${encodeURIComponent(returnTo)}`);
  }, []);

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
    <AuthLayout
      brandHeading="Get started in 30 seconds"
      brandLead="Create an account to keep order history, manage profiles per platform, and unlock loyalty rewards on every plan."
      altCta={{ label: "Already have an account?", href: "/login" }}
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

        {/* Phone OU Telegram — pelo menos um. Front e back validam. */}
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
        <button type="submit" className="btn btn-primary" disabled={loading || !contactOk}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
