"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { TicketDetail } from "@/lib/api";
import { fetchMyTicket, replyTicket } from "@/lib/api";
import { getToken } from "@/lib/auth";

const STATUS_LABEL: Record<string, string> = {
  open: "Aberto",
  pending: "Aguardando você",
  resolved: "Resolvido",
  closed: "Fechado",
};

export default function TicketThreadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function load() {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const d = await fetchMyTicket(token, id);
      setDetail(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar ticket");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onReply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    const fd = new FormData(e.currentTarget);
    const body = String(fd.get("body") ?? "").trim();
    if (!body) return;
    setSending(true);
    try {
      await replyTicket(token, id, body);
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao responder");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: "2rem" }}>
        <p style={{ color: "var(--muted)" }}>Carregando…</p>
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main className="container" style={{ paddingTop: "2rem" }}>
        <div className="alert alert-error">{error ?? "Ticket não encontrado."}</div>
        <p><Link href="/tickets">← Voltar</Link></p>
      </main>
    );
  }

  const closed = detail.ticket.status === "closed";

  return (
    <main className="container" style={{ maxWidth: 760, paddingTop: "2rem", paddingBottom: "4rem" }}>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        <Link href="/tickets">← Meus tickets</Link>
      </p>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>{detail.ticket.subject}</h1>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
            {STATUS_LABEL[detail.ticket.status] ?? detail.ticket.status}
          </span>
        </div>
        <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          #{detail.ticket.id.slice(0, 8)} · aberto em {new Date(detail.ticket.created_at).toLocaleString("pt-BR")}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {detail.messages.map((m) => {
          const isUser = m.author_type === "user";
          return (
            <div
              key={m.id}
              className="card"
              style={{
                borderColor: isUser ? "var(--border)" : "var(--accent)",
                background: isUser ? "var(--surface)" : "var(--accent-dim)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                <strong style={{ color: isUser ? "var(--text)" : "var(--accent)" }}>
                  {isUser ? "Você" : `${m.author_name || "Suporte"} (suporte)`}
                </strong>
                <span>{new Date(m.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{m.body}</div>
            </div>
          );
        })}
      </div>

      {closed ? (
        <div className="alert" style={{ background: "rgba(122,139,150,0.12)", border: "1px solid var(--border-strong)", color: "var(--muted-strong)" }}>
          Este ticket foi fechado. Abra um novo se precisar de ajuda.
        </div>
      ) : (
        <form onSubmit={onReply} className="card">
          <label className="label" htmlFor="body">Responder</label>
          <textarea className="input" id="body" name="body" rows={4} required placeholder="Escreva sua mensagem…" />
          <button type="submit" className="btn btn-primary" style={{ marginTop: "0.75rem" }} disabled={sending}>
            {sending ? "Enviando…" : "Enviar resposta"}
          </button>
        </form>
      )}
    </main>
  );
}
