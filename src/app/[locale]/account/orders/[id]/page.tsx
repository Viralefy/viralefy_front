"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { OrderDetail } from "@/lib/api";
import { fetchMyOrder } from "@/lib/api";
import { getToken } from "@/lib/auth";

// Status label/cor compartilhado com a listagem. Mantém os mesmos rótulos
// que o user já viu em /account pra não criar disjunção visual.
const statusLabel: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

const statusColor: Record<string, string> = {
  pending: "var(--muted)",
  paid: "var(--success)",
  failed: "var(--danger, #c0392b)",
  cancelled: "var(--muted)",
};

// Quatro marcos do tracking: criado → pago → captura de baseline (gateway
// começou a entregar) → captura de delivery (verificação pós-entrega).
// O backend mantém `baseline_captured_at` quando o cron de delivery roda,
// então usamos esses campos como proxy de "Captured/Delivered".
type Milestone = {
  key: string;
  label: string;
  reached: boolean;
  at?: string | null;
};

function buildTimeline(o: OrderDetail): Milestone[] {
  const paid = o.status === "paid" || !!o.baseline_captured_at || !!o.delivery_captured_at;
  const captured = !!o.baseline_captured_at || !!o.delivery_captured_at;
  const delivered = !!o.delivery_captured_at;
  return [
    { key: "created", label: "Created", reached: true, at: o.created_at },
    { key: "paid", label: "Paid", reached: paid, at: paid ? o.updated_at : null },
    { key: "captured", label: "Captured", reached: captured, at: o.baseline_captured_at ?? null },
    { key: "delivered", label: "Delivered", reached: delivered, at: o.delivery_captured_at ?? null },
  ];
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!id) {
      setError("Invalid order id");
      setLoading(false);
      return;
    }
    fetchMyOrder(token, id)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load order"))
      .finally(() => setLoading(false));
  }, [router, id]);

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
        <div className="alert alert-error">{error ?? "Order not found"}</div>
        <p style={{ marginTop: "1rem" }}>
          <Link href="/account">← Back to account</Link>
        </p>
      </main>
    );
  }

  const timeline = buildTimeline(order);
  const showCompletePayment = order.status === "pending" && !!order.payment_url;

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <p style={{ marginBottom: "1rem" }}>
        <Link href="/account">← Back to account</Link>
      </p>

      {/* Hero — plano + valor exibido + status badge. */}
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Order #{order.id.slice(0, 8)}</h1>
          <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            {new Date(order.created_at).toLocaleString()}
          </div>
          <div style={{ marginTop: "0.75rem", fontSize: "1.1rem" }}>
            <strong>{order.display_amount}</strong> {order.display_currency}
            {order.settlement_currency !== order.display_currency && (
              <span style={{ color: "var(--muted)" }}>
                {" "}
                → {order.settlement_amount} {order.settlement_currency}
              </span>
            )}
          </div>
        </div>
        <span
          style={{
            display: "inline-block",
            padding: "0.35rem 0.75rem",
            borderRadius: "999px",
            background: "var(--surface-2, #f3f3f3)",
            color: statusColor[order.status] ?? "var(--text)",
            fontSize: "0.85rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {statusLabel[order.status] ?? order.status}
        </span>
      </div>

      {/* CTA pra retomar checkout pendente. payment_url vem do gateway
          (Mercado Pago / Stripe), válido até o gateway expirar a sessão. */}
      {showCompletePayment && order.payment_url && (
        <div style={{ marginBottom: "1.5rem" }}>
          <a
            href={order.payment_url}
            className="btn btn-primary"
            style={{ padding: "0.75rem 1.5rem", display: "inline-block" }}
            rel="noopener noreferrer"
          >
            Complete payment
          </a>
        </div>
      )}

      {/* Timeline horizontal — 4 nós ligados por linha. Verde = atingido,
          cinza = pending. flex-wrap pra mobile não cortar. */}
      <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Progress</h2>
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        {timeline.map((m, idx) => (
          <div
            key={m.key}
            style={{
              flex: "1 1 120px",
              textAlign: "center",
              minWidth: "120px",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: m.reached ? "var(--success)" : "var(--muted)",
                color: "#fff",
                margin: "0 auto 0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              {idx + 1}
            </div>
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: m.reached ? "var(--text)" : "var(--muted)",
              }}
            >
              {m.label}
            </div>
            {m.at && (
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                {new Date(m.at).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Link pro ticket atrelado, quando existir — categorias high-touch
          (recovery/BMs/perfis) abrem ticket automaticamente após o paid. */}
      {order.ticket_id && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>Support ticket</strong>
          <Link href={`/tickets/${order.ticket_id}`}>
            Open ticket #{order.ticket_id.slice(0, 8)} →
          </Link>
        </div>
      )}

      {order.publication_url && (
        <div className="card">
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>Target</strong>
          <a href={order.publication_url} target="_blank" rel="noopener noreferrer">
            {order.publication_url}
          </a>
        </div>
      )}
    </main>
  );
}
