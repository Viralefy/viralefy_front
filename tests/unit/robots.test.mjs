// Regression guard for src/app/robots.ts.
//
// The Next.js Robots type supports a `host` field that emits a `Host:`
// directive in the output. That directive is the legacy Yandex extension —
// NOT part of RFC 9309 (2022) — and Google/Bing validators flag it as
// "Syntax not understood". Modern Yandex resolves host preference via
// canonical link + sitemap, so emitting `Host:` is pure noise + warnings.
//
// This test imports the route module and asserts the shape it produces.

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SITE_URL = "https://www.viralefy.com";

import robotsRoute from "../../src/app/robots.ts";

test("robots() does NOT include the deprecated `host` field", () => {
  const out = robotsRoute();
  assert.equal(out.host, undefined, "host directive must not be emitted (RFC 9309)");
  // Defesa adicional: também não pode aparecer com chave alternativa.
  for (const k of Object.keys(out)) {
    assert.ok(!/host/i.test(k), `unexpected host-like key: ${k}`);
  }
});

test("robots() declares a sitemap (Google/Bing rely on it for indexing)", () => {
  const out = robotsRoute();
  assert.ok(out.sitemap, "sitemap must be set");
  assert.equal(out.sitemap, "https://www.viralefy.com/sitemap.xml");
});

test("robots() carries a rule for User-agent *", () => {
  const out = robotsRoute();
  assert.ok(Array.isArray(out.rules), "rules must be array");
  const wildcard = out.rules.find((r) => r.userAgent === "*");
  assert.ok(wildcard, "must include rule for User-agent *");
  assert.equal(wildcard.allow, "/");
});

test("robots() disallows private routes (/account, /login, /api, etc.)", () => {
  const out = robotsRoute();
  const wildcard = out.rules.find((r) => r.userAgent === "*");
  const disallow = wildcard.disallow;
  assert.ok(Array.isArray(disallow), "disallow must be array");
  for (const path of ["/account", "/tickets", "/login", "/register", "/api/"]) {
    assert.ok(disallow.includes(path), `must disallow ${path}`);
  }
});

test("robots() does NOT disallow /orders (review submission landings must be crawlable for noindex tag)", () => {
  // /orders/[id]/review tem noindex meta — não pode estar em Disallow no
  // robots.txt, senão o crawler nunca lê o noindex e a URL pode ficar
  // indexed-with-no-content (problema clássico de SEO).
  const out = robotsRoute();
  const wildcard = out.rules.find((r) => r.userAgent === "*");
  const disallow = wildcard.disallow ?? [];
  assert.ok(
    !disallow.some((p) => p === "/orders" || p === "/orders/"),
    "disallow /orders exact would block /orders/[id]/review crawl + noindex read",
  );
});

test("robots() declares explicit policy for IA crawlers (GPTBot, ClaudeBot, Google-Extended)", () => {
  // IA crawlers ignoram /robots.txt sem user-agent específico. Declarar explícito
  // dá controle granular: hoje permitimos pra content marketing; se virar
  // problema, mudamos pra disallow sem afetar Google/Bing.
  const out = robotsRoute();
  const aiRule = out.rules.find(
    (r) => Array.isArray(r.userAgent) && r.userAgent.includes("GPTBot"),
  );
  assert.ok(aiRule, "must declare explicit rule for IA crawlers (GPTBot et al.)");
  assert.ok(aiRule.userAgent.includes("ClaudeBot"), "ClaudeBot must be in IA rule");
  assert.ok(aiRule.userAgent.includes("Google-Extended"), "Google-Extended must be in IA rule");
});
