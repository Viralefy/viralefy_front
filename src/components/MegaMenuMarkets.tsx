"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { COUNTRIES, countriesByRegion } from "@/i18n/countries";
import { tr, type LangCode } from "@/i18n/languages";

// Mega menu de "Markets" no header — abre um painel duas colunas
// (Américas / SEPA) com todos os 67 países. Tem um filtro inline para
// digitar e estreitar a lista sem precisar abrir a busca global.

export function MegaMenuMarkets({ lang }: { lang: LangCode }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const t = tr(lang);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setFilter("");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setFilter("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const americas = countriesByRegion("americas");
  const sepa = countriesByRegion("sepa");

  const f = filter.trim().toLowerCase();
  const match = (name: string, code: string) =>
    !f || name.toLowerCase().includes(f) || code.includes(f);

  const totalShown = f
    ? COUNTRIES.filter((c) => match(c.name, c.code)).length
    : COUNTRIES.length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-outline"
        style={{ padding: "0.5rem 0.85rem", fontSize: "0.9rem" }}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        🌐 {t.header.markets} {open ? "▴" : "▾"}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            left: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "0.7rem",
            padding: "1rem",
            width: "min(720px, 85vw)",
            zIndex: 100,
            boxShadow: "0 14px 36px rgba(0,0,0,0.5)",
          }}
        >
          <input
            type="search"
            className="input"
            placeholder={t.header.searchPlaceholder}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ marginBottom: "0.75rem" }}
            autoFocus
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", maxHeight: "60vh", overflowY: "auto" }}>
            <section>
              <h4 style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.5rem" }}>
                {t.header.regionAmericas}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.15rem" }}>
                {americas.filter((c) => match(c.name, c.code)).map((c) => (
                  <li key={c.code}>
                    <Link
                      href={`/${c.code}`}
                      hrefLang={c.htmlLang}
                      onClick={() => { setOpen(false); setFilter(""); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.3rem 0.5rem",
                        borderRadius: "0.35rem",
                        textDecoration: "none",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    >
                      <span style={{ fontSize: "1.05rem" }}>{c.flag}</span> {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.5rem" }}>
                {t.header.regionSepa}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.15rem" }}>
                {sepa.filter((c) => match(c.name, c.code)).map((c) => (
                  <li key={c.code}>
                    <Link
                      href={`/${c.code}`}
                      hrefLang={c.htmlLang}
                      onClick={() => { setOpen(false); setFilter(""); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.3rem 0.5rem",
                        borderRadius: "0.35rem",
                        textDecoration: "none",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    >
                      <span style={{ fontSize: "1.05rem" }}>{c.flag}</span> {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.75rem", textAlign: "right" }}>
            {totalShown} / {COUNTRIES.length}
          </p>
        </div>
      )}
    </div>
  );
}
