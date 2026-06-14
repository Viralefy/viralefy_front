// Round 18 (Track EE) — cobertura expandida nos helpers críticos.
//
// Coverage:
//   - jsonld.withGlobalGraph      — prepend Org+WebSite, @id canônicos, ordem
//   - jsonld.buildOrganizationNode— campos obrigatórios + contactPoint
//   - jsonld.buildWebSiteNode     — inLanguage propagado (default vs override)
//   - plan-labels.localizedPlanName       — saída por lang × qty × category
//   - plan-labels.localizedPlanDescription— tier thresholds (faixas)
//   - gdpr.cookieDomain           — localhost edge / *.viralefy.com / *.com.br
//
// Cada teste pina uma SHAPE assertion (não só truthy) seguindo o padrão do
// skill §22 (smoke/unit nunca cego). Cenários negativos cobertos:
//   - withGlobalGraph com pageNodes vazio
//   - buildWebSiteNode sem opts (default lista)
//   - localizedPlanName fallback (qty=0 / category desconhecida)
//   - localizedPlanDescription fallback (category fora de followers/eng/views)
//   - cookieDomain SSR (sem window) e localhost
//
// IMPORTANTE: gdpr.ts faz `typeof window === "undefined"` no topo de
// cookieDomain — pra testar a lógica de host precisamos mockar window ANTES
// do import dinâmico.

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SITE_URL = "https://viralefy.com";

import {
  withGlobalGraph,
  buildOrganizationNode,
  buildWebSiteNode,
} from "../../src/lib/jsonld.ts";
import {
  localizedPlanName,
  localizedPlanDescription,
} from "../../src/lib/plan-labels.ts";

const SITE = "https://viralefy.com";

// ─── buildOrganizationNode ────────────────────────────────────────────────

test("buildOrganizationNode emits Organization with canonical @id and required fields", () => {
  const org = buildOrganizationNode(SITE);
  assert.equal(org["@type"], "Organization");
  assert.equal(org["@id"], `${SITE}/#organization`);
  assert.equal(org.name, "Viralefy");
  assert.equal(org.url, SITE);
  assert.equal(org.logo["@type"], "ImageObject");
  assert.equal(org.logo.url, `${SITE}/logo.png`);
  assert.equal(typeof org.logo.width, "number");
  assert.equal(typeof org.logo.height, "number");
});

test("buildOrganizationNode contactPoint covers customer support with full language list", () => {
  const org = buildOrganizationNode(SITE);
  assert.equal(org.contactPoint["@type"], "ContactPoint");
  assert.equal(org.contactPoint.contactType, "customer support");
  assert.ok(Array.isArray(org.contactPoint.availableLanguage));
  // Pin some of the 10 core languages (en + pt + ar required).
  assert.ok(org.contactPoint.availableLanguage.includes("en"));
  assert.ok(org.contactPoint.availableLanguage.includes("pt"));
  assert.ok(org.contactPoint.availableLanguage.includes("ar"));
  assert.equal(org.contactPoint.url, `${SITE}/legal/contact?lang=en`);
});

test("buildOrganizationNode omits sameAs (no social profiles yet)", () => {
  // sameAs intencionalmente ausente — política documentada no source. Pinar
  // pra que qualquer regressão que adicione sameAs vazio quebre o teste.
  const org = buildOrganizationNode(SITE);
  assert.ok(!("sameAs" in org), "sameAs must not be emitted until social profiles exist");
});

// ─── buildWebSiteNode ─────────────────────────────────────────────────────

test("buildWebSiteNode emits WebSite with canonical @id and publisher pointer", () => {
  const ws = buildWebSiteNode(SITE);
  assert.equal(ws["@type"], "WebSite");
  assert.equal(ws["@id"], `${SITE}/#website`);
  assert.equal(ws.name, "Viralefy");
  assert.equal(ws.url, SITE);
  assert.deepEqual(ws.publisher, { "@id": `${SITE}/#organization` });
});

