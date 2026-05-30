"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Ticket } from "@/lib/api";
import { fetchMyTickets } from "@/lib/api";
import { getToken } from "@/lib/auth";

const STATUS: Record<string, { label: string; color: string }> = {
  open: { label: "Aberto", color: "#a855f7" },
  pending: { label: "Aguardando você", color: "#f59e0b" },
  resolved: { label: "Resolvido", color: "#22c55e" },
  closed: { label: "Fechado", color: "#6b7280" },
};

export default function TicketsListPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchMyTickets(token)
      .then(setTickets)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Suporte</h1>
          <p style={{ color: "var(--muted)" }}>Seus tickets de atendimento.</p>
        </div>
        <Link href="/tickets/new" className="btn btn-primary">Novo ticket</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Carregando…</p>
      ) : tickets.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--muted)" }}>
            Você ainda não abriu nenhum ticket. <Link href="/tickets/new">Abrir um agora</Link>.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tickets.map((t) => {
            const st = STATUS[t.status] ?? { label: t.status, color: "#9ca3af" };
            return (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="card"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", gap: "1rem" }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", color: "var(--text)" }}>{t.subject}</strong>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    #{t.id.slice(0, 8)} · atualizado {new Date(t.updated_at).toLocaleString("pt-BR")}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "999px",
                    background: st.color + "22",
                    border: `1px solid ${st.color}`,
                    color: st.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {st.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
