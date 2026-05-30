"use client";

import { useState } from "react";
import type { Plan } from "@/lib/api";
import { priceFor } from "@/lib/format";
import { useApp } from "./Providers";
import { CheckoutModal } from "./CheckoutModal";
import { tr, type LangCode } from "@/i18n/languages";

// Bloco isolado de CTA na página do plano. Mantemos `client` aqui pra deixar
// o resto da página de plano server-rendered.
export function BuyPlanCta({ plan, lang }: { plan: Plan; lang: LangCode }) {
  const { currency } = useApp();
  const [open, setOpen] = useState(false);
  const t = tr(lang);

  return (
    <div
      className="card"
      style={{
        textAlign: "center",
        background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(236,72,153,0.08) 100%)",
        border: "1px solid var(--accent)",
      }}
    >
      <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.25rem" }}>{t.category.total}</p>
      <p className="plan-price" style={{ fontSize: "2.25rem", margin: "0 0 1rem" }}>{priceFor(plan, currency)}</p>
      <button
        type="button"
        className="btn btn-primary"
        style={{ padding: "1rem 2.5rem", fontSize: "1.05rem" }}
        onClick={() => setOpen(true)}
      >
        {t.cta.buyNow}
      </button>
      {open && <CheckoutModal plan={plan} onClose={() => setOpen(false)} />}
    </div>
  );
}
