// Unit tests para as melhorias de SEO orgânico / AIO (2026-07-26):
//   - novos builders de JSON-LD (FAQPage, HowTo, Review)
//   - dateModified ESTÁVEL (sem churn de `new Date()` sob ISR)
//   - helpers de imagem OG fallback
//   - lastmod REAL e estável no gerador de URLs do sitemap
//
// Importam os módulos REAIS via o ts-loader (resolve os aliases `@/`), então
// pinam o comportamento de produção — não uma cópia.

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SITE_URL = "https://viralefy.com";

import {
  buildFaqPageNode,
  buildHowToNode,
  buildReviewNodes,
  buildCountryJsonLd,
} from "../../src/lib/jsonld.ts";
import {
  SITE_CONTENT_VERSION,
  indexableDates,
  indexableMeta,
  ogFallbackImages,
  OG_FALLBACK_IMAGE,
} from "../../src/lib/seo-meta.ts";
import { allSiteUrls } from "../../src/lib/site-urls.ts";
import { getCountry } from "../../src/i18n/countries.ts";

const SITE = "https://viralefy.com";

// ---------- FAQPage ----------

test("buildFaqPageNode: monta FAQPage com Question/Answer", () => {
  const node = buildFaqPageNode([
    { q: "Is it safe?", a: "Yes, no password required." },
    { q: "How fast?", a: "Delivery starts within an hour." },
  ]);
  assert.equal(node["@type"], "FAQPage");
  assert.equal(node.mainEntity.length, 2);
  assert.equal(node.mainEntity[0]["@type"], "Question");
  assert.equal(node.mainEntity[0].name, "Is it safe?");
  assert.equal(node.mainEntity[0].acceptedAnswer["@type"], "Answer");
  assert.equal(node.mainEntity[0].acceptedAnswer.text, "Yes, no password required.");
});

test("buildFaqPageNode: devolve null quando vazio (caller omite o nó)", () => {
  assert.equal(buildFaqPageNode([]), null);
  assert.equal(buildFaqPageNode(undefined), null);
});

// ---------- HowTo ----------

test("buildHowToNode: passos ordenados com position + âncora deep-link", () => {
  const node = buildHowToNode({
    name: "How to buy",
    description: "Buying flow",
    url: `${SITE}/help/how-to-buy`,
    inLanguage: "en",
    steps: [
      { heading: "Pick a plan", body: "Open a plan card." },
      { heading: "Checkout", body: "Pay and confirm." },
    ],
  });
  assert.equal(node["@type"], "HowTo");
  assert.equal(node.step.length, 2);
  assert.equal(node.step[0]["@type"], "HowToStep");
  assert.equal(node.step[0].position, 1);
  assert.equal(node.step[0].name, "Pick a plan");
  assert.equal(node.step[1].position, 2);
  // Deep-link por passo casa com os id="step-N" renderizados na página.
  assert.equal(node.step[0].url, `${SITE}/help/how-to-buy#step-1`);
  assert.equal(node.step[1].url, `${SITE}/help/how-to-buy#step-2`);
});

// ---------- Review ----------

test("buildReviewNodes: nós Review reais, rating clamp, cap em max", () => {
  const reviews = Array.from({ length: 8 }, (_, i) => ({
    rating: i === 0 ? 9 : i === 1 ? 0 : 4, // 9 e 0 devem ser clampados
    title: `T${i}`,
    body: `B${i}`,
    author_name: `A${i}`,
    created_at: "2026-06-01T00:00:00Z",
  }));
  const nodes = buildReviewNodes(reviews, 5);
  assert.equal(nodes.length, 5, "capa em max=5");
  assert.equal(nodes[0]["@type"], "Review");
  assert.equal(nodes[0].reviewRating.ratingValue, 5, "9 → clamp em 5");
  assert.equal(nodes[1].reviewRating.ratingValue, 1, "0 → clamp em 1");
  assert.equal(nodes[0].author.name, "A0");
});

test("buildReviewNodes: lista vazia → []", () => {
  assert.deepEqual(buildReviewNodes([]), []);
});

// ---------- dateModified ESTÁVEL (anti-churn) ----------

