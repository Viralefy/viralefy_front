"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "./Providers";
import { langOfCountry, tr } from "@/i18n/languages";
import { getCountry } from "@/i18n/countries";
import { MegaMenuMarkets } from "./MegaMenuMarkets";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";

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

function langFromPath(pathname: string) {
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  if (!seg) return "en" as const;
  if (getCountry(seg)) return langOfCountry(seg);
  return "en" as const;
}

export function Header() {
  const { currencies, currency, setCurrencyCode, user, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const lang = langFromPath(pathname ?? "");
  const t = tr(lang);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fecha drawer quando navega
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Esc fecha drawer
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const CurrencySelect = (
    <select
      aria-label={t.header.currency}
      className="input"
      style={{ width: "auto", padding: "0.5rem 0.7rem", fontSize: "0.85rem" }}
      value={currency?.code ?? "USD"}
      onChange={(e) => setCurrencyCode(e.target.value)}
    >
      {currencies.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.code}
        </option>
      ))}
    </select>
  );

  const AuthButtons = user ? (
    <>
      <Link href="/tickets" className="btn btn-outline" style={{ padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}>
        {t.header.support}
      </Link>
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
          <Image src="/logo.png" alt="Viralefy" width={2471} height={704} priority />
        </Link>

        {/* Markets — visível só em desktop */}
        <div className="site-header__hide-mobile">
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
          {drawerOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Drawer mobile — abre abaixo da row 1, com Markets + Theme + Currency + Auth */}
      <div className={`site-header__drawer container ${drawerOpen ? "open" : ""}`}>
        <MegaMenuMarkets lang={lang} />
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.4rem" }}>
          <ThemeToggle />
          <div style={{ flex: 1 }}>
            <label className="label" style={{ marginBottom: 0 }}>{t.header.currency}</label>
            {CurrencySelect}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.6rem" }}>
          {AuthButtons}
        </div>
      </div>
    </header>
  );
}
