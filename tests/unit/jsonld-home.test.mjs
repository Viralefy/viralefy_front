// Tests for buildHomeJsonLd — the global home schema.
//
// Antes: home só tinha Organization + WebSite. Sem Service/Offer/AggregateOffer
// → zero rich result candidate. Agora emite Organization + WebSite + Service
// com AggregateOffer.offers contendo cada plano como rich-result Offer.

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SITE_URL = "https://www.viralefy.com";

import { buildHomeJsonLd } from "../../src/lib/jsonld.ts";

const SITE = "https://www.viralefy.com";

const PLANS = [
  {
    id: "p1",
    name: "100 followers Instagram",
    category: "seguidores_instagram",
    price_cents: 250,
    prices: { USD: "2.50" },
    followers_qty: 100,
  },
  {
    id: "p2",
    name: "1000 followers Instagram",
    category: "seguidores_instagram",
    price_cents: 1500,
    prices: { USD: "15.00" },
    followers_qty: 1000,
  },
  {
    id: "p3",
    name: "500 likes TikTok",
    category: "curtidas_tiktok",
    price_cents: 600,
    prices: { USD: "6.00" },
    followers_qty: 500,
  },
];

test("buildHomeJsonLd returns 3 blocks: Organization + WebSite + Service", () => {
  const blocks = buildHomeJsonLd(PLANS, SITE);
  assert.equal(blocks.length, 3);
  const types = blocks.map((b) => b["@type"]);
  assert.deepEqual(types, ["Organization", "WebSite", "Service"]);
});

test("every block carries @context = https://schema.org", () => {
  const blocks = buildHomeJsonLd(PLANS, SITE);
  for (const b of blocks) {
    assert.equal(b["@context"], "https://schema.org");
  }
});

test("Organization has logo as ImageObject with width + height", () => {
  const [org] = buildHomeJsonLd(PLANS, SITE);
  assert.equal(org.logo["@type"], "ImageObject");
  assert.equal(org.logo.url, `${SITE}/logo.png`);
  assert.ok(org.logo.width > 0);
  assert.ok(org.logo.height > 0);
});

test("Organization @id is stable, WebSite references it via publisher", () => {
  const [org, web] = buildHomeJsonLd(PLANS, SITE);
  assert.equal(org["@id"], `${SITE}/#organization`);
  assert.equal(web.publisher["@id"], `${SITE}/#organization`);
});

test("Service.offers is AggregateOffer with offerCount, lowPrice, highPrice", () => {
  const [, , service] = buildHomeJsonLd(PLANS, SITE);
  assert.ok(service.offers, "Service must declare offers");
  assert.equal(service.offers["@type"], "AggregateOffer");
  assert.equal(service.offers.priceCurrency, "USD");
  assert.equal(service.offers.offerCount, 3);
  // lowPrice = min of 2.50, 15.00, 6.00 = 2.50
  // highPrice = max = 15.00
  assert.equal(service.offers.lowPrice, "2.50");
  assert.equal(service.offers.highPrice, "15.00");
});

test("Service.offers.offers[] has one Offer per plan", () => {
  const [, , service] = buildHomeJsonLd(PLANS, SITE);
  const offers = service.offers.offers;
  assert.ok(Array.isArray(offers));
  assert.equal(offers.length, 3);
  for (const o of offers) {
    assert.equal(o["@type"], "Offer");
    assert.ok(o.name);
    assert.ok(o.sku);
    assert.ok(o.price);
    assert.equal(o.priceCurrency, "USD");
    assert.equal(o.availability, "https://schema.org/InStock");
  }
});

test("each Offer URL points to /us/<en-slug>/<qty>-<en-slug>", () => {
  const [, , service] = buildHomeJsonLd(PLANS, SITE);
  const offers = service.offers.offers;
  // p1: 100 followers Instagram → seguidores_instagram → instagram-followers
  assert.equal(offers[0].url, `${SITE}/us/instagram-followers/100-instagram-followers`);
  // p3: 500 likes TikTok → curtidas_tiktok → tiktok-likes
  assert.equal(offers[2].url, `${SITE}/us/tiktok-likes/500-tiktok-likes`);
});

