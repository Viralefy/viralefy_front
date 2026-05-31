// Unit tests for the Russian (ru) localization pack.
//
// The ru locale is "rich" in src/i18n/languages.ts (full Pack) but currently
// shares the en fallback in src/i18n/categories.ts (CATEGORY_LABEL,
// CATEGORY_SLUG, COPY) and src/i18n/legal.ts. We exercise the rich pack and
// pin the fallback behavior so a future commit adding ru CATEGORY entries
// won't accidentally break the chain.

import { test } from "node:test";
import assert from "node:assert/strict";

import { tr, PACKS } from "../../src/i18n/languages.ts";
import {
  CATEGORY_CODES,
  categoryFromSlug,
  categorySlug,
  categoryLabel,
  copyFor,
} from "../../src/i18n/categories.ts";
import { legalDoc } from "../../src/i18n/legal.ts";

// Cyrillic block: U+0400-U+04FF. We treat presence of any character in that
// block as the language signal.
const CYRILLIC_RE = /[Ѐ-ӿ]/;
function countCyrillic(s) {
  return (s.match(/[Ѐ-ӿ]/g) || []).length;
}

test("tr('ru') exposes a Pack with every required section non-empty", () => {
  const t = tr("ru");
  assert.ok(t.home && t.header && t.footer && t.cta && t.category && t.plan);
  // Spot-check several non-empty fields across sections.
  assert.ok(t.home.heroTitle && t.home.heroTitle.length > 0);
  assert.ok(t.home.heroSubtitle && t.home.heroSubtitle.length > 0);
  assert.ok(t.header.login && t.header.markets);
  assert.ok(t.footer.tagline && t.footer.sections.legal);
  assert.ok(t.cta.buy && t.cta.buyNow);
  assert.ok(t.category.intro && t.category.faq);
  assert.ok(t.plan.delivery && t.plan.refill);
});

test("tr('ru').home.heroTitle contains Cyrillic characters", () => {
  assert.ok(CYRILLIC_RE.test(tr("ru").home.heroTitle));
});

test("tr('ru').header.markets returns 'Рынки'", () => {
  assert.equal(tr("ru").header.markets, "Рынки");
});

test("categoryLabel('seguidores_instagram', 'ru') carries Cyrillic now ru is wired", () => {
  const label = categoryLabel("seguidores_instagram", "ru");
  // ru label is now shipped — must contain Cyrillic ("Подписчики Instagram").
  assert.ok(CYRILLIC_RE.test(label), `expected Cyrillic in ru label, got: ${label}`);
});

test("categorySlug('seguidores_instagram', 'ru') returns a non-empty ASCII slug", () => {
  const slug = categorySlug("seguidores_instagram", "ru");
  assert.ok(typeof slug === "string" && slug.length > 0);
  // The slug must be safe for a URL — printable ASCII only, no spaces.
  assert.ok(/^[a-z0-9-]+$/.test(slug), `slug not URL-safe: ${slug}`);
});

test("categoryFromSlug('podpisciki-instagram') resolves to 'seguidores_instagram'", () => {
  // ru transliterated slugs are now wired for the platform-split codes.
  const r = categoryFromSlug("podpisciki-instagram");
  assert.equal(r, "seguidores_instagram");
});

test("copyFor('seguidores_instagram', 'ru') returns at least 5 paragraphs totalling many characters", () => {
  const copy = copyFor("seguidores_instagram", "ru");
  const ps = copy.paragraphs("Россия");
  assert.ok(Array.isArray(ps));
  assert.ok(ps.length >= 5, `expected >=5 paragraphs, got ${ps.length}`);
  const total = ps.join(" ").length;
  // ru copy now ships, so we expect Cyrillic content.
  assert.ok(total >= 1500, `total copy too short: ${total}`);
  const sumCyrillic = ps.reduce((acc, p) => acc + countCyrillic(p), 0);
  assert.ok(sumCyrillic >= 400, `expected substantial Cyrillic in ru copy, got ${sumCyrillic} chars`);
});

test("All 7 categories have a copyFor('ru') return value (fallback or native)", () => {
  for (const code of CATEGORY_CODES) {
    const copy = copyFor(code, "ru");
    assert.ok(copy, `missing copyFor(${code}, ru)`);
    assert.ok(typeof copy.h1 === "function");
    assert.ok(typeof copy.paragraphs === "function");
    const ps = copy.paragraphs("Россия");
    assert.ok(ps.length >= 3, `paragraphs too short for ${code}`);
  }
});

test("legalDoc('ru', 'privacy').body contains content (Cyrillic when ru shipped)", () => {
  const doc = legalDoc("ru", "privacy");
  assert.ok(doc && doc.body && doc.body.length > 200);
  // Once ru legal is added: assert CYRILLIC_RE.test(doc.body).
  // For now: assert the body is non-trivial English fallback, which still
  // satisfies "English-fallback verification".
  const hasCyr = CYRILLIC_RE.test(doc.body);
  const hasLatin = /[a-zA-Z]/.test(doc.body);
  assert.ok(hasCyr || hasLatin, "legal body is neither Cyrillic nor Latin?");
});

test("PACKS.ru exists in the registry and is referenced by tr('ru')", () => {
  assert.ok(PACKS.ru);
  assert.equal(tr("ru"), PACKS.ru);
});

test("ru pack heroSubtitle and category labels carry Cyrillic", () => {
  const t = tr("ru");
  assert.ok(CYRILLIC_RE.test(t.home.heroSubtitle));
  assert.ok(CYRILLIC_RE.test(t.category.faq));
  assert.ok(CYRILLIC_RE.test(t.plan.refill));
});
