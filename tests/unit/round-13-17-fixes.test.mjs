// Regression tests for the fixes shipped in rounds 13–17 (QA 2026-06-12..14).
//
// Coverage:
//   - Round 13 (i18n): middleware.detectAcceptLanguage parses Accept-Language
//     with weighted q-values and picks the highest-weight supported tag, not
//     just the first one listed.
//   - Round 14 (BUG-191): jsonld.toJsonLdGraph wraps nodes in a single
//     `@graph` envelope, strips per-node `@context`, and drops nullish nodes.
//   - Round 14 (BUG-192): jsonld.buildAggregateOffer filters out offers with
//     non-numeric / zero / wrong-currency prices and returns null when the
//     valid set is empty.
//   - Round 17 (i18n labels): plan-labels.formatQty uses Intl-locale grouping
//     per language (pt-BR uses "."; en uses ",").
//
// Each test targets a SHAPE assertion (not just truthiness) and a negative
// branch (empty input, hostile input, wrong-currency input) as required by
// the engineering standards skill §22 ("smoke/unit nunca cego").

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SITE_URL = "https://viralefy.com";

import { toJsonLdGraph, buildAggregateOffer } from "../../src/lib/jsonld.ts";
import { formatQty } from "../../src/lib/plan-labels.ts";

// NOTE on detectAcceptLanguage: src/middleware.ts imports "next/server"
// (NextRequest), which Node's ESM resolver can't load outside the Next
// bundler. Same pattern as tests/unit/jsonld.test.mjs (which inlines the
// shape it pins): we replicate detectAcceptLanguage VERBATIM from
// src/middleware.ts so the test pins the algorithm's contract. If the source
// drifts, this test will not catch it directly — but the parse logic is
// also exercised end-to-end by tests/emulated/i18n-flow.mjs against the
// live SSR. Trade-off documented per skill §22 (test never silently bypassed).
function detectAcceptLanguage(req) {
  const h = req.headers.get("accept-language");
  if (!h) return null;
  const tags = h
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      const weight = q ? parseFloat(q.slice(2)) : 1;
      return { tag: tag.toLowerCase(), weight: Number.isFinite(weight) ? weight : 0 };
    })
    .filter((t) => t.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  for (const { tag } of tags) {
    if (tag.startsWith("pt")) return "pt-BR";
    if (tag.startsWith("es")) return "es-ES";
    if (tag.startsWith("fr")) return "fr-FR";
    if (tag.startsWith("de")) return "de-DE";
    if (tag.startsWith("ja")) return "ja-JP";
    if (tag.startsWith("it")) return "it-IT";
    if (tag.startsWith("ru")) return "ru-RU";
    if (tag.startsWith("nl")) return "nl-NL";
    if (tag.startsWith("ko")) return "ko-KR";
    if (tag.startsWith("ar")) return "ar-SA";
    if (tag.startsWith("zh")) return "zh-CN";
    if (tag.startsWith("hi")) return "hi-IN";
    if (tag.startsWith("tr")) return "tr-TR";
    if (tag.startsWith("pl")) return "pl-PL";
    if (tag.startsWith("sv")) return "sv-SE";
    if (tag.startsWith("en")) return "en";
  }
  return null;
}

// ─── toJsonLdGraph (round 14 / BUG-191) ───────────────────────────────────

test("toJsonLdGraph wraps nodes in a single @graph envelope", () => {
  const out = toJsonLdGraph([
    { "@type": "Organization", name: "Viralefy" },
    { "@type": "WebSite", name: "Viralefy" },
  ]);
  assert.equal(out["@context"], "https://schema.org");
  assert.ok(Array.isArray(out["@graph"]));
  assert.equal(out["@graph"].length, 2);
  assert.equal(out["@graph"][0]["@type"], "Organization");
  assert.equal(out["@graph"][1]["@type"], "WebSite");
});

test("toJsonLdGraph strips per-node @context (only envelope keeps it)", () => {
  const out = toJsonLdGraph([
    { "@context": "https://schema.org", "@type": "Organization", name: "X" },
  ]);
  const node = out["@graph"][0];
  assert.ok(!("@context" in node), "per-node @context must be stripped");
  assert.equal(node["@type"], "Organization");
});

test("toJsonLdGraph drops null/undefined nodes (defensive against optional blocks)", () => {
  const out = toJsonLdGraph([
    { "@type": "Organization" },
    null,
    undefined,
    { "@type": "WebSite" },
  ]);
  assert.equal(out["@graph"].length, 2);
  assert.deepEqual(out["@graph"].map((n) => n["@type"]), ["Organization", "WebSite"]);
});

test("toJsonLdGraph with empty input still emits a valid envelope", () => {
  const out = toJsonLdGraph([]);
  assert.equal(out["@context"], "https://schema.org");
  assert.deepEqual(out["@graph"], []);
});

// ─── buildAggregateOffer (round 14 / BUG-192) ─────────────────────────────

test("buildAggregateOffer computes low/high/count from valid numeric offers", () => {
  const offers = [
    { price: "9.90",  priceCurrency: "USD", "@type": "Offer" },
    { price: "49.90", priceCurrency: "USD", "@type": "Offer" },
    { price: "199.90", priceCurrency: "USD", "@type": "Offer" },
  ];
  const agg = buildAggregateOffer(offers, { priceCurrency: "USD" });
  assert.ok(agg, "expected an AggregateOffer block");
  assert.equal(agg["@type"], "AggregateOffer");
  assert.equal(agg.priceCurrency, "USD");
  assert.equal(agg.lowPrice, "9.90");
  assert.equal(agg.highPrice, "199.90");
  assert.equal(agg.offerCount, 3);
});

