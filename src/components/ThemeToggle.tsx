"use client";

import { useEffect, useState } from "react";
import { getTheme, toggleTheme, type Theme } from "@/lib/theme";
import { Icon } from "./Icon";

// Botão de switcher claro/escuro. Lê o estado de localStorage no mount,
// muda via toggleTheme() (que escreve no <html data-theme> e localStorage).
// Anti-flash: o script inline em layout.tsx já setou o atributo correto
// antes do React hidratar, então este componente só sincroniza o ícone.

export function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocal(getTheme());
    setMounted(true);
  }, []);

  function onClick() {
    setLocal(toggleTheme());
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
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {mounted ? <Icon name={theme === "dark" ? "sun" : "moon"} size={18} label={theme === "dark" ? "Switch to light" : "Switch to dark"} /> : <Icon name="moon" size={18} />}
    </button>
  );
}