test("buildWebSiteNode default inLanguage covers full multilingual catalog", () => {
  const ws = buildWebSiteNode(SITE);
  assert.ok(Array.isArray(ws.inLanguage));
  assert.ok(ws.inLanguage.includes("en"));
  assert.ok(ws.inLanguage.includes("pt"));
  assert.ok(ws.inLanguage.includes("ja"));
  assert.ok(ws.inLanguage.length >= 10, "expected ≥10 languages by default");
});

test("buildWebSiteNode propagates opts.inLanguage (single string)", () => {
  const ws = buildWebSiteNode(SITE, { inLanguage: "en" });
  assert.equal(ws.inLanguage, "en");
});

test("buildWebSiteNode propagates opts.inLanguage (array)", () => {
  const ws = buildWebSiteNode(SITE, { inLanguage: ["en", "pt"] });
  assert.deepEqual(ws.inLanguage, ["en", "pt"]);
});

test("buildWebSiteNode emits SearchAction with country-code EntryPoint", () => {
  const ws = buildWebSiteNode(SITE);
  assert.equal(ws.potentialAction["@type"], "SearchAction");
  assert.equal(ws.potentialAction.target["@type"], "EntryPoint");
  assert.equal(ws.potentialAction.target.urlTemplate, `${SITE}/{country_code}`);
  assert.equal(ws.potentialAction["query-input"], "required name=country_code");
});

// ─── withGlobalGraph ──────────────────────────────────────────────────────

test("withGlobalGraph prepends Organization + WebSite to page nodes (in order)", () => {
  const pageNode = { "@type": "CollectionPage", name: "Help center" };
  const out = withGlobalGraph([pageNode], { siteUrl: SITE });
  assert.equal(out["@context"], "https://schema.org");
  assert.equal(out["@graph"].length, 3);
  assert.equal(out["@graph"][0]["@type"], "Organization");
  assert.equal(out["@graph"][1]["@type"], "WebSite");
  assert.equal(out["@graph"][2]["@type"], "CollectionPage");
});

test("withGlobalGraph emits canonical @id values matching country-page convention", () => {
  const out = withGlobalGraph([], { siteUrl: SITE });
  assert.equal(out["@graph"][0]["@id"], `${SITE}/#organization`);
  assert.equal(out["@graph"][1]["@id"], `${SITE}/#website`);
});

test("withGlobalGraph forwards inLanguage to WebSite node only (not Organization)", () => {
  const out = withGlobalGraph([], { siteUrl: SITE, inLanguage: "en" });
  assert.equal(out["@graph"][1].inLanguage, "en");
  // Organization doesn't carry inLanguage — make sure it stayed clean.
  assert.ok(!("inLanguage" in out["@graph"][0]));
});

test("withGlobalGraph with empty page array still emits Org+WebSite envelope", () => {
  const out = withGlobalGraph([], { siteUrl: SITE });
  assert.equal(out["@graph"].length, 2);
  assert.equal(out["@graph"][0]["@type"], "Organization");
  assert.equal(out["@graph"][1]["@type"], "WebSite");
});

test("withGlobalGraph drops nullish page nodes (defensive against optional blocks)", () => {
  const out = withGlobalGraph([null, { "@type": "BreadcrumbList" }, undefined], {
    siteUrl: SITE,
  });
  assert.equal(out["@graph"].length, 3);
  assert.deepEqual(
    out["@graph"].map((n) => n["@type"]),
    ["Organization", "WebSite", "BreadcrumbList"],
  );
});

// ─── localizedPlanName ────────────────────────────────────────────────────

function mkPlan(over = {}) {
  return {
    id: "plan-x",
    name: "1000 followers Instagram",
    description: "Initial growth",
    category: "seguidores_instagram",
    platform: "instagram",
    target_type: "profile",
    followers_qty: 1000,
    price_cents: 990,
    currency: "USD",
    active: true,
    sort_order: 0,
    prices: { USD: "9.90" },
    ...over,
  };
}

test("localizedPlanName pt-BR formats qty + Portuguese unit", () => {
  const out = localizedPlanName(mkPlan(), "pt");
  assert.equal(out, "1.000 seguidores Instagram");
});

