"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Order } from "@/lib/api";
import { fetchMyOrders } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useApp } from "@/components/Providers";
import { Setup2FAPrompt } from "@/components/Setup2FAPrompt";

const statusLabel: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

export default function AccountPage() {
  const router = useRouter();
  const { user } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchMyOrders(token)
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <Setup2FAPrompt />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>My account</h1>
          {user && <p style={{ color: "var(--muted)" }}>{user.name} · {user.email}</p>}
        </div>
        <Link href="/" className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
          Buy more
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
        <Link href="/account/profiles" className="card" style={{ textDecoration: "none", color: "var(--text)" }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>👤 Profiles</strong>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Register your IG/TikTok profiles</span>
        </Link>
        <Link href="/account/credits" className="card" style={{ textDecoration: "none", color: "var(--text)" }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>💳 Credits</strong>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Balance + top-up + ledger</span>
        </Link>
        <Link href="/tickets" className="card" style={{ textDecoration: "none", color: "var(--text)" }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>🎫 Support</strong>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Support tickets</span>
        </Link>
      </div>

      <h2 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>Purchase history</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : orders.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--muted)" }}>
            You haven&apos;t made any purchases yet. <Link href="/">Browse services</Link>.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {orders.map((o) => {
            const isHighTouch = o.plan_category === "recuperacao_perfil";
            const hasTicket = !!o.ticket_id;
            return (
              <div
                key={o.id}
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                  // Borda destacada quando o pedido é high-touch e tem
                  // ticket vivo — chama o olho do user pra ir conversar lá.
                  border: hasTicket ? "1px solid var(--accent)" : undefined,
                  background: hasTicket ? "var(--accent-dim)" : undefined,
                }}
              >
                <div>
                  <strong>{o.plan_name || "Plan"}</strong>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}
                  </div>
                  {hasTicket && (
                    <Link
                      href={`/tickets/${o.ticket_id}`}
                      style={{
                        display: "inline-block",
                        marginTop: "0.5rem",
                        fontSize: "0.85rem",
                        textDecoration: "underline",
                      }}
                    >
                      💬 Open support ticket →
                    </Link>
                  )}
                  {isHighTouch && !hasTicket && o.status === "pending" && (
                    <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                      Ticket will open automatically once payment confirms.
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>
                    {o.display_amount} {o.display_currency}
                    {o.settlement_currency !== o.display_currency && (
                      <span style={{ color: "var(--muted)" }}> → {o.settlement_amount} {o.settlement_currency}</span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: o.status === "paid" ? "var(--success)" : "var(--muted)",
                    }}
                  >
                    {statusLabel[o.status] ?? o.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
