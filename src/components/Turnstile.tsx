"use client";

import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile widget (modo managed). Gated por
// NEXT_PUBLIC_TURNSTILE_SITE_KEY — sem a env não renderiza nada e
// `onToken` recebe a string vazia "" (que o backend trata como bypass
// quando TURNSTILE_SECRET_KEY também está vazia).
//
// O script da Cloudflare é carregado uma única vez por sessão. O widget
// renderiza em modo "managed" — o Cloudflare decide se mostra o desafio
// baseado nos sinais do visitante. Usuário limpo passa invisível.

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

function ensureScriptLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${TURNSTILE_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = `${TURNSTILE_SRC}?render=explicit`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export function Turnstile({
  onToken,
  theme = "auto",
}: {
  onToken: (token: string) => void;
  theme?: "light" | "dark" | "auto";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [error, setError] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    // Sem a chave configurada, simulamos "validado" passando token vazio.
    // Backend que decide se aceita (quando TURNSTILE_SECRET_KEY também
    // estiver vazio o middleware faz bypass).
    if (!siteKey) {
      onToken("");
      return;
    }

    let cancelled = false;
    ensureScriptLoaded().then(() => {
      if (cancelled || !ref.current || !window.turnstile) return;
      try {
        widgetIdRef.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme,
          appearance: "interaction-only", // só aparece se o Cloudflare desafiar
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => {
            setError(true);
            onToken("");
          },
        });
      } catch {
        setError(true);
        onToken("");
      }
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* engole — turnstile pode já ter desmontado */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, theme]);

  if (!siteKey) return null;
  return (
    <div>
      <div ref={ref} />
      {error && (
        <p style={{ color: "var(--danger)", fontSize: "0.85rem", margin: "0.5rem 0 0" }}>
          Anti-bot check failed to load. Please refresh and try again.
        </p>
      )}
    </div>
  );
}
