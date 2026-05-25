"use client";

import { useState } from "react";
import type { Plan } from "@/lib/api";
import { checkout, formatPrice } from "@/lib/api";

export function CheckoutModal({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await checkout({
        plan_id: plan.id,
        email: String(fd.get("email")),
        name: String(fd.get("name")),
        instagram: String(fd.get("instagram")),
        password: String(fd.get("password")),
      });
      setSuccess(
        `Pedido #${res.order_id.slice(0, 8)} criado! Status: ${res.status}. Em breve você receberá instruções de pagamento.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 440, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: "0.5rem" }}>Finalizar compra</h2>
        <p style={{ color: "var(--muted)", marginBottom: "1.25rem" }}>
          {plan.name} — {formatPrice(plan.price_cents, plan.currency)} (
          {plan.followers_qty.toLocaleString("pt-BR")} seguidores)
        </p>

        {success ? (
          <div className="alert alert-success">{success}</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {error && <div className="alert alert-error">{error}</div>}
            <div>
              <label className="label" htmlFor="name">Nome completo</label>
              <input className="input" id="name" name="name" required />
            </div>
            <div>
              <label className="label" htmlFor="email">E-mail</label>
              <input className="input" id="email" name="email" type="email" required />
            </div>
            <div>
              <label className="label" htmlFor="instagram">@ Instagram</label>
              <input className="input" id="instagram" name="instagram" placeholder="seuperfil" required />
            </div>
            <div>
              <label className="label" htmlFor="password">Senha (cadastro)</label>
              <input className="input" id="password" name="password" type="password" minLength={8} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Processando…" : "Confirmar pedido"}
            </button>
          </form>
        )}
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: "1rem", width: "100%" }}
          onClick={onClose}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
