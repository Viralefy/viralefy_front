"use client";

import Link from "next/link";
import { useState } from "react";
import type { CheckoutResult, Plan } from "@/lib/api";
import { checkout } from "@/lib/api";
import { priceFor } from "@/lib/format";
import { useApp } from "./Providers";

export function CheckoutModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { currency } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);

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
        display_currency: currency?.code ?? "BRL",
      });
      setResult(res);
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
      <div className="card" style={{ maxWidth: 460, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        {result ? (
          <>
            <h2 style={{ marginBottom: "0.75rem" }}>Pedido criado! 🎉</h2>
            <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
              Pedido <strong>#{result.order_id.slice(0, 8)}</strong> do plano{" "}
              <strong>{result.plan_name}</strong>.
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              <li>
                Valor: <strong>{result.display_symbol} {result.display_amount}</strong>
              </li>
              <li>
                Cobrança em:{" "}
                <strong>
                  {result.settlement_amount} {result.settlement_currency}
                </strong>
                {result.settlement_currency !== result.display_currency && (
                  <span style={{ color: "var(--muted)" }}> (liquidação)</span>
                )}
              </li>
            </ul>

            <PaymentInstructions result={result} />

            {result.account_created ? (
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Criamos uma conta para <strong>{result.email}</strong>.{" "}
                {result.email_sent
                  ? "Enviamos sua senha e as instruções de pagamento por e-mail."
                  : "Não foi possível enviar o e-mail agora — use 'Esqueci a senha' ou contate o suporte."}
              </p>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Enviamos as instruções de pagamento para <strong>{result.email}</strong>.
              </p>
            )}
            <Link href="/login" className="btn btn-primary" style={{ width: "100%" }}>
              Entrar e ver meus pedidos
            </Link>
            <button type="button" className="btn btn-outline" style={{ marginTop: "0.75rem", width: "100%" }} onClick={onClose}>
              Fechar
            </button>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: "0.5rem" }}>Finalizar compra</h2>
            <p style={{ color: "var(--muted)", marginBottom: "0.5rem" }}>
              {plan.name} — {priceFor(plan, currency)}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Criamos sua conta automaticamente e enviamos a senha por e-mail.
            </p>
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
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Processando…" : "Confirmar pedido"}
              </button>
            </form>
            <button type="button" className="btn btn-outline" style={{ marginTop: "1rem", width: "100%" }} onClick={onClose}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PaymentInstructions({ result }: { result: CheckoutResult }) {
  const extra = result.payment_extra ?? {};
  const brCode = extra["br_code"];
  const qrImage = extra["qr_code_image"];
  const address = extra["address"];
  const network = extra["network"];
  const pixKey = extra["pix_key"];

  // 1) Cobrança Woovi (PIX) — QR + copy-paste
  if (brCode || qrImage) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Pague via PIX</h3>
        {qrImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrImage} alt="QR Code PIX" style={{ display: "block", maxWidth: 220, margin: "0 auto 0.75rem", borderRadius: "0.5rem" }} />
        )}
        {brCode && (
          <>
            <label className="label">Código copia-e-cola</label>
            <textarea readOnly className="input" rows={3} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={brCode} />
            <button
              type="button"
              className="btn btn-outline"
              style={{ marginTop: "0.5rem", width: "100%" }}
              onClick={() => navigator.clipboard.writeText(brCode).catch(() => undefined)}
            >
              Copiar código
            </button>
          </>
        )}
      </div>
    );
  }

  // 2) Cobrança Heleket (cripto) — endereço + rede
  if (address) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
          Pague {result.settlement_amount} {result.settlement_currency}
          {network && <span style={{ color: "var(--muted)", fontWeight: "normal" }}> (rede {network})</span>}
        </h3>
        <label className="label">Carteira</label>
        <textarea readOnly className="input" rows={2} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={address} />
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: "0.5rem", width: "100%" }}
          onClick={() => navigator.clipboard.writeText(address).catch(() => undefined)}
        >
          Copiar endereço
        </button>
        {result.payment_url && (
          <a href={result.payment_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: "0.5rem", width: "100%" }}>
            Abrir página de pagamento
          </a>
        )}
      </div>
    );
  }

  // 3) Link de pagamento externo (sem extras)
  if (result.payment_url) {
    return (
      <a href={result.payment_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginBottom: "1rem", width: "100%" }}>
        Ir para a página de pagamento
      </a>
    );
  }

  // 4) PIX manual (fallback)
  if (pixKey) {
    return (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Pague via PIX</h3>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          Use a chave abaixo e nos envie o comprovante por e-mail.
        </p>
        <label className="label">Chave PIX</label>
        <input readOnly className="input" value={pixKey} />
      </div>
    );
  }

  return (
    <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
      Enviamos as instruções de pagamento para <strong>{result.email}</strong>.
    </p>
  );
}