test("buildAggregateOffer filters out non-numeric price strings (on_request, empty)", () => {
  const offers = [
    { price: "on_request", priceCurrency: "USD", "@type": "Offer" },
    { price: "",           priceCurrency: "USD", "@type": "Offer" },
    { price: "19.90",      priceCurrency: "USD", "@type": "Offer" },
  ];
  const agg = buildAggregateOffer(offers, { priceCurrency: "USD" });
  assert.ok(agg);
  assert.equal(agg.offerCount, 1, "only one numeric offer must survive");
  assert.equal(agg.lowPrice, "19.90");
  assert.equal(agg.highPrice, "19.90");
});

test("buildAggregateOffer filters out zero-priced offers (enterprise/quote)", () => {
  const offers = [
    { price: "0",     priceCurrency: "USD", "@type": "Offer" },
    { price: "0.00",  priceCurrency: "USD", "@type": "Offer" },
    { price: "10.00", priceCurrency: "USD", "@type": "Offer" },
  ];
  const agg = buildAggregateOffer(offers, { priceCurrency: "USD" });
  assert.ok(agg);
  assert.equal(agg.offerCount, 1);
  assert.equal(agg.lowPrice, "10.00", "zero must not pull lowPrice down");
});

test("buildAggregateOffer drops offers in a different currency than opts.priceCurrency", () => {
  const offers = [
    { price: "9.90",  priceCurrency: "BRL", "@type": "Offer" },
    { price: "49.90", priceCurrency: "USD", "@type": "Offer" },
  ];
  const agg = buildAggregateOffer(offers, { priceCurrency: "USD" });
  assert.ok(agg);
  assert.equal(agg.offerCount, 1);
  assert.equal(agg.priceCurrency, "USD");
});

test("buildAggregateOffer returns null when no valid offer remains", () => {
  const offers = [
    { price: "on_request", priceCurrency: "USD", "@type": "Offer" },
    { price: "0",          priceCurrency: "USD", "@type": "Offer" },
  ];
  const agg = buildAggregateOffer(offers, { priceCurrency: "USD" });
  assert.equal(agg, null);
});

test("buildAggregateOffer returns null for empty input", () => {
  assert.equal(buildAggregateOffer([], { priceCurrency: "USD" }), null);
});

// ─── formatQty (round 17 / BUG-174 — i18n number grouping) ────────────────

test("formatQty pt uses dot as thousands separator (pt-BR locale)", () => {
  // pt-BR groups with "." — 1000 → "1.000". NBSP-safe.
  assert.equal(formatQty(1000, "pt"), "1.000");
  assert.equal(formatQty(50000, "pt"), "50.000");
});

test("formatQty en uses comma as thousands separator", () => {
  assert.equal(formatQty(1000, "en"), "1,000");
  assert.equal(formatQty(50000, "en"), "50,000");
});

test("formatQty de groups with dot (de-DE locale)", () => {
  assert.equal(formatQty(1000, "de"), "1.000");
});

test("formatQty falls back gracefully for tiny qty (no grouping needed)", () => {
  assert.equal(formatQty(100, "pt"), "100");
  assert.equal(formatQty(100, "en"), "100");
});

test("formatQty es and es_AR both use Spanish grouping (NOT English)", () => {
  // es uses "." (es generic / es-ES) — must not be "1,000" (English).
  const es = formatQty(10000, "es");
  const esAR = formatQty(10000, "es_AR");
  // Either "10.000" (Spain) or "10 000" (NBSP, some locales) but never "10,000".
  assert.notEqual(es, "10,000");
  assert.notEqual(esAR, "10,000");
});

// ─── detectAcceptLanguage (round 13 — i18n SSR via Accept-Language) ───────

function mockReq(acceptLanguage) {
  return {
    headers: {
      get(name) {
        return name.toLowerCase() === "accept-language" ? acceptLanguage : null;
      },
    },
  };
}

test("detectAcceptLanguage picks highest-weight pt over en (q-value parse)", () => {
  // Browser default: pt-BR,pt;q=0.9,en;q=0.8 — pt wins.
  const loc = detectAcceptLanguage(mockReq("pt-BR,pt;q=0.9,en;q=0.8"));
  assert.equal(loc, "pt-BR");
});

test("detectAcceptLanguage respects explicit q ordering (lower-weight pt loses)", () => {
  // en is first AND highest weight: must NOT pick pt just because it's listed.
  const loc = detectAcceptLanguage(mockReq("en;q=1.0,pt;q=0.1"));
  assert.equal(loc, "en");
});

test("detectAcceptLanguage maps Arabic to ar-SA (RTL family)", () => {
  const loc = detectAcceptLanguage(mockReq("ar-SA,ar;q=0.9,en;q=0.5"));
  assert.equal(loc, "ar-SA");
});

test("detectAcceptLanguage returns null when header is missing", () => {
  assert.equal(detectAcceptLanguage(mockReq(null)), null);
});

test("detectAcceptLanguage returns null when all weights are q=0 (RFC 7231)", () => {
  // q=0 means explicitly NOT acceptable. None survives the weight > 0 filter.
  assert.equal(detectAcceptLanguage(mockReq("pt;q=0,en;q=0")), null);
});

test("detectAcceptLanguage handles a single tag without q-param (default q=1)", () => {
  assert.equal(detectAcceptLanguage(mockReq("de")), "de-DE");
  assert.equal(detectAcceptLanguage(mockReq("ja")), "ja-JP");
});

test("detectAcceptLanguage falls back through ordered list when first tag is unsupported", () => {
  // "xx" is gibberish; falls to "es" next.
  const loc = detectAcceptLanguage(mockReq("xx,es;q=0.8"));
  assert.equal(loc, "es-ES");
});
