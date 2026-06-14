"use client";

import Link from "next/link";
import { useState } from "react";
import { COUNTRIES, countriesByRegion, type Country, type Region } from "@/i18n/countries";
import { tr, type LangCode } from "@/i18n/languages";
import { Icon } from "./Icon";
import { Flag } from "./Flag";
import { Modal } from "./Modal";

// Mega menu de "Markets" no header. Agora renderiza via Modal (portal) pra
// cobrir o site todo em vez de cair preso embaixo do header sticky.
// Mostra as 6 regiões em 2 colunas com filtro inline.

const REGION_LABEL_FALLBACK: Record<Region, string> = {
  americas: "Americas",
  sepa: "Europe / SEPA",
  asia: "Asia",
  africa: "Africa",
  oceania: "Oceania",
  europe_other: "Europe (other)",
};

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
  const t = tr(lang);

  function close() {
    setOpen(false);
    setFilter("");
  }

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
      <section style={{ marginBottom: "1.25rem" }}>
        <h4
          style={{
            fontSize: "0.72rem",
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: ".06em",
            marginBottom: "0.5rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{regionLabel(region, lang)}</span>
          <span style={{ fontWeight: 400, opacity: 0.7 }}>{list.length}</span>
        </h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.15rem" }}>
          {list.map((c) => (
            <li key={c.code}>
              <Link
                href={`/${c.code}`}
                hrefLang={c.htmlLang}
                onClick={close}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  padding: "0.35rem 0.55rem",
                  borderRadius: "0.4rem",
                  textDecoration: "none",
                  color: "var(--text)",
                  fontSize: "0.88rem",
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-dim, rgba(0,254,214,0.08))")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Flag code={c.code} width={20} title={c.name} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-outline"
        style={{ padding: "0.5rem 0.85rem", fontSize: "0.9rem", display: "inline-flex", alignItems: "center" }}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="globe" size={16} style={{ marginInlineEnd: "0.4rem" }} />
        {t.header.markets}
        <Icon name="chevronDown" size={14} style={{ marginInlineStart: "0.3rem" }} />
      </button>

      <Modal
        open={open}
        onClose={close}
        title={t.header.markets}
        maxWidth={900}
        footer={
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0, textAlign: "end" }}>
            {totalShown} / {COUNTRIES.length}
          </p>
        }
      >
        <input
          type="search"
          className="input"
          placeholder={t.header.searchPlaceholder}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ marginBottom: "1rem", width: "100%" }}
          autoFocus
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
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
      </Modal>
    </>
  );
}
