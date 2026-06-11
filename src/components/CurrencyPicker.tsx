"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import type { Currency } from "@/lib/api";

// CurrencyPicker — botão que abre um Modal full-screen (via portal) com a
// lista de moedas suportadas em vez do <select> nativo. Motivo: select
// nativo em mobile abria embaixo do header sticky em alguns browsers, e
// o conjunto de moedas é grande o suficiente pra justificar busca + grid.
//
// Botão mostra a moeda atual; Modal lista todas em grid clicável.

export function CurrencyPicker({
  currencies,
  current,
  onChange,
  label = "Currency",
}: {
  currencies: Currency[];
  current?: Currency | null;
  onChange: (code: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  function pick(code: string) {
    onChange(code);
    setOpen(false);
  }

  const display = current
    ? `${current.symbol} ${current.code}`
    : `${currencies[0]?.symbol ?? "$"} ${currencies[0]?.code ?? "USD"}`;

  return (
    <>
      <button
        type="button"
        className="btn btn-outline"
        data-testid="currency-picker"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        style={{
          padding: "0.5rem 0.7rem",
          fontSize: "0.85rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
        }}
      >
        {display}
        <Icon name="chevronDown" size={14} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        maxWidth={520}
      >
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "0.4rem",
          }}
        >
          {currencies.map((c) => {
            const active = c.code === current?.code;
            return (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => pick(c.code)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: active ? "2px solid var(--accent, #00fed6)" : "1px solid var(--border)",
                    background: active ? "var(--accent-dim, rgba(0,254,214,0.08))" : "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    textAlign: "left",
                    transition: "background 120ms ease",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <strong>{c.symbol}</strong>
                    <span>{c.code}</span>
                  </span>
                  {active && <Icon name="check" size={14} color="var(--accent, #00fed6)" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
