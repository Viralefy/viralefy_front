// Hreflang invariants — captures the 4 audit issues that Ahrefs Site
// Audit 2026-06-05 flagged on Viralefy (200 invalid + 197 missing
// reciprocal hreflang errors).
//
// The fixes live in src/lib/hreflang.ts. These tests ensure:
//
//   1. Each page type has its OWN hreflang group (home != country roots).
//   2. x-default ALWAYS points to the en-US variant of the current group,
//      never to the home "/".
//   3. self-tag is present and matches canonical.
//   4. Every BCP47 code is unique (no duplicate hreflang keys = invalid).
//   5. Every URL is a relative path starting with "/" (Next.js prepends
//      origin) and is a 200 (no redirect targets).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  homeAlternates,
  countryRootAlternates,
  categoryAlternates,
  slugAlternates,
} from "../../src/lib/hreflang.ts";
import { COUNTRIES } from "../../src/i18n/countries.ts";

// ---------- COUNTRIES sanity (unchanged from previous suite) ----------

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

test("every htmlLang is a valid BCP47 tag (lang or lang-region)", () => {
  const bcp = /^[a-z]{2,3}(-[A-Z]{2,3}|-[0-9]{3})?$/;
  for (const c of COUNTRIES) {
    assert.ok(bcp.test(c.htmlLang), `htmlLang not BCP47-ish: ${c.htmlLang} (country ${c.code})`);
  }
});

// ---------- homeAlternates ----------

test("homeAlternates: canonical is '/' and languages only has x-default + en", () => {
  const a = homeAlternates();
  assert.equal(a.canonical, "/");
  const keys = Object.keys(a.languages).sort();
  assert.deepEqual(keys, ["en", "x-default"]);
  assert.equal(a.languages["x-default"], "/");
  assert.equal(a.languages.en, "/");
});

test("homeAlternates: does NOT declare hreflang to any country root", () => {
  // Regression guard: previously the home declared en-US → /us, es-MX →
  // /mx etc., but home and country roots have DIFFERENT content. They are
  // separate hreflang groups now.
  const a = homeAlternates();
  for (const c of COUNTRIES) {
    assert.equal(
      a.languages[c.htmlLang],
      undefined,
      `home leaks ${c.htmlLang} → ${a.languages[c.htmlLang]} (country roots are a separate group)`,
    );
  }
});

// ---------- countryRootAlternates ----------

test("countryRootAlternates: canonical is /${code}", () => {
  assert.equal(countryRootAlternates("us").canonical, "/us");
  assert.equal(countryRootAlternates("br").canonical, "/br");
  assert.equal(countryRootAlternates("jp").canonical, "/jp");
});

test("countryRootAlternates: x-default points to /us, NEVER to /", () => {
  for (const c of COUNTRIES) {
    const a = countryRootAlternates(c.code);
    assert.equal(
      a.languages["x-default"],
      "/us",
      `${c.code}: x-default = ${a.languages["x-default"]}, want /us`,
    );
    assert.notEqual(a.languages["x-default"], "/", `${c.code}: x-default must NOT be /`);
  }
});

test("countryRootAlternates: declares all countries with unique BCP47", () => {
  const a = countryRootAlternates("us");
  const keys = Object.keys(a.languages).filter((k) => k !== "x-default");
  assert.equal(keys.length, COUNTRIES.length);
  assert.equal(new Set(keys).size, keys.length, "duplicate BCP47 keys (Ahrefs flags as invalid)");
});

test("countryRootAlternates: self-tag matches canonical", () => {
  for (const c of COUNTRIES) {
    const a = countryRootAlternates(c.code);
    assert.equal(
      a.languages[c.htmlLang],
      a.canonical,
      `${c.code}: self-tag (${c.htmlLang}) must equal canonical (${a.canonical})`,
    );
  }
});

// ---------- categoryAlternates ----------

test("categoryAlternates: canonical is /${code}/${slug} (locale-aware slug)", () => {
  const us = categoryAlternates("us", "seguidores_instagram");
  assert.equal(us.canonical, "/us/instagram-followers");
  const br = categoryAlternates("br", "seguidores_instagram");
  assert.equal(br.canonical, "/br/seguidores-instagram");
});

test("categoryAlternates: x-default points to /us/<category-en-slug>, NEVER to /", () => {
  const categories = ["seguidores_instagram", "curtidas_instagram", "comentarios_tiktok"];
  const samples = ["us", "br", "jp", "de"];
  for (const cat of categories) {
    for (const country of samples) {
      const a = categoryAlternates(country, cat);
      assert.notEqual(a.languages["x-default"], "/", `${country}/${cat}: x-default must NOT be /`);
      assert.ok(
        a.languages["x-default"].startsWith("/us/"),
        `${country}/${cat}: x-default = ${a.languages["x-default"]}, want /us/...`,
      );
    }
  }
});

test("categoryAlternates: self-tag matches canonical", () => {
  for (const c of COUNTRIES.slice(0, 20)) {
    const a = categoryAlternates(c.code, "seguidores_instagram");
    assert.equal(
      a.languages[c.htmlLang],
      a.canonical,
      `${c.code}: category self-tag must match canonical`,
    );
  }
});

// ---------- slugAlternates ----------

test("slugAlternates: canonical embeds qty and locale slug", () => {
  const a = slugAlternates("us", "seguidores_instagram", 1000);
  assert.equal(a.canonical, "/us/instagram-followers/1000-instagram-followers");
});

