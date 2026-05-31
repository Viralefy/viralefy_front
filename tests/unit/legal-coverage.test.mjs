// Unit tests for legal documents coverage and fallback behavior.

import { test } from "node:test";
import assert from "node:assert/strict";

import { legalDoc, LEGAL, LEGAL_SLUGS } from "../../src/i18n/legal.ts";
import { PACKS } from "../../src/i18n/languages.ts";

const ALL_LANGS = Object.keys(PACKS);

test("LEGAL_SLUGS contains the 6 expected slugs", () => {
  assert.deepEqual(
    [...LEGAL_SLUGS].sort(),
    ["about", "contact", "cookies", "privacy", "refund", "terms"]
  );
});

test("legalDoc('en', 'privacy') returns a non-empty body", () => {
  const d = legalDoc("en", "privacy");
  assert.ok(d);
  assert.ok(d.body && d.body.length >= 100);
});

test("legalDoc('pt', 'privacy') returns a non-empty body", () => {
  const d = legalDoc("pt", "privacy");
  assert.ok(d);
  assert.ok(d.body.length >= 100);
});

test("legalDoc('ru', 'privacy').body contains Cyrillic", () => {
  const d = legalDoc("ru", "privacy");
  assert.ok(d);
  assert.match(d.body, /[Ѐ-ӿ]/, "ru privacy missing Cyrillic");
});

test("legalDoc('ar', 'privacy') falls back to EN (no Arabic legal yet)", () => {
  // LEGAL has no `ar` key — legalDoc returns EN body.
  const d = legalDoc("ar", "privacy");
  assert.ok(d);
  assert.ok(d.body.length >= 100);
  // Sanity: same body as EN.
  assert.equal(d.body, legalDoc("en", "privacy").body);
});

test("every (lang, slug) updatedAt matches YYYY-MM-DD", () => {
  for (const lang of Object.keys(LEGAL)) {
    for (const slug of LEGAL_SLUGS) {
      const d = legalDoc(lang, slug);
      assert.match(d.updatedAt, /^\d{4}-\d{2}-\d{2}$/, `${lang}/${slug} bad date`);
    }
  }
});

test("every (lang, slug) body contains at least 2 '## ' headers", () => {
  for (const lang of Object.keys(LEGAL)) {
    for (const slug of LEGAL_SLUGS) {
      const d = legalDoc(lang, slug);
      const headers = (d.body.match(/^## /gm) || []).length;
      assert.ok(headers >= 2, `${lang}/${slug} only ${headers} h2 headers`);
    }
  }
});

test("every (lang, slug) title is non-empty", () => {
  for (const lang of Object.keys(LEGAL)) {
    for (const slug of LEGAL_SLUGS) {
      const d = legalDoc(lang, slug);
      assert.ok(d.title && d.title.length > 0, `${lang}/${slug} empty title`);
    }
  }
});

test("legalDoc(unknown_lang, slug) falls back to en (returns valid body)", () => {
  // 'xx' is not in PACKS.
  const d = legalDoc("xx", "terms");
  assert.ok(d);
  assert.ok(d.body.length >= 100);
});

test("every defined LEGAL lang has all 6 slugs", () => {
  for (const lang of Object.keys(LEGAL)) {
    for (const slug of LEGAL_SLUGS) {
      assert.ok(LEGAL[lang][slug], `${lang} missing slug ${slug}`);
    }
  }
});

test("legalDoc body strings don't contain placeholder markers", () => {
  // Use word boundaries and uppercase-only forms to avoid matching the
  // Portuguese word "Todo" (= "all").
  const placeholder = /\b(TODO|FIXME|XXX)\b|<placeholder/;
  for (const lang of Object.keys(LEGAL)) {
    for (const slug of LEGAL_SLUGS) {
      const d = legalDoc(lang, slug);
      assert.ok(!placeholder.test(d.body), `${lang}/${slug} placeholder`);
    }
  }
});

test("every legalDoc has a sane updatedAt date (not in the future, not 1970)", () => {
  const today = new Date();
  const epoch = new Date("2020-01-01T00:00:00Z");
  for (const lang of Object.keys(LEGAL)) {
    for (const slug of LEGAL_SLUGS) {
      const d = legalDoc(lang, slug);
      const dt = new Date(d.updatedAt + "T00:00:00Z");
      assert.ok(!isNaN(dt.getTime()), `${lang}/${slug} updatedAt unparseable`);
      assert.ok(dt > epoch, `${lang}/${slug} updatedAt too old`);
      // Allow up to +1 day skew for timezone vs UTC.
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      assert.ok(dt <= tomorrow, `${lang}/${slug} updatedAt in the future`);
    }
  }
});
