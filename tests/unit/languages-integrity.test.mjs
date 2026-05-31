// Unit tests for languages.ts PACKS data integrity (deeper than ru.test.mjs).
//
// Pins the top-level shape of every Pack (home/header/footer/cta/category/plan
// with all nested fields), validates that every COUNTRY_LANG maps to a real
// LangCode (via langOfCountry roundtrip), and confirms tr() fallback.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PACKS,
  tr,
  langOfCountry,
} from "../../src/i18n/languages.ts";
import { COUNTRIES } from "../../src/i18n/countries.ts";

const ALL_LANGS = Object.keys(PACKS);

// Rich locales — ones with fully translated packs (not English fallbacks).
const RICH = ["en", "pt", "es", "fr", "de", "it", "ru"];

const REQ_HOME = ["heroTitle", "heroSubtitle", "plansByService", "pickMarket", "pickService", "viewService"];
const REQ_HEADER = [
  "login", "register", "account", "support", "logout",
  "currency", "markets", "searchPlaceholder", "searchNoResults",
  "regionAmericas", "regionSepa",
];
const REQ_FOOTER_SECTIONS = ["legal", "site", "markets"];
const REQ_FOOTER_LINKS = ["privacy", "terms", "cookies", "refund", "contact", "about"];
const REQ_CTA = ["buy", "buyNow", "seeAll", "seeRange", "seeCards", "backToHome", "backToCategory"];
const REQ_CATEGORY = [
  "intro", "chooseQty", "suggested", "total", "perUnit", "compareAll",
  "faq", "breadcrumb", "in",
];
const REQ_CATEGORY_TABLE = ["plan", "qty", "price"];
const REQ_PLAN = [
  "delivery", "deliveryDesc", "safe", "safeDesc", "refill", "refillDesc",
  "support", "supportDesc", "detailsTitle", "whyTitle", "relatedTitle",
];
const REQ_TRUST = ["refill", "password", "delivery", "guarantee"];
const REQ_LIVE = ["ordersToday", "lastHour"];

test("PACKS registry has all expected top-level keys", () => {
  for (const lang of ALL_LANGS) {
    const p = PACKS[lang];
    assert.ok(p.home, `lang ${lang} missing home`);
    assert.ok(p.header, `lang ${lang} missing header`);
    assert.ok(p.footer, `lang ${lang} missing footer`);
    assert.ok(p.cta, `lang ${lang} missing cta`);
    assert.ok(p.category, `lang ${lang} missing category`);
    assert.ok(p.plan, `lang ${lang} missing plan`);
    assert.ok(p.trust, `lang ${lang} missing trust`);
    assert.ok(p.live, `lang ${lang} missing live`);
  }
});

test("every Pack.trust has refill/password/delivery/guarantee (string)", () => {
  for (const lang of ALL_LANGS) {
    for (const k of REQ_TRUST) {
      const v = PACKS[lang].trust[k];
      assert.equal(typeof v, "string", `lang ${lang} trust.${k}`);
      assert.ok(v.length > 0, `lang ${lang} trust.${k} empty`);
    }
  }
});

test("every Pack.live has ordersToday/lastHour (string)", () => {
  for (const lang of ALL_LANGS) {
    for (const k of REQ_LIVE) {
      const v = PACKS[lang].live[k];
      assert.equal(typeof v, "string", `lang ${lang} live.${k}`);
      assert.ok(v.length > 0, `lang ${lang} live.${k} empty`);
    }
  }
});

test("every Pack.home has all required keys (defined, string-typed)", () => {
  for (const lang of ALL_LANGS) {
    for (const k of REQ_HOME) {
      const v = PACKS[lang].home[k];
      assert.equal(typeof v, "string", `lang ${lang} home.${k} type=${typeof v}`);
    }
  }
});

test("every Pack.header has all required keys", () => {
  for (const lang of ALL_LANGS) {
    for (const k of REQ_HEADER) {
      const v = PACKS[lang].header[k];
      assert.equal(typeof v, "string", `lang ${lang} header.${k}`);
    }
  }
});

test("every Pack.footer.sections has legal/site/markets", () => {
  for (const lang of ALL_LANGS) {
    for (const k of REQ_FOOTER_SECTIONS) {
      const v = PACKS[lang].footer.sections[k];
      assert.equal(typeof v, "string", `lang ${lang} footer.sections.${k}`);
    }
  }
});

