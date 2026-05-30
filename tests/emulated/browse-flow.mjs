// Emulated user browse flow: hits a small subset of the public surface in
// the same order a human would (home -> country -> category -> plan) and
// pings the public API. Each step prints PASS/FAIL with the HTTP status.
// Exits 1 on the first hard failure; 0 if everything passes.
//
// Env:
//   SITE_URL  default https://viralefy.com
//   API_URL   default https://api.viralefy.com

const SITE_URL = process.env.SITE_URL ?? "https://viralefy.com";
const API_URL = process.env.API_URL ?? "https://api.viralefy.com";

let pass = 0;
let fail = 0;

function passOk(label) { pass++; console.log(`  PASS ${label}`); }
function failBad(label, why) { fail++; console.log(`  FAIL ${label} — ${why}`); }

async function getOk(label, url, opts = {}) {
  const { mustContain, expectStatus = 200, json = false, jsonShape } = opts;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Viralefy-Emulated/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status !== expectStatus) {
      failBad(label, `status=${res.status} want ${expectStatus}`);
      return null;
    }
    if (json) {
      const body = await res.json();
      if (typeof jsonShape === "function" && !jsonShape(body)) {
        failBad(label, `json shape rejected by check`);
        return null;
      }
      passOk(`${label} (${res.status})`);
      return body;
    }
    const text = await res.text();
    if (mustContain && !text.includes(mustContain)) {
      failBad(label, `body missing '${mustContain}'`);
      return null;
    }
    passOk(`${label} (${res.status}, ${text.length} bytes)`);
    return text;
  } catch (err) {
    failBad(label, `request failed: ${err?.message ?? err}`);
    return null;
  }
}

console.log(`\nBrowse flow against site=${SITE_URL} api=${API_URL}\n`);

console.log("[front-end]");
await getOk("GET /",                        `${SITE_URL}/`,                                  { mustContain: "Viralefy" });
await getOk("GET /br",                      `${SITE_URL}/br`,                                { mustContain: "Instagram" });
await getOk("GET /br/seguidores",           `${SITE_URL}/br/seguidores`);
await getOk("GET /br/seguidores/1000-...",  `${SITE_URL}/br/seguidores/1000-seguidores`);
await getOk("GET /us/followers",            `${SITE_URL}/us/followers`);

console.log("\n[public API]");
const plans = await getOk("GET /v1/plans", `${API_URL}/v1/plans`, {
  json: true,
  jsonShape: (body) =>
    body && Array.isArray(body.data) && body.data.length >= 1,
});

await getOk("GET /v1/categories", `${API_URL}/v1/categories`, {
  json: true,
  jsonShape: (body) => {
    if (!body || !Array.isArray(body.data)) return false;
    // We expect 4 canonical categories. Allow >= 4 in case backend is in
    // mid-migration with extras.
    return body.data.length >= 4;
  },
});

await getOk("GET /v1/currencies", `${API_URL}/v1/currencies`, {
  json: true,
  jsonShape: (body) => body && Array.isArray(body.data) && body.data.length >= 1,
});

console.log("\n=================================================");
console.log(`PASS=${pass}  FAIL=${fail}`);

if (plans && plans.data && plans.data[0]) {
  console.log(`(plans sample: id=${plans.data[0].id} name='${plans.data[0].name}')`);
}

process.exit(fail > 0 ? 1 : 0);
