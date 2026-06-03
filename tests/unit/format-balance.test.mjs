// Unit tests for the USD-canonical helpers: formatBalance + formatPresetUsd.
//
// Both helpers exist because créditos, invoices e price_cents são
// canonicamente USD-cents desde a migração 011, mas o usuário visualiza
// na moeda de display escolhida. NUNCA cair em BRL como fallback global —
// a SSR-fallback é USDT/$ (1:1 com USD).

import { test } from "node:test";
import assert from "node:assert/strict";

import { formatBalance, formatPresetUsd } from "../../src/lib/format.ts";

const USDT = { code: "USDT", name: "Tether", symbol: "$", rate: 1, decimals: 2, kind: "crypto", settlement_code: "USDT" };
const USD = { code: "USD", name: "Dollar", symbol: "$", rate: 1, decimals: 2, kind: "fiat", settlement_code: "USDT" };
const BRL = { code: "BRL", name: "Real", symbol: "R$", rate: 5.41, decimals: 2, kind: "fiat", settlement_code: "BRL" };
const EUR = { code: "EUR", name: "Euro", symbol: "€", rate: 0.92, decimals: 2, kind: "fiat", settlement_code: "EUR" };
const BTC = { code: "BTC", name: "Bitcoin", symbol: "₿", rate: 0.0000103, decimals: 8, kind: "crypto", settlement_code: "BTC" };

// ---------- formatBalance ----------

test("formatBalance: SSR fallback = '$ N.NN' USDT, NEVER BRL/R$", () => {
  // currency=null acontece no primeiro paint (antes do /api/geo).
  assert.equal(formatBalance(0, null), "$ 0.00");
  assert.equal(formatBalance(2500, null), "$ 25.00");
  assert.equal(formatBalance(9999, null), "$ 99.99");
  assert.equal(formatBalance(150000, null), "$ 1500.00");
});

test("formatBalance: USDT (rate=1) renders as '$ X.XX'", () => {
  assert.equal(formatBalance(2500, USDT), "$ 25.00");
  assert.equal(formatBalance(100, USDT), "$ 1.00");
});

test("formatBalance: USD (rate=1) renders as '$ X.XX'", () => {
  assert.equal(formatBalance(2500, USD), "$ 25.00");
});

test("formatBalance: BRL applies rate 5.41 with R$ symbol", () => {
  // 2500 USD-cents = $25 USD = R$ 135.25 (com rate 5.41)
  assert.equal(formatBalance(2500, BRL), "R$ 135.25");
  assert.equal(formatBalance(100, BRL), "R$ 5.41");
});

test("formatBalance: EUR applies rate 0.92 with € symbol", () => {
  // 2500 USD-cents = $25 USD = € 23.00 (com rate 0.92)
  assert.equal(formatBalance(2500, EUR), "€ 23.00");
});

test("formatBalance: BTC honors 8 decimals", () => {
  // 2500 USD-cents = $25 USD * 0.0000103 = 0.00025750 BTC
  assert.equal(formatBalance(2500, BTC), "₿ 0.00025750");
});

test("formatBalance: zero balance always renders without leakage", () => {
  for (const c of [null, USDT, USD, BRL, EUR, BTC]) {
    const out = formatBalance(0, c);
    assert.ok(out.length > 0, "empty output");
    assert.ok(out.includes("0"), `missing zero: ${out}`);
  }
});

test("formatBalance: never returns 'R$' when currency is null/USDT/USD", () => {
  // Regressão: o leak histórico era BRL/R$ no SSR-fallback.
  for (const c of [null, USDT, USD]) {
    const out = formatBalance(50000, c);
    assert.ok(!out.includes("R$"), `BRL leak in fallback: ${out}`);
  }
});

test("formatBalance: handles negative amounts (debits) cleanly", () => {
  // No app o sinal vem fora da string; aqui só checamos formato.
  assert.equal(formatBalance(-2500, USDT), "$ -25.00");
});

test("formatBalance: respects currency.decimals (e.g. 8 for BTC)", () => {
  const out = formatBalance(1000000, BTC); // $10000 * 0.0000103 = 0.103 BTC
  assert.match(out, /^₿ 0\.\d{8}$/, `bad BTC decimals: ${out}`);
});

// ---------- formatPresetUsd ----------

test("formatPresetUsd: USDT preset renders as integer dollars when whole", () => {
  // "+ $ 25" — não "+ $ 25.00", já que é redondo em USD.
  assert.equal(formatPresetUsd(25, USDT), "$ 25");
  assert.equal(formatPresetUsd(100, USDT), "$ 100");
});

test("formatPresetUsd: BRL preset keeps decimals when not whole", () => {
  // $25 USD * 5.41 = R$ 135.25 → não é redondo, mantém 2 casas.
  assert.equal(formatPresetUsd(25, BRL), "R$ 135.25");
});

test("formatPresetUsd: BRL renders as integer when whole (e.g. $100 in fictional rate 5)", () => {
  // Smoke test do branch "isWhole" — usando moeda fictícia com rate redondo.
  const BRL_ROUND = { ...BRL, rate: 5 };
  assert.equal(formatPresetUsd(20, BRL_ROUND), "R$ 100"); // 20*5=100 redondo
});

test("formatPresetUsd: EUR preset rounds to integer", () => {
  // $25 USD * 0.92 = € 23.00 → € 23
  assert.equal(formatPresetUsd(25, EUR), "€ 23");
});

test("formatPresetUsd: BTC keeps fixed decimals (not rounded to int)", () => {
  // BTC nunca é "round" pra preset USD — mantém decimais.
  const out = formatPresetUsd(25, BTC);
  assert.match(out, /^₿ 0\./, `bad BTC preset: ${out}`);
});

test("formatPresetUsd: null currency falls back to '$ N' (USDT), never R$", () => {
  assert.equal(formatPresetUsd(25, null), "$ 25");
  assert.equal(formatPresetUsd(100, null), "$ 100");
});

test("formatPresetUsd: non-integer USD presets are rendered as integer when result is whole", () => {
  // 10 * 0.92 = 9.20 EUR → não é redondo, mantém .00 (até 2 casas)
  assert.equal(formatPresetUsd(10, EUR), "€ 9.20");
});

test("formatPresetUsd: handles standard preset ladder [10, 25, 50, 100, 250, 500]", () => {
  for (const v of [10, 25, 50, 100, 250, 500]) {
    const usdt = formatPresetUsd(v, USDT);
    const brl = formatPresetUsd(v, BRL);
    const eur = formatPresetUsd(v, EUR);
    assert.equal(usdt, `$ ${v}`, `USDT preset wrong for ${v}`);
    assert.ok(brl.startsWith("R$ "), `BRL prefix missing for ${v}`);
    assert.ok(eur.startsWith("€ "), `EUR prefix missing for ${v}`);
  }
});

test("formatPresetUsd: never emits R$ in default/USDT/USD path (regression)", () => {
  for (const c of [null, USDT, USD]) {
    for (const v of [10, 25, 50, 100, 250, 500]) {
      const out = formatPresetUsd(v, c);
      assert.ok(!out.includes("R$"), `BRL leak in preset: ${out} (currency=${c?.code ?? "null"})`);
    }
  }
});
