"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/i18n/countries";
import {
  CATEGORY_CODES,
  CATEGORY_LABEL,
  categoryLabel,
  categorySlug,
  type CategoryCode,
} from "@/i18n/categories";
import { langOfCountry, tr, type LangCode } from "@/i18n/languages";

// Busca tipo marketplace: digita "seguidores" e a lista mostra
// "Seguidores Instagram & TikTok — Brasil", "Followers — United States",
// "Abonnés — France"... cada item linka pra /<country>/<category-slug>.
//
// Index estático (built once at module load): 67 países × 4 categorias = 268
// itens. Keywords ricos: nome do país, código, h1, descrição, label da
// categoria em TODOS os 26 idiomas + palavras-chave de serviços conhecidos
// pra "recuperação" / "verificação" / "auditoria" caírem na categoria de
// serviços.
//
// Match algorithm: token-AND com bônus quando o token começa em fronteira
// de palavra. Limit 12 resultados.

type Hit = {
  url: string;
  label: string;
  market: string;
  flag: string;
  keywords: string;
};

// Keywords adicionais por categoria — vocabulário do usuário que talvez não
// esteja nos labels (ex: "seguidor singular", "curtidas vs likes", nomes
// de serviços específicos pra categoria 'servicos').
const EXTRA_KEYWORDS: Record<CategoryCode, string> = {
  seguidores: "follower seguidor follower seguir abonnes obserwujacy seuraajat sledilci instagram tiktok",
  engajamento: "like curtir polubienia interaccion comentario comment commentaire reazione",
  visualizacoes: "view watch reels story stories reel video views vistas aufruf vues visualizzazioni",
  servicos: "servico service services premium gestao management gestion gerenciamento " +
    "recuperacao recovery recuperar recuperacion recuperer recover wiederherstellen rebooting " +
    "auditoria audit auditar auditoria diagnostico " +
    "setup launch lancamento lanzamiento creation " +
    "shadowban shadow ban anti-shadowban hashtags " +
    "concorrentes competitor concurrents competitors analisi rivali " +
    "verificacao verification badge azul blue check verifie verifica " +
    "consultoria consulting consulenza beratung consultation",
};

function buildIndex(): Hit[] {
  const items: Hit[] = [];
  for (const c of COUNTRIES) {
    const lang = langOfCountry(c.code);
    for (const cat of CATEGORY_CODES) {
      const label = categoryLabel(cat, lang);
      const slug = categorySlug(cat, lang);
      // Junta o label da categoria em TODOS os idiomas — pra digitação em
      // qualquer língua bater com qualquer país.
      const allLangsLabel = Object.values(CATEGORY_LABEL[cat]).join(" ");
      items.push({
        url: `/${c.code}/${slug}`,
        label: `${label} Instagram & TikTok`,
        market: c.name,
        flag: c.flag,
        keywords: [
          c.name,
          c.code,
          c.h1,
          c.description,
          c.htmlLang,
          allLangsLabel,
          label,
          EXTRA_KEYWORDS[cat],
        ]
          .join(" ")
          .toLowerCase()
          // Remove diacríticos para tolerar busca sem acento
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, ""),
      });
    }
  }
  return items;
}

const INDEX = buildIndex();

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function search(query: string, limit = 12): Hit[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored: Array<{ hit: Hit; score: number }> = [];
  for (const item of INDEX) {
    let score = 0;
    let allMatched = true;
    for (const tok of tokens) {
      const idx = item.keywords.indexOf(tok);
      if (idx === -1) {
        allMatched = false;
        break;
      }
      score += 10;
      if (idx === 0 || item.keywords[idx - 1] === " ") score += 6;
      // Bônus quando o token bate diretamente no nome do mercado
      if (item.market.toLowerCase().includes(tok)) score += 4;
    }
    if (allMatched) scored.push({ hit: item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.hit);
}

export function SearchBar({ lang }: { lang: LangCode }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = tr(lang);

  const hits = useMemo(() => search(q), [q]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Atalho global: "/" foca a busca (estilo GitHub).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(hit: Hit) {
    router.push(hit.url);
    setOpen(false);
    setQ("");
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        flex: "1 1 260px",
        minWidth: 200,
        maxWidth: 460,
      }}
    >
      <input
        ref={inputRef}
        type="search"
        className="input"
        role="searchbox"
        aria-label={t.header.searchPlaceholder}
        placeholder={t.header.searchPlaceholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        style={{ paddingLeft: "2.25rem", padding: "0.55rem 0.75rem 0.55rem 2.25rem", fontSize: "0.9rem" }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          opacity: 0.6,
        }}
      >
        🔍
      </span>

      {open && q.trim().length >= 2 && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 0.4rem)",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "0.6rem",
            maxHeight: 380,
            overflowY: "auto",
            zIndex: 100,
            boxShadow: "0 14px 36px rgba(0,0,0,0.5)",
          }}
        >
          {hits.length === 0 ? (
            <p style={{ color: "var(--muted)", padding: "1rem", fontSize: "0.9rem" }}>
              {t.header.searchNoResults}
            </p>
          ) : (
            hits.map((h, i) => (
              <button
                key={h.url}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(h)}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: "0.7rem",
                  padding: "0.55rem 0.75rem",
                  background: i === active ? "var(--accent-dim)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  color: "var(--text)",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>{h.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{h.label}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{h.market}</div>
                </div>
                <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{h.url}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
