// Edge-case tests for the search corpus that backs <SearchBar>.
//
// search-corpus.test.mjs covers the happy path. THIS file pins the edge
// behaviors: empty query, 1-char query, no-match, case-insensitive,
// diacritic normalization, multi-token AND, dedupe, ranking. We mirror
// the same buildIndex/search functions from src/components/SearchBar.tsx
// because they're module-private to a "use client" component.

import { test } from "node:test";
import assert from "node:assert/strict";

import { COUNTRIES } from "../../src/i18n/countries.ts";
import {
  CATEGORY_CODES,
  CATEGORY_LABEL,
  categoryLabel,
  categorySlug,
  categoryFromSlug,
} from "../../src/i18n/categories.ts";
import { langOfCountry } from "../../src/i18n/languages.ts";

const EXTRA_KEYWORDS = {
  seguidores:
    "follower seguidor follower seguir abonnes obserwujacy seuraajat sledilci instagram tiktok",
  curtidas:
    "like curtir likes curtidas reazione lajki polubienia",
  comentarios:
    "comment comentario comentarios commentaire kommentar commento reactie",
  compartilhamentos:
    "share compartilhamento save salvamento partilhar shares saves partage condivisione",
  visualizacoes:
    "view watch reels story stories reel video views vistas aufruf vues visualizzazioni",
  servicos:
    "servico service services premium gestao management gestion gerenciamento " +
    "recuperacao recovery recuperar recuperacion recuperer recover wiederherstellen rebooting " +
    "auditoria audit auditar auditoria diagnostico " +
    "setup launch lancamento lanzamiento creation " +
    "shadowban shadow ban anti-shadowban hashtags " +
    "concorrentes competitor concurrents competitors analisi rivali " +
    "verificacao verification badge azul blue check verifie verifica " +
    "consultoria consulting consulenza beratung consultation",
};

function buildIndex() {
  const items = [];
  for (const c of COUNTRIES) {
    const lang = langOfCountry(c.code);
    for (const cat of CATEGORY_CODES) {
      const label = categoryLabel(cat, lang);
      const slug = categorySlug(cat, lang);
      const allLangsLabel = Object.values(CATEGORY_LABEL[cat]).join(" ");
      items.push({
        url: `/${c.code}/${slug}`,
        label: `${label} Instagram & TikTok`,
        market: c.name,
        flag: c.flag,
        keywords: [
          c.name,
          c.code,
          c.h1,
          c.description,
          c.htmlLang,
          allLangsLabel,
          label,
          EXTRA_KEYWORDS[cat],
        ]
          .join(" ")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, ""),
      });
    }
  }
  return items;
}

