"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "./Providers";
import { fetchMyOpenTicketsCount } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { langOfCountry, tr } from "@/i18n/languages";
import { getCountry } from "@/i18n/countries";
import { MegaMenuMarkets } from "./MegaMenuMarkets";
import { MegaMenuServices } from "./MegaMenuServices";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencyPicker } from "./CurrencyPicker";
import { Icon } from "./Icon";

// Header sticky com blur. Layout responsivo:
//   Desktop (>= 760px):  Logo · Markets · Search · Currency · Auth (single row)
//   Mobile  (< 760px):
//     Row 1: Logo · ☰ (hamburger)
//     Row 2: Search (full-width, sempre acessível)
//     Drawer aberto: Markets · Currency · Auth (stack)
//
// As classes site-header__* + media queries em globals.css fazem o switch;
// `drawerOpen` controla o estado quando ☰ é clicado. Drawer fecha em cada
// mudança de rota.

// `viralefy_last_country` é a memória entre navegações pra páginas globais
// (/legal, /vs, /case-studies, /pricing). Sem ela, ao sair de /br pra
// /legal/terms o Header voltava pra inglês e perdia o mercado — BUG-119
// do QA 2026-06-12.
const LAST_COUNTRY_KEY = "viralefy_last_country";

function readLastCountry(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(LAST_COUNTRY_KEY);
    return v && getCountry(v) ? v : null;
  } catch {
    return null;
  }
}

function langFromPath(pathname: string, fallbackCountry: string | null) {
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  if (seg && getCountry(seg)) return langOfCountry(seg);
  if (fallbackCountry) return langOfCountry(fallbackCountry);
  return "en" as const;
}

function countryFromPath(pathname: string, fallbackCountry: string | null): string {
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  if (seg && getCountry(seg)) return seg;
  if (fallbackCountry) return fallbackCountry;
  return "us";
}

