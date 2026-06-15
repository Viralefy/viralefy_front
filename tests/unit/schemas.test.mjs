// Unit tests para os Zod schemas de boundary (Fase 8.3).
//
// Cobertura: 5+ positivos (parses válidos) e 5+ negativos (rejeições).
// Cada negativo verifica que parseOr produz uma mensagem que cita o
// path do campo problemático — isso garante que erro de produção em
// console/Sentry seja diagnosticável.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PlanSchema,
  CategorySchema,
  CurrencySchema,
  CheckoutResultSchema,
  CouponPreviewSchema,
  OrderSchema,
  OrderDetailSchema,
  SessionSchema,
  UserSchema,
  NotifPrefsSchema,
  SubscriptionSchema,
  parseOr,
} from "../../src/lib/schemas.ts";

// ---------- Positivos ----------

test("PlanSchema accepts a full valid plan", () => {
  const plan = {
    id: "p1",
    name: "1k Followers",
    description: "Real-looking accounts",
    category: "seguidores",
    platform: "instagram",
    target_type: "profile",
    followers_qty: 1000,
    price_cents: 990,
    currency: "USD",
    active: true,
    sort_order: 1,
    prices: { USD: "9.90", USDT: "9.90" },
    aggregate_rating: {
      rating_value: 4.7,
      review_count: 23,
      best_rating: 5,
      worst_rating: 1,
    },
  };
  const out = parseOr(PlanSchema, plan, "/v1/plans");
  assert.equal(out.id, "p1");
  assert.equal(out.platform, "instagram");
});

test("PlanSchema accepts plan without aggregate_rating (null)", () => {
  const plan = {
    id: "p2",
    name: "n",
    description: "",
    category: "c",
    platform: "tiktok",
    target_type: "publication",
    followers_qty: 0,
    price_cents: 0,
    currency: "USD",
    active: false,
    sort_order: 0,
    prices: {},
    aggregate_rating: null,
  };
  const out = parseOr(PlanSchema, plan, "/v1/plans");
  assert.equal(out.aggregate_rating, null);
});

test("CategorySchema accepts minimal category", () => {
  const out = parseOr(
    CategorySchema,
    { code: "seguidores", label: "Followers", sort_order: 1 },
    "/v1/categories",
  );
  assert.equal(out.code, "seguidores");
});

test("CurrencySchema accepts USDT crypto entry", () => {
  const out = parseOr(
    CurrencySchema,
    {
      code: "USDT",
      name: "Tether",
      symbol: "$",
      rate: 1,
      decimals: 2,
      kind: "crypto",
      settlement_code: "USDT",
    },
    "/v1/currencies",
  );
  assert.equal(out.kind, "crypto");
});

test("CheckoutResultSchema accepts gateway payment with optional fields absent", () => {
  const out = parseOr(
    CheckoutResultSchema,
    {
      order_id: "o1",
      status: "pending",
      plan_name: "1k",
      display_currency: "USD",
      display_symbol: "$",
      display_amount: "9.90",
      settlement_currency: "USDT",
      settlement_symbol: "$",
      settlement_amount: "9.90",
      account_created: true,
      email: "x@y.com",
      email_sent: true,
      payment_method: "gateway",
    },
    "/v1/checkout",
  );
  assert.equal(out.payment_method, "gateway");
  assert.equal(out.gateway_provider, undefined);
});

test("SessionSchema accepts session with nested user", () => {
  // Contrato real (round 17+): o auth-service Go retorna access_token /
  // access_expires_at (não token / expires_at) e UserView usa PascalCase
  // por causa do encoding/json default do Go (ID/Email/Name/Phone/Telegram).
  // Login unificado: subject_kind distingue "user" de "admin"; quando 2FA
  // está ativo, twofa_required=true e token/user vêm omitidos até o
  // segundo passo (completeUserLoginTwoFA).
  const out = parseOr(
    SessionSchema,
    {
      access_token: "tok",
      access_expires_at: "2026-12-31T00:00:00Z",
      subject_kind: "user",
      user: { ID: "u1", Email: "a@b.com", Name: "Ada" },
    },
    "/v1/auth/user/login",
  );
  assert.equal(out.user.ID, "u1");
});

