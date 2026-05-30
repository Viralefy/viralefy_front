"use client";

import { useMemo, useState } from "react";
import type { Plan } from "@/lib/api";
import { priceFor } from "@/lib/format";
import { useApp } from "./Providers";
import { CheckoutModal } from "./CheckoutModal";
import { tr, type LangCode } from "@/i18n/languages";

// Variante "calculadora" reutilizável (antes era apenas LandingCalculator pra
// /v2). Recebe uma lista de planos JÁ filtrada pela categoria e um idioma; o
// usuário arrasta o slider, vemos o plano mais próximo e oferecemos o
// checkout. Abaixo, a tabela comparativa com todos os planos da categoria.
export function QuantitySlider({
  plans,
  lang,
  unitLabel,
}: {
  plans: Plan[];
  lang: LangCode;
  unitLabel: string; // ex. "seguidores", "curtidas", "views"
}) {
  const { currency } = useApp();
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

  const price = matched ? priceFor(matched, currency) : "—";
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
            "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(236,72,153,0.10) 50%, rgba(245,158,11,0.08) 100%)",
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
          type="range"
          min={minQty}
          max={maxQty}
          step={Math.max(50, Math.floor(minQty))}
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value, 10))}
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
            <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{matched?.name ?? "—"}</p>
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
          {t.cta.buyNow} — {matched?.name ?? ""}
        </button>
      </section>

      <h4 style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", textTransform: "uppercase", letterSpacing: ".5px" }}>
        {t.category.compareAll}
      </h4>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(168,85,247,0.08)", borderBottom: "1px solid var(--border)" }}>
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
                  <strong>{p.name}</strong>
                  <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{p.description}</div>
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {p.followers_qty.toLocaleString()}
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                  {priceFor(p, currency)}
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

      {selected && <CheckoutModal plan={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
