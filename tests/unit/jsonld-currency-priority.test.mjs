// Tests for JSON-LD Offer currency preference order.
//
// Política: USD primeiro (mais portável globalmente em rich results),
// USDT logo em seguida (canônica do storefront, 1:1 com USD), depois
// EUR, e BRL bem mais para baixo — nunca 3ª preferência como era antes.
// Garante que rich results no Google/Bing mostrem USD/USDT/EUR pra
// visitantes globais e que BRL só apareça pra plano explicitamente
// precificado só em BRL.

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SITE_URL = "https://viralefy.com";

import { buildCountryJsonLd } from "../../src/lib/jsonld.ts";
import { getCountry } from "../../src/i18n/countries.ts";

const SITE = "https://viralefy.com";
const br = getCountry("br");
assert.ok(br, "BR country fixture missing");

function offersOf(blocks) {
  const svc = blocks.find((b) => b["@type"] === "Service");
  return svc?.offers?.offers ?? [];
}

test("when plan has BOTH USD and USDT, JSON-LD picks USD (most portable for SEO)", () => {
  const plans = [
    { id: "p1", name: "100 followers", category: "seguidores", price_cents: 990,
      prices: { USD: "9.90", USDT: "9.90", EUR: "9.10", BRL: "49.90" }, followers_qty: 100 },
  ];
  const offers = offersOf(buildCountryJsonLd(br, plans, SITE));
  assert.equal(offers.length, 1);
  assert.equal(offers[0].priceCurrency, "USD", "expected USD to win over USDT");
});

test("when plan has USDT but NOT USD, JSON-LD picks USDT (canon storefront)", () => {
  const plans = [
    { id: "p1", name: "100 followers", category: "seguidores", price_cents: 990,
      prices: { USDT: "9.90", EUR: "9.10", BRL: "49.90" }, followers_qty: 100 },
  ];
  const offers = offersOf(buildCountryJsonLd(br, plans, SITE));
  assert.equal(offers[0].priceCurrency, "USDT");
});

test("when plan has only EUR and BRL, EUR wins (BRL fica no fim da lista)", () => {
  const plans = [
    { id: "p1", name: "100 followers", category: "seguidores", price_cents: 990,
      prices: { EUR: "9.10", BRL: "49.90" }, followers_qty: 100 },
  ];
  const offers = offersOf(buildCountryJsonLd(br, plans, SITE));
  assert.equal(offers[0].priceCurrency, "EUR", "BRL must NOT win over EUR in SEO");
});

test("when plan has only BRL, fallback to BRL is acceptable (last resort)", () => {
  const plans = [
    { id: "p1", name: "100 followers", category: "seguidores", price_cents: 990,
      prices: { BRL: "49.90" }, followers_qty: 100 },
  ];
  const offers = offersOf(buildCountryJsonLd(br, plans, SITE));
  assert.equal(offers[0].priceCurrency, "BRL");
});

test("plan without any prices falls back to USD constructed from cents", () => {
  const plans = [
    { id: "p1", name: "100 followers", category: "seguidores", price_cents: 990,
      prices: {}, followers_qty: 100 },
  ];
  const offers = offersOf(buildCountryJsonLd(br, plans, SITE));
  assert.equal(offers[0].priceCurrency, "USD");
  assert.equal(offers[0].price, "9.90");
});

test("aggregate currency is the first offer's currency (consistent across catalog)", () => {
  // All plans price in USD → AggregateOffer must also be USD-based.
  const plans = [
    { id: "p1", name: "small", category: "seguidores", price_cents: 990,
      prices: { USD: "9.90", BRL: "49.90" }, followers_qty: 100 },
    { id: "p2", name: "big", category: "seguidores", price_cents: 9990,
      prices: { USD: "99.90", BRL: "499.90" }, followers_qty: 1000 },
  ];
  const blocks = buildCountryJsonLd(br, plans, SITE);
  const svc = blocks.find((b) => b["@type"] === "Service");
  assert.equal(svc.offers.priceCurrency, "USD");
});

test("BRL must NEVER appear in priceCurrency when USD/USDT/EUR are available (3-way regression)", () => {
  const plans = [
    { id: "p1", name: "a", category: "seguidores", price_cents: 990,
      prices: { USD: "9.90", USDT: "9.90", EUR: "9.10", BRL: "49.90" }, followers_qty: 100 },
    { id: "p2", name: "b", category: "seguidores", price_cents: 1990,
      prices: { USDT: "19.90", EUR: "18.30", BRL: "99.90" }, followers_qty: 250 },
    { id: "p3", name: "c", category: "seguidores", price_cents: 2990,
      prices: { EUR: "27.50", BRL: "149.90" }, followers_qty: 500 },
  ];
  const offers = offersOf(buildCountryJsonLd(br, plans, SITE));
  for (const o of offers) {
    assert.notEqual(o.priceCurrency, "BRL", `unexpected BRL pick: ${JSON.stringify(o)}`);
  }
});
