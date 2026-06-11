"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CATEGORY_CODES,
  categoryLabel,
  categorySlug,
  type CategoryCode,
} from "@/i18n/categories";
import { tr, type LangCode } from "@/i18n/languages";
import { Icon, type IconName } from "./Icon";

// MegaMenuServices — modal "todos os serviços" disparado pelo hambúrguer
// no header. Mostra TODAS as 12 CategoryCodes agrupadas por:
//   coluna 1: Instagram (5 categorias)
//   coluna 2: TikTok    (5 categorias)
//   coluna 3: Outros    (servicos, recuperacao_perfil)
//
// Cada item linka pra /{country}/{slug}. Se o usuário não tem país no path
// (home global em inglês), o link cai em /us como padrão razoável de tráfego
// global (idioma en-US, mercado #1 de pesquisa).
//
// Fechamento: ESC, click fora, click em link, ou X. Body fica com
// overflow:hidden enquanto aberto pra evitar scroll do background.

type Bucket = "instagram" | "tiktok" | "other";

type ServiceEntry = {
  code: CategoryCode;
  bucket: Bucket;
  icon: IconName;
};

const SERVICES: ServiceEntry[] = [
  { code: "seguidores_instagram", bucket: "instagram", icon: "profile" },
  { code: "curtidas_instagram", bucket: "instagram", icon: "starFilled" },
  { code: "comentarios_instagram", bucket: "instagram", icon: "chat" },
  { code: "compartilhamentos_instagram", bucket: "instagram", icon: "arrowRight" },
  { code: "visualizacoes_instagram", bucket: "instagram", icon: "bolt" },

  { code: "seguidores_tiktok", bucket: "tiktok", icon: "profile" },
  { code: "curtidas_tiktok", bucket: "tiktok", icon: "starFilled" },
  { code: "comentarios_tiktok", bucket: "tiktok", icon: "chat" },
  { code: "compartilhamentos_tiktok", bucket: "tiktok", icon: "arrowRight" },
  { code: "visualizacoes_tiktok", bucket: "tiktok", icon: "bolt" },

  { code: "servicos", bucket: "other", icon: "shield" },
  { code: "recuperacao_perfil", bucket: "other", icon: "lock" },
];

// Brand names "Instagram" e "TikTok" são iguais cross-lang. Pra "Outros
// serviços" mantemos um map por lang com fallback EN.
const OTHER_LABEL: Partial<Record<LangCode, string>> = {
  en: "Other services",
  pt: "Outros serviços",
  es: "Otros servicios",
  fr: "Autres services",
  de: "Weitere Leistungen",
  it: "Altri servizi",
  nl: "Andere diensten",
};

function bucketTitle(b: Bucket, lang: LangCode): string {
  if (b === "instagram") return "Instagram";
  if (b === "tiktok") return "TikTok";
  return OTHER_LABEL[lang] ?? OTHER_LABEL.en!;
}

// IconBucket — ícone do header da coluna (Instagram/TikTok/Outros)
const BUCKET_ICON: Record<Bucket, IconName> = {
  instagram: "instagram",
  tiktok: "tiktok",
  other: "diamond",
};

export function MegaMenuServices({
  lang = "en",
  country = "us",
}: {
  lang?: LangCode;
  country?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const t = tr(lang);

  // Fecha em ESC + restora foco no botão pra a11y
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Bloqueia scroll do body enquanto modal aberto.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const buckets: Bucket[] = ["instagram", "tiktok", "other"];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-outline"
        aria-label={t.header.allServices ?? "All services"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        style={{
          padding: "0.5rem 0.85rem",
          fontSize: "0.9rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        <Icon name="menu" size={18} />
        <span>{t.header.allServices ?? "Services"}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.header.allServices ?? "All services"}
          onClick={(e) => {
            // Fecha quando clica no overlay (não no card)
            if (e.target === e.currentTarget) setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "4vh 1rem 2rem",
            overflowY: "auto",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 960,
              padding: "1.5rem 1.5rem 2rem",
              borderRadius: "0.9rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
            }}
          >
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.15rem" }}>
                {t.header.allServices ?? "All services"}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  padding: "0.4rem",
                  cursor: "pointer",
                  color: "var(--text)",
                  display: "inline-flex",
                }}
              >
                <Icon name="close" size={18} />
              </button>
            </header>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {buckets.map((bucket) => {
                const list = SERVICES.filter((s) => s.bucket === bucket);
                return (
                  <section key={bucket}>
                    <h3
                      style={{
                        margin: "0 0 0.75rem",
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--muted)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <Icon name={BUCKET_ICON[bucket]} size={14} color="var(--accent, #00fed6)" />
                      {bucketTitle(bucket, lang)}
                    </h3>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {list.map((s) => {
                        const slug = categorySlug(s.code, lang);
                        const href = `/${country}/${slug}`;
                        return (
                          <li key={s.code}>
                            <Link
                              href={href}
                              onClick={() => setOpen(false)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.55rem",
                                padding: "0.5rem 0.6rem",
                                borderRadius: "0.5rem",
                                textDecoration: "none",
                                color: "var(--text)",
                                fontSize: "0.92rem",
                                width: "100%",
                                transition: "background 120ms ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-dim, rgba(0,254,214,0.08))")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Icon name={s.icon} size={16} color="var(--accent, #00fed6)" />
                              <span>{categoryLabel(s.code, lang)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>

            <footer
              style={{
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                {CATEGORY_CODES.length} services available · Instant delivery worldwide
              </span>
              <Link
                href={`/${country}`}
                onClick={() => setOpen(false)}
                className="btn btn-primary"
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                Browse country
                <Icon name="arrowRight" size={14} />
              </Link>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