test("each Offer carries an image (Google Merchant Listings requires it)", () => {
  const [, , service] = buildHomeJsonLd(PLANS, SITE);
  for (const o of service.offers.offers) {
    assert.ok(o.image, `Offer ${o.name} missing image`);
    assert.ok(o.image.includes("/og/"), `image must be the OG endpoint, got ${o.image}`);
  }
});

test("each Offer carries shippingDetails + hasMerchantReturnPolicy (Merchant Listings rich result fields)", () => {
  const [, , service] = buildHomeJsonLd(PLANS, SITE);
  for (const o of service.offers.offers) {
    assert.ok(o.shippingDetails, `Offer ${o.name} missing shippingDetails`);
    assert.equal(o.shippingDetails["@type"], "OfferShippingDetails");
    assert.ok(o.hasMerchantReturnPolicy, `Offer ${o.name} missing hasMerchantReturnPolicy`);
    assert.equal(o.hasMerchantReturnPolicy["@type"], "MerchantReturnPolicy");
  }
});

test("each Offer has priceValidUntil set to a future ISO date", () => {
  const [, , service] = buildHomeJsonLd(PLANS, SITE);
  const now = new Date();
  for (const o of service.offers.offers) {
    assert.match(o.priceValidUntil, /^\d{4}-\d{2}-\d{2}$/);
    const d = new Date(o.priceValidUntil + "T00:00:00Z");
    assert.ok(d.getTime() > now.getTime(), `priceValidUntil must be in the future`);
  }
});

test("Service.areaServed is global Place 'Worldwide'", () => {
  const [, , service] = buildHomeJsonLd(PLANS, SITE);
  assert.equal(service.areaServed["@type"], "Place");
  assert.equal(service.areaServed.name, "Worldwide");
});

test("buildHomeJsonLd with empty plans still emits 3 blocks (no AggregateOffer)", () => {
  const blocks = buildHomeJsonLd([], SITE);
  assert.equal(blocks.length, 3);
  const [, , service] = blocks;
  assert.equal(service.offers, undefined, "empty catalog → no offers block");
});

test("categorySlugEn maps every supported category (regression: unsupported keys would break Offer URLs)", () => {
  const supported = [
    "seguidores_instagram", "seguidores_tiktok",
    "curtidas_instagram", "curtidas_tiktok",
    "comentarios_instagram", "comentarios_tiktok",
    "compartilhamentos_instagram", "compartilhamentos_tiktok",
    "visualizacoes_instagram", "visualizacoes_tiktok",
    "servicos",
    "recuperacao_perfil", "bms_facebook", "perfis_redes", "emails_validados",
  ];
  // Cobre testando que cada categoria produz uma URL contendo '/us/' + algum slug.
  for (const cat of supported) {
    const blocks = buildHomeJsonLd([
      { id: "x", name: "n", category: cat, price_cents: 100, prices: { USD: "1.00" }, followers_qty: 100 },
    ], SITE);
    const offer = blocks[2].offers.offers[0];
    assert.ok(offer.url.includes("/us/"), `category ${cat} produced bad URL: ${offer.url}`);
    assert.ok(!offer.url.includes(cat), `category ${cat} not mapped to en slug — URL contains raw key: ${offer.url}`);
  }
});

test("regression: home schema NEVER omits Product/Offer info (the Ahrefs gap)", () => {
  const blocks = buildHomeJsonLd(PLANS, SITE);
  // Antes a home só tinha Organization + WebSite. Esse teste falha se a
  // regressão voltar.
  const hasOfferOrService = blocks.some(
    (b) => b["@type"] === "Service" || b["@type"] === "AggregateOffer" || b["@type"] === "Offer",
  );
  assert.ok(hasOfferOrService, "home must emit Service/Offer/AggregateOffer for rich results");
});
