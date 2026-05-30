// Unit tests for the country catalog.
//
// The catalog backs every /<country> subsite. A drift here (duplicate code,
// missing field, unknown region) breaks routing or breaks the sitemap.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  COUNTRIES,
  getCountry,
  countriesByRegion,
} from "../../src/i18n/countries.ts";

const VALID_REGIONS = new Set([
  "americas",
  "sepa",
  "asia",
  "africa",
  "oceania",
  "europe_other",
]);

const REQUIRED_FIELDS = [
  "code",
  "name",
  "htmlLang",
  "region",
  "currencyHint",
  "flag",
  "h1",
  "title",
  "description",
  "intro",
  "labels",
];

const REQUIRED_LABEL_FIELDS = [
  "plansHeading",
  "ctaBuy",
  "followers",
  "backToStore",
  "otherMarkets",
];

test("COUNTRIES has reasonable cardinality (>=60)", () => {
  assert.ok(
    COUNTRIES.length >= 60,
    `expected at least 60 countries, got ${COUNTRIES.length}`
  );
});

test("every country carries all required fields", () => {
  for (const c of COUNTRIES) {
    for (const f of REQUIRED_FIELDS) {
      assert.ok(
        c[f] !== undefined && c[f] !== "",
        `country ${c.code} missing ${f}`
      );
    }
    for (const lf of REQUIRED_LABEL_FIELDS) {
      assert.ok(
        c.labels[lf] && c.labels[lf].length > 0,
        `country ${c.code} labels.${lf} missing`
      );
    }
  }
});

test("no duplicate country codes", () => {
  const seen = new Set();
  for (const c of COUNTRIES) {
    assert.ok(!seen.has(c.code), `duplicate code ${c.code}`);
    seen.add(c.code);
  }
});

test("country codes are ISO 3166-1 alpha-2 lowercase (2 chars)", () => {
  for (const c of COUNTRIES) {
    assert.match(c.code, /^[a-z]{2}$/, `invalid code: ${c.code}`);
  }
});

test("every country uses a valid region", () => {
  for (const c of COUNTRIES) {
    assert.ok(
      VALID_REGIONS.has(c.region),
      `country ${c.code} has bad region: ${c.region}`
    );
  }
});

test("every htmlLang follows BCP47 'xx-YY' shape", () => {
  for (const c of COUNTRIES) {
    assert.match(c.htmlLang, /^[a-z]{2,3}-[A-Z]{2}$/, `bad htmlLang: ${c.htmlLang}`);
  }
});

test("getCountry('br') returns the BR entry", () => {
  const br = getCountry("br");
  assert.ok(br);
  assert.equal(br.code, "br");
  assert.equal(br.region, "americas");
  assert.equal(br.currencyHint, "BRL");
});

test("getCountry is case-insensitive", () => {
  assert.ok(getCountry("BR"));
  assert.ok(getCountry("Br"));
});

test("getCountry returns undefined for unknown code", () => {
  assert.equal(getCountry("nonexistent"), undefined);
  assert.equal(getCountry("zz"), undefined);
});

test("countriesByRegion('americas') is sorted by name and only americas", () => {
  const list = countriesByRegion("americas");
  assert.ok(list.length > 10);
  for (const c of list) assert.equal(c.region, "americas");
  const names = list.map((c) => c.name);
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(names, sorted);
});

test("countriesByRegion('sepa') returns sorted SEPA countries", () => {
  const list = countriesByRegion("sepa");
  assert.ok(list.length > 10);
  for (const c of list) assert.equal(c.region, "sepa");
});

test("descriptions and intros are substantive (no placeholder TODOs)", () => {
  for (const c of COUNTRIES) {
    assert.ok(c.description.length >= 30, `short description: ${c.code}`);
    assert.ok(c.intro.length >= 30, `short intro: ${c.code}`);
    assert.ok(!/TODO|FIXME|XXX/i.test(c.description));
    assert.ok(!/TODO|FIXME|XXX/i.test(c.intro));
  }
});
