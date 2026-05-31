// Helpers de tema. SSR-safe — funciona quando window/localStorage são
// undefined. O atributo `data-theme` mora no <html> e é setado o mais cedo
// possível via inline script em layout.tsx (anti-flash). O ThemeToggle
// componente chama setTheme() pra mudar e persistir no localStorage.

export type Theme = "dark" | "light";

const STORAGE_KEY = "viralefy_theme";

// Acesso defensivo ao localStorage — checa globalThis pra funcionar em
// ambientes de teste (node:test com shim) e SSR (sem DOM nenhum).
function ls(): Storage | null {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: Storage }).localStorage) {
      return (globalThis as { localStorage: Storage }).localStorage;
    }
  } catch { /* ignora */ }
  return null;
}

function setAttr(theme: Theme): void {
  try {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch { /* ignora */ }
}

export function getTheme(): Theme {
  const s = ls();
  if (!s) return "dark";
  try {
    const v = s.getItem(STORAGE_KEY);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function setTheme(theme: Theme): Theme {
  const s = ls();
  if (s) {
    try { s.setItem(STORAGE_KEY, theme); } catch { /* ignora */ }
  }
  setAttr(theme);
  return theme;
}

export function toggleTheme(): Theme {
  return setTheme(getTheme() === "dark" ? "light" : "dark");
}
