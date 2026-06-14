"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Plan } from "@/lib/api";
import { priceForCountry } from "@/lib/format";
import { subscribe as apiSubscribe } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useApp } from "./Providers";
import { CheckoutModal } from "./CheckoutModal";
import { tr, type LangCode } from "@/i18n/languages";
import { categorySlug, type CategoryCode } from "@/i18n/categories";
import { localizedPlanName, localizedPlanDescription, formatQty } from "@/lib/plan-labels";
import { Icon } from "./Icon";
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
  const { currency, pppMap, user } = useApp();
  const t = tr(lang);
  const [selected, setSelected] = useState<Plan | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  // Subscribe mode: ?subscribe=1 ativa botão extra "Subscribe monthly" em
  // cada card. Sem token → redireciona pra /login mantendo o ?subscribe=1.
  const subscribeMode = searchParams.get("subscribe") === "1";
  const [subBusy, setSubBusy] = useState<string | null>(null);
  const [subOk, setSubOk] = useState<string | null>(null);
  const [subErr, setSubErr] = useState<string | null>(null);
  async function onSubscribeClick(planID: string) {
    const token = getToken();
    if (!token) {
      router.push("/login?next=" + encodeURIComponent(window.location.pathname + "?subscribe=1"));
      return;
    }
    setSubBusy(planID); setSubErr(null);
    try {
      await apiSubscribe(token, planID);
      setSubOk(planID);
    } catch (e) {
      setSubErr(e instanceof Error ? e.message : "Subscribe failed");
    } finally {
      setSubBusy(null);
    }
  }
  useEffect(() => { if (subscribeMode && !user) setSubErr("Sign in to subscribe."); }, [subscribeMode, user]);

  const sorted = [...plans].sort((a, b) => a.followers_qty - b.followers_qty);
  if (sorted.length === 0) return null;

  const catSlug = categorySlug(category, lang);
  // PPP ativo quando multiplier < 1.00 pro country. Mostra selo "Local pricing".
  const pppMult = pppMap[countryCode.toLowerCase()];
  const pppActive = pppMult != null && pppMult > 0 && pppMult < 1;

  return (
    <>
      <div className="grid-plans">
        {sorted.map((plan, i) => {
          // Slug do plano = qty + unit (estável e SEO-friendly em qualquer idioma).
          const planSlug = `${plan.followers_qty}-${catSlug}`;
          return (
            <article key={plan.id} className={`card plan-card ${i === Math.floor(sorted.length / 2) ? "featured" : ""}`}>
              <h3>{localizedPlanName(plan, lang)}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{localizedPlanDescription(plan, lang)}</p>
              <p className="plan-price">{priceForCountry(plan, currency, countryCode, pppMap)}</p>
              {pppActive && (
                <p style={{ fontSize: "0.7rem", color: "var(--accent)", margin: 0, fontWeight: 600 }}>
                  {t.category.localPricing}
                </p>
              )}
              {category !== "servicos" && (
                <p style={{ fontSize: "0.95rem" }}>
                  <strong>{formatQty(plan.followers_qty, lang)}</strong> {unitLabel}
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
              {subscribeMode && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "var(--accent)" }}
                  onClick={() => onSubscribeClick(plan.id)}
                  disabled={subBusy === plan.id || subOk === plan.id}
                >
                  {subOk === plan.id ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <Icon name="check" size={14} color="var(--accent, #00fed6)" />
                      Subscribed
                    </span>
                  ) : subBusy === plan.id ? "Subscribing…" : "Subscribe monthly"}
                </button>
              )}
            </article>
          );
        })}
      </div>
      {subscribeMode && (subErr || subOk) && (
        <p style={{ textAlign: "center", marginTop: "1rem", color: subErr ? "var(--danger)" : "var(--accent)", fontSize: "0.9rem" }}>
          {subErr ?? (subOk ? "Subscription created. Manage at /account/subscriptions." : "")}
        </p>
      )}
      {selected && <CheckoutModal plan={selected} onClose={() => setSelected(null)} targetCountry={countryCode} />}
    </>
  );
}
