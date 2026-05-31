// Unit tests for site URL generator integrity (deeper than sitemap-split).
//
// site-urls.ts powers the sitemap and feeds IndexNow. Any drift in URL
// origin, dedup, lang partitioning, or priority/changeFrequency values
// silently degrades crawler coverage. These tests pin the contract.
//
// NOTE: when running hermetically (no API), fetchPlans() returns []
// inside site-urls.ts, so the URL count is much lower than the live
// production value. We assert the OFFLINE lower bound here and let
// the smoke tests assert the LIVE upper bound.

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SITE_URL = "https://viralefy.com";

import {
  allSiteUrls,
  urlsForLang,
  SITEMAP_BUCKETS,
} from "../../src/lib/site-urls.ts";
import { COUNTRIES } from "../../src/i18n/countries.ts";
import { PACKS } from "../../src/i18n/languages.ts";
import { LEGAL_SLUGS } from "../../src/i18n/legal.ts";

const SITE = "https://viralefy.com";
const urls = await allSiteUrls();

const VALID_FREQ = new Set([
  "always", "hourly", "daily", "weekly", "monthly", "yearly", "never",
]);

test("allSiteUrls() returns at minimum (1 home + 130 countries + 4 categories + legals) URLs", () => {
  // Lower bound with no plans seeded in the API:
  //   1 home + 130 countries + 130*4 categories + 6 legal_slugs * |PACKS|
  // = 1 + 130 + 520 + 6*47 ≈ 933.
  // With plans seeded in prod the count climbs to ~10k+. We pin the
  // hermetic offline floor and let smoke tests verify the live ceiling.
  assert.ok(urls.length >= 900, `urls.length=${urls.length}`);
});

test("every SiteUrl.url is a valid URL string", () => {
  for (const u of urls) {
    assert.equal(typeof u.url, "string");
    let parsed;
    try { parsed = new URL(u.url); } catch { /* fall through */ }
    assert.ok(parsed, `not a valid URL: ${u.url}`);
  }
});

test("every SiteUrl.url starts with the SITE_URL prefix", () => {
  for (const u of urls) {
    assert.ok(u.url.startsWith(SITE), `bad prefix: ${u.url}`);
  }
});

test("every SiteUrl.lang is a known LangCode or 'legal'", () => {
  const known = new Set([...Object.keys(PACKS), "legal"]);
  for (const u of urls) {
    assert.ok(known.has(u.lang), `unknown lang: ${u.lang} on ${u.url}`);
  }
});

test("urlsForLang('en', all) returns >= 1 URL", () => {
  const en = urlsForLang(urls, "en");
  assert.ok(en.length >= 1, `en URLs=${en.length}`);
});

test("urlsForLang('ru', all) returns >= 1 URL (ru countries are in catalog)", () => {
  const ru = urlsForLang(urls, "ru");
  assert.ok(ru.length >= 1, `ru URLs=${ru.length}`);
});

test("urlsForLang('legal', all) returns 6 * |PACKS| URLs", () => {
  const legal = urlsForLang(urls, "legal");
  const expected = LEGAL_SLUGS.length * Object.keys(PACKS).length;
  assert.equal(legal.length, expected, `legal count ${legal.length} != ${expected}`);
});

test("no duplicate URLs across allSiteUrls() output", () => {
  const set = new Set(urls.map((u) => u.url));
  assert.equal(set.size, urls.length, `dupes: ${urls.length - set.size}`);
});

test("every priority is in [0.0, 1.0]", () => {
  for (const u of urls) {
    assert.equal(typeof u.priority, "number");
    assert.ok(u.priority >= 0 && u.priority <= 1, `priority out of range: ${u.priority}`);
  }
});

test("changeFrequency values are within the valid sitemap.org enum", () => {
  for (const u of urls) {
    assert.ok(VALID_FREQ.has(u.changeFrequency), `bad freq ${u.changeFrequency}`);
  }
});

test("SITEMAP_BUCKETS includes 'en', 'pt', 'ru', 'legal' at minimum", () => {
  for (const need of ["en", "pt", "ru", "legal"]) {
    assert.ok(SITEMAP_BUCKETS.includes(need), `bucket missing: ${need}`);
  }
});

test("home URL has priority 1.0", () => {
  const home = urls.find((u) => u.url === SITE);
  assert.ok(home);
  assert.equal(home.priority, 1.0);
});

test("every country has a country-landing URL /<code>", () => {
  for (const c of COUNTRIES) {
    const expected = `${SITE}/${c.code}`;
    assert.ok(urls.some((u) => u.url === expected), `missing ${expected}`);
  }
});

test("every bucket in SITEMAP_BUCKETS is a valid lang or 'legal'", () => {
  const valid = new Set([...Object.keys(PACKS), "legal"]);
  for (const b of SITEMAP_BUCKETS) {
    assert.ok(valid.has(b), `bucket not in PACKS or 'legal': ${b}`);
  }
});
