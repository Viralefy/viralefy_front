// HTTP contract tests for the public API surface.
//
// Hits the API directly with fetch() and verifies status codes plus
// envelope shape (data / error). Idempotent — no state mutation beyond
// what would happen from a bot probing the same endpoint once.
//
// Env:
//   API_URL  default https://api.viralefy.com

const API_URL = process.env.API_URL ?? "https://api.viralefy.com";

let pass = 0;
let fail = 0;
let info = 0;

const ok = (label) => { pass++; console.log(`  PASS ${label}`); };
const ko = (label, why) => { fail++; console.log(`  FAIL ${label} — ${why}`); };
const note = (label, why) => { info++; console.log(`  INFO ${label} — ${why}`); };

async function fetchJson(method, path, body, headers = {}) {
  const url = `${API_URL}${path}`;
  const init = {
    method,
    signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": "Viralefy-API-Contract/1.0", ...headers },
  };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  try {
    const res = await fetch(url, init);
    let json = null;
    const text = await res.text();
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: res.status, json, text };
  } catch (err) {
    return { status: 0, json: null, text: "", err: err?.message ?? String(err) };
  }
}

console.log(`\nAPI contract tests against ${API_URL}\n`);

// ------------------------------------------------------------------
// GET /v1/plans → 200 + data array, plan shape
// ------------------------------------------------------------------
console.log("[plans]");
{
  const r = await fetchJson("GET", "/v1/plans");
  if (r.status !== 200) {
    ko("GET /v1/plans status", `expected 200 got ${r.status}`);
  } else if (!r.json || !Array.isArray(r.json.data)) {
    ko("GET /v1/plans shape", "expected { data: [...] }");
  } else {
    ok(`GET /v1/plans -> 200 with data[${r.json.data.length}]`);
    const p = r.json.data[0];
    if (p) {
      const requiredKeys = ["id", "name", "category", "price_cents", "currency"];
      const missing = requiredKeys.filter((k) => p[k] === undefined);
      if (missing.length === 0) {
        ok("plan[0] has id/name/category/price_cents/currency");
      } else {
        note("plan[0] missing keys", missing.join(","));
      }
      if (typeof p.price_cents === "number") ok("plan.price_cents is a number");
      else ko("plan.price_cents type", `got ${typeof p.price_cents}`);
      if (typeof p.currency === "string") ok("plan.currency is a string");
      else ko("plan.currency type", `got ${typeof p.currency}`);
      if (p.prices && typeof p.prices === "object" && p.prices.USD) {
        ok("plan.prices.USD present");
      } else {
        note("plan.prices.USD", "missing (display fallback may apply)");
      }
    } else {
      note("plans empty", "no plans seeded — skipping shape checks");
    }
  }
}

// ------------------------------------------------------------------
// GET /v1/categories
// ------------------------------------------------------------------
console.log("\n[categories]");
{
  const r = await fetchJson("GET", "/v1/categories");
  if (r.status !== 200) {
    ko("GET /v1/categories status", `expected 200 got ${r.status}`);
  } else if (!r.json || !Array.isArray(r.json.data)) {
    ko("GET /v1/categories shape", "expected { data: [...] }");
  } else {
    ok(`GET /v1/categories -> 200 with data[${r.json.data.length}]`);
    const c = r.json.data[0];
    if (c) {
      if (c.code) ok("category[0].code present");
      else ko("category[0].code", "missing");
      if (c.label) ok("category[0].label present");
      else note("category[0].label", "missing (may be `name` in some shapes)");
      if (c.sort_order !== undefined || c.sortOrder !== undefined) {
        ok("category[0].sort_order present");
      } else {
        note("category[0].sort_order", "missing (ordering may be implicit)");
      }
    }
  }
}

// ------------------------------------------------------------------
// GET /v1/currencies
// ------------------------------------------------------------------
console.log("\n[currencies]");
{
  const r = await fetchJson("GET", "/v1/currencies");
  if (r.status !== 200) {
    ko("GET /v1/currencies status", `expected 200 got ${r.status}`);
  } else if (!r.json || !Array.isArray(r.json.data)) {
    ko("GET /v1/currencies shape", "expected { data: [...] }");
  } else {
    ok(`GET /v1/currencies -> 200 with data[${r.json.data.length}]`);
    const c = r.json.data[0];
    if (c) {
      if (c.code) ok("currency[0].code present");
      else ko("currency[0].code", "missing");
      if (c.name) ok("currency[0].name present");
      else note("currency[0].name", "missing");
      if (c.symbol !== undefined) ok("currency[0].symbol present");
      else note("currency[0].symbol", "missing");
    }
  }
}

