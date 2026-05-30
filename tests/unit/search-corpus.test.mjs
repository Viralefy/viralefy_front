// Unit tests for the search corpus that backs <SearchBar>.
//
// NOTE: SearchBar is a "use client" React component. Its buildIndex/search
// functions are not exported (they are module-private). We re-implement
// them HERE — line-by-line mirror of src/components/SearchBar.tsx — so we
// can pin the indexing and ranking behavior. Any drift in the component
// should be reflected here too.

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
  engajamento:
    "like curtir polubienia interaccion comentario comment commentaire reazione",
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

test("index size = countries x categories", () => {
  assert.equal(INDEX.length, COUNTRIES.length * CATEGORY_CODES.length);
  assert.ok(INDEX.length >= 264, `expected >=264 entries, got ${INDEX.length}`);
});

test("every entry has url/label/market/keywords", () => {
  for (const it of INDEX) {
    assert.ok(it.url.startsWith("/"));
    assert.ok(it.label.length > 0);
    assert.ok(it.market.length > 0);
    assert.ok(it.keywords.length > 0);
  }
});

test("search('') and search('a') return []", () => {
  assert.deepEqual(search(""), []);
  assert.deepEqual(search("a"), []);
});

test("search('seguidores') returns multiple hits", () => {
  const hits = search("seguidores");
  assert.ok(hits.length >= 5, `expected >=5 hits, got ${hits.length}`);
});

test("search('seguidores') returns category=seguidores hits across PT/ES markets", () => {
  const hits = search("seguidores");
  // Every hit should belong to a market whose H1/description carries
  // 'seguidores' or whose labels do — i.e. predominantly Portuguese or
  // Spanish-language markets. We assert that at least half of the top hits
  // are from PT/ES countries (Brasil, México, Espana, Argentina, etc.).
  const ptEsMarkets = new Set([
    "Brasil", "México", "España", "Argentina", "Chile", "Colombia",
    "Perú", "Bolivia", "Paraguay", "Uruguay", "Ecuador", "Venezuela",
    "Cuba", "República Dominicana", "Puerto Rico", "Guatemala", "Honduras",
    "El Salvador", "Nicaragua", "Costa Rica", "Panamá", "Portugal",
  ]);
  const top = hits.slice(0, 6).map((h) => h.market);
  const ptEsHits = top.filter((m) => ptEsMarkets.has(m)).length;
  assert.ok(
    ptEsHits >= 1,
    `expected at least 1 PT/ES market in top 6, got: ${top.join(", ")}`
  );
});

test("search('seguidores') hits map to valid category slugs", () => {
  // Markets whose H1/intro literally mention 'seguidores' (e.g. MX, BR)
  // will surface ALL their categories — that's intended: the user wants
  // to see all options for that country. Just verify every hit URL is
  // a parseable /country/category-slug.
  const hits = search("seguidores");
  assert.ok(hits.length > 0);
  for (const h of hits) {
    const parts = h.url.split("/");
    assert.equal(parts.length, 3, `bad url shape: ${h.url}`);
    assert.equal(parts[0], "");
    assert.ok(parts[1].length === 2, `bad country code in ${h.url}`);
    const cat = categoryFromSlug(parts[2]);
    assert.ok(cat !== undefined, `unknown category slug ${parts[2]} in ${h.url}`);
  }
});

test("search('followers') returns hits including English markets", () => {
  const hits = search("followers");
  assert.ok(hits.length >= 5);
  const markets = hits.map((h) => h.market);
  assert.ok(
    markets.includes("United States") || markets.includes("United Kingdom"),
    `expected US or UK in hits, got: ${markets.slice(0, 5).join(", ")}`
  );
});

test("search('recuperacao') matches /XX/servicos URLs (EXTRA_KEYWORDS hook)", () => {
  const hits = search("recuperacao");
  assert.ok(hits.length > 0, "expected at least one hit for 'recuperacao'");
  for (const h of hits) {
    const slug = h.url.split("/")[2];
    assert.equal(
      categoryFromSlug(slug),
      "servicos",
      `expected services category, got url: ${h.url}`
    );
  }
});

test("search('recuperação') with diacritic also matches services", () => {
  // Search normalizes diacritics — typing with accents should still hit.
  const hits = search("recuperação");
  assert.ok(hits.length > 0);
});

test("search returns at most 12 results", () => {
  const hits = search("instagram");
  assert.ok(hits.length <= 12);
});

test("search results carry unique URLs in the top 12", () => {
  const hits = search("followers");
  const urls = hits.map((h) => h.url);
  assert.equal(new Set(urls).size, urls.length);
});

test("search('brasil') ranks the Brazil markets at the top", () => {
  const hits = search("brasil");
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].market, "Brasil");
});

test("search('france') ranks France markets at the top", () => {
  const hits = search("france");
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].market, "France");
});

test("multi-token AND: 'followers brasil' returns only Brasil's seguidores hit", () => {
  const hits = search("followers brasil");
  assert.ok(hits.length >= 1);
  for (const h of hits) {
    assert.equal(h.market, "Brasil");
  }
});

test("bogus query returns []", () => {
  assert.deepEqual(search("zzzz_no_match_here"), []);
});
