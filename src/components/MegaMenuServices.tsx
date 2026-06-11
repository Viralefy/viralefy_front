"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CATEGORY_CODES,
  categoryLabel,
  categorySlug,
  type CategoryCode,
} from "@/i18n/categories";
import { tr, type LangCode } from "@/i18n/languages";
import { Icon, type IconName } from "./Icon";
import { Modal } from "./Modal";

// MegaMenuServices — botão hambúrguer no header que abre um modal full-
// screen (via Portal) com TODAS as 12 categorias agrupadas:
//   coluna 1: Instagram (5)
//   coluna 2: TikTok    (5)
//   coluna 3: Outros    (servicos, recuperacao_perfil)
//
// O modal vive em document.body via createPortal — escapa o stacking
// context do .site-header (sticky + z-index 50) que antes prendia o overlay
// abaixo do menu.

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
  const t = tr(lang);
  const label = t.header.allServices ?? "Services";

  const buckets: Bucket[] = ["instagram", "tiktok", "other"];

  return (
    <>
      <button
        type="button"
        className="btn btn-outline"
        aria-label={label}
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
        <span>{label}</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        maxWidth={960}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
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
          </div>
        }
      >
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
      </Modal>
    </>
  );
}
