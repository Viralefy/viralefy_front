"use client";

import { useMemo, useState } from "react";
import type { Plan } from "@/lib/api";
import type { Labels } from "@/i18n/countries";
import { priceFor } from "@/lib/format";
import { useApp } from "./Providers";
import { CheckoutModal } from "./CheckoutModal";

// Variante "calculadora": slider de quantidade que destaca o plano mais
// próximo, mostra o preço por unidade e abaixo a tabela comparativa completa.
// Para teste A/B vs. o grid de cards padrão.
export function LandingCalculator({ plans, labels }: { plans: Plan[]; labels: Labels }) {
  const { currency } = useApp();
  const sorted = useMemo(
    () => [...plans].sort((a, b) => a.followers_qty - b.followers_qty),
    [plans]
  );
  const minQty = sorted[0]?.followers_qty ?? 100;
  const maxQty = sorted[sorted.length - 1]?.followers_qty ?? 1_000_000;
  const [qty, setQty] = useState<number>(minQty);
  const [selected, setSelected] = useState<Plan | null>(null);

  // Plano mais próximo (>= qty se possível, senão o maior <=).
  const matched = useMemo(() => {
    return (
      sorted.find((p) => p.followers_qty >= qty) ??
      sorted[sorted.length - 1]
    );
  }, [sorted, qty]);

  const price = matched ? priceFor(matched, currency) : "—";
  const perUnit = matched && currency
    ? `${currency.symbol} ${(
        parseFloat(matched.prices?.[currency.code] ?? "0") / matched.followers_qty
      ).toFixed(currency.decimals + 2)}`
    : "—";

  return (
    <>
      <section
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(236,72,153,0.10) 50%, rgba(245,158,11,0.08) 100%)",
          border: "1px solid var(--accent)",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "0.5rem", fontSize: "1.2rem" }}>{labels.plansHeading}</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Quantos {labels.followers}? Arraste o controle.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Quantidade</span>
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
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.25rem" }}>Plano sugerido</p>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{matched?.name ?? "—"}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.25rem" }}>Total</p>
            <p className="plan-price" style={{ fontSize: "1.75rem", margin: 0 }}>{price}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>{perUnit} por unidade</p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "1.5rem", padding: "1rem", fontSize: "1.05rem" }}
          onClick={() => matched && setSelected(matched)}
          disabled={!matched}
        >
          {labels.ctaBuy} — {matched?.name ?? ""}
        </button>
      </section>

      <h3 style={{ marginBottom: "1rem", fontSize: "1rem", color: "var(--muted)", textAlign: "center", textTransform: "uppercase", letterSpacing: ".5px" }}>
        Compare todos os planos
      </h3>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(168,85,247,0.08)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.85rem", color: "var(--muted)" }}>Plano</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "0.85rem", color: "var(--muted)" }}>{labels.followers}</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "0.85rem", color: "var(--muted)" }}>Preço</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}></th>
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
                    {labels.ctaBuy}
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
