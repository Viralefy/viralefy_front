"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Plan } from "@/lib/api";
import { priceFor, priceForCountry } from "@/lib/format";
import { useApp } from "./Providers";
import { TrustSignals } from "./TrustSignals";

// CheckoutModal é pesado (Pix QR, Stripe Elements, copy localizado por
// idioma). 99% das renderizações do CTA NÃO abrem o checkout, então sai do
// bundle inicial. ssr:false pq o modal é puramente interativo (sem SEO).
const CheckoutModal = dynamic(
  () => import("./CheckoutModal").then((m) => ({ default: m.CheckoutModal })),
  { ssr: false }
);
import { tr, type LangCode } from "@/i18n/languages";

// Bloco isolado de CTA na página do plano. Mantemos `client` aqui pra deixar
// o resto da página de plano server-rendered.
export function BuyPlanCta({ plan, lang, countryCode }: { plan: Plan; lang: LangCode; countryCode?: string }) {
  const { currency, pppMap } = useApp();
  const [open, setOpen] = useState(false);
  const t = tr(lang);
  const displayPrice = countryCode
    ? priceForCountry(plan, currency, countryCode, pppMap)
    : priceFor(plan, currency);

  return (
    <div
      className="card"
      style={{
        textAlign: "center",
        background: "var(--gradient-subtle)",
        border: "1px solid var(--accent)",
      }}
    >
      <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.25rem" }}>{t.category.total}</p>
      <p className="plan-price" style={{ fontSize: "2.25rem", margin: "0 0 1rem" }}>{displayPrice}</p>
      <button
        type="button"
        data-testid="buy-now-cta"
        className="btn btn-primary"
        style={{ padding: "1rem 2.5rem", fontSize: "1.05rem" }}
        onClick={() => setOpen(true)}
      >
        {t.cta.buyNow}
      </button>
      <TrustSignals lang={lang} variant="compact" />
      {open && <CheckoutModal plan={plan} lang={lang} onClose={() => setOpen(false)} targetCountry={countryCode} />}
    </div>
  );
}
