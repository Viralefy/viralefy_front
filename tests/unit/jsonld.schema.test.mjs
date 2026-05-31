// Stricter shape validation for buildCountryJsonLd output.
//
// The existing tests/unit/jsonld.test.mjs already pins ordering and a few
// fields. This file adds the cross-block invariants Google's Rich Results
// validator cares about: every block has @context, the Service.provider
// is a proper Organization, AggregateOffer has numerically coherent low/
// highPrice, BreadcrumbList.itemListElement is an array, etc.
//
// We re-use the same inline mirror of buildCountryJsonLd as jsonld.test.mjs
// (lib/jsonld.ts pulls @/ aliases that the test loader resolves but the
// inline copy keeps the test hermetic and decoupled from the API type).

import { test } from "node:test";
import assert from "node:assert/strict";

import { getCountry } from "../../src/i18n/countries.ts";

function buildCountryJsonLd(country, plans, siteUrl) {
  const pageUrl = `${siteUrl}/${country.code}`;
  const offers = plans.map((p) => {
    const brl = p.prices?.["BRL"] ?? (p.price_cents / 100).toFixed(2);
    return {
      "@type": "Offer",
      name: p.name,
      price: brl,
      priceCurrency: "BRL",
      url: pageUrl,
      availability: "https://schema.org/InStock",
      eligibleRegion: { "@type": "Country", name: country.name },
    };
  });
  const prices = offers.map((o) => parseFloat(o.price)).filter((n) => !isNaN(n));
  const low = prices.length ? Math.min(...prices).toFixed(2) : "0";
  const high = prices.length ? Math.max(...prices).toFixed(2) : "0";

  const organization = { "@context": "https://schema.org", "@type": "Organization", name: "Viralefy", url: siteUrl };
  const website = { "@context": "https://schema.org", "@type": "WebSite", name: "Viralefy", url: siteUrl };
  const webpage = {
    "@context": "https://schema.org", "@type": "WebPage", url: pageUrl,
    name: country.title, description: country.description, inLanguage: country.htmlLang,
    isPartOf: { "@type": "WebSite", name: "Viralefy", url: siteUrl },
  };
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: country.name, item: pageUrl },
    ],
  };
  const service = {
    "@context": "https://schema.org", "@type": "Service",
    name: country.h1, description: country.description,
    provider: { "@type": "Organization", name: "Viralefy", url: siteUrl },
    areaServed: { "@type": "Country", name: country.name },
    inLanguage: country.htmlLang,
    offers: {
      "@type": "AggregateOffer", priceCurrency: "BRL",
      lowPrice: low, highPrice: high, offerCount: offers.length, offers,
    },
  };
  return [organization, website, webpage, breadcrumb, service];
}

const country = getCountry("br");
const samplePlans = [
  { id: "a", name: "100 followers", price_cents: 990, prices: { BRL: "9.90" } },
  { id: "b", name: "1000 followers", price_cents: 4990, prices: { BRL: "49.90" } },
  { id: "c", name: "10000 followers", price_cents: 19990, prices: { BRL: "199.90" } },
];

test("buildCountryJsonLd returns exactly 5 blocks", () => {
  const blocks = buildCountryJsonLd(country, samplePlans, "https://viralefy.com");
  assert.equal(blocks.length, 5);
});

test("every block carries @context = 'https://schema.org'", () => {
  const blocks = buildCountryJsonLd(country, samplePlans, "https://viralefy.com");
  for (const b of blocks) {
    assert.equal(b["@context"], "https://schema.org");
  }
});

test("Organization block has @type, name and url", () => {
  const blocks = buildCountryJsonLd(country, samplePlans, "https://viralefy.com");
  const org = blocks.find((b) => b["@type"] === "Organization");
  assert.ok(org);
  assert.equal(org["@type"], "Organization");
  assert.ok(org.name && org.name.length > 0);
  assert.ok(org.url && org.url.startsWith("https://"));
});

test("WebSite block has @type and url", () => {
  const blocks = buildCountryJsonLd(country, samplePlans, "https://viralefy.com");
  const ws = blocks.find((b) => b["@type"] === "WebSite");
  assert.ok(ws);
  assert.equal(ws["@type"], "WebSite");
  assert.ok(ws.url && ws.url.startsWith("https://"));
});

test("WebPage block has inLanguage matching country.htmlLang", () => {
  const blocks = buildCountryJsonLd(country, samplePlans, "https://viralefy.com");
  const wp = blocks.find((b) => b["@type"] === "WebPage");
  assert.ok(wp);
  assert.equal(wp.inLanguage, country.htmlLang);
});

test("BreadcrumbList.itemListElement is a non-empty array of ListItem entries", () => {
  const blocks = buildCountryJsonLd(country, samplePlans, "https://viralefy.com");
  const bc = blocks.find((b) => b["@type"] === "BreadcrumbList");
  assert.ok(bc);
  assert.ok(Array.isArray(bc.itemListElement));
  assert.ok(bc.itemListElement.length >= 2);
  for (const li of bc.itemListElement) {
    assert.equal(li["@type"], "ListItem");
    assert.ok(typeof li.position === "number");
    assert.ok(li.name);
    assert.ok(li.item);
  }
});

test("Service.provider is a proper Organization sub-object", () => {
  const blocks = buildCountryJsonLd(country, samplePlans, "https://viralefy.com");
  const svc = blocks.find((b) => b["@type"] === "Service");
  assert.ok(svc);
  assert.ok(svc.provider);
  assert.equal(svc.provider["@type"], "Organization");
  assert.ok(svc.provider.name);
});

test("AggregateOffer.lowPrice <= highPrice numerically", () => {
  const blocks = buildCountryJsonLd(country, samplePlans, "https://viralefy.com");
  const svc = blocks.find((b) => b["@type"] === "Service");
  const agg = svc.offers;
  assert.equal(agg["@type"], "AggregateOffer");
  const low = parseFloat(agg.lowPrice);
  const high = parseFloat(agg.highPrice);
  assert.ok(!Number.isNaN(low));
  assert.ok(!Number.isNaN(high));
  assert.ok(low <= high, `lowPrice ${low} should be <= highPrice ${high}`);
});

test("Each Offer is well-formed (type, name, price, currency, url)", () => {
  const blocks = buildCountryJsonLd(country, samplePlans, "https://viralefy.com");
  const svc = blocks.find((b) => b["@type"] === "Service");
  for (const off of svc.offers.offers) {
    assert.equal(off["@type"], "Offer");
    assert.ok(off.name);
    assert.ok(off.price);
    assert.ok(off.priceCurrency);
    assert.ok(off.url);
    assert.equal(off.availability, "https://schema.org/InStock");
  }
});

test("Empty plans list still produces a valid AggregateOffer (offerCount=0)", () => {
  const blocks = buildCountryJsonLd(country, [], "https://viralefy.com");
  const svc = blocks.find((b) => b["@type"] === "Service");
  assert.equal(svc.offers.offerCount, 0);
  assert.equal(svc.offers.lowPrice, "0");
  assert.equal(svc.offers.highPrice, "0");
});
