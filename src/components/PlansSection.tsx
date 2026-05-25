"use client";

import { useState } from "react";
import type { Plan } from "@/lib/api";
import { formatPrice } from "@/lib/api";
import { CheckoutModal } from "./CheckoutModal";

export function PlansSection({ plans }: { plans: Plan[] }) {
  const [selected, setSelected] = useState<Plan | null>(null);

  if (plans.length === 0) {
    return (
      <p style={{ color: "var(--muted)", textAlign: "center" }}>
        Nenhum plano disponível no momento.
      </p>
    );
  }

  return (
    <>
      <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Nossos planos</h2>
      <div className="grid-plans">
        {plans.map((plan, i) => (
          <article
            key={plan.id}
            className={`card plan-card ${i === 1 ? "featured" : ""}`}
          >
            {i === 1 && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--accent)",
                  fontWeight: 600,
                }}
              >
                MAIS POPULAR
              </span>
            )}
            <h3>{plan.name}</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              {plan.description}
            </p>
            <p className="plan-price">{formatPrice(plan.price_cents, plan.currency)}</p>
            <p style={{ fontSize: "0.95rem" }}>
              <strong>{plan.followers_qty.toLocaleString("pt-BR")}</strong> seguidores
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: "auto" }}
              onClick={() => setSelected(plan)}
            >
              Comprar agora
            </button>
          </article>
        ))}
      </div>
      {selected && (
        <CheckoutModal plan={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
