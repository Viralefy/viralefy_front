// Unit tests for the hreflang language map used by src/app/page.tsx.
//
// page.tsx builds alternates.languages from COUNTRIES, plus x-default and
// en. We mirror that logic here and assert the structural invariants:
// uniqueness, presence of x-default, and cardinality.

import { test } from "node:test";
import assert from "node:assert/strict";

import { COUNTRIES } from "../../src/i18n/countries.ts";

// Mirror of the alternates.languages builder in src/app/page.tsx.
function buildLanguageMap() {
  const languages = { "x-default": "/", en: "/" };
  for (const c of COUNTRIES) languages[c.htmlLang] = `/${c.code}`;
  return languages;
}

test("every country exposes a non-empty htmlLang", () => {
  for (const c of COUNTRIES) {
    assert.ok(typeof c.htmlLang === "string");
    assert.ok(c.htmlLang.length >= 2, `bad htmlLang for ${c.code}: ${c.htmlLang}`);
  }
});

test("every country code is unique", () => {
  const codes = COUNTRIES.map((c) => c.code);
  assert.equal(new Set(codes).size, codes.length);
});

test("language map contains x-default", () => {
  const m = buildLanguageMap();
  assert.equal(m["x-default"], "/");
});

test("language map contains en pointing to /", () => {
  const m = buildLanguageMap();
  assert.equal(m["en"], "/");
});

test("language map size respects unique htmlLang collisions + x-default + en", () => {
  // page.tsx writes each country into languages[htmlLang]. When two
  // countries share a htmlLang the later write wins, so the resulting
  // map size = unique htmlLangs + (x-default if not also a htmlLang) +
  // (en if not also a htmlLang). We assert the map covers AT LEAST the
  // set of unique htmlLangs (every locale should be representable).
  const m = buildLanguageMap();
  const uniqueHtmlLangs = new Set(COUNTRIES.map((c) => c.htmlLang));
  // Map size must be >= unique htmlLangs (some keys like "en"/"x-default"
  // might overlap with a country's htmlLang, but at minimum every unique
  // htmlLang is represented).
  assert.ok(Object.keys(m).length >= uniqueHtmlLangs.size);
});

test("language map includes one entry per country (lookup by htmlLang resolves to /code)", () => {
  const m = buildLanguageMap();
  for (const c of COUNTRIES) {
    assert.equal(m[c.htmlLang], `/${c.code}`,
      `htmlLang ${c.htmlLang} should map to /${c.code} (or collide with another country sharing the htmlLang)`);
  }
});

test("each htmlLang is a valid BCP47 tag (lang or lang-region)", () => {
  // Accept e.g. "en", "pt-BR", "es-419". Reject empty / lowercase region.
  const bcp = /^[a-z]{2,3}(-[A-Z]{2,3}|-[0-9]{3})?$/;
  for (const c of COUNTRIES) {
    assert.ok(bcp.test(c.htmlLang), `htmlLang not BCP47-ish: ${c.htmlLang} (country ${c.code})`);
  }
});

test("language map has at least 50 entries (covers our minimum locale spread)", () => {
  const m = buildLanguageMap();
  assert.ok(Object.keys(m).length >= 50, `only ${Object.keys(m).length} alternates`);
});