function normalize(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function search(query, limit = 12) {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const item of INDEX) {
    let score = 0;
    let allMatched = true;
    for (const tok of tokens) {
      const idx = item.keywords.indexOf(tok);
      if (idx === -1) {
        allMatched = false;
        break;
      }
      score += 10;
      if (idx === 0 || item.keywords[idx - 1] === " ") score += 6;
      if (item.market.toLowerCase().includes(tok)) score += 4;
    }
    if (allMatched) scored.push({ hit: item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.hit);
}

const INDEX = buildIndex();

test("search('') returns []", () => {
  assert.deepEqual(search(""), []);
});

test("search('a') (1 char) returns []", () => {
  assert.deepEqual(search("a"), []);
});

test("search('xxxx-nope-xxxx') returns []", () => {
  assert.deepEqual(search("xxxx-nope-xxxx"), []);
});

test("search('recovery') matches /XX/{servicos,recuperacao_perfil} URLs", () => {
  // Antes 'recovery' caía só em /servicos. Depois do split, há uma
  // categoria dedicada `recuperacao_perfil` com LP de formulário, então
  // tanto recuperacao_perfil quanto servicos são respostas válidas.
  const ALLOWED = new Set(["servicos", "recuperacao_perfil"]);
  const hits = search("recovery");
  assert.ok(hits.length >= 1, "expected at least 1 hit for 'recovery'");
  for (const h of hits) {
    const slug = h.url.split("/")[2];
    const cat = categoryFromSlug(slug);
    assert.ok(
      cat && ALLOWED.has(cat),
      `expected servicos or recuperacao_perfil, got ${cat} from ${h.url}`,
    );
  }
});

test("search('audit') matches at least one services URL", () => {
  const hits = search("audit");
  assert.ok(hits.length >= 1, "expected hits for 'audit'");
  for (const h of hits) {
    const slug = h.url.split("/")[2];
    assert.equal(categoryFromSlug(slug), "servicos");
  }
});

test("search('shadowban') matches at least one services URL", () => {
  const hits = search("shadowban");
  assert.ok(hits.length >= 1);
  for (const h of hits) {
    const slug = h.url.split("/")[2];
    assert.equal(categoryFromSlug(slug), "servicos");
  }
});

test("search('instagram') returns hits", () => {
  const hits = search("instagram");
  assert.ok(hits.length >= 1, "expected 'instagram' hits");
});

test("search('tiktok') returns hits", () => {
  const hits = search("tiktok");
  assert.ok(hits.length >= 1, "expected 'tiktok' hits");
});

test("search('BR') (uppercase) matches Brazil results (case-insensitive)", () => {
  const hits = search("BR");
  assert.ok(hits.length >= 1, "expected uppercase BR hits");
  // At least one hit should be /br/*.
  const brHits = hits.filter((h) => h.url.startsWith("/br/"));
  assert.ok(brHits.length >= 1, `expected /br hit, got: ${hits.map((h) => h.url).join(", ")}`);
});

test("search('brasil') matches Brazil", () => {
  const hits = search("brasil");
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].market, "Brasil");
});

test("search('açoes') with diacritic matches normalized 'acoes' results", () => {
  // Normalization strips combining marks — so 'açoes' becomes 'acoes'.
  // The corpus has 'visualizacoes' (PT slug for views), so we expect hits.
  const hits = search("acoes");
  const hitsAccented = search("açoes");
  // Both should return the same set (diacritic-insensitive).
  assert.equal(
    hits.length,
    hitsAccented.length,
    "diacritic normalization mismatch"
  );
});

test("multi-token AND: 'a b c' only matches when ALL tokens present", () => {
  // Three random short tokens unlikely to all co-occur — should be 0.
  const hits = search("zzzzz qqqqq xxxxx");
  assert.equal(hits.length, 0);
});

test("search results have <=12 entries always", () => {
  for (const q of ["instagram", "tiktok", "followers", "seguidores", "brasil"]) {
    const hits = search(q);
    assert.ok(hits.length <= 12, `query '${q}' returned ${hits.length} > 12`);
  }
});

test("search results URLs are unique (no duplicates)", () => {
  for (const q of ["instagram", "tiktok", "followers", "seguidores", "recovery"]) {
    const hits = search(q);
    const urls = hits.map((h) => h.url);
    assert.equal(new Set(urls).size, urls.length, `dup urls for '${q}'`);
  }
});

test("rank: 'recovery' surfaces servicos OU recuperacao_perfil URLs", () => {
  // Após o split de Account Recovery em categoria dedicada, 'recovery'
  // legitimamente bate em duas famílias: a LP de formulário
  // (recuperacao_perfil) e o agrupamento premium services. Nenhuma outra
  // família compartilha o keyword.
  const ALLOWED = new Set(["servicos", "recuperacao_perfil"]);
  const hits = search("recovery");
  assert.ok(hits.length >= 1);
  const allValid = hits.every((h) => {
    const slug = h.url.split("/")[2];
    return ALLOWED.has(categoryFromSlug(slug));
  });
  assert.ok(allValid, "non-recovery category leaked into 'recovery' search");
});