test("localizedPlanName en formats qty + English unit", () => {
  const out = localizedPlanName(mkPlan(), "en");
  assert.equal(out, "1,000 followers Instagram");
});

test("localizedPlanName de uses German unit (compound word)", () => {
  const out = localizedPlanName(mkPlan(), "de");
  assert.equal(out, "1.000 Instagram-Follower");
});

test("localizedPlanName fr uses French unit (abonnés)", () => {
  const out = localizedPlanName(mkPlan(), "fr");
  // fr group separator may be NBSP — assert ends-with rather than full match.
  assert.match(out, /abonnés Instagram$/);
});

test("localizedPlanName it / nl share the same shape", () => {
  assert.match(localizedPlanName(mkPlan(), "it"), /follower Instagram$/);
  assert.match(localizedPlanName(mkPlan(), "nl"), /Instagram-volgers$/);
});

test("localizedPlanName tiktok categories produce TikTok unit (not Instagram)", () => {
  const p = mkPlan({ category: "seguidores_tiktok", followers_qty: 500 });
  assert.equal(localizedPlanName(p, "pt"), "500 seguidores TikTok");
  assert.equal(localizedPlanName(p, "en"), "500 followers TikTok");
});

test("localizedPlanName falls back to plan.name when qty <= 0 (avoid '0 followers')", () => {
  const p = mkPlan({ followers_qty: 0, name: "Fallback Name" });
  assert.equal(localizedPlanName(p, "pt"), "Fallback Name");
});

test("localizedPlanName falls back to plan.name when category has no unit map", () => {
  const p = mkPlan({ category: "unknown_category", name: "Untranslated" });
  assert.equal(localizedPlanName(p, "pt"), "Untranslated");
});

test("localizedPlanName for servicos uses translated name when available, else fallback", () => {
  const p = mkPlan({ category: "servicos", name: "Profile audit", followers_qty: 0 });
  assert.equal(localizedPlanName(p, "pt"), "Auditoria de perfil");
  assert.equal(localizedPlanName(p, "es"), "Auditoría de perfil");
  // fr does NOT have a servicos translation — falls back to original name.
  assert.equal(localizedPlanName(p, "fr"), "Profile audit");
});

test("localizedPlanName for recuperacao_perfil maps Account recovery", () => {
  const p = mkPlan({
    category: "recuperacao_perfil",
    name: "Account recovery",
    followers_qty: 0,
  });
  assert.equal(localizedPlanName(p, "pt"), "Recuperação de conta");
  assert.equal(localizedPlanName(p, "es"), "Recuperación de cuenta");
});

// ─── localizedPlanDescription (tier thresholds) ───────────────────────────

test("localizedPlanDescription followers tier — qty 100 hits 'Ideal for testing'", () => {
  const p = mkPlan({ followers_qty: 100 });
  assert.equal(localizedPlanDescription(p, "en"), "Ideal for testing");
  assert.equal(localizedPlanDescription(p, "pt"), "Ideal pra testar");
});

test("localizedPlanDescription followers tier — qty 500 hits 'First push'", () => {
  const p = mkPlan({ followers_qty: 500 });
  assert.equal(localizedPlanDescription(p, "en"), "First push");
  assert.equal(localizedPlanDescription(p, "de"), "Erster Schub");
});

test("localizedPlanDescription followers tier — qty 1000 hits 'Takeoff'", () => {
  const p = mkPlan({ followers_qty: 1000 });
  assert.equal(localizedPlanDescription(p, "en"), "Takeoff");
  assert.equal(localizedPlanDescription(p, "fr"), "Décollage");
});

test("localizedPlanDescription engagement tier — qty 100 likes hits 'First push'", () => {
  const p = mkPlan({ category: "curtidas_instagram", followers_qty: 100 });
  assert.equal(localizedPlanDescription(p, "en"), "First push");
});

test("localizedPlanDescription views tier — qty 500 views hits 'Ignition'", () => {
  const p = mkPlan({ category: "visualizacoes_tiktok", followers_qty: 500 });
  assert.equal(localizedPlanDescription(p, "en"), "Ignition");
  assert.equal(localizedPlanDescription(p, "pt"), "Ignição");
});

