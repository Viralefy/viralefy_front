"use client";

import { useState } from "react";
import type { Plan } from "@/lib/api";
import { priceFor } from "@/lib/format";
import { useApp } from "./Providers";
import { CheckoutModal } from "./CheckoutModal";
import { tr, type LangCode } from "@/i18n/languages";
import { categorySlug, type CategoryCode } from "@/i18n/categories";
import Link from "next/link";

// Variante "cards" da página de categoria. Cada plano vira um card com link
// para a página dedicada do plano (SEO próprio).
export function CategoryCardGrid({
  plans,
  lang,
  countryCode,
  category,
  unitLabel,
  hideDetailLink = false,
}: {
  plans: Plan[];
  lang: LangCode;
  countryCode: string;
  category: CategoryCode;
  unitLabel: string;
  // Esconde o link "+" pra página dedicada do plano. Usado em LPs globais
  // (marketplace/* não tem rota por-plano).
  hideDetailLink?: boolean;
}) {
  const { currency } = useApp();
  const t = tr(lang);
  const [selected, setSelected] = useState<Plan | null>(null);

  const sorted = [...plans].sort((a, b) => a.followers_qty - b.followers_qty);
  if (sorted.length === 0) return null;

  const catSlug = categorySlug(category, lang);

  return (
    <>
      <div className="grid-plans">
        {sorted.map((plan, i) => {
          // Slug do plano = qty + unit (estável e SEO-friendly em qualquer idioma).
          const planSlug = `${plan.followers_qty}-${catSlug}`;
          return (
            <article key={plan.id} className={`card plan-card ${i === Math.floor(sorted.length / 2) ? "featured" : ""}`}>
              <h3>{plan.name}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{plan.description}</p>
              <p className="plan-price">{priceFor(plan, currency)}</p>
              {category !== "servicos" && (
                <p style={{ fontSize: "0.95rem" }}>
                  <strong>{plan.followers_qty.toLocaleString()}</strong> {unitLabel}
                </p>
              )}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", flexWrap: "wrap" }}>
                <button type="button" className="btn btn-primary" style={{ flex: 1, minWidth: 0 }} onClick={() => setSelected(plan)}>
                  {t.cta.buyNow}
                </button>
                {!hideDetailLink && (
                  <Link
                    href={`/${countryCode}/${catSlug}/${planSlug}`}
                    className="btn btn-outline"
                    style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}
                  >
                    +
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {selected && <CheckoutModal plan={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
