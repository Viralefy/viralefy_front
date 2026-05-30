"use client";

import { useMemo, useState } from "react";
import type { Category, Plan } from "@/lib/api";
import { priceFor } from "@/lib/format";
import { useApp } from "./Providers";
import { CheckoutModal } from "./CheckoutModal";

export function PlansSection({ plans, categories }: { plans: Plan[]; categories: Category[] }) {
  const { currency } = useApp();
  const [tab, setTab] = useState<string>("all");
  const [selected, setSelected] = useState<Plan | null>(null);

  // Só mostra abas que têm pelo menos um plano.
  const tabs = useMemo(() => {
    const withPlans = categories.filter((c) => plans.some((p) => p.category === c.code));
    return [{ code: "all", label: "Todos" }, ...withPlans];
  }, [categories, plans]);

  const visible = tab === "all" ? plans : plans.filter((p) => p.category === tab);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "2rem",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.code}
            type="button"
            className={tab === t.code ? "btn btn-primary" : "btn btn-outline"}
            style={{ padding: "0.5rem 1.1rem" }}
            onClick={() => setTab(t.code)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p style={{ color: "var(--muted)", textAlign: "center" }}>
          Nenhum serviço disponível nesta categoria.
        </p>
      ) : (
        <div className="grid-plans">
          {visible.map((plan, i) => (
            <article
              key={plan.id}
              className={`card plan-card ${i === 0 && tab !== "all" ? "featured" : ""}`}
            >
              <h3>{plan.name}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{plan.description}</p>
              <p className="plan-price">{priceFor(plan, currency)}</p>
              {plan.category !== "servicos" && (
                <p style={{ fontSize: "0.95rem" }}>
                  <strong>{plan.followers_qty.toLocaleString("pt-BR")}</strong>{" "}
                  {plan.category === "seguidores" ? "seguidores" : "unidades"}
                </p>
              )}
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
      )}

      {selected && <CheckoutModal plan={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
