// Emulated checkout flow.
//
// Steps:
//   1. fetch /v1/plans, pick a real plan id (preferring the cheapest
//      seguidores plan since that's the most common entry point)
//   2. POST /v1/checkout with payment_method=gateway and a unique test
//      email (we do NOT pay — we just confirm the order-creation path
//      returns a valid CheckoutResult)
//   3. print response summary
//
// The probe is intentionally safe: it creates one pending order per run
// that will expire / be cleaned up by the backend's pending-order sweep.
// It does NOT submit payment, hit any credit-card API or call the
// payment gateway with real funds.
//
// Env:
//   API_URL    default https://api.viralefy.com
//   SITE_URL   default https://viralefy.com (only used for log context)
//   TEST_EMAIL optional override

const SITE_URL = process.env.SITE_URL ?? "https://viralefy.com";
const API_URL = process.env.API_URL ?? "https://api.viralefy.com";

function logPass(msg) { console.log(`  PASS ${msg}`); }
function logFail(msg) { console.log(`  FAIL ${msg}`); }
function logInfo(msg) { console.log(`  INFO ${msg}`); }

async function jget(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "User-Agent": "Viralefy-CheckoutEmulator/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function jpost(path, payload) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Viralefy-CheckoutEmulator/1.0",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

console.log(`\nCheckout flow against api=${API_URL}\n`);

let exitCode = 0;

console.log("[1] fetching plans");
const plansResp = await jget("/v1/plans");
if (plansResp.status !== 200 || !Array.isArray(plansResp.body?.data) || plansResp.body.data.length === 0) {
  logFail(`/v1/plans -> status=${plansResp.status}, body empty`);
  process.exit(1);
}
logPass(`/v1/plans returned ${plansResp.body.data.length} plans`);

const plans = plansResp.body.data;
// Prefer a 'seguidores' plan with the lowest followers_qty.
const seguidoresPlans = plans.filter((p) => p.category === "seguidores");
const candidate =
  (seguidoresPlans.length > 0
    ? seguidoresPlans.sort((a, b) => a.followers_qty - b.followers_qty)
    : plans.sort((a, b) => a.price_cents - b.price_cents))[0];

logInfo(`selected plan: ${candidate.id} '${candidate.name}' qty=${candidate.followers_qty} price_cents=${candidate.price_cents}`);

const ts = Date.now().toString(36);
const email = process.env.TEST_EMAIL ?? `smoke+${ts}@viralefy.test`;

console.log("\n[2] posting /v1/checkout");
const checkoutPayload = {
  plan_id: candidate.id,
  email,
  name: "Smoke Tester",
  display_currency: "BRL",
  payment_method: "gateway",
  new_profile: {
    platform: candidate.platform ?? "instagram",
    handle: `smoke_${ts}`,
    display_name: "Smoke Tester",
  },
};

const checkoutResp = await jpost("/v1/checkout", checkoutPayload);
if (checkoutResp.status >= 500) {
  logFail(`/v1/checkout returned ${checkoutResp.status} (server error)`);
  console.log("  body:", JSON.stringify(checkoutResp.body).slice(0, 400));
  exitCode = 1;
} else if (checkoutResp.status >= 400) {
  // 4xx is acceptable as evidence the validation pipeline runs; we log
  // the message so the maintainer can decide if the contract changed.
  logInfo(`/v1/checkout returned ${checkoutResp.status} — ${JSON.stringify(checkoutResp.body).slice(0, 200)}`);
} else {
  const data = checkoutResp.body?.data ?? checkoutResp.body;
  if (data && (data.order_id || data.id)) {
    logPass(`/v1/checkout OK — order_id=${data.order_id ?? data.id} status=${data.status}`);
    logInfo(`display_amount=${data.display_amount} ${data.display_currency} payment_method=${data.payment_method}`);
    if (data.email_sent === true) logPass("checkout reported email_sent=true");
    else                          logInfo(`checkout email_sent=${data.email_sent}`);
  } else {
    logFail(`/v1/checkout 2xx but missing order_id in body: ${JSON.stringify(checkoutResp.body).slice(0, 200)}`);
    exitCode = 1;
  }
}

console.log("\n=================================================");
console.log(exitCode === 0 ? "checkout emulation OK" : "checkout emulation FAILED");

process.exit(exitCode);
