"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Plan } from "@/lib/api";
import { priceFor } from "@/lib/format";
import { useApp } from "./Providers";
import { CheckoutModal } from "./CheckoutModal";
import { CATEGORY_CODES, categoryLabel, categorySlug, categoryUnit } from "@/i18n/categories";
import { tr, type LangCode } from "@/i18n/languages";

// Grid usado em /<country> e em / (global). Agrupa os planos por categoria
// na ordem canônica (seguidores → likes → comments → shares → views →
// serviços) e dentro de cada grupo ordena por followers_qty ASC. Cada grupo
// tem um header e um link "ver detalhes" que leva à página SEO de categoria.
//
// `countryCode` define o prefixo dos links — `/${countryCode}/${slug}`. Quando
// for a home global o prefixo é `""` e os links vão pra raiz com âncora.
export function CategoryGroupedGrid({
  plans,
  lang,
  countryCode,
}: {
  plans: Plan[];
  lang: LangCode;
  countryCode: string; // "" para global
}) {
  const { currency } = useApp();
  const [selected, setSelected] = useState<Plan | null>(null);
  const t = tr(lang);

  // Agrupa: categoryCode → plans ordenados.
  const groups = useMemo(() => {
    return CATEGORY_CODES.map((code) => {
      const items = plans
        .filter((p) => p.category === code)
        .sort((a, b) => a.followers_qty - b.followers_qty);
      return { code, items };
    }).filter((g) => g.items.length > 0);
  }, [plans]);

  const prefix = countryCode ? `/${countryCode}` : "";

  return (
    <>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
        {t.home.plansByService}
      </h2>

      {groups.map((g) => {
        const slug = categorySlug(g.code, lang);
        const href = countryCode
          ? `${prefix}/${slug}`
          : `${prefix}/global/${slug}`; // sem país, usa namespace global
        const label = categoryLabel(g.code, lang);
        return (
          <section key={g.code} aria-labelledby={`cat-${g.code}`} style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
              <h3 id={`cat-${g.code}`} style={{ fontSize: "1.15rem", margin: 0 }}>
                {label}
              </h3>
              {countryCode && (
                <Link href={href} style={{ fontSize: "0.85rem", color: "var(--accent)" }}>
                  {t.home.viewService} →
                </Link>
              )}
            </div>

            <div className="grid-plans">
              {g.items.map((plan) => (
                <article key={plan.id} className="card plan-card">
                  <h4 style={{ fontSize: "1rem" }}>{plan.name}</h4>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{plan.description}</p>
                  <p className="plan-price">{priceFor(plan, currency)}</p>
                  {g.code !== "servicos" && (
                    <p style={{ fontSize: "0.9rem" }}>
                      <strong>{plan.followers_qty.toLocaleString()}</strong>{" "}
                      {categoryUnit(g.code, lang)}
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: "auto" }}
                    onClick={() => setSelected(plan)}
                  >
                    {t.cta.buyNow}
                  </button>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {selected && <CheckoutModal plan={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
