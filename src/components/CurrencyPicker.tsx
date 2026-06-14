"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import type { Currency } from "@/lib/api";

// Nome legível por código (fallback pra próprio code quando desconhecido).
// BUG-117 do QA 2026-06-12: modal de moeda mostrava só "$ USD" / "R$ BRL" —
// agora mostra "Dólar americano", "Real brasileiro" etc. logo abaixo do
// símbolo+code pro usuário entender o que cada um significa.
const CURRENCY_NAMES: Record<string, { pt: string; en: string; es: string }> = {
  USD:  { pt: "Dólar americano",     en: "US Dollar",          es: "Dólar estadounidense" },
  USDT: { pt: "Tether (USD)",        en: "Tether (USD)",       es: "Tether (USD)" },
  USDC: { pt: "USD Coin",            en: "USD Coin",           es: "USD Coin" },
  DAI:  { pt: "Dai",                 en: "Dai",                es: "Dai" },
  EUR:  { pt: "Euro",                en: "Euro",               es: "Euro" },
  GBP:  { pt: "Libra esterlina",     en: "British Pound",      es: "Libra esterlina" },
  BRL:  { pt: "Real brasileiro",     en: "Brazilian Real",     es: "Real brasileño" },
  MXN:  { pt: "Peso mexicano",       en: "Mexican Peso",       es: "Peso mexicano" },
  ARS:  { pt: "Peso argentino",      en: "Argentine Peso",     es: "Peso argentino" },
  CAD:  { pt: "Dólar canadense",     en: "Canadian Dollar",    es: "Dólar canadiense" },
  AUD:  { pt: "Dólar australiano",   en: "Australian Dollar",  es: "Dólar australiano" },
  CHF:  { pt: "Franco suíço",        en: "Swiss Franc",        es: "Franco suizo" },
  JPY:  { pt: "Iene japonês",        en: "Japanese Yen",       es: "Yen japonés" },
  CNY:  { pt: "Yuan chinês",         en: "Chinese Yuan",       es: "Yuan chino" },
  KRW:  { pt: "Won sul-coreano",     en: "Korean Won",         es: "Won surcoreano" },
  INR:  { pt: "Rúpia indiana",       en: "Indian Rupee",       es: "Rupia india" },
  BTC:  { pt: "Bitcoin",             en: "Bitcoin",            es: "Bitcoin" },
  ETH:  { pt: "Ethereum",            en: "Ethereum",           es: "Ethereum" },
  BNB:  { pt: "BNB",                 en: "BNB",                es: "BNB" },
  SOL:  { pt: "Solana",              en: "Solana",             es: "Solana" },
  ADA:  { pt: "Cardano",             en: "Cardano",            es: "Cardano" },
  XRP:  { pt: "XRP",                 en: "XRP",                es: "XRP" },
  DOGE: { pt: "Dogecoin",            en: "Dogecoin",           es: "Dogecoin" },
  LTC:  { pt: "Litecoin",            en: "Litecoin",           es: "Litecoin" },
  MATIC:{ pt: "Polygon (MATIC)",     en: "Polygon (MATIC)",    es: "Polygon (MATIC)" },
  TRX:  { pt: "TRON",                en: "TRON",               es: "TRON" },
};

function currencyName(code: string, lang: "pt" | "en" | "es"): string {
  return CURRENCY_NAMES[code]?.[lang] ?? code;
}

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
  lang = "en",
}: {
  currencies: Currency[];
  current?: Currency | null;
  onChange: (code: string) => void;
  label?: string;
  lang?: "pt" | "en" | "es";
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
                    textAlign: "start",
                    transition: "background 120ms ease",
                  }}
                >
                  <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                      <strong>{c.symbol}</strong>
                      <span>{c.code}</span>
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: "0.72rem", lineHeight: 1.2, marginTop: "0.1rem" }}>
                      {currencyName(c.code, lang)}
                    </span>
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
