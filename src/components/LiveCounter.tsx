"use client";

import { useEffect, useState } from "react";
import { tr, type LangCode } from "@/i18n/languages";

// Widget sticky bottom-right que poll-a `/api/orders-today` cada 60s. Mostra
// "N orders today · M in the last hour". A primeira pintura é vazia (zero
// flash) — só aparece depois do primeiro fetch resolver, mesmo se for
// fallback sintético.
//
// Não bloqueia render — o componente é injetado em páginas de país/plano
// como ilha client. Limpa o interval no unmount.

type Stats = { today: number; last_hour: number };

export function LiveCounter({ lang = "en" }: { lang?: LangCode }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const t = tr(lang);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch("/api/orders-today", { cache: "no-store" });
        const json = await res.json();
        const data = json?.data as Stats | undefined;
        if (alive && data) setStats(data);
      } catch {
        // silencioso — UI permanece com último valor (ou null se nunca chegou).
      }
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!stats || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        right: "1rem",
        bottom: "1rem",
        zIndex: 40,
        padding: "0.6rem 0.9rem",
        background: "rgba(20, 20, 31, 0.92)",
        color: "var(--text)",
        border: "1px solid var(--accent)",
        borderRadius: "0.6rem",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
        fontSize: "0.82rem",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: "0.55rem",
          height: "0.55rem",
          borderRadius: "50%",
          background: "var(--accent, #00fed6)",
          boxShadow: "0 0 8px var(--accent, #00fed6)",
        }}
      />
      <span>
        <strong>{stats.today.toLocaleString()}</strong> {t.live.ordersToday}
        <span style={{ color: "var(--muted)" }}>
          {" · "}
          <strong>{stats.last_hour.toLocaleString()}</strong> {t.live.lastHour}
        </span>
      </span>
      <button
        type="button"
        aria-label="dismiss"
        onClick={() => setDismissed(true)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          padding: "0 0.2rem",
          fontSize: "1rem",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
