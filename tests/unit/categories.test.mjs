// Unit tests for the category slug/label/copy helpers.
//
// We import the .ts module directly — Node 25+ strips TypeScript types at
// load time (no flag needed; --experimental-strip-types is harmless if set).
// The path is absolute relative to the repo so it works no matter where the
// test runner is invoked from.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CATEGORY_CODES,
  categoryFromSlug,
  categorySlug,
  categoryLabel,
  copyFor,
} from "../../src/i18n/categories.ts";

test("CATEGORY_CODES expõe 15 códigos (storefront + marketplace + recovery)", () => {
  // 11 storefront + 4 marketplace/recovery: recuperacao_perfil (LP custom
  // com formulário), bms_facebook, perfis_redes, emails_validados.
  assert.deepEqual(CATEGORY_CODES, [
    "seguidores_instagram",
    "seguidores_tiktok",
    "curtidas_instagram",
    "curtidas_tiktok",
    "comentarios_instagram",
    "comentarios_tiktok",
    "compartilhamentos_instagram",
    "compartilhamentos_tiktok",
    "visualizacoes_instagram",
    "visualizacoes_tiktok",
    "servicos",
    "recuperacao_perfil",
    "bms_facebook",
    "perfis_redes",
    "emails_validados",
  ]);
});

test("categoryFromSlug resolves Portuguese Instagram followers slug", () => {
  assert.equal(categoryFromSlug("seguidores-instagram"), "seguidores_instagram");
});

test("categoryFromSlug resolves English Instagram followers slug", () => {
  assert.equal(categoryFromSlug("instagram-followers"), "seguidores_instagram");
});

test("categoryFromSlug resolves French Instagram followers slug", () => {
  assert.equal(categoryFromSlug("abonnes-instagram"), "seguidores_instagram");
});

test("categoryFromSlug resolves TikTok followers slug", () => {
  assert.equal(categoryFromSlug("tiktok-followers"), "seguidores_tiktok");
});

test("categoryFromSlug is case-insensitive", () => {
  assert.equal(categoryFromSlug("Instagram-FoLLowErs"), "seguidores_instagram");
});

test("categoryFromSlug returns undefined for unknown slug", () => {
  assert.equal(categoryFromSlug("nonexistent"), undefined);
});

test("categoryFromSlug maps 'instagram-likes' to curtidas_instagram", () => {
  assert.equal(categoryFromSlug("instagram-likes"), "curtidas_instagram");
});

test("categoryFromSlug maps 'tiktok-likes' to curtidas_tiktok", () => {
  assert.equal(categoryFromSlug("tiktok-likes"), "curtidas_tiktok");
});

test("categoryFromSlug maps comments/shares slugs to the right codes", () => {
  assert.equal(categoryFromSlug("instagram-comments"), "comentarios_instagram");
  assert.equal(categoryFromSlug("comentarios-tiktok"), "comentarios_tiktok");
  assert.equal(categoryFromSlug("instagram-shares"), "compartilhamentos_instagram");
  assert.equal(categoryFromSlug("partages-tiktok"), "compartilhamentos_tiktok");
});

test("categoryFromSlug maps 'services' to servicos", () => {
  assert.equal(categoryFromSlug("services"), "servicos");
});

test("categorySlug returns the PT Instagram followers slug", () => {
  assert.equal(categorySlug("seguidores_instagram", "pt"), "seguidores-instagram");
});

test("categorySlug returns the EN Instagram followers slug", () => {
  assert.equal(categorySlug("seguidores_instagram", "en"), "instagram-followers");
});

test("categorySlug falls back to EN for languages without an explicit slug", () => {
  // ja (Japanese) has no explicit slug in CATEGORY_SLUG for seguidores_instagram.
  assert.equal(categorySlug("seguidores_instagram", "ja"), "instagram-followers");
});

test("categorySlug returns FR slug for curtidas_instagram", () => {
  assert.equal(categorySlug("curtidas_instagram", "fr"), "likes-instagram");
});

test("categoryLabel returns German label", () => {
  assert.equal(categoryLabel("seguidores_instagram", "de"), "Instagram Follower");
});

test("categoryLabel returns French label", () => {
  assert.equal(categoryLabel("seguidores_instagram", "fr"), "Abonnés Instagram");
});

test("categoryLabel falls back to EN when missing", () => {
  // pl (Polish) has no rich label for seguidores_instagram — falls back to EN.
  assert.equal(categoryLabel("seguidores_instagram", "pl"), "Instagram followers");
});

test("copyFor returns LongCopy with callable paragraphs", () => {
  const copy = copyFor("seguidores_instagram", "en");
  assert.ok(typeof copy.h1 === "function");
  assert.ok(typeof copy.paragraphs === "function");
  const ps = copy.paragraphs("United States");
  assert.ok(Array.isArray(ps));
  assert.ok(ps.length >= 3, "expected several paragraphs");
  for (const p of ps) {
    assert.ok(typeof p === "string");
    assert.ok(p.length > 50, "paragraphs should be sentences, not fragments");
  }
});

test("copyFor falls back to English when language is unknown", () => {
  const enCopy = copyFor("seguidores_instagram", "en");
  const jaCopy = copyFor("seguidores_instagram", "ja");
  assert.equal(jaCopy.h1("Japan"), enCopy.h1("Japan"));
});

test("copyFor h1 interpolates country name", () => {
  const copy = copyFor("seguidores_instagram", "pt");
  const h1 = copy.h1("Brasil");
  assert.ok(h1.includes("Brasil"), `expected h1 to mention Brasil, got: ${h1}`);
});

test("copyFor returns bullets and faq for every category", () => {
  for (const code of CATEGORY_CODES) {
    const copy = copyFor(code, "en");
    const bullets = copy.bullets();
    const faq = copy.faq();
    assert.ok(bullets.length >= 3, `bullets too short for ${code}`);
    assert.ok(faq.length >= 3, `faq too short for ${code}`);
    for (const f of faq) {
      assert.ok(f.q && f.a, `incomplete faq item in ${code}`);
    }
  }
});

test("Instagram and TikTok variants share the same copy", () => {
  // Platform-split codes intentionally reuse the same LongCopy bundle.
  const igFollowers = copyFor("seguidores_instagram", "en");
  const ttFollowers = copyFor("seguidores_tiktok", "en");
  assert.equal(igFollowers, ttFollowers);
});