test("every Pack.footer.links has privacy/terms/cookies/refund/contact/about", () => {
  for (const lang of ALL_LANGS) {
    for (const k of REQ_FOOTER_LINKS) {
      const v = PACKS[lang].footer.links[k];
      assert.equal(typeof v, "string", `lang ${lang} footer.links.${k}`);
    }
  }
});

test("every Pack.footer has tagline / copyright / disclaimer", () => {
  for (const lang of ALL_LANGS) {
    const f = PACKS[lang].footer;
    assert.equal(typeof f.tagline, "string");
    assert.equal(typeof f.copyright, "string");
    assert.equal(typeof f.disclaimer, "string");
  }
});

test("every Pack.cta has all required keys", () => {
  for (const lang of ALL_LANGS) {
    for (const k of REQ_CTA) {
      const v = PACKS[lang].cta[k];
      assert.equal(typeof v, "string", `lang ${lang} cta.${k}`);
    }
  }
});

test("every Pack.category has all required keys", () => {
  for (const lang of ALL_LANGS) {
    for (const k of REQ_CATEGORY) {
      const v = PACKS[lang].category[k];
      assert.equal(typeof v, "string", `lang ${lang} category.${k}`);
    }
    for (const tk of REQ_CATEGORY_TABLE) {
      const v = PACKS[lang].category.table[tk];
      assert.equal(typeof v, "string", `lang ${lang} category.table.${tk}`);
    }
  }
});

test("every Pack.plan has all required keys", () => {
  for (const lang of ALL_LANGS) {
    for (const k of REQ_PLAN) {
      const v = PACKS[lang].plan[k];
      assert.equal(typeof v, "string", `lang ${lang} plan.${k}`);
    }
  }
});

test("all rich locales (en/pt/es/fr/de/it/ru) have non-empty entries everywhere", () => {
  for (const lang of RICH) {
    const p = PACKS[lang];
    const all = [
      ...REQ_HOME.map((k) => [`home.${k}`, p.home[k]]),
      ...REQ_HEADER.map((k) => [`header.${k}`, p.header[k]]),
      ...REQ_FOOTER_SECTIONS.map((k) => [`footer.sections.${k}`, p.footer.sections[k]]),
      ...REQ_FOOTER_LINKS.map((k) => [`footer.links.${k}`, p.footer.links[k]]),
      ["footer.tagline", p.footer.tagline],
      ["footer.copyright", p.footer.copyright],
      ["footer.disclaimer", p.footer.disclaimer],
      ...REQ_CTA.map((k) => [`cta.${k}`, p.cta[k]]),
      ...REQ_CATEGORY.map((k) => [`category.${k}`, p.category[k]]),
      ...REQ_CATEGORY_TABLE.map((k) => [`category.table.${k}`, p.category.table[k]]),
      ...REQ_PLAN.map((k) => [`plan.${k}`, p.plan[k]]),
    ];
    for (const [path, v] of all) {
      assert.ok(v && v.length >= 1, `rich lang ${lang} empty at ${path}`);
    }
  }
});

test("every country code resolves to a LangCode present in PACKS (via langOfCountry)", () => {
  for (const c of COUNTRIES) {
    const lang = langOfCountry(c.code);
    assert.ok(PACKS[lang], `country ${c.code} resolves to unknown lang ${lang}`);
  }
});

test("tr('unknown') falls back to en", () => {
  const fb = tr("not-a-real-lang");
  assert.deepEqual(fb, tr("en"), "tr fallback should equal en pack");
});

test("tr(known) returns the exact Pack for that lang", () => {
  for (const lang of ALL_LANGS) {
    assert.equal(tr(lang), PACKS[lang], `tr(${lang}) drifted from PACKS[${lang}]`);
  }
});

test("langOfCountry('xx-not-a-country') falls back to en", () => {
  assert.equal(langOfCountry("xx-not-a-country"), "en");
});

test("langOfCountry is case-insensitive (BR -> pt)", () => {
  assert.equal(langOfCountry("BR"), "pt");
  assert.equal(langOfCountry("Br"), "pt");
  assert.equal(langOfCountry("br"), "pt");
});

test("rich locales (ru) carry Cyrillic in the heroTitle", () => {
  const ru = tr("ru");
  assert.match(ru.home.heroTitle, /[Ѐ-ӿ]/, "ru heroTitle missing Cyrillic");
  assert.match(ru.footer.disclaimer, /[Ѐ-ӿ]/, "ru disclaimer missing Cyrillic");
});
