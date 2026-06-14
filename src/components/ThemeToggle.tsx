"use client";

import { useEffect, useState } from "react";
import { getTheme, resolveTheme, toggleTheme, type ResolvedTheme } from "@/lib/theme";
import { Icon } from "./Icon";

// Botão de switcher claro/escuro. O tema efetivo (dark/light) vem do
// SSR via cookie — o `<html data-theme>` já está correto antes da
// hidratação. Este componente só precisa sincronizar o ícone do botão
// com o tema atualmente aplicado.
//
// BUG-79/111: antes lia localStorage no mount, o que falhava cross-domain
// (subdomínios não compartilhavam LS) e fazia o tema "voltar" pro default
// em alguns refreshes. Agora a fonte é o cookie `vf_theme` lido server-
// side; cookie também segue cross-subdomain (.viralefy.com).

export function ThemeToggle() {
  // Estado do ícone — espelha o tema EFETIVO (dark/light). A preferência
  // crua (incluindo "system") fica em `lib/theme.ts`.
  const [effective, setEffective] = useState<ResolvedTheme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEffective(resolveTheme(getTheme()));
    setMounted(true);

    // Quando a preferência é "system", o sistema operacional pode mudar
    // o esquema (dark/light schedule no macOS/Windows). Reagimos pra
    // que o ícone fique consistente sem reload.
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (getTheme() === "system") {
        const t: ResolvedTheme = mq.matches ? "light" : "dark";
        setEffective(t);
        try { document.documentElement.setAttribute("data-theme", t); } catch { /* ignora */ }
      }
    };
    try {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } catch {
      // Safari antigo
      mq.addListener(onChange);
      return () => mq.removeListener(onChange);
    }
  }, []);

  function onClick() {
    const next = toggleTheme();
    setEffective(resolveTheme(next));
  }

  // Antes de mount: render neutro pra evitar hydration mismatch.
  // O ícone aparece após o primeiro useEffect.
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={onClick}
      className="btn btn-outline"
      style={{
        padding: "0.5rem 0.7rem",
        fontSize: "1rem",
        minWidth: 40,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      title={effective === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {mounted ? <Icon name={effective === "dark" ? "sun" : "moon"} size={18} label={effective === "dark" ? "Switch to light" : "Switch to dark"} /> : <Icon name="moon" size={18} />}
    </button>
  );
}
