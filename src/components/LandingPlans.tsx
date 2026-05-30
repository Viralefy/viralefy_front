"use client";

import { useState } from "react";
import type { Plan } from "@/lib/api";
import type { Labels } from "@/i18n/countries";
import { priceFor } from "@/lib/format";
import { useApp } from "./Providers";
import { CheckoutModal } from "./CheckoutModal";

export function LandingPlans({ plans, labels }: { plans: Plan[]; labels: Labels }) {
  const { currency } = useApp();
  const [selected, setSelected] = useState<Plan | null>(null);

  return (
    <>
      <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>{labels.plansHeading}</h2>
      <div className="grid-plans">
        {plans.map((plan) => (
          <article key={plan.id} className="card plan-card">
            <h3>{plan.name}</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{plan.description}</p>
            <p className="plan-price">{priceFor(plan, currency)}</p>
            <p style={{ fontSize: "0.95rem" }}>
              <strong>{plan.followers_qty.toLocaleString()}</strong> {labels.followers}
            </p>
            <button type="button" className="btn btn-primary" style={{ marginTop: "auto" }} onClick={() => setSelected(plan)}>
              {labels.ctaBuy}
            </button>
          </article>
        ))}
      </div>
      {selected && <CheckoutModal plan={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
