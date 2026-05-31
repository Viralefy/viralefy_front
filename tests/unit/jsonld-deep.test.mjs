// Deeper JSON-LD unit tests. Where jsonld.test.mjs mirrors the function
// inline for hermetic SHAPE assertions, this file exercises the REAL
// src/lib/jsonld.ts buildCountryJsonLd via the loader hook + asserts the
// cross-block reference integrity (@id targets resolve, lowPrice <=
// highPrice numerically, priceValidUntil is a future date, etc.).

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SITE_URL = "https://viralefy.com";

import { buildCountryJsonLd } from "../../src/lib/jsonld.ts";
import { getCountry } from "../../src/i18n/countries.ts";

const SITE = "https://viralefy.com";
const br = getCountry("br");
assert.ok(br, "BR country fixture missing");

const PLANS = [
  { id: "p1", name: "100 followers", category: "seguidores", price_cents: 990,  prices: { USD: "9.90",  BRL: "49.90"  }, followers_qty: 100 },
  { id: "p2", name: "1000 followers",category: "seguidores", price_cents: 4990, prices: { USD: "49.90", BRL: "249.90" }, followers_qty: 1000 },
  { id: "p3", name: "10000 followers",category: "seguidores",price_cents: 19990,prices: { USD: "199.90",BRL: "999.90" }, followers_qty: 10000 },
];

const PREFERRED = ["USD", "EUR", "BRL", "USDT", "BTC"];

test("buildCountryJsonLd returns exactly 5 blocks (Org/WebSite/WebPage/Breadcrumb/Service)", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  assert.equal(blocks.length, 5);
  const types = blocks.map((b) => b["@type"]);
  assert.deepEqual(types, ["Organization", "WebSite", "WebPage", "BreadcrumbList", "Service"]);
});

test("every block carries @context = https://schema.org", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  for (const b of blocks) {
    assert.equal(b["@context"], "https://schema.org", `${b["@type"]} missing @context`);
  }
});

test("every @id present in the document is unique", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const ids = blocks.map((b) => b["@id"]).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, "duplicate @id detected");
});

test("Organization.contactPoint.availableLanguage is an array of lang codes", () => {
  const [org] = buildCountryJsonLd(br, PLANS, SITE);
  assert.ok(Array.isArray(org.contactPoint.availableLanguage));
  assert.ok(org.contactPoint.availableLanguage.length >= 1);
  for (const lang of org.contactPoint.availableLanguage) {
    assert.match(lang, /^[a-z]{2}(-[A-Z]{2})?$/i, `bad availableLanguage entry: ${lang}`);
  }
});

test("Organization.logo is an ImageObject with numeric width/height", () => {
  const [org] = buildCountryJsonLd(br, PLANS, SITE);
  assert.equal(org.logo["@type"], "ImageObject");
  assert.equal(typeof org.logo.width, "number");
  assert.equal(typeof org.logo.height, "number");
  assert.ok(org.logo.width > 0);
  assert.ok(org.logo.height > 0);
});

test("WebSite.publisher.@id === Organization.@id (reference resolves)", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const org = blocks.find((b) => b["@type"] === "Organization");
  const site = blocks.find((b) => b["@type"] === "WebSite");
  assert.equal(site.publisher["@id"], org["@id"]);
});

test("WebPage.isPartOf.@id === WebSite.@id (reference resolves)", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const site = blocks.find((b) => b["@type"] === "WebSite");
  const page = blocks.find((b) => b["@type"] === "WebPage");
  assert.equal(page.isPartOf["@id"], site["@id"]);
});

test("BreadcrumbList.itemListElement positions are sequential starting at 1", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const crumb = blocks.find((b) => b["@type"] === "BreadcrumbList");
  const positions = crumb.itemListElement.map((e) => e.position);
  for (let i = 0; i < positions.length; i++) {
    assert.equal(positions[i], i + 1, `position ${i} should be ${i + 1}`);
  }
});

test("Service.provider.@id === Organization.@id", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const org = blocks.find((b) => b["@type"] === "Organization");
  const svc = blocks.find((b) => b["@type"] === "Service");
  assert.equal(svc.provider["@id"], org["@id"]);
});

test("Service.areaServed.name === country.name", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const svc = blocks.find((b) => b["@type"] === "Service");
  assert.equal(svc.areaServed.name, br.name);
});

test("AggregateOffer.lowPrice <= AggregateOffer.highPrice (numeric)", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const svc = blocks.find((b) => b["@type"] === "Service");
  const low = parseFloat(svc.offers.lowPrice);
  const high = parseFloat(svc.offers.highPrice);
  assert.ok(!isNaN(low));
  assert.ok(!isNaN(high));
  assert.ok(low <= high, `low ${low} > high ${high}`);
});

test("AggregateOffer.offerCount equals offers.length", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const svc = blocks.find((b) => b["@type"] === "Service");
  assert.equal(svc.offers.offerCount, svc.offers.offers.length);
});

test("every Offer.price is a string parseable as a positive number", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const svc = blocks.find((b) => b["@type"] === "Service");
  for (const o of svc.offers.offers) {
    assert.equal(typeof o.price, "string", `offer.price is not string: ${typeof o.price}`);
    const n = parseFloat(o.price);
    assert.ok(!isNaN(n) && n > 0, `offer.price ${o.price} is not a positive number`);
  }
});

test("every Offer.priceCurrency is a 3+ char string in the preferred set", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const svc = blocks.find((b) => b["@type"] === "Service");
  for (const o of svc.offers.offers) {
    assert.equal(typeof o.priceCurrency, "string");
    assert.ok(o.priceCurrency.length >= 3);
    assert.ok(
      PREFERRED.includes(o.priceCurrency),
      `unexpected currency ${o.priceCurrency}`
    );
  }
});

test("every Offer.priceValidUntil is a future ISO date (YYYY-MM-DD)", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const svc = blocks.find((b) => b["@type"] === "Service");
  const now = new Date();
  for (const o of svc.offers.offers) {
    assert.match(o.priceValidUntil, /^\d{4}-\d{2}-\d{2}$/, `bad date: ${o.priceValidUntil}`);
    const d = new Date(o.priceValidUntil + "T00:00:00Z");
    assert.ok(d.getTime() > now.getTime(), `priceValidUntil ${o.priceValidUntil} not in future`);
  }
});

test("every Offer.sku is a non-empty string (the plan id)", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const svc = blocks.find((b) => b["@type"] === "Service");
  const skus = svc.offers.offers.map((o) => o.sku);
  for (const sku of skus) {
    assert.equal(typeof sku, "string");
    assert.ok(sku.length >= 1);
  }
  // Sku set equals plan id set.
  const expectedSkus = PLANS.map((p) => p.id);
  assert.deepEqual([...skus].sort(), expectedSkus.sort());
});

test("buildCountryJsonLd with empty plans returns 5 blocks, Service.offers undefined", () => {
  const blocks = buildCountryJsonLd(br, [], SITE);
  assert.equal(blocks.length, 5);
  const svc = blocks.find((b) => b["@type"] === "Service");
  assert.equal(svc.offers, undefined);
});

test("WebPage.inLanguage matches country.htmlLang", () => {
  const blocks = buildCountryJsonLd(br, PLANS, SITE);
  const page = blocks.find((b) => b["@type"] === "WebPage");
  assert.equal(page.inLanguage, br.htmlLang);
});
