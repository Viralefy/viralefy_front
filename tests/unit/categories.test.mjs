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

test("CATEGORY_CODES expõe 12 códigos (storefront + recovery)", () => {
  // 10 storefront (5 primitivas × 2 plataformas) + servicos + recuperacao_perfil.
  // Os códigos marketplace (bms_facebook, perfis_redes, emails_validados) foram
  // planejados para uma fase posterior e ainda não estão no catálogo — quando
  // forem implementados, este assert (e os companheiros em jsonld-home, plan-slugs,
  // ru.test) precisam crescer junto.
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

test("Instagram and TikTok variants share the same base copy bundle but diverge on platform-specific FAQ", () => {
  // O BUG-179 do QA 2026-06-14 introduziu overrides por-plataforma na FAQ:
  // /br/seguidores-instagram não pode dizer "Instagram ou TikTok" na pergunta
  // (polui o sinal semântico). Logo, copyFor() devolve objetos distintos para
  // IG/TT em seguidores_* — mesmo base (h1/paragraphs/bullets), FAQ separada.
  const igFollowers = copyFor("seguidores_instagram", "en");
  const ttFollowers = copyFor("seguidores_tiktok", "en");
  // Base compartilhada: h1, paragraphs e bullets vêm da mesma função.
  assert.equal(igFollowers.h1, ttFollowers.h1);
  assert.equal(igFollowers.paragraphs, ttFollowers.paragraphs);
  assert.equal(igFollowers.bullets, ttFollowers.bullets);
  // FAQ específica de plataforma — uma menciona Instagram, a outra TikTok.
  const igFaqText = igFollowers.faq().map((f) => f.q + " " + f.a).join(" ");
  const ttFaqText = ttFollowers.faq().map((f) => f.q + " " + f.a).join(" ");
  assert.ok(/Instagram/.test(igFaqText), "IG FAQ should mention Instagram");
  assert.ok(/TikTok/.test(ttFaqText), "TT FAQ should mention TikTok");
  assert.notEqual(igFaqText, ttFaqText, "FAQ must differ between platforms");

  // Categorias que NÃO têm overrides ainda compartilham o mesmo bundle.
  const igLikes = copyFor("curtidas_instagram", "en");
  const ttLikes = copyFor("curtidas_tiktok", "en");
  assert.equal(igLikes, ttLikes);
});
