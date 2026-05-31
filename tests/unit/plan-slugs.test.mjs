// Unit tests for category slug correctness and fallback behavior.
//
// Each (category, lang) pair produces a slug used in URLs. Slugs must be
// URL-safe and stable, slugs in non-English languages must be ASCII (no
// diacritics), and falling back to `en` when a lang has no slug is the
// expected behavior. Drift breaks routing.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CATEGORY_CODES,
  CATEGORY_LABEL,
  CATEGORY_SLUG,
  COPY,
  categoryFromSlug,
  categoryLabel,
  categorySlug,
} from "../../src/i18n/categories.ts";

const URL_SAFE = /^[a-z0-9-]+$/;

test("categorySlug(code, 'en') returns ASCII (no diacritics)", () => {
  for (const code of CATEGORY_CODES) {
    const slug = categorySlug(code, "en");
    // ASCII only.
    assert.match(slug, /^[\x00-\x7F]+$/, `non-ASCII en slug for ${code}: ${slug}`);
    // No diacritics (NFD-normalized has no combining marks).
    const nfd = slug.normalize("NFD");
    assert.equal(nfd, slug, `diacritic in en slug for ${code}: ${slug}`);
  }
});

test("every (CategoryCode x LangCode) slug is URL-safe", () => {
  for (const code of CATEGORY_CODES) {
    for (const lang of Object.keys(CATEGORY_SLUG[code])) {
      const slug = CATEGORY_SLUG[code][lang];
      assert.match(slug, URL_SAFE, `bad slug ${code}/${lang}: '${slug}'`);
    }
  }
});

test("categoryFromSlug('podpisciki-instagram') === 'seguidores_instagram'", () => {
  assert.equal(categoryFromSlug("podpisciki-instagram"), "seguidores_instagram");
});

test("categoryFromSlug('lajki-tiktok') === 'curtidas_tiktok'", () => {
  assert.equal(categoryFromSlug("lajki-tiktok"), "curtidas_tiktok");
});

test("categoryFromSlug resolves comments/shares slugs to the new codes", () => {
  assert.equal(categoryFromSlug("instagram-comments"), "comentarios_instagram");
  assert.equal(categoryFromSlug("comentarios-instagram"), "comentarios_instagram");
  assert.equal(categoryFromSlug("tiktok-shares"), "compartilhamentos_tiktok");
  assert.equal(categoryFromSlug("partages-instagram"), "compartilhamentos_instagram");
});

test("categoryFromSlug('prosmotry-instagram') === 'visualizacoes_instagram'", () => {
  assert.equal(categoryFromSlug("prosmotry-instagram"), "visualizacoes_instagram");
});

test("categoryFromSlug('uslugi') === 'servicos'", () => {
  assert.equal(categoryFromSlug("uslugi"), "servicos");
});

test("categoryFromSlug returns undefined for nonsense", () => {
  assert.equal(categoryFromSlug("nonsensexyz123"), undefined);
  assert.equal(categoryFromSlug(""), undefined);
  assert.equal(categoryFromSlug("--"), undefined);
});

test("categoryLabel falls back to en when a lang has no entry", () => {
  // Polish ("pl") has no rich label for curtidas_instagram — falls back to en.
  const label = categoryLabel("curtidas_instagram", "pl");
  assert.equal(label, CATEGORY_LABEL.curtidas_instagram.en);
});

test("categorySlug falls back to en when a lang has no entry", () => {
  // Japanese has no curtidas_instagram slug — falls back to the en slug.
  const slug = categorySlug("curtidas_instagram", "ja");
  assert.equal(slug, CATEGORY_SLUG.curtidas_instagram.en);
});

test("COPY map has at least en/pt/es/ru entries for every category", () => {
  for (const code of CATEGORY_CODES) {
    for (const lang of ["en", "pt", "es", "ru"]) {
      assert.ok(
        COPY[code][lang],
        `COPY[${code}][${lang}] missing`
      );
    }
  }
});

test("categoryFromSlug is case-insensitive on input", () => {
  assert.equal(categoryFromSlug("Podpisciki-Instagram"), "seguidores_instagram");
  assert.equal(categoryFromSlug("USLUGI"), "servicos");
});

test("categorySlug roundtrips through categoryFromSlug", () => {
  // For each defined slug, going back through categoryFromSlug must give
  // the original code.
  for (const code of CATEGORY_CODES) {
    for (const lang of Object.keys(CATEGORY_SLUG[code])) {
      const slug = CATEGORY_SLUG[code][lang];
      assert.equal(
        categoryFromSlug(slug),
        code,
        `slug '${slug}' (${lang}) did not resolve back to ${code}`
      );
    }
  }
});

test("CATEGORY_LABEL has at least en/pt/es/ru entries for every category", () => {
  for (const code of CATEGORY_CODES) {
    for (const lang of ["en", "pt", "es", "ru"]) {
      const label = CATEGORY_LABEL[code][lang];
      assert.ok(label && label.length > 0, `${code}/${lang} label missing`);
    }
  }
});

test("CATEGORY_CODES has exactly 11 entries (engagement split by primitive)", () => {
  // Engagement foi separado em 3 primitivas (curtidas, comentarios,
  // compartilhamentos) × 2 plataformas = 6 codes. Mais 2 seguidores, 2 views
  // e servicos = 11.
  assert.equal(CATEGORY_CODES.length, 11);
  assert.deepEqual(
    [...CATEGORY_CODES].sort(),
    [
      "comentarios_instagram",
      "comentarios_tiktok",
      "compartilhamentos_instagram",
      "compartilhamentos_tiktok",
      "curtidas_instagram",
      "curtidas_tiktok",
      "seguidores_instagram",
      "seguidores_tiktok",
      "servicos",
      "visualizacoes_instagram",
      "visualizacoes_tiktok",
    ]
  );
});