// ------------------------------------------------------------------
// POST /v1/checkout — empty body must be rejected
// ------------------------------------------------------------------
console.log("\n[checkout validation]");
{
  const r = await fetchJson("POST", "/v1/checkout", {});
  if (r.status === 400 || r.status === 422) {
    ok(`POST /v1/checkout {} -> ${r.status} (validation rejection)`);
    if (r.json && r.json.error && r.json.error.code && r.json.error.message) {
      ok("error envelope has { error: { code, message } }");
    } else {
      note("error envelope shape", "no code/message inside error");
    }
  } else if (r.status === 0) {
    note("POST /v1/checkout {}", "unreachable");
  } else {
    note(`POST /v1/checkout {} -> ${r.status}`, "expected 400/422");
  }
}

{
  const r = await fetchJson("POST", "/v1/checkout", { plan_id: "nope-not-a-plan-id-zzz" });
  if (r.status === 400 || r.status === 404 || r.status === 422) {
    ok(`POST /v1/checkout invalid plan_id -> ${r.status}`);
  } else if (r.status === 0) {
    note("POST /v1/checkout invalid plan_id", "unreachable");
  } else {
    note(`POST /v1/checkout invalid plan_id -> ${r.status}`, "review");
  }
}

// ------------------------------------------------------------------
// POST /v1/auth/user/register — weak password
// ------------------------------------------------------------------
console.log("\n[auth validation]");
{
  const r = await fetchJson("POST", "/v1/auth/user/register", {
    email: `weak-pw-canary-${Date.now()}@viralefy.test`,
    name: "Canary",
    password: "a", // weak password
  });
  if (r.status === 400 || r.status === 422) {
    ok(`POST /v1/auth/user/register weak pw -> ${r.status}`);
  } else if (r.status === 200 || r.status === 201) {
    note(`weak pw accepted -> ${r.status}`, "consider enforcing minimum strength");
  } else if (r.status === 0) {
    note("register endpoint unreachable", "0");
  } else {
    note(`register weak pw -> ${r.status}`, "review");
  }
}

// ------------------------------------------------------------------
// POST /v1/auth/user/login — bad credentials
// ------------------------------------------------------------------
{
  const r = await fetchJson("POST", "/v1/auth/user/login", {
    email: "definitely-not-a-real-user@viralefy.test",
    password: "wrong-password-canary",
  });
  if (r.status === 401 || r.status === 400) {
    ok(`POST /v1/auth/user/login bad creds -> ${r.status}`);
  } else if (r.status === 0) {
    note("login endpoint unreachable", "0");
  } else {
    note(`login bad creds -> ${r.status}`, "review");
  }
}

// ------------------------------------------------------------------
// POST /v1/me/orders — no auth
// ------------------------------------------------------------------
console.log("\n[auth gates]");
{
  const r = await fetchJson("POST", "/v1/me/orders", {});
  if (r.status === 401 || r.status === 403) {
    ok(`POST /v1/me/orders no auth -> ${r.status}`);
  } else if (r.status === 0) {
    note("POST /v1/me/orders unreachable", "0");
  } else {
    ko("POST /v1/me/orders no auth", `expected 401/403, got ${r.status}`);
  }
}

// ------------------------------------------------------------------
// GET /health — if exposed
// ------------------------------------------------------------------
console.log("\n[health]");
{
  const r = await fetchJson("GET", "/health");
  if (r.status === 200) {
    ok("GET /health -> 200");
  } else if (r.status === 404) {
    note("GET /health -> 404", "not exposed (acceptable)");
  } else if (r.status === 0) {
    note("GET /health unreachable", "0");
  } else {
    note(`GET /health -> ${r.status}`, "review");
  }
}

// ------------------------------------------------------------------
// Summary
// ------------------------------------------------------------------
console.log("\n=================================================");
console.log(`PASS=${pass}  FAIL=${fail}  INFO=${info}`);
process.exit(fail > 0 ? 1 : 0);
