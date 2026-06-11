"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/Providers";
import type { Session, User, AdminPrincipal } from "@/lib/api";

// /sso/callback — landing OAuth-style do login unificado.
//
// Fluxo:
//   1. auth.viralefy.com/login completou o login e redirecionou pra cá
//      com session no fragment URL: #access_token=...&user={...}
//   2. Parseamos o fragment, montamos uma Session, chamamos login() do
//      Providers (que persiste no localStorage do subdomínio CORRENTE).
//   3. Limpamos o fragment (history.replaceState) — evita session vazar
//      no Referer header se o usuário compartilhar o link.
//   4. Redirect pra /account (user) ou home (default fallback).
//
// Sem fragment: render mensagem de erro + link de volta pra /login.

export default function SSOCallbackPage() {
  const router = useRouter();
  const { login } = useApp();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    if (!hash) {
      setError("No session in URL — redirecting back to login.");
      const t = setTimeout(() => {
        window.location.href = `${authUrl()}/login?return_to=${encodeURIComponent(window.location.origin + "/sso/callback")}`;
      }, 1500);
      return () => clearTimeout(t);
    }
    try {
      const params = new URLSearchParams(hash);
      const session: Session = {
        access_token: params.get("access_token") ?? undefined,
        access_expires_at: params.get("access_expires_at") ?? undefined,
        refresh_token: params.get("refresh_token") ?? undefined,
        refresh_expires_at: params.get("refresh_expires_at") ?? undefined,
        subject_kind: (params.get("subject_kind") as "user" | "admin") ?? undefined,
      };
      const userRaw = params.get("user");
      const adminRaw = params.get("admin");
      if (userRaw) session.user = JSON.parse(userRaw) as User;
      if (adminRaw) session.admin = JSON.parse(adminRaw) as AdminPrincipal;
      if (!session.access_token) {
        setError("Session payload is missing access_token. Try logging in again.");
        return;
      }
      login(session);
      // Limpa o fragment ANTES de qualquer navegação — Next router.push
      // pode normalizar URL e preservar fragment senão. replaceState não
      // adiciona entrada no history.
      window.history.replaceState(null, "", "/sso/callback");
      router.replace("/account");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse session.");
    }
  }, [login, router]);

  return (
    <main className="container" style={{ paddingTop: "4rem", textAlign: "center", maxWidth: 480 }}>
      <div className="card" style={{ padding: "2rem" }}>
        <h1 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
          {error ? "Sign-in problem" : "Signing you in…"}
        </h1>
        {error ? (
          <>
            <p style={{ color: "var(--danger, #ff6b6b)", fontSize: "0.9rem" }}>{error}</p>
            <p style={{ marginTop: "1.5rem" }}>
              <a className="btn btn-primary" href={`${authUrl()}/login?return_to=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.origin + "/sso/callback")}`}>
                Go to login
              </a>
            </p>
          </>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Restoring your session…
          </p>
        )}
      </div>
    </main>
  );
}

function authUrl(): string {
  return process.env.NEXT_PUBLIC_AUTH_UI_URL || "https://auth.viralefy.com";
}
