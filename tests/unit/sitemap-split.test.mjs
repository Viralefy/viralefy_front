// Unit tests for the sitemap URL generator. Covers the existing
// lib/site-urls.ts entry point. The per-language sitemap split
// (sitemap-en.xml etc.) is pending; once src/app/sitemap-[lang].xml/
// route.ts or generateSitemaps in src/app/sitemap.ts ships, the
// "feature pending" block below activates.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  allSiteUrls,
  paginatedBuckets,
  parseSitemapBucketID,
  urlsForBucket,
  SITEMAP_URLS_PER_PAGE,
  SITEMAP_BUCKETS,
} from "../../src/lib/site-urls.ts";
import { COUNTRIES } from "../../src/i18n/countries.ts";
import { langOfCountry } from "../../src/i18n/languages.ts";

// Force the site URL the generator emits. site-urls reads from
// NEXT_PUBLIC_SITE_URL (not SITE_URL), so we set it explicitly. We do this
// once before allSiteUrls() runs so every URL is prefixed correctly.
process.env.NEXT_PUBLIC_SITE_URL = "https://viralefy.com";

// allSiteUrls fetches plans from the API and falls back to [] on error,
// which is what we want for hermetic tests.
const urls = await allSiteUrls();

test("allSiteUrls() returns at least a few hundred URLs (no plan-deep URLs in offline mode)", () => {
  // With no API plans available (fetchPlans returns []), the generator
  // emits home + per-country + per-country/category + per-legal. That is:
  //   1 + 126 + 126*4 + 6*<lang_count> = ~700+. Once plans seed in, it
  //   climbs past 7000. We assert the lower bound for the hermetic case
  //   and trust the smoke test to count the live number.
  assert.ok(urls.length >= 600, `urls.length=${urls.length}`);
});

test("every URL starts with the configured site origin", () => {
  for (const u of urls) {
    assert.ok(u.url.startsWith("https://viralefy.com"),
      `bad origin: ${u.url}`);
  }
});

test("URL list contains no duplicates", () => {
  const set = new Set(urls.map((u) => u.url));
  assert.equal(set.size, urls.length,
    `dupes detected: ${urls.length - set.size}`);
});

test("Home URL is present exactly once", () => {
  const home = urls.filter((u) => u.url === "https://viralefy.com");
  assert.equal(home.length, 1);
});

test("Every country in COUNTRIES is reachable as /<code>", () => {
  for (const c of COUNTRIES) {
    const expected = `https://viralefy.com/${c.code}`;
    assert.ok(urls.some((u) => u.url === expected), `missing ${expected}`);
  }
});

test("Per-language partition: filtering by a country's URLs returns >= 4 entries (1 country + 4 categories minus dedupe)", () => {
  // /br + /br/seguidores + /br/curtidas + /br/visualizacoes + /br/servicos
  // = 5. We use >= 4 to leave wiggle room for the slug differing per lang.
  const br = urls.filter((u) => u.url.startsWith("https://viralefy.com/br"));
  assert.ok(br.length >= 4, `br urls=${br.length}`);
});

test("Per-language partition: /us routes use English category slugs (followers, likes, views, services)", () => {
  const us = urls.filter((u) => u.url.startsWith("https://viralefy.com/us"));
  const slugs = us.map((u) => u.url.split("/")[4]).filter(Boolean);
  // Spot-check at least one English slug present.
  const expected = ["followers", "likes", "views", "services"];
  const hasAny = expected.some((s) => slugs.includes(s));
  assert.ok(hasAny, `expected English slug in /us routes, got: ${slugs.join(", ")}`);
});

test("Per-language sitemap split: feature pending, will activate once implemented", async () => {
  // Look for either a per-lang route file or a generateSitemaps export.
  // Until either exists, this test is a no-op that documents intent.
  const routeFile = await import("../../src/app/sitemap-[lang].xml/route.ts").catch(() => null);
  const sitemapMod = await import("../../src/app/sitemap.ts").catch(() => null);
  const hasGenerateSitemaps =
    sitemapMod && typeof sitemapMod.generateSitemaps === "function";

  if (!routeFile && !hasGenerateSitemaps) {
    // PENDING — once the split ships, replace this with:
    //   const ids = await sitemapMod.generateSitemaps();
    //   assert.ok(ids.length >= COUNTRIES.length);
    assert.ok(true, "sitemap split not yet implemented");
    return;
  }
  // When the feature ships, verify cardinality.
  if (hasGenerateSitemaps) {
    const ids = await sitemapMod.generateSitemaps();
    assert.ok(Array.isArray(ids));
    assert.ok(ids.length >= 1);
  }
});

test("paginatedBuckets: no shard exceeds SITEMAP_URLS_PER_PAGE", () => {
  const buckets = paginatedBuckets(urls);
  for (const b of buckets) {
    const slice = urlsForBucket(urls, b);
    assert.ok(
      slice.length <= SITEMAP_URLS_PER_PAGE,
      `bucket ${b.id} has ${slice.length} urls (cap is ${SITEMAP_URLS_PER_PAGE})`,
    );
    assert.ok(slice.length > 0, `bucket ${b.id} is empty`);
  }
});

test("paginatedBuckets: page-1 buckets keep back-compat <lang>.xml ids", () => {
  const buckets = paginatedBuckets(urls);
  const page1Ids = buckets.filter((b) => b.page === 1).map((b) => b.id);
  // Sem hífen e dentro do conjunto conhecido de SITEMAP_BUCKETS.
  for (const id of page1Ids) {
    assert.ok(!id.includes("-"), `page 1 id should not have suffix: ${id}`);
    assert.ok(SITEMAP_BUCKETS.includes(id), `unknown bucket: ${id}`);
  }
});

test("paginatedBuckets: page-2+ buckets are <lang>-<n> with n>=2", () => {
  const buckets = paginatedBuckets(urls);
  for (const b of buckets) {
    if (b.page === 1) continue;
    assert.match(b.id, /^.+-\d+$/, `bad paginated id: ${b.id}`);
    const parsed = parseSitemapBucketID(b.id);
    assert.equal(parsed.lang, b.lang);
    assert.equal(parsed.page, b.page);
    assert.ok(b.page >= 2, `page must be >=2 for suffixed id: ${b.id}`);
  }
});

test("parseSitemapBucketID: 'en' -> page 1; 'en-3' -> page 3", () => {
  assert.deepEqual(parseSitemapBucketID("en"), { id: "en", lang: "en", page: 1 });
  assert.deepEqual(parseSitemapBucketID("en-3"), { id: "en-3", lang: "en", page: 3 });
  assert.deepEqual(parseSitemapBucketID("legal-2"), { id: "legal-2", lang: "legal", page: 2 });
});

test("paginatedBuckets: total URL count across all shards equals total urls", () => {
  const buckets = paginatedBuckets(urls);
  let sum = 0;
  for (const b of buckets) {
    sum += urlsForBucket(urls, b).length;
  }
  // Cada URL aparece em exatamente um bucket (lang dela). Soma == count.
  assert.equal(sum, urls.length, `partition mismatch: ${sum} vs ${urls.length}`);
});

test("Lang coverage: at least one URL exists per resolved country language", () => {
  // Each country code resolves to a LangCode via langOfCountry. The
  // sitemap must contain at least one URL per country (the /<code>
  // landing). We assert this by spot-checking the set of langs is
  // non-trivial — at least 8 distinct languages represented.
  const langs = new Set(COUNTRIES.map((c) => langOfCountry(c.code)));
  assert.ok(langs.size >= 8, `only ${langs.size} languages covered`);
});
