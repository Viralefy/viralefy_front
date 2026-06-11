"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { COUNTRIES, countriesByRegion, type Country, type Region } from "@/i18n/countries";
import { tr, type LangCode } from "@/i18n/languages";
import { Icon } from "./Icon";
import { Flag } from "./Flag";

// Mega menu de "Markets" no header. Mostra todas as 6 regiões em 2 colunas:
//   Esquerda: Américas + SEPA (mercados históricos)
//   Direita:  Ásia + África + Oceania + Europa-fora-SEPA (expansão)
// Tem filtro inline com autofocus pra estreitar a lista sem precisar
// abrir a busca global.

const REGION_LABEL_FALLBACK: Record<Region, string> = {
  americas: "Americas",
  sepa: "Europe / SEPA",
  asia: "Asia",
  africa: "Africa",
  oceania: "Oceania",
  europe_other: "Europe (other)",
};

// Tradução compacta por idioma — apenas os nomes das 6 regiões, herdados
// onde o pacote básico (tr) não cobre.
const REGION_LABEL_BY_LANG: Partial<Record<LangCode, Partial<Record<Region, string>>>> = {
  pt: { americas: "Américas", sepa: "Europa / SEPA", asia: "Ásia", africa: "África", oceania: "Oceania", europe_other: "Europa (outros)" },
  es: { americas: "Américas", sepa: "Europa / SEPA", asia: "Asia", africa: "África", oceania: "Oceanía", europe_other: "Europa (otros)" },
  fr: { americas: "Amériques", sepa: "Europe / SEPA", asia: "Asie", africa: "Afrique", oceania: "Océanie", europe_other: "Europe (autres)" },
  de: { americas: "Amerika", sepa: "Europa / SEPA", asia: "Asien", africa: "Afrika", oceania: "Ozeanien", europe_other: "Europa (sonstige)" },
  it: { americas: "Americhe", sepa: "Europa / SEPA", asia: "Asia", africa: "Africa", oceania: "Oceania", europe_other: "Europa (altri)" },
};

function regionLabel(region: Region, lang: LangCode): string {
  return REGION_LABEL_BY_LANG[lang]?.[region] ?? REGION_LABEL_FALLBACK[region];
}

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

  const f = filter.trim().toLowerCase();
  const match = (c: Country) =>
    !f || c.name.toLowerCase().includes(f) || c.code.includes(f) || c.h1.toLowerCase().includes(f);

  const leftRegions: Region[] = ["americas", "sepa"];
  const rightRegions: Region[] = ["asia", "africa", "oceania", "europe_other"];

  const totalShown = f ? COUNTRIES.filter(match).length : COUNTRIES.length;

  function RegionBlock({ region }: { region: Region }) {
    const list = countriesByRegion(region).filter(match);
    if (list.length === 0) return null;
    return (
      <section style={{ marginBottom: "1rem" }}>
        <h4
          style={{
            fontSize: "0.7rem",
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: ".6px",
            marginBottom: "0.4rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{regionLabel(region, lang)}</span>
          <span style={{ fontWeight: 400, opacity: 0.7 }}>{list.length}</span>
        </h4>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.1rem" }}>
          {list.map((c) => (
            <li key={c.code}>
              <Link
                href={`/${c.code}`}
                hrefLang={c.htmlLang}
                onClick={() => {
                  setOpen(false);
                  setFilter("");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.35rem",
                  textDecoration: "none",
                  color: "var(--text)",
                  fontSize: "0.85rem",
                }}
              >
                <Flag code={c.code} width={18} title={c.name} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

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
        <Icon name="globe" size={16} style={{ marginRight: "0.4rem" }} />
        {t.header.markets}
        <Icon name={open ? "chevronUp" : "chevronDown"} size={14} style={{ marginLeft: "0.3rem" }} />
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
            width: "min(760px, 90vw)",
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.25rem",
              maxHeight: "65vh",
              overflowY: "auto",
            }}
          >
            <div>
              {leftRegions.map((r) => (
                <RegionBlock key={r} region={r} />
              ))}
            </div>
            <div>
              {rightRegions.map((r) => (
                <RegionBlock key={r} region={r} />
              ))}
            </div>
          </div>

          <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.75rem", textAlign: "right" }}>
            {totalShown} / {COUNTRIES.length}
          </p>
        </div>
      )}
    </div>
  );
}
