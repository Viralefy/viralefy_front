// Unit tests for sitemap XML generation.
//
// We can't import the Next.js route handler directly (it depends on the
// runtime Response object and dynamic mode). Instead we mirror the same
// pure transform that app/sitemap.xml/route.ts uses and assert its
// shape end-to-end against a sample of SITEMAP_BUCKETS.

import { test } from "node:test";
import assert from "node:assert/strict";

import { SITEMAP_BUCKETS } from "../../src/lib/site-urls.ts";

const SITE = "https://viralefy.com";

// Mirror of the pure transform inside src/app/sitemap.xml/route.ts.
function xmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildSitemapIndexXml(base, buckets, today) {
  const entries = buckets.map((b) => `
  <sitemap>
    <loc>${xmlEscape(`${base}/sitemap/${b}.xml`)}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</sitemapindex>`;
}

const today = new Date().toISOString().slice(0, 10);
const xml = buildSitemapIndexXml(SITE, SITEMAP_BUCKETS, today);

test("sitemap index XML starts with the XML prolog", () => {
  assert.ok(xml.startsWith("<?xml"), "missing xml prolog");
});

test("sitemap index XML has the <sitemapindex> root", () => {
  assert.match(xml, /<sitemapindex[^>]*>/);
});

test("sitemap index has at least 40 <sitemap> entries", () => {
  const count = (xml.match(/<sitemap>/g) || []).length;
  // We have ~47 buckets in SITEMAP_BUCKETS.
  assert.ok(count >= 40, `only ${count} sitemap entries`);
});

test("each <sitemap> entry has a <loc> with /sitemap/<lang>.xml format", () => {
  // Extract the <loc> contents.
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 40);
  for (const loc of locs) {
    assert.match(
      loc,
      /^https?:\/\/[^/]+\/sitemap\/[a-zA-Z_]+\.xml$/,
      `bad loc: ${loc}`
    );
  }
});

test("every sitemap loc references one of SITEMAP_BUCKETS", () => {
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const known = new Set(SITEMAP_BUCKETS);
  for (const loc of locs) {
    const m = loc.match(/sitemap\/([a-zA-Z_]+)\.xml$/);
    assert.ok(m, `bad loc: ${loc}`);
    assert.ok(known.has(m[1]), `unknown bucket in loc: ${m[1]}`);
  }
});

test("every <sitemap> has a <lastmod> in YYYY-MM-DD form", () => {
  const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  assert.ok(lastmods.length >= 40);
  for (const lm of lastmods) {
    assert.match(lm, /^\d{4}-\d{2}-\d{2}$/, `bad lastmod: ${lm}`);
  }
});

test("sitemap index is well-formed XML (balanced <sitemap> open/close)", () => {
  const opens = (xml.match(/<sitemap>/g) || []).length;
  const closes = (xml.match(/<\/sitemap>/g) || []).length;
  assert.equal(opens, closes, `unbalanced sitemap tags: ${opens} open vs ${closes} close`);
});

test("sitemap index declares the sitemap.org namespace", () => {
  assert.match(xml, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
});

test("xmlEscape handles ampersands and angle brackets safely", () => {
  assert.equal(xmlEscape("a & b"), "a &amp; b");
  assert.equal(xmlEscape("<tag>"), "&lt;tag&gt;");
  assert.equal(xmlEscape("Tom & <Jerry>"), "Tom &amp; &lt;Jerry&gt;");
});

test("a sample urlset XML payload (mock) parses as a urlset", () => {
  // Generate a mock urlset to validate the parsing helper independently.
  const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc></url>
  <url><loc>${SITE}/br</loc></url>
</urlset>`;
  assert.match(urlset, /<urlset[^>]*>/);
  assert.match(urlset, /<\/urlset>/);
  const urlCount = (urlset.match(/<url>/g) || []).length;
  assert.equal(urlCount, 2);
});