test("buildCountryJsonLd: WebPage.dateModified === SITE_CONTENT_VERSION e é estável por render (anti-churn)", () => {
  const c = getCountry("br");
  assert.ok(c, "br existe");
  const webpageOf = (g) => g["@graph"].find((n) => n["@type"] === "WebPage");
  const first = webpageOf(buildCountryJsonLd(c, [], SITE));
  assert.ok(first, "tem WebPage");
  assert.equal(first.dateModified, SITE_CONTENT_VERSION,
    "dateModified vem da constante de versão do conteúdo, não de new Date()");
  // Anti-churn REAL: reconstruir (simula outra regeneração ISR) não muda a data.
  const second = webpageOf(buildCountryJsonLd(c, [], SITE));
  assert.equal(first.dateModified, second.dateModified,
    "dateModified não pode variar entre renders (seria churn de new Date())");
});

test("buildCountryJsonLd: com opts.faq → inclui FAQPage no @graph", () => {
  const c = getCountry("us");
  const graph = buildCountryJsonLd(c, [], SITE, {
    faq: [{ q: "Q?", a: "A." }],
  });
  const faq = graph["@graph"].find((n) => n["@type"] === "FAQPage");
  assert.ok(faq, "FAQPage presente quando faq é passado");
  assert.equal(faq.mainEntity[0].name, "Q?");
});

test("buildCountryJsonLd: sem faq → nenhum FAQPage (nó null filtrado)", () => {
  const c = getCountry("us");
  const graph = buildCountryJsonLd(c, [], SITE);
  assert.equal(graph["@graph"].some((n) => n["@type"] === "FAQPage"), false);
  // e nenhum nó nulo vaza pro @graph
  assert.equal(graph["@graph"].every(Boolean), true);
});

test("indexableDates/indexableMeta: dateModified default é a constante estável, nunca new Date()", () => {
  assert.equal(indexableDates().dateModified, SITE_CONTENT_VERSION);
  assert.equal(indexableMeta().other["article:modified_time"], SITE_CONTENT_VERSION);
  // modifiedAt explícito ainda é respeitado (help/case-studies passam data real).
  assert.equal(indexableDates({ modifiedAt: "2026-02-14T10:00:00Z" }).dateModified, "2026-02-14T10:00:00Z");
});

// ---------- OG fallback ----------

test("ogFallbackImages / OG_FALLBACK_IMAGE: shape 1200×630 apontando pra /og/global", () => {
  assert.equal(OG_FALLBACK_IMAGE, "/og/global");
  const imgs = ogFallbackImages("My Title");
  assert.equal(imgs.length, 1);
  assert.equal(imgs[0].url, "/og/global");
  assert.equal(imgs[0].width, 1200);
  assert.equal(imgs[0].height, 630);
  assert.equal(imgs[0].alt, "My Title");
});

// ---------- sitemap lastmod REAL e ESTÁVEL ----------

const urls = await allSiteUrls();

test("allSiteUrls: toda URL declara lastModified, exceto /status (que é force-dynamic)", () => {
  const missing = urls.filter((u) => !u.lastModified && !u.url.endsWith("/status"));
  assert.equal(missing.length, 0,
    `URLs sem lastModified: ${missing.slice(0, 3).map((u) => u.url).join(", ")}`);
  // /status intencionalmente sem lastmod
  const status = urls.find((u) => u.url.endsWith("/status"));
  assert.ok(status && !status.lastModified, "/status não declara lastmod");
});

test("allSiteUrls: help usa data real por tópico (não a versão global do conteúdo)", () => {
  const help = urls.find((u) => /\/help\/how-to-buy$/.test(u.url));
  assert.ok(help, "help/how-to-buy no sitemap");
  // help.updatedAt = 2026-06-05 → lastmod ≠ SITE_CONTENT_VERSION
  assert.notEqual(help.lastModified, SITE_CONTENT_VERSION);
  assert.match(help.lastModified, /^2026-06-05T/);
});

test("allSiteUrls: lastModified é ESTÁVEL entre chamadas (prova que não é new Date())", async () => {
  const again = await allSiteUrls();
  const a = urls.map((u) => u.lastModified ?? "").join("|");
  const b = again.map((u) => u.lastModified ?? "").join("|");
  assert.equal(a, b, "lastmod não pode variar entre regenerações (seria churn)");
});