export function Header() {
  const { currencies, currency, setCurrencyCode, user, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  // Memória do último país visitado, pra Header continuar localizado quando
  // o usuário sai pra /legal, /vs, /pricing. Hidratado no client após mount.
  const [lastCountry, setLastCountry] = useState<string | null>(null);
  const lang = langFromPath(pathname ?? "", lastCountry);
  const countryCode = countryFromPath(pathname ?? "", lastCountry);
  const t = tr(lang);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Contagem de tickets em open/pending — alimenta o badge ao lado do 💬.
  // null = ainda não buscado; 0 = sem tickets ativos; >0 = mostra badge.
  const [openTickets, setOpenTickets] = useState<number | null>(null);
  // Mounted gate — SSR não tem localStorage nem user (Providers só hidrata
  // depois). Renderizar AuthButtons / CurrencySelect dependentes desses
  // valores no SSR causa hydration mismatch (React #418 — BUG-105/109 do
  // QA 2026-06-12, causa raiz do "flash de tela preta" no scroll). Antes
  // do mount, gate render dessas ilhas com null/skeleton.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Fecha drawer quando navega
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Hidrata o último country no client + grava quando estamos numa rota de país.
  useEffect(() => {
    const fromPath = (pathname ?? "").split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
    if (fromPath && getCountry(fromPath)) {
      setLastCountry(fromPath);
      try { window.localStorage.setItem(LAST_COUNTRY_KEY, fromPath); } catch { /* ignora */ }
    } else if (!lastCountry) {
      const saved = readLastCountry();
      if (saved) setLastCountry(saved);
    }
  }, [pathname, lastCountry]);

  // Polling do badge de tickets — só quando logado. Refresh manual
  // dispara re-fetch ao mudar de rota (pra refletir respostas recentes
  // sem precisar de WebSocket).
  useEffect(() => {
    if (!user) {
      setOpenTickets(null);
      return;
    }
    const token = getToken();
    if (!token) return;
    let cancelled = false;
    fetchMyOpenTicketsCount(token)
      .then((r) => {
        if (!cancelled) setOpenTickets(r.open);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  // Esc fecha drawer
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Gated atrás de `mounted` pra evitar mismatch SSR/CSR — o catálogo de
  // moedas vem por fetch async (Providers) e currency começa null no SSR.
  const pickerLang: "pt" | "en" | "es" =
    lang === "pt" ? "pt"
    : lang === "es" || lang === "es_AR" ? "es"
    : "en";
  const CurrencySelect = mounted ? (
    <CurrencyPicker
      currencies={currencies}
      current={currency}
      onChange={setCurrencyCode}
      label={t.header.currency}
      lang={pickerLang}
    />
  ) : null;

  // Support sempre visível, com badge "💬", pra dar acesso rápido tanto
  // pra logado (vai pros tickets dele) quanto pra anônimo (cai em /login
  // que devolve pra /tickets depois). Quando logado e tem tickets ativos,
  // mostra contador em vermelho.
  const SupportButton = (
    <Link
      href="/tickets"
      className="btn btn-outline"
      style={{
        padding: "0.5rem 0.85rem",
        fontSize: "0.85rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        position: "relative",
      }}
    >
      <Icon name="chat" size={16} />
      {t.header.support}
      {openTickets != null && openTickets > 0 && (
        <span
          aria-label={`${openTickets} ticket(s) abertos`}
          style={{
            background: "var(--danger, #ef4444)",
            color: "#fff",
            borderRadius: "999px",
            padding: "0.05rem 0.45rem",
            fontSize: "0.7rem",
            fontWeight: 700,
            minWidth: "1.2rem",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {openTickets > 99 ? "99+" : openTickets}
        </span>
      )}
    </Link>
  );

  // AuthButtons depende de `user` que vem do localStorage — só popula
  // depois do mount. Antes do mount mostramos só o SupportButton (mesma
  // estrutura em SSR e CSR), evitando mismatch.
  const AuthButtons = !mounted ? (
    SupportButton
  ) : user ? (
    <>
      {SupportButton}
      <Link href="/account" className="btn btn-outline" style={{ padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
        {t.header.account}
      </Link>
      <button
        type="button"
        className="btn btn-outline"
        style={{ padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
        onClick={() => {
          logout();
          router.push("/");
        }}
      >
        {t.header.logout}
      </button>
    </>
  ) : (
    <>
      {SupportButton}
      <Link href="/login" className="btn btn-outline" style={{ padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
        {t.header.login}
      </Link>
      <Link href="/register" className="btn btn-primary" style={{ padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
        {t.header.register}
      </Link>
    </>
  );

  return (
    <header className="site-header">
      <div className="site-header__row container">
        <Link href="/" aria-label="Viralefy" className="site-header__logo" style={{ display: "inline-flex", flexShrink: 0 }}>
          {/* sizes="200px" pra Next.js servir variante pequena (~200w em
              vez do 3840w default). Antes o PSI flagava 24KB de logo
              transferido pra render de 160x46. */}
          <Image
            src="/logo.png"
            alt="Viralefy"
            width={2471}
            height={704}
            sizes="200px"
            priority
          />
        </Link>

        {/* Services + Markets — visíveis só em desktop */}
        <div className="site-header__hide-mobile" style={{ display: "inline-flex", gap: "0.5rem" }}>
          <MegaMenuServices lang={lang} country={countryCode} />
          <MegaMenuMarkets lang={lang} />
        </div>

        {/* Search — sempre visível; em mobile vai pra row 2 via CSS order/flex */}
        <div className="site-header__search">
          <SearchBar lang={lang} />
        </div>

        {/* Theme toggle + Currency + auth — só desktop */}
        <nav className="site-header__nav site-header__hide-mobile">
          <ThemeToggle />
          {CurrencySelect}
          {AuthButtons}
        </nav>

        {/* Hamburger — só mobile */}
        <button
          type="button"
          className="site-header__hamburger"
          aria-label="Menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((o) => !o)}
        >
          <Icon name={drawerOpen ? "close" : "menu"} size={22} label={drawerOpen ? "Close menu" : "Open menu"} />
        </button>
      </div>

      {/* Drawer mobile — abre abaixo da row 1, com Services + Markets + Theme + Currency + Auth */}
      <div className={`site-header__drawer container ${drawerOpen ? "open" : ""}`}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <MegaMenuServices lang={lang} country={countryCode} />
          <MegaMenuMarkets lang={lang} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.4rem" }}>
          <ThemeToggle />
          {CurrencySelect}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.6rem" }}>
          {AuthButtons}
        </div>
      </div>
    </header>
  );
}
