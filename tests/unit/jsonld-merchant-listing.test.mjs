// Tests for Merchant Listings rich result invariants in JSON-LD.
//
// Google Search Console flagged 104 plan pages with 3 issues:
//   - ERROR: "image" missing on Product → INVALID rich result.
//   - WARNING: "hasMerchantReturnPolicy" missing on Offer.
//   - WARNING: "shippingDetails" missing on Offer.
//
// These tests guard the fix: buildOfferEnhancements helper must always emit
// shippingDetails + hasMerchantReturnPolicy with the canonical shape Google
// expects, and buildCountryJsonLd must apply it to every Offer in the
// AggregateOffer.

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SITE_URL = "https://viralefy.com";

import { buildOfferEnhancements, buildCountryJsonLd } from "../../src/lib/jsonld.ts";
import { getCountry } from "../../src/i18n/countries.ts";

const SITE = "https://viralefy.com";
const br = getCountry("br");
assert.ok(br, "BR country fixture missing");

// ---------- buildOfferEnhancements ----------

test("buildOfferEnhancements returns exactly shippingDetails + hasMerchantReturnPolicy", () => {
  const e = buildOfferEnhancements("BR");
  const keys = Object.keys(e).sort();
  assert.deepEqual(keys, ["hasMerchantReturnPolicy", "shippingDetails"]);
});

test("shippingDetails is OfferShippingDetails with $0 cost (digital service)", () => {
  const { shippingDetails } = buildOfferEnhancements("BR");
  assert.equal(shippingDetails["@type"], "OfferShippingDetails");

  const rate = shippingDetails.shippingRate;
  assert.equal(rate["@type"], "MonetaryAmount");
  assert.equal(rate.value, "0");
  assert.equal(rate.currency, "USD", "shipping cost is in USD (canonical)");
});

test("shippingDetails has DefinedRegion addressCountry uppercased", () => {
  const { shippingDetails } = buildOfferEnhancements("br");
  // Input lowercase → output uppercase (ISO 3166-1 alpha-2 convention).
  assert.equal(shippingDetails.shippingDestination["@type"], "DefinedRegion");
  assert.equal(shippingDetails.shippingDestination.addressCountry, "BR");
});

test("shippingDetails declares 0-day handling + 0-1 day transit (digital instant)", () => {
  const { shippingDetails } = buildOfferEnhancements("BR");
  const t = shippingDetails.deliveryTime;
  assert.equal(t["@type"], "ShippingDeliveryTime");
  assert.equal(t.handlingTime.minValue, 0);
  assert.equal(t.handlingTime.maxValue, 0);
  assert.equal(t.handlingTime.unitCode, "DAY");
  assert.equal(t.transitTime.minValue, 0);
  assert.equal(t.transitTime.maxValue, 1);
  assert.equal(t.transitTime.unitCode, "DAY");
});

test("hasMerchantReturnPolicy is FiniteReturnWindow at 30 days, FreeReturn by Mail", () => {
  const { hasMerchantReturnPolicy: p } = buildOfferEnhancements("BR");
  assert.equal(p["@type"], "MerchantReturnPolicy");
  assert.equal(p.applicableCountry, "BR");
  assert.equal(p.returnPolicyCategory, "https://schema.org/MerchantReturnFiniteReturnWindow");
  assert.equal(p.merchantReturnDays, 30, "must match the public 30-day refill/refund guarantee");
  assert.equal(p.returnMethod, "https://schema.org/ReturnByMail");
  assert.equal(p.returnFees, "https://schema.org/FreeReturn");
});

test("buildOfferEnhancements honors the country code per offer (US/GB/JP)", () => {
  for (const code of ["us", "gb", "JP", "de", "br"]) {
    const e = buildOfferEnhancements(code);
    assert.equal(e.shippingDetails.shippingDestination.addressCountry, code.toUpperCase());
    assert.equal(e.hasMerchantReturnPolicy.applicableCountry, code.toUpperCase());
  }
});

// ---------- buildCountryJsonLd uses enhancements ----------

const PLANS = [
  { id: "p1", name: "100 followers", category: "seguidores", price_cents: 990,  prices: { USD: "9.90",  BRL: "49.90"  }, followers_qty: 100 },
  { id: "p2", name: "1000 followers",category: "seguidores", price_cents: 4990, prices: { USD: "49.90", BRL: "249.90" }, followers_qty: 1000 },
];

function offersOf(blocks) {
  const svc = blocks.find((b) => b["@type"] === "Service");
  return svc?.offers?.offers ?? [];
}

test("every Offer in country JSON-LD carries shippingDetails", () => {
  const offers = offersOf(buildCountryJsonLd(br, PLANS, SITE));
  for (const o of offers) {
    assert.ok(o.shippingDetails, `Offer ${o.name} missing shippingDetails`);
    assert.equal(o.shippingDetails["@type"], "OfferShippingDetails");
  }
});

test("every Offer in country JSON-LD carries hasMerchantReturnPolicy", () => {
  const offers = offersOf(buildCountryJsonLd(br, PLANS, SITE));
  for (const o of offers) {
    assert.ok(o.hasMerchantReturnPolicy, `Offer ${o.name} missing hasMerchantReturnPolicy`);
    assert.equal(o.hasMerchantReturnPolicy["@type"], "MerchantReturnPolicy");
  }
});

test("every Offer keeps its existing fields (regression — no fields dropped)", () => {
  // Sanity check: spreading enhancements must NOT remove price/url/availability/etc.
  const offers = offersOf(buildCountryJsonLd(br, PLANS, SITE));
  for (const o of offers) {
    for (const key of ["name", "sku", "price", "priceCurrency", "url", "availability", "eligibleRegion", "priceValidUntil"]) {
      assert.ok(o[key] !== undefined, `Offer ${o.name} missing pre-existing field ${key}`);
    }
  }
});

test("returnPolicyCategory uses the Schema.org enum URL form (not bare string)", () => {
  // Google insiste em URL completa pra enum values; "FiniteReturnWindow" sozinho falha.
  const { hasMerchantReturnPolicy: p } = buildOfferEnhancements("BR");
  assert.match(p.returnPolicyCategory, /^https:\/\/schema\.org\/Merchant/);
  assert.match(p.returnMethod, /^https:\/\/schema\.org\/Return/);
  assert.match(p.returnFees, /^https:\/\/schema\.org\/Free/);
});

test("country code uppercase normalization is idempotent across calls", () => {
  // Mesmo input em vários casings produz o mesmo output (alpha-2 canon).
  const a = buildOfferEnhancements("br");
  const b = buildOfferEnhancements("BR");
  const c = buildOfferEnhancements("Br");
  assert.deepEqual(a, b);
  assert.deepEqual(b, c);
});