test("OrderSchema accepts order with ticket_id explicitly null", () => {
  const out = parseOr(
    OrderSchema,
    {
      id: "o1",
      plan_id: "p1",
      plan_name: "n",
      plan_category: "seguidores",
      status: "paid",
      amount_cents: 990,
      currency: "USD",
      ticket_id: null,
      display_currency: "USD",
      display_amount: "9.90",
      settlement_currency: "USDT",
      settlement_amount: "9.90",
      created_at: "2026-06-07T00:00:00Z",
    },
    "/v1/me/orders",
  );
  assert.equal(out.ticket_id, null);
});

test("OrderDetailSchema accepts JSONB metrics with arbitrary keys", () => {
  const out = parseOr(
    OrderDetailSchema,
    {
      id: "o1",
      user_id: "u1",
      plan_id: "p1",
      status: "delivered",
      amount_cents: 990,
      currency: "USD",
      display_currency: "USD",
      display_amount: "9.90",
      settlement_currency: "USDT",
      settlement_amount: "9.90",
      payment_method: "gateway",
      credits_used_cents: 0,
      baseline_metrics: { followers: 1234, future_field: "anything" },
      delivery_metrics: null,
      created_at: "2026-06-07T00:00:00Z",
      updated_at: "2026-06-07T00:00:00Z",
    },
    "/v1/me/orders/o1",
  );
  assert.equal(out.baseline_metrics.followers, 1234);
});

test("NotifPrefsSchema accepts all four toggles", () => {
  const out = parseOr(
    NotifPrefsSchema,
    {
      order_updates: true,
      marketing: false,
      reviews: true,
      cart_recovery: false,
    },
    "/v1/me/notif-prefs",
  );
  assert.equal(out.order_updates, true);
});

test("CouponPreviewSchema parses a discount preview", () => {
  const out = parseOr(
    CouponPreviewSchema,
    {
      code: "FRIEND10",
      discount_usd_cents: 100,
      final_usd_cents: 890,
      description: "10% off",
    },
    "/v1/coupons/validate",
  );
  assert.equal(out.code, "FRIEND10");
});

test("SubscriptionSchema accepts an active subscription", () => {
  const out = parseOr(
    SubscriptionSchema,
    {
      id: "s1",
      user_id: "u1",
      plan_id: "p1",
      status: "active",
      current_period_start: "2026-06-01T00:00:00Z",
      current_period_end: "2026-07-01T00:00:00Z",
      amount_cents: 4990,
      currency: "USD",
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-01T00:00:00Z",
    },
    "/v1/me/subscriptions",
  );
  assert.equal(out.status, "active");
});

// ---------- Negativos ----------

test("PlanSchema rejects missing required field (price_cents)", () => {
  const bad = {
    id: "p1",
    name: "n",
    description: "",
    category: "c",
    platform: "instagram",
    target_type: "profile",
    followers_qty: 1000,
    // price_cents missing
    currency: "USD",
    active: true,
    sort_order: 1,
    prices: {},
  };
  assert.throws(
    () => parseOr(PlanSchema, bad, "/v1/plans"),
    /Invalid \/v1\/plans response.*price_cents/,
  );
});

test("PlanSchema rejects invalid platform enum value", () => {
  const bad = {
    id: "p1",
    name: "n",
    description: "",
    category: "c",
    platform: "facebook", // not allowed
    target_type: "profile",
    followers_qty: 1,
    price_cents: 1,
    currency: "USD",
    active: true,
    sort_order: 1,
    prices: {},
  };
  assert.throws(
    () => parseOr(PlanSchema, bad, "/v1/plans"),
    /platform/,
  );
});

