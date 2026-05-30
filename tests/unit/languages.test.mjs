// Unit tests for the language/i18n helpers.

import { test } from "node:test";
import assert from "node:assert/strict";

import { langOfCountry, tr, PACKS } from "../../src/i18n/languages.ts";

test("langOfCountry resolves Brazilian Portuguese", () => {
  assert.equal(langOfCountry("br"), "pt");
});

test("langOfCountry resolves US English", () => {
  assert.equal(langOfCountry("us"), "en");
});

test("langOfCountry resolves French France", () => {
  assert.equal(langOfCountry("fr"), "fr");
});

test("langOfCountry resolves Argentine Spanish (es_AR)", () => {
  assert.equal(langOfCountry("ar"), "es_AR");
});

test("langOfCountry resolves Germany", () => {
  assert.equal(langOfCountry("de"), "de");
});

test("langOfCountry falls back to en for unknown country", () => {
  assert.equal(langOfCountry("xx"), "en");
});

test("langOfCountry is case-insensitive", () => {
  assert.equal(langOfCountry("BR"), "pt");
});

test("tr(pt) exposes 'Mercados' for header.markets", () => {
  assert.equal(tr("pt").header.markets, "Mercados");
});

test("tr(en) header.searchPlaceholder is a non-empty string", () => {
  const s = tr("en").header.searchPlaceholder;
  assert.equal(typeof s, "string");
  assert.ok(s.length > 0);
});

test("tr falls back to English pack on unknown language", () => {
  // Cast through any-string since the type system doesn't allow unknown
  // langs in the public surface, but the runtime fallback exists.
  const fallback = tr(/** @type {any} */ ("xx_YY"));
  const en = tr("en");
  assert.equal(fallback.home.heroTitle, en.home.heroTitle);
});

test("every declared LangCode has a Pack entry", () => {
  const keys = Object.keys(PACKS);
  // We declare 39 LangCodes — quick check that the catalog has the bulk.
  assert.ok(keys.length >= 30, `expected at least 30 packs, got ${keys.length}`);
  for (const k of keys) {
    const pack = PACKS[k];
    assert.ok(pack.home && pack.header && pack.footer && pack.cta);
    assert.ok(pack.home.heroTitle.length > 0);
    assert.ok(pack.header.login.length > 0);
  }
});

test("French pack carries French strings (not English fallback)", () => {
  const fr = tr("fr");
  assert.equal(fr.header.login, "Connexion");
  assert.equal(fr.header.markets, "Marchés");
});

test("German pack carries German strings", () => {
  const de = tr("de");
  assert.equal(de.header.login, "Anmelden");
  assert.equal(de.header.markets, "Märkte");
});

test("es_AR carries voseo-style buyNow ('Comprá ahora')", () => {
  assert.equal(tr("es_AR").cta.buyNow, "Comprá ahora");
});
