"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CreditAccount, CreditTransaction } from "@/lib/api";
import { fetchCredits, fetchTransactions, requestRecharge } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useApp } from "@/components/Providers";

const PRESETS = [50, 100, 200, 500, 1000, 2000]; // em reais

const TX_LABEL: Record<string, string> = {
  recharge: "Recarga",
  spend: "Pedido",
  refund: "Estorno",
  adjustment: "Ajuste",
};

function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function CreditsPage() {
  const router = useRouter();
  const { currency } = useApp();
  const [acct, setAcct] = useState<CreditAccount | null>(null);
  const [txs, setTxs] = useState<CreditTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rechargeUrl, setRechargeUrl] = useState<string | null>(null);
  const [rechargeExtra, setRechargeExtra] = useState<Record<string, string> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const [a, t] = await Promise.all([fetchCredits(token), fetchTransactions(token)]);
      setAcct(a);
      setTxs(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRecharge(amountReais: number) {
    const token = getToken();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const inv = await requestRecharge(token, {
        amount_cents: Math.round(amountReais * 100),
        display_currency: currency?.code ?? "BRL",
      });
      setRechargeUrl(inv.payment_url ?? null);
      setRechargeExtra(inv.payment_extra ?? {});
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar recarga");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 760 }}>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        <Link href="/account">← Minha conta</Link>
      </p>

      <h1 style={{ marginBottom: "0.5rem" }}>Créditos</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Recarregue e use saldo no checkout — sem precisar passar por cobrança a cada compra.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.5rem" }}>
          Saldo disponível
        </p>
        <p className="plan-price" style={{ fontSize: "2.5rem", margin: 0 }}>
          {acct ? formatBRL(acct.balance_cents) : "—"}
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Recarregar</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              className="btn btn-outline"
              style={{ padding: "0.5rem 0.9rem" }}
              onClick={() => onRecharge(v)}
              disabled={submitting}
            >
              + R$ {v}
            </button>
          ))}
        </div>
        <CustomAmount onSubmit={onRecharge} disabled={submitting} />

        {rechargeExtra && (rechargeExtra["br_code"] || rechargeExtra["address"] || rechargeUrl || rechargeExtra["pix_key"]) && (
          <div style={{ marginTop: "1rem", padding: "1rem", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Pague para creditar o saldo</h3>
            {rechargeExtra["br_code"] && (
              <>
                <label className="label">Código PIX (copia-e-cola)</label>
                <textarea readOnly className="input" rows={3} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={rechargeExtra["br_code"]} />
              </>
            )}
            {rechargeExtra["address"] && (
              <>
                <label className="label">Carteira ({rechargeExtra["network"]})</label>
                <textarea readOnly className="input" rows={2} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={rechargeExtra["address"]} />
              </>
            )}
            {rechargeExtra["pix_key"] && (
              <>
                <label className="label">Chave PIX</label>
                <input readOnly className="input" value={rechargeExtra["pix_key"]} />
              </>
            )}
            {rechargeUrl && (
              <a href={rechargeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: "0.5rem", display: "inline-block" }}>
                Abrir página de pagamento →
              </a>
            )}
            <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
              Após o pagamento, o saldo é creditado automaticamente. Se demorar, abra um ticket de suporte.
            </p>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Histórico (ledger)</h2>
      {txs.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--muted)" }}>Sem transações ainda.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(168,85,247,0.06)" }}>
                <th style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.8rem", color: "var(--muted)" }}>Quando</th>
                <th style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.8rem", color: "var(--muted)" }}>Tipo</th>
                <th style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.8rem", color: "var(--muted)" }}>Descrição</th>
                <th style={{ padding: "0.6rem 1rem", textAlign: "right", fontSize: "0.8rem", color: "var(--muted)" }}>Valor</th>
                <th style={{ padding: "0.6rem 1rem", textAlign: "right", fontSize: "0.8rem", color: "var(--muted)" }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.6rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                    {new Date(t.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}>{TX_LABEL[t.type] ?? t.type}</td>
                  <td style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}>
                    {t.description}
                    <div style={{ color: "var(--muted)", fontSize: "0.75rem", fontFamily: "monospace" }}>
                      #{t.id.slice(0, 8)}
                    </div>
                  </td>
                  <td style={{ padding: "0.6rem 1rem", textAlign: "right", fontSize: "0.9rem", fontWeight: 600, color: t.amount_cents > 0 ? "var(--success)" : "var(--danger)", fontVariantNumeric: "tabular-nums" }}>
                    {t.amount_cents > 0 ? "+ " : "− "}{formatBRL(Math.abs(t.amount_cents))}
                  </td>
                  <td style={{ padding: "0.6rem 1rem", textAlign: "right", fontSize: "0.85rem", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                    {formatBRL(t.balance_after_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function CustomAmount({ onSubmit, disabled }: { onSubmit: (v: number) => void; disabled: boolean }) {
  const [val, setVal] = useState<string>("");
  const num = parseFloat(val.replace(",", "."));
  const ok = !isNaN(num) && num >= 5;
  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <input
        type="number"
        min={5}
        step="0.01"
        className="input"
        placeholder="Outro valor em R$ (mín. 5)"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{ flex: 1 }}
      />
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => ok && onSubmit(num)}
        disabled={!ok || disabled}
      >
        Recarregar
      </button>
    </div>
  );
}
