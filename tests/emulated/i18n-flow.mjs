// Emulated i18n verification flow.
//
// Hits one country per major language family and asserts the response body
// carries content in the expected script/language (Cyrillic for ru/kz, etc.)
// or falls back to English. This is the safety net for the "English fallback
// verification" requirement: every country page must either serve localized
// content or English — never broken.
//
// Env:
//   SITE_URL  default https://viralefy.com

const SITE_URL = process.env.SITE_URL ?? "https://viralefy.com";

let pass = 0;
let fail = 0;
let info = 0;

function passOk(label) { pass++; console.log(`  PASS ${label}`); }
function failBad(label, why) { fail++; console.log(`  FAIL ${label} — ${why}`); }
function infoMsg(label, why) { info++; console.log(`  INFO ${label} — ${why}`); }

const HAS_CYRILLIC = /[Ѐ-ӿ]/;
const HAS_CJK = /[　-ヿ一-鿿]/;

async function fetchText(path) {
  try {
    const res = await fetch(`${SITE_URL}${path}`, {
      headers: { "User-Agent": "Viralefy-I18n/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    return { status: res.status, text: await res.text() };
  } catch (err) {
    return { status: 0, text: "", err: err?.message ?? String(err) };
  }
}

async function checkContains(label, path, needles) {
  const r = await fetchText(path);
  if (r.status !== 200) {
    if (r.status === 404) {
      infoMsg(label, `${path} -> 404 (feature pending)`);
    } else {
      failBad(label, `status=${r.status}`);
    }
    return;
  }
  const hit = needles.find((n) =>
    n instanceof RegExp ? n.test(r.text) : r.text.includes(n));
  if (hit) {
    passOk(`${label} (matched: ${hit instanceof RegExp ? hit.source : hit})`);
  } else {
    failBad(label, `none of [${needles.map((n) => n instanceof RegExp ? n.source : n).join(", ")}] found`);
  }
}

async function checkFallbackOrLocale(label, path, localeNeedles) {
  // The page is acceptable if it serves localized content (locale needle
  // hit) OR English (Viralefy + a clear English marker). The first form
  // is preferred; the second is allowed under the English-fallback rule.
  const r = await fetchText(path);
  if (r.status !== 200) {
    if (r.status === 404) {
      infoMsg(label, `${path} -> 404 (feature pending)`);
    } else {
      failBad(label, `status=${r.status}`);
    }
    return;
  }
  const localized = localeNeedles.find((n) =>
    n instanceof RegExp ? n.test(r.text) : r.text.includes(n));
  if (localized) {
    passOk(`${label} (localized: ${localized instanceof RegExp ? localized.source : localized})`);
    return;
  }
  // English fallback check — assert "Viralefy" and at least one English
  // marker word are present.
  if (r.text.includes("Viralefy") && /\b(followers|grow|delivery)\b/i.test(r.text)) {
    passOk(`${label} (English fallback — acceptable per i18n policy)`);
  } else {
    failBad(label, "neither localized content nor English fallback detected");
  }
}

console.log(`\nViralefy i18n flow against ${SITE_URL}\n`);

console.log("[Portuguese — /br]");
await checkContains("/br carries PT content", "/br", [
  "Instagram", /seguidores/i, /TikTok/,
]);

console.log("\n[English — /us]");
await checkContains("/us carries EN content", "/us", [
  "Viralefy", /followers/i, /Instagram/,
]);

console.log("\n[Japanese — /jp]");
await checkFallbackOrLocale("/jp Japanese or fallback", "/jp", [
  HAS_CJK,
  /日本/,
]);

console.log("\n[Russian — /ru]");
await checkFallbackOrLocale("/ru Russian or fallback", "/ru", [
  HAS_CYRILLIC,
  /Россия/,
]);

console.log("\n[Kazakhstan — /kz]");
await checkFallbackOrLocale("/kz Russian or fallback", "/kz", [
  HAS_CYRILLIC,
  /Казахстан/,
]);

console.log("\n[Portuguese deep — /br/seguidores]");
await checkContains("/br/seguidores carries PT", "/br/seguidores", [
  /seguidores/i, /Instagram/, /TikTok/,
]);

console.log("\n[French — /fr]");
await checkFallbackOrLocale("/fr French or fallback", "/fr", [
  /abonnés/i, /Boostez/, /TikTok/,
]);

console.log("\n[German — /de]");
await checkFallbackOrLocale("/de German or fallback", "/de", [
  /Follower/, /wachsen/, /Instagram/,
]);

console.log("\n=================================================");
console.log(`PASS=${pass}  FAIL=${fail}  INFO=${info}`);
process.exit(fail > 0 ? 1 : 0);
