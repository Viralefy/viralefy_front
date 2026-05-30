"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Order } from "@/lib/api";
import { fetchMyOrders } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useApp } from "@/components/Providers";

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou",
  cancelled: "Cancelado",
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
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar pedidos"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Minha conta</h1>
          {user && <p style={{ color: "var(--muted)" }}>{user.name} · {user.email}</p>}
        </div>
        <Link href="/" className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
          Comprar mais
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
        <Link href="/account/profiles" className="card" style={{ textDecoration: "none", color: "var(--text)" }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>👤 Perfis</strong>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Cadastre seus perfis IG/TikTok</span>
        </Link>
        <Link href="/account/credits" className="card" style={{ textDecoration: "none", color: "var(--text)" }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>💳 Créditos</strong>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Saldo + recarga + ledger</span>
        </Link>
        <Link href="/tickets" className="card" style={{ textDecoration: "none", color: "var(--text)" }}>
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>🎫 Suporte</strong>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Tickets de atendimento</span>
        </Link>
      </div>

      <h2 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>Histórico de compras</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Carregando…</p>
      ) : orders.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--muted)" }}>
            Você ainda não fez nenhuma compra. <Link href="/">Ver serviços</Link>.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {orders.map((o) => (
            <div
              key={o.id}
              className="card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
            >
              <div>
                <strong>{o.plan_name || "Plano"}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString("pt-BR")}
                </div>
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
          ))}
        </div>
      )}
    </main>
  );
}
