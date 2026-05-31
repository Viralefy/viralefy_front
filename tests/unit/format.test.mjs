// Unit tests for the priceFor formatter.

import { test } from "node:test";
import assert from "node:assert/strict";

import { priceFor } from "../../src/lib/format.ts";

/** @type {import("../../src/lib/api.ts").Plan} */
const plan = {
  id: "p1",
  name: "1k Followers",
  description: "",
  category: "seguidores",
  platform: "instagram",
  target_type: "profile",
  followers_qty: 1000,
  price_cents: 990,
  currency: "BRL",
  active: true,
  sort_order: 1,
  prices: { BRL: "9.90", USD: "1.99", USDT: "1.99", EUR: "1.79" },
};

const BRL = { code: "BRL", name: "Real", symbol: "R$", rate: 1, decimals: 2, kind: "fiat", settlement_code: "BRL" };
const USD = { code: "USD", name: "Dollar", symbol: "US$", rate: 5, decimals: 2, kind: "fiat", settlement_code: "USD" };
const USDT = { code: "USDT", name: "Tether", symbol: "$", rate: 5, decimals: 2, kind: "crypto", settlement_code: "USDT" };
const EUR = { code: "EUR", name: "Euro", symbol: "€", rate: 6, decimals: 2, kind: "fiat", settlement_code: "EUR" };
const BTC = { code: "BTC", name: "Bitcoin", symbol: "₿", rate: 1, decimals: 8, kind: "crypto", settlement_code: "BTC" };

test("priceFor formats BRL with symbol + space + amount", () => {
  assert.equal(priceFor(plan, BRL), "R$ 9.90");
});

test("priceFor formats USD", () => {
  assert.equal(priceFor(plan, USD), "US$ 1.99");
});

test("priceFor formats USDT", () => {
  assert.equal(priceFor(plan, USDT), "$ 1.99");
});

test("priceFor formats EUR", () => {
  assert.equal(priceFor(plan, EUR), "€ 1.79");
});

test("priceFor falls back to USDT amount when currency missing from prices map", () => {
  // BTC has no entry — should still produce a string using the USDT amount
  // (antes era BRL, mas BRL como fallback global era um leak histórico).
  const got = priceFor(plan, BTC);
  assert.ok(got.startsWith("₿ "), `expected '₿' prefix, got '${got}'`);
  assert.ok(got.includes("1.99"));
});

test("priceFor uses default USDT/$ when currency arg is null (SSR fallback)", () => {
  // SSR antes do hidrate: currency=null → USDT/$ em vez de BRL/R$.
  const got = priceFor(plan, null);
  assert.equal(got, "$ 1.99");
});

test("priceFor falls back to cents/100 when nothing matches", () => {
  const planNoPrices = { ...plan, prices: {} };
  assert.equal(priceFor(planNoPrices, null), "$ 9.90");
});

test("priceFor always returns a string", () => {
  assert.equal(typeof priceFor(plan, BRL), "string");
  assert.equal(typeof priceFor(plan, null), "string");
});
