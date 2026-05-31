// Unit tests for COUNTRIES catalog data integrity (deeper than countries.test.mjs).
//
// Covers field invariants (BCP 47 lang format, ISO 4217 currency, emoji
// flags, title brand suffix, description/intro length windows) and global
// uniqueness invariants (every htmlLang and code distinct). Drift here =
// SEO drift across the per-country sitemap.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  COUNTRIES,
  getCountry,
  countriesByRegion,
} from "../../src/i18n/countries.ts";

const VALID_REGIONS = new Set([
  "americas", "sepa", "asia", "africa", "oceania", "europe_other",
]);

const REQUIRED_KEYS = [
  "code", "name", "htmlLang", "region",
  "currencyHint", "flag",
  "h1", "title", "description", "intro", "labels",
];

test("COUNTRIES has length >= 130", () => {
  assert.ok(COUNTRIES.length >= 130, `got ${COUNTRIES.length}`);
});

test("every country has all required keys", () => {
  for (const c of COUNTRIES) {
    for (const k of REQUIRED_KEYS) {
      assert.ok(
        c[k] !== undefined && c[k] !== null && c[k] !== "",
        `country ${c.code} missing key '${k}'`
      );
    }
  }
});

test("all country.code values are unique", () => {
  const seen = new Set();
  for (const c of COUNTRIES) {
    assert.ok(!seen.has(c.code), `duplicate code: ${c.code}`);
    seen.add(c.code);
  }
});

test("all country.code are 2 lowercase letters", () => {
  for (const c of COUNTRIES) {
    assert.match(c.code, /^[a-z]{2}$/, `bad code: ${c.code}`);
  }
});

test("all country.htmlLang follow BCP 47 (e.g., pt-BR, ru-KZ)", () => {
  // Accepts xx, xx-YY (Google tolerates both; our catalog uses xx-YY everywhere).
  for (const c of COUNTRIES) {
    assert.match(
      c.htmlLang,
      /^[a-z]{2}(-[A-Z]{2})?$/i,
      `country ${c.code} bad htmlLang: ${c.htmlLang}`
    );
  }
});

test("all country.htmlLang are unique", () => {
  const seen = new Set();
  for (const c of COUNTRIES) {
    assert.ok(
      !seen.has(c.htmlLang),
      `duplicate htmlLang: ${c.htmlLang} (country ${c.code})`
    );
    seen.add(c.htmlLang);
  }
});

test("all country.flag is a 4-8 char emoji string (regional indicators)", () => {
  for (const c of COUNTRIES) {
    assert.ok(
      c.flag.length >= 4 && c.flag.length <= 8,
      `country ${c.code} flag length=${c.flag.length} (${c.flag})`
    );
  }
});

test("every country.h1 is non-empty", () => {
  for (const c of COUNTRIES) {
    assert.ok(c.h1 && c.h1.length > 0, `country ${c.code} h1 empty`);
  }
});

test("every country.title contains '| Viralefy'", () => {
  for (const c of COUNTRIES) {
    assert.ok(
      c.title.includes("| Viralefy"),
      `country ${c.code} title missing '| Viralefy': ${c.title}`
    );
  }
});

test("every country.description length is between 50 and 200 chars", () => {
  for (const c of COUNTRIES) {
    const len = c.description.length;
    assert.ok(
      len >= 50 && len <= 200,
      `country ${c.code} description length=${len} out of [50,200]`
    );
  }
});

test("every country.intro length is between 30 and 200 chars", () => {
  for (const c of COUNTRIES) {
    const len = c.intro.length;
    assert.ok(
      len >= 30 && len <= 200,
      `country ${c.code} intro length=${len} out of [30,200]`
    );
  }
});

test("every country.currencyHint is a 3-letter ISO 4217 code", () => {
  for (const c of COUNTRIES) {
    assert.match(
      c.currencyHint,
      /^[A-Z]{3}$/,
      `country ${c.code} bad currencyHint: ${c.currencyHint}`
    );
  }
});

test("every region is in the valid Region enum", () => {
  for (const c of COUNTRIES) {
    assert.ok(
      VALID_REGIONS.has(c.region),
      `country ${c.code} unknown region: ${c.region}`
    );
  }
});

test("countriesByRegion('americas') returns >= 20 countries, sorted by name, region=americas", () => {
  const list = countriesByRegion("americas");
  assert.ok(list.length >= 20, `americas count=${list.length}`);
  for (const c of list) assert.equal(c.region, "americas");
  const names = list.map((c) => c.name);
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(names, sorted, "americas not sorted by name");
});

test("countriesByRegion for each region returns a sorted list", () => {
  for (const region of VALID_REGIONS) {
    const list = countriesByRegion(region);
    for (const c of list) assert.equal(c.region, region);
    const names = list.map((c) => c.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    assert.deepEqual(names, sorted, `${region} not sorted`);
  }
});

test("getCountry handles uppercase input ('BR' -> br entry)", () => {
  const upper = getCountry("BR");
  assert.ok(upper, "getCountry('BR') returned undefined");
  assert.equal(upper.code, "br");
  const mixed = getCountry("Br");
  assert.ok(mixed);
  assert.equal(mixed.code, "br");
});

test("every region has at least one country (no orphan region)", () => {
  for (const region of VALID_REGIONS) {
    const list = countriesByRegion(region);
    assert.ok(list.length >= 1, `region ${region} has no country`);
  }
});

test("no country.h1 contains TODO/FIXME/XXX placeholders", () => {
  for (const c of COUNTRIES) {
    assert.ok(!/TODO|FIXME|XXX/i.test(c.h1), `placeholder in h1 of ${c.code}`);
    assert.ok(!/TODO|FIXME|XXX/i.test(c.title), `placeholder in title of ${c.code}`);
  }
});
