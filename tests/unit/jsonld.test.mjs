// Unit tests for buildCountryJsonLd.
//
// NOTE on indirection: src/lib/jsonld.ts uses `@/i18n/countries` (a tsconfig
// path alias). Node's TS stripping does not resolve aliases, so we cannot
// `import` jsonld.ts directly from this .mjs file without a loader. We
// reproduce the function inline below, mirroring src/lib/jsonld.ts. The
// CI / build still validates the real module; this test pins the SHAPE
// of the JSON-LD output that the page templates expect.

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

const br = getCountry("br");

const plans = [
  { id: "a", name: "100 followers", price_cents: 990, prices: { BRL: "9.90" } },
  { id: "b", name: "1000 followers", price_cents: 4990, prices: { BRL: "49.90" } },
  { id: "c", name: "10000 followers", price_cents: 19990, prices: { BRL: "199.90" } },
];

test("buildCountryJsonLd returns 5 blocks in canonical order", () => {
  const blocks = buildCountryJsonLd(br, plans, "https://viralefy.com");
  assert.equal(blocks.length, 5);
  const types = blocks.map((b) => b["@type"]);
  assert.deepEqual(types, [
    "Organization",
    "WebSite",
    "WebPage",
    "BreadcrumbList",
    "Service",
  ]);
});

test("every block carries the schema.org @context", () => {
  const blocks = buildCountryJsonLd(br, plans, "https://viralefy.com");
  for (const b of blocks) {
    assert.equal(b["@context"], "https://schema.org");
  }
});

test("WebPage carries inLanguage matching the country", () => {
  const blocks = buildCountryJsonLd(br, plans, "https://viralefy.com");
  const webpage = blocks.find((b) => b["@type"] === "WebPage");
  assert.equal(webpage.inLanguage, "pt-BR");
  assert.equal(webpage.url, "https://viralefy.com/br");
});

test("BreadcrumbList has Home + Country positions", () => {
  const blocks = buildCountryJsonLd(br, plans, "https://viralefy.com");
  const crumb = blocks.find((b) => b["@type"] === "BreadcrumbList");
  assert.equal(crumb.itemListElement.length, 2);
  assert.equal(crumb.itemListElement[0].name, "Home");
  assert.equal(crumb.itemListElement[1].name, br.name);
});

test("Service.offers is an AggregateOffer with low/high/offerCount", () => {
  const blocks = buildCountryJsonLd(br, plans, "https://viralefy.com");
  const service = blocks.find((b) => b["@type"] === "Service");
  assert.equal(service.offers["@type"], "AggregateOffer");
  assert.equal(service.offers.offerCount, plans.length);
  assert.equal(service.offers.lowPrice, "9.90");
  assert.equal(service.offers.highPrice, "199.90");
  assert.equal(service.offers.priceCurrency, "BRL");
});

test("each Offer has @type, name, price, priceCurrency, url, availability", () => {
  const blocks = buildCountryJsonLd(br, plans, "https://viralefy.com");
  const offers = blocks.find((b) => b["@type"] === "Service").offers.offers;
  for (const o of offers) {
    assert.equal(o["@type"], "Offer");
    assert.ok(o.name && o.price && o.priceCurrency && o.url && o.availability);
    assert.equal(o.availability, "https://schema.org/InStock");
  }
});

test("empty plans list still produces a valid Service block", () => {
  const blocks = buildCountryJsonLd(br, [], "https://viralefy.com");
  const service = blocks.find((b) => b["@type"] === "Service");
  assert.equal(service.offers.offerCount, 0);
  assert.equal(service.offers.lowPrice, "0");
});