test("slugAlternates: x-default points to /us/<slug>/<qty>-<slug>, NEVER to /", () => {
  const samples = [
    { country: "us", cat: "seguidores_instagram", qty: 100 },
    { country: "br", cat: "seguidores_instagram", qty: 1000 },
    { country: "jp", cat: "curtidas_instagram", qty: 500 },
    { country: "de", cat: "comentarios_tiktok", qty: 50 },
  ];
  for (const s of samples) {
    const a = slugAlternates(s.country, s.cat, s.qty);
    assert.notEqual(a.languages["x-default"], "/");
    assert.ok(
      a.languages["x-default"].startsWith("/us/"),
      `${s.country}/${s.cat}/${s.qty}: x-default = ${a.languages["x-default"]}, want /us/...`,
    );
    assert.ok(
      a.languages["x-default"].includes(`/${s.qty}-`),
      `${s.country}/${s.cat}/${s.qty}: x-default must embed qty`,
    );
  }
});

test("slugAlternates: every value embeds the same qty (planos compartilhados entre países)", () => {
  const a = slugAlternates("us", "seguidores_instagram", 750);
  for (const k of Object.keys(a.languages)) {
    if (k === "x-default") continue;
    const url = a.languages[k];
    assert.ok(
      url.includes("/750-"),
      `${k}: ${url} should embed qty=750`,
    );
  }
});

// ---------- universal invariants ----------

test("INVARIANT: x-default is NEVER `/` outside the home group", () => {
  // This is the ROOT BUG that caused the 197 "missing reciprocal" Ahrefs
  // errors. Home can declare x-default → / (its own group). All other
  // surfaces must point x-default to the en-US variant of their own group.
  const offenders = [];
  if (countryRootAlternates("br").languages["x-default"] === "/") offenders.push("countryRoot");
  if (categoryAlternates("br", "seguidores_instagram").languages["x-default"] === "/") offenders.push("category");
  if (slugAlternates("br", "seguidores_instagram", 1000).languages["x-default"] === "/") offenders.push("slug");
  assert.deepEqual(offenders, [], `x-default = / leaked in: ${offenders.join(", ")}`);
});

test("INVARIANT: no duplicate hreflang keys (Ahrefs flags as invalid)", () => {
  const groups = [
    homeAlternates(),
    countryRootAlternates("us"),
    categoryAlternates("us", "seguidores_instagram"),
    slugAlternates("us", "seguidores_instagram", 1000),
  ];
  for (const g of groups) {
    const keys = Object.keys(g.languages);
    assert.equal(new Set(keys).size, keys.length, `duplicates in ${g.canonical}`);
  }
});

test("INVARIANT: all hreflang URLs are absolute paths starting with /", () => {
  // Next.js prepends the site origin onto languages[*]. If someone pastes
  // a full URL by mistake, the output becomes "https://...https://..." (clear bug).
  const groups = [
    homeAlternates(),
    countryRootAlternates("us"),
    categoryAlternates("us", "seguidores_instagram"),
    slugAlternates("us", "seguidores_instagram", 1000),
  ];
  for (const g of groups) {
    for (const [k, url] of Object.entries(g.languages)) {
      assert.ok(url.startsWith("/"), `${g.canonical} ${k}: URL must start with /, got ${url}`);
      assert.ok(!url.startsWith("//"), `${g.canonical} ${k}: protocol-relative not allowed`);
      assert.ok(!/^https?:/.test(url), `${g.canonical} ${k}: full URL not allowed (Next prepends origin)`);
    }
  }
});

test("INVARIANT: BCP47 codes are valid in every group", () => {
  const bcp47 = /^[a-z]{2,3}(-[A-Z]{2})?$/;
  const groups = [
    countryRootAlternates("us"),
    categoryAlternates("us", "seguidores_instagram"),
    slugAlternates("us", "seguidores_instagram", 1000),
  ];
  for (const g of groups) {
    for (const k of Object.keys(g.languages)) {
      if (k === "x-default" || k === "en") continue;
      assert.match(k, bcp47, `${g.canonical} invalid BCP47: ${k}`);
    }
  }
});

test("INVARIANT: reciprocity — country roots all point to each other", () => {
  const usGroup = countryRootAlternates("us").languages;
  const caGroup = countryRootAlternates("ca").languages;
  assert.equal(usGroup["en-CA"], "/ca");
  assert.equal(caGroup["en-US"], "/us");
});

test("INVARIANT: reciprocity — category groups have identical hreflang maps across countries", () => {
  // The hreflang group for a category should be the SAME map regardless of
  // which country root you visit it from. If /us/instagram-followers and
  // /br/seguidores-instagram have different language maps, reciprocity breaks.
  const us = categoryAlternates("us", "seguidores_instagram").languages;
  const br = categoryAlternates("br", "seguidores_instagram").languages;
  assert.deepEqual(
    Object.keys(us).sort(),
    Object.keys(br).sort(),
    "category groups must share the same set of BCP47 keys",
  );
  // Every hreflang → URL mapping should be identical (the group is shared).
  for (const k of Object.keys(us)) {
    assert.equal(us[k], br[k], `hreflang ${k} differs: us=${us[k]} br=${br[k]}`);
  }
});

test("INVARIANT: reciprocity — slug groups have identical hreflang maps across countries", () => {
  const us = slugAlternates("us", "seguidores_instagram", 1000).languages;
  const br = slugAlternates("br", "seguidores_instagram", 1000).languages;
  assert.deepEqual(Object.keys(us).sort(), Object.keys(br).sort());
  for (const k of Object.keys(us)) {
    assert.equal(us[k], br[k], `hreflang ${k} differs: us=${us[k]} br=${br[k]}`);
  }
});
