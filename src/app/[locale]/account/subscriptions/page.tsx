"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Plan, Subscription } from "@/lib/api";
import { cancelSubscription, fetchMySubscriptions, fetchPlans } from "@/lib/api";
import { getToken } from "@/lib/auth";

// /account/subscriptions — painel de assinaturas mensais recorrentes
// do usuário logado (Fase 6.3). Lista subs com badge de status + botão
// Cancel; quando vazia, mostra CTA pra catálogo com ?subscribe=1
// (catálogo detecta query e abre modal "Subscribe to {plan}" no card).

function statusColor(status: string): { bg: string; fg: string; label: string } {
  switch (status) {
    case "active":
      return { bg: "#0a4d2a", fg: "#a6f0c2", label: "Active" };
    case "paused":
      return { bg: "#4d3a0a", fg: "#f0d7a6", label: "Paused" };
    case "cancelled":
      return { bg: "#4d1d1d", fg: "#f0b3b3", label: "Cancelled" };
    default:
      return { bg: "#2a2d33", fg: "#bbb", label: status };
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyID, setBusyID] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchMySubscriptions(token)
      .then(setSubs)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    fetchPlans()
      .then(setPlans)
      .catch(() => {
        // catálogo é só pra resolver plan_id → name; falha silenciosa.
      });
  }, [router]);

  const planByID = useMemo(() => {
    const map = new Map<string, Plan>();
    for (const p of plans) map.set(p.id, p);
    return map;
  }, [plans]);

  async function handleCancel(id: string) {
    const token = getToken();
    if (!token) return;
    if (!window.confirm("Cancel this subscription? You won't be charged for future cycles.")) {
      return;
    }
    setBusyID(id);
    try {
      await cancelSubscription(token, id);
      // Re-fetch pra refletir o novo status (mantém o row + status=cancelled).
      const fresh = await fetchMySubscriptions(token);
      setSubs(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusyID(null);
    }
  }

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/account" style={{ color: "var(--muted)" }}>
          ← My account
        </Link>
      </div>

      <h1 style={{ marginBottom: "0.5rem" }}>Subscriptions</h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Recurring monthly plans. We&apos;ll generate a fresh order at the start of
        each cycle and email you the payment link. Cancel anytime — you stay
        active until the end of the paid cycle.
      </p>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {!subs ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : subs.length === 0 ? (
        <div className="card">
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
            Start a subscription
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
            You don&apos;t have any subscriptions yet. Pick a plan from the
            catalog and choose the monthly option.
          </p>
          <Link href="/?subscribe=1" className="btn btn-primary">
            Browse catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {subs.map((s) => {
            const plan = planByID.get(s.plan_id);
            const color = statusColor(s.status);
            const isActive = s.status === "active";
            return (
              <div key={s.id} className="card">
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ flex: "1 1 280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <strong style={{ fontSize: "1.05rem" }}>
                        {plan ? plan.name : `Plan ${s.plan_id.slice(0, 8)}`}
                      </strong>
                      <span
                        style={{
                          background: color.bg,
                          color: color.fg,
                          padding: "0.15rem 0.55rem",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {color.label}
                      </span>
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      <div>Renews monthly</div>
                      {isActive && <div>Next billing: {formatDate(s.next_billing_at)}</div>}
                      {!isActive && s.cancelled_at && (
                        <div>Cancelled on {formatDate(s.cancelled_at)}</div>
                      )}
                      {s.failed_payments > 0 && (
                        <div style={{ color: "#f0b3b3" }}>
                          Failed attempts: {s.failed_payments}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {isActive && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={busyID === s.id}
                        onClick={() => handleCancel(s.id)}
                      >
                        {busyID === s.id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="card" style={{ marginTop: "0.5rem" }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
              Start another subscription
            </h2>
            <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
              Browse the catalog and tap Subscribe on any monthly plan.
            </p>
            <Link href="/?subscribe=1" className="btn btn-outline">
              Browse catalog
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