test("CategorySchema rejects sort_order as string", () => {
  assert.throws(
    () =>
      parseOr(
        CategorySchema,
        { code: "x", label: "X", sort_order: "1" },
        "/v1/categories",
      ),
    /sort_order/,
  );
});

test("CurrencySchema rejects when rate is a string", () => {
  assert.throws(
    () =>
      parseOr(
        CurrencySchema,
        {
          code: "USD",
          name: "Dollar",
          symbol: "$",
          rate: "1.0", // should be number
          decimals: 2,
          kind: "fiat",
          settlement_code: "USD",
        },
        "/v1/currencies",
      ),
    /rate/,
  );
});

test("CheckoutResultSchema rejects invalid payment_method enum", () => {
  const bad = {
    order_id: "o1",
    status: "pending",
    plan_name: "n",
    display_currency: "USD",
    display_symbol: "$",
    display_amount: "1",
    settlement_currency: "USDT",
    settlement_symbol: "$",
    settlement_amount: "1",
    account_created: true,
    email: "a@b",
    email_sent: true,
    payment_method: "bank_transfer", // not allowed
  };
  assert.throws(
    () => parseOr(CheckoutResultSchema, bad, "/v1/checkout"),
    /payment_method/,
  );
});

test("SessionSchema rejects when nested user has wrong shape", () => {
  // No contrato atual `user` é opcional (twofa_required=true pode omiti-lo),
  // então a ausência não é erro. O que continua sendo erro é um user PRESENTE
  // com shape errado (faltando ID/Email/Name obrigatórios do UserView do Go).
  assert.throws(
    () =>
      parseOr(
        SessionSchema,
        {
          access_token: "t",
          access_expires_at: "2026-01-01T00:00:00Z",
          subject_kind: "user",
          user: { id: "u1" }, // camelCase + faltam Email/Name → inválido
        },
        "/v1/auth/user/login",
      ),
    /user/,
  );
});

test("UserSchema rejects null instead of object", () => {
  assert.throws(
    () => parseOr(UserSchema, null, "/v1/me"),
    /Invalid \/v1\/me response/,
  );
});

test("NotifPrefsSchema rejects extra string in place of boolean", () => {
  assert.throws(
    () =>
      parseOr(
        NotifPrefsSchema,
        {
          order_updates: "yes", // not a boolean
          marketing: false,
          reviews: false,
          cart_recovery: false,
        },
        "/v1/me/notif-prefs",
      ),
    /order_updates/,
  );
});

test("OrderSchema rejects when amount_cents missing", () => {
  const bad = {
    id: "o1",
    plan_id: "p1",
    plan_name: "n",
    plan_category: "c",
    status: "paid",
    // amount_cents missing
    currency: "USD",
    display_currency: "USD",
    display_amount: "1",
    settlement_currency: "USDT",
    settlement_amount: "1",
    created_at: "now",
  };
  assert.throws(
    () => parseOr(OrderSchema, bad, "/v1/me/orders"),
    /amount_cents/,
  );
});

test("SubscriptionSchema rejects unknown status enum", () => {
  const bad = {
    id: "s1",
    user_id: "u1",
    plan_id: "p1",
    status: "frozen", // not in enum
    current_period_start: "x",
    current_period_end: "y",
    amount_cents: 1,
    currency: "USD",
    created_at: "x",
    updated_at: "y",
  };
  assert.throws(
    () => parseOr(SubscriptionSchema, bad, "/v1/me/subscriptions"),
    /status/,
  );
});

test("parseOr error message includes the request context for triage", () => {
  try {
    parseOr(
      CategorySchema,
      { code: 123, label: "X", sort_order: 1 },
      "/v1/categories",
    );
    assert.fail("expected throw");
  } catch (err) {
    assert.match(err.message, /Invalid \/v1\/categories response/);
    assert.match(err.message, /code/);
  }
});