test("localizedPlanDescription saturates at 'Giant' for huge followers qty", () => {
  const p = mkPlan({ followers_qty: 10_000_000 });
  assert.equal(localizedPlanDescription(p, "en"), "Giant");
  assert.equal(localizedPlanDescription(p, "pt"), "Gigante");
});

test("localizedPlanDescription falls back to plan.description when category not tiered", () => {
  const p = mkPlan({
    category: "unknown_tier",
    description: "Original description",
    followers_qty: 100,
  });
  assert.equal(localizedPlanDescription(p, "en"), "Original description");
});

test("localizedPlanDescription for servicos uses translated description when available", () => {
  const p = mkPlan({
    category: "servicos",
    name: "Profile audit",
    description: "Audit + recommendations",
    followers_qty: 0,
  });
  assert.equal(localizedPlanDescription(p, "pt"), "Diagnóstico + recomendações");
  // fr has no servicos translation → original description survives.
  assert.equal(localizedPlanDescription(p, "fr"), "Audit + recommendations");
});

// ─── gdpr.cookieDomain ────────────────────────────────────────────────────
//
// cookieDomain reads window.location.hostname. We mock window before
// importing the module so the SSR-guard (`typeof window === "undefined"`)
// passes through to the host-parsing branch.

function withMockHostname(host, fn) {
  const prev = globalThis.window;
  globalThis.window = { location: { hostname: host } };
  try {
    return fn();
  } finally {
    if (prev === undefined) delete globalThis.window;
    else globalThis.window = prev;
  }
}

// Import after we've established the shape — the function reads
// window.location.hostname AT CALL TIME, not at import time, so per-test
// swapping is safe.
const gdprMod = await import("../../src/lib/gdpr.ts");
const { cookieDomain } = gdprMod;

test("cookieDomain returns '' for localhost (host-only cookie in dev)", () => {
  withMockHostname("localhost", () => {
    assert.equal(cookieDomain(), "");
  });
});

test("cookieDomain returns '' for 127.0.0.1", () => {
  withMockHostname("127.0.0.1", () => {
    assert.equal(cookieDomain(), "");
  });
});

test("cookieDomain returns '' for *.local mDNS hostnames", () => {
  withMockHostname("dev.local", () => {
    assert.equal(cookieDomain(), "");
  });
});

test("cookieDomain returns '.viralefy.com' for www.viralefy.com (cross-subdomain)", () => {
  withMockHostname("www.viralefy.com", () => {
    assert.equal(cookieDomain(), ".viralefy.com");
  });
});

test("cookieDomain returns '.viralefy.com' for app.viralefy.com (any subdomain)", () => {
  withMockHostname("app.viralefy.com", () => {
    assert.equal(cookieDomain(), ".viralefy.com");
  });
});

test("cookieDomain returns '.viralefy.com' even when called with bare apex", () => {
  // Edge: hostname="viralefy.com" — parts.slice(-2) still yields "viralefy.com"
  // so the cookie domain is the same. Verifies the .split(".") path is safe.
  withMockHostname("viralefy.com", () => {
    assert.equal(cookieDomain(), ".viralefy.com");
  });
});

test("cookieDomain handles ccTLDs like .com.br via last-two-parts heuristic", () => {
  // Heurística "last two parts" — pra .com.br vira ".com.br" mesmo, é uma
  // limitação conhecida (não cobre TLD de duas partes corretamente). Pinar
  // o comportamento ATUAL pra que mudança futura (PSL) seja explícita.
  withMockHostname("app.viralefy.com.br", () => {
    assert.equal(cookieDomain(), ".com.br");
  });
});

test("cookieDomain returns '' for single-label hostnames (e.g. intranet 'host')", () => {
  withMockHostname("host", () => {
    assert.equal(cookieDomain(), "");
  });
});

test("cookieDomain returns '' when window is undefined (SSR-safe)", () => {
  const prev = globalThis.window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete globalThis.window;
  try {
    assert.equal(cookieDomain(), "");
  } finally {
    if (prev !== undefined) globalThis.window = prev;
  }
});
