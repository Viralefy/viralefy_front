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

test("CATEGORY_CODES exposes the four canonical codes", () => {
  assert.deepEqual(CATEGORY_CODES, [
    "seguidores",
    "engajamento",
    "visualizacoes",
    "servicos",
  ]);
});

test("categoryFromSlug resolves Portuguese slug", () => {
  assert.equal(categoryFromSlug("seguidores"), "seguidores");
});

test("categoryFromSlug resolves English slug", () => {
  assert.equal(categoryFromSlug("followers"), "seguidores");
});

test("categoryFromSlug resolves French slug", () => {
  assert.equal(categoryFromSlug("abonnes"), "seguidores");
});

test("categoryFromSlug is case-insensitive", () => {
  assert.equal(categoryFromSlug("FoLLowErs"), "seguidores");
});

test("categoryFromSlug returns undefined for unknown slug", () => {
  assert.equal(categoryFromSlug("nonexistent"), undefined);
});

test("categoryFromSlug maps 'likes' to engajamento", () => {
  assert.equal(categoryFromSlug("likes"), "engajamento");
});

test("categoryFromSlug maps 'services' to servicos", () => {
  assert.equal(categoryFromSlug("services"), "servicos");
});

test("categorySlug returns the PT slug", () => {
  assert.equal(categorySlug("seguidores", "pt"), "seguidores");
});

test("categorySlug returns the EN slug", () => {
  assert.equal(categorySlug("seguidores", "en"), "followers");
});

test("categorySlug falls back to EN for languages without an explicit slug", () => {
  // ja (Japanese) has no explicit slug in CATEGORY_SLUG for seguidores.
  assert.equal(categorySlug("seguidores", "ja"), "followers");
});

test("categorySlug returns FR slug for engajamento", () => {
  assert.equal(categorySlug("engajamento", "fr"), "likes");
});

test("categoryLabel returns German label", () => {
  assert.equal(categoryLabel("seguidores", "de"), "Follower");
});

test("categoryLabel returns French label", () => {
  assert.equal(categoryLabel("seguidores", "fr"), "Abonnés");
});

test("categoryLabel falls back to EN when missing", () => {
  assert.equal(categoryLabel("seguidores", "ja"), "Followers");
});

test("copyFor returns LongCopy with callable paragraphs", () => {
  const copy = copyFor("seguidores", "en");
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
  const enCopy = copyFor("seguidores", "en");
  const jaCopy = copyFor("seguidores", "ja");
  assert.equal(jaCopy.h1("Japan"), enCopy.h1("Japan"));
});

test("copyFor h1 interpolates country name", () => {
  const copy = copyFor("seguidores", "pt");
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
