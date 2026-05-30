"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createTicket } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function NewTicketPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const t = await createTicket(token, {
        subject: String(fd.get("subject")),
        body: String(fd.get("body")),
        order_id: (String(fd.get("order_id") ?? "").trim() || null),
      });
      router.push(`/tickets/${t.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 640, paddingTop: "2rem", paddingBottom: "4rem" }}>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        <Link href="/tickets">← Meus tickets</Link>
      </p>
      <div className="card">
        <h1 style={{ marginBottom: "0.5rem" }}>Abrir ticket</h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Descreva sua dúvida ou problema. Nossa equipe responde por aqui e também envia um e-mail.
        </p>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div>
            <label className="label" htmlFor="subject">Assunto</label>
            <input className="input" id="subject" name="subject" placeholder="Ex.: Pedido #ABC123 não chegou" required maxLength={120} />
          </div>
          <div>
            <label className="label" htmlFor="body">Mensagem</label>
            <textarea
              className="input"
              id="body"
              name="body"
              rows={6}
              required
              placeholder="Conte com detalhes o que aconteceu. Quanto mais contexto, mais rápido resolvemos."
            />
          </div>
          <div>
            <label className="label" htmlFor="order_id">ID do pedido (opcional)</label>
            <input className="input" id="order_id" name="order_id" placeholder="Cole o ID se for relacionado a um pedido específico" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Enviando…" : "Enviar"}
          </button>
        </form>
      </div>
    </main>
  );
}
