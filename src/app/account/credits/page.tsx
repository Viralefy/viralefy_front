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
  recharge: "Top-up",
  spend: "Order",
  refund: "Refund",
  adjustment: "Adjustment",
};

// Créditos são canonicamente USD-cents.
function formatUSD(cents: number): string {
  return `$ ${(cents / 100).toFixed(2)}`;
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
      setError(e instanceof Error ? e.message : "Error");
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
        display_currency: currency?.code ?? "USD",
      });
      setRechargeUrl(inv.payment_url ?? null);
      setRechargeExtra(inv.payment_extra ?? {});
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create top-up");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 760 }}>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        <Link href="/account">← My account</Link>
      </p>

      <h1 style={{ marginBottom: "0.5rem" }}>Credits</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Top up and use your balance at checkout — no need to go through payment on every purchase.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.5rem" }}>
          Available balance
        </p>
        <p className="plan-price" style={{ fontSize: "2.5rem", margin: 0 }}>
          {acct ? formatUSD(acct.balance_cents) : "—"}
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Top up</h2>
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
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Pay to credit your balance</h3>
            {rechargeExtra["br_code"] && (
              <>
                <label className="label">Pix code (copy and paste)</label>
                <textarea readOnly className="input" rows={3} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={rechargeExtra["br_code"]} />
              </>
            )}
            {rechargeExtra["address"] && (
              <>
                <label className="label">Wallet ({rechargeExtra["network"]})</label>
                <textarea readOnly className="input" rows={2} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={rechargeExtra["address"]} />
              </>
            )}
            {rechargeExtra["pix_key"] && (
              <>
                <label className="label">Pix key</label>
                <input readOnly className="input" value={rechargeExtra["pix_key"]} />
              </>
            )}
            {rechargeUrl && (
              <a href={rechargeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: "0.5rem", display: "inline-block" }}>
                Open payment page →
              </a>
            )}
            <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
              After payment, your balance is credited automatically. If it takes too long, open a support ticket.
            </p>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>History (ledger)</h2>
      {txs.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--muted)" }}>No transactions yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--accent-dimmer)" }}>
                <th style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.8rem", color: "var(--muted)" }}>When</th>
                <th style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.8rem", color: "var(--muted)" }}>Type</th>
                <th style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.8rem", color: "var(--muted)" }}>Description</th>
                <th style={{ padding: "0.6rem 1rem", textAlign: "right", fontSize: "0.8rem", color: "var(--muted)" }}>Amount</th>
                <th style={{ padding: "0.6rem 1rem", textAlign: "right", fontSize: "0.8rem", color: "var(--muted)" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.6rem 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}>{TX_LABEL[t.type] ?? t.type}</td>
                  <td style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}>
                    {t.description}
                    <div style={{ color: "var(--muted)", fontSize: "0.75rem", fontFamily: "monospace" }}>
                      #{t.id.slice(0, 8)}
                    </div>
                  </td>
                  <td style={{ padding: "0.6rem 1rem", textAlign: "right", fontSize: "0.9rem", fontWeight: 600, color: t.amount_cents > 0 ? "var(--success)" : "var(--danger)", fontVariantNumeric: "tabular-nums" }}>
                    {t.amount_cents > 0 ? "+ " : "− "}{formatUSD(Math.abs(t.amount_cents))}
                  </td>
                  <td style={{ padding: "0.6rem 1rem", textAlign: "right", fontSize: "0.85rem", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                    {formatUSD(t.balance_after_cents)}
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
        placeholder="Other amount in R$ (min. 5)"
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
        Top up
      </button>
    </div>
  );
}
