"use client";

import { useMemo, useState } from "react";
import type { Plan } from "@/lib/api";
import { priceFor, priceForCountry } from "@/lib/format";
import { useApp } from "./Providers";
import { CheckoutModal } from "./CheckoutModal";
import { tr, type LangCode } from "@/i18n/languages";
import { localizedPlanName, localizedPlanDescription } from "@/lib/plan-labels";

// Variante "calculadora" reutilizável (antes era apenas LandingCalculator pra
// /v2). Recebe uma lista de planos JÁ filtrada pela categoria e um idioma; o
// usuário arrasta o slider, vemos o plano mais próximo e oferecemos o
// checkout. Abaixo, a tabela comparativa com todos os planos da categoria.
export function QuantitySlider({
  plans,
  lang,
  unitLabel,
  countryCode,
}: {
  plans: Plan[];
  lang: LangCode;
  unitLabel: string; // ex. "seguidores", "curtidas", "views"
  countryCode?: string; // ISO alpha-2 lowercase; ativa PPP via priceForCountry
}) {
  const { currency, pppMap } = useApp();
  const renderPrice = (p: Plan): string =>
    countryCode ? priceForCountry(p, currency, countryCode, pppMap) : priceFor(p, currency);
  const t = tr(lang);
  const sorted = useMemo(
    () => [...plans].sort((a, b) => a.followers_qty - b.followers_qty),
    [plans]
  );
  const minQty = sorted[0]?.followers_qty ?? 100;
  const maxQty = sorted[sorted.length - 1]?.followers_qty ?? 1_000_000;
  const [qty, setQty] = useState<number>(minQty);
  const [selected, setSelected] = useState<Plan | null>(null);

  const matched = useMemo(() => {
    return sorted.find((p) => p.followers_qty >= qty) ?? sorted[sorted.length - 1];
  }, [sorted, qty]);

  const price = matched ? renderPrice(matched) : "—";
  const perUnit = matched && currency
    ? `${currency.symbol} ${(
        parseFloat(matched.prices?.[currency.code] ?? "0") / matched.followers_qty
      ).toFixed(Math.max(2, currency.decimals + 2))}`
    : "—";

  if (sorted.length === 0) return null;

  return (
    <>
      <section
        className="card"
        style={{
          background:
            "var(--gradient-subtle)",
          border: "1px solid var(--accent)",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ marginBottom: "0.5rem", fontSize: "1.15rem" }}>{t.category.chooseQty}</h3>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{unitLabel}</span>
          <strong style={{ fontSize: "2rem" }}>{qty.toLocaleString()}</strong>
        </div>
        <input
          // a11y BUG-65 do QA 2026-06-12: input range sem aria-* não é
          // descrito por NVDA/JAWS/VoiceOver. WCAG 1.3.1 + 4.1.2.
          id="quantity-slider"
          name="quantity"
          type="range"
          min={minQty}
          max={maxQty}
          step={Math.max(50, Math.floor(minQty))}
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value, 10))}
          aria-label={t.category.chooseQty}
          aria-valuemin={minQty}
          aria-valuemax={maxQty}
          aria-valuenow={qty}
          aria-valuetext={`${qty.toLocaleString()} ${unitLabel}`}
          style={{ width: "100%", accentColor: "var(--accent)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
          <span>{minQty.toLocaleString()}</span>
          <span>{maxQty.toLocaleString()}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.25rem" }}>
              {t.category.suggested}
            </p>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{matched ? localizedPlanName(matched, lang) : "—"}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.25rem" }}>
              {t.category.total}
            </p>
            <p className="plan-price" style={{ fontSize: "1.75rem", margin: 0 }}>{price}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>{perUnit} {t.category.perUnit}</p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "1.5rem", padding: "1rem", fontSize: "1.05rem" }}
          onClick={() => matched && setSelected(matched)}
          disabled={!matched}
        >
          {t.cta.buyNow} — {matched ? localizedPlanName(matched, lang) : ""}
        </button>
      </section>

      <h4 style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", textTransform: "uppercase", letterSpacing: ".5px" }}>
        {t.category.compareAll}
      </h4>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--accent-dim)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.85rem", color: "var(--muted)" }}>
                {t.category.table.plan}
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "0.85rem", color: "var(--muted)" }}>
                {t.category.table.qty}
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "0.85rem", color: "var(--muted)" }}>
                {t.category.table.price}
              </th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <strong>{localizedPlanName(p, lang)}</strong>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{localizedPlanDescription(p, lang)}</div>
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {p.followers_qty.toLocaleString()}
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                  {renderPrice(p)}
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                  <button type="button" className="btn btn-outline" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} onClick={() => setSelected(p)}>
                    {t.cta.buy}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <CheckoutModal plan={selected} onClose={() => setSelected(null)} targetCountry={countryCode} />}
    </>
  );
}
