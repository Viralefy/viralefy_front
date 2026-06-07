// Zod schemas para boundaries da API (Fase 8.3).
//
// Os types em lib/api.ts são a forma "final" desejada no front. Aqui
// definimos schemas Zod que validam o payload bruto vindo de json.data
// ANTES de tipar como T. Vantagens:
//   - Falhamos cedo com erro descritivo quando o backend muda contrato
//     ou um campo vem null/undefined onde esperávamos string.
//   - Type-safety real em runtime (não só em compile-time).
//   - Um único ponto de manutenção: se o backend evolui, só este arquivo
//     muda + os types em api.ts.
//
// Notas de escolha:
//   - Usei Zod 3 (estável). Valibot tem bundle menor mas não temos pressão
//     de bundle no front hoje; fica como follow-up.
//   - Para Record<string, X> uso z.record(z.string(), X). Compatível Zod 3.
//   - Schemas são "loose" onde o backend ainda evolui (passthrough() em
//     objetos JSONB tipo metrics, tracking, etc.) — não queremos quebrar
//     o front toda vez que o backend adiciona uma chave nova.
//   - String literals (enums) usam z.enum() pra rejeitar valores fora
//     do conjunto conhecido.

import { z } from "zod";

// ---------- Primitives & shared ----------

export const PlatformSchema = z.enum(["instagram", "tiktok"]);
export const TargetTypeSchema = z.enum(["profile", "publication"]);

export const AggregateRatingSchema = z.object({
  rating_value: z.number(),
  review_count: z.number(),
  best_rating: z.number(),
  worst_rating: z.number(),
});

export const PublicReviewSchema = z.object({
  rating: z.number(),
  title: z.string(),
  body: z.string(),
  author_name: z.string(),
  created_at: z.string(),
});

// ---------- Plan / Category / Currency ----------

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  platform: PlatformSchema,
  target_type: TargetTypeSchema,
  followers_qty: z.number(),
  price_cents: z.number(),
  currency: z.string(),
  active: z.boolean(),
  sort_order: z.number(),
  prices: z.record(z.string(), z.string()),
  aggregate_rating: AggregateRatingSchema.nullable().optional(),
});

export const CategorySchema = z.object({
  code: z.string(),
  label: z.string(),
  sort_order: z.number(),
});

export const CurrencySchema = z.object({
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
  rate: z.number(),
  decimals: z.number(),
  kind: z.string(),
  settlement_code: z.string(),
});

// ---------- Checkout ----------

export const CheckoutResultSchema = z.object({
  order_id: z.string(),
  status: z.string(),
  plan_name: z.string(),
  display_currency: z.string(),
  display_symbol: z.string(),
  display_amount: z.string(),
  settlement_currency: z.string(),
  settlement_symbol: z.string(),
  settlement_amount: z.string(),
  account_created: z.boolean(),
  email: z.string(),
  email_sent: z.boolean(),
  gateway_provider: z.string().optional(),
  payment_url: z.string().optional(),
  payment_extra: z.record(z.string(), z.string()).optional(),
  payment_method: z.enum(["gateway", "credits"]),
  credits_used_cents: z.number().optional(),
  credit_balance_cents: z.number().optional(),
  coupon_code: z.string().optional(),
  original_usd_cents: z.number().optional(),
  discount_usd_cents: z.number().optional(),
});

export const CouponPreviewSchema = z.object({
  code: z.string(),
  discount_usd_cents: z.number(),
  final_usd_cents: z.number(),
  description: z.string(),
});

// ---------- User / Session ----------

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  instagram: z.string(),
});

export const SessionSchema = z.object({
  token: z.string(),
  expires_at: z.string(),
  user: UserSchema,
});

// ---------- Orders ----------

export const OrderSchema = z.object({
  id: z.string(),
  plan_id: z.string(),
  plan_name: z.string(),
  plan_category: z.string(),
  status: z.string(),
  amount_cents: z.number(),
  currency: z.string(),
  ticket_id: z.string().nullable().optional(),
  display_currency: z.string(),
  display_amount: z.string(),
  settlement_currency: z.string(),
  settlement_amount: z.string(),
  created_at: z.string(),
});

// OrderDetail tem campos JSONB (baseline_metrics, delivery_metrics) que
// evoluem com novos coletores — usamos passthrough nesses sub-objetos
// para não quebrar o front quando o backend adiciona uma chave nova.
export const OrderDetailSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  plan_id: z.string(),
  status: z.string(),
  amount_cents: z.number(),
  currency: z.string(),
  display_currency: z.string(),
  display_amount: z.string(),
  settlement_currency: z.string(),
  settlement_amount: z.string(),
  payment_url: z.string().nullable().optional(),
  payment_method: z.string(),
  credits_used_cents: z.number(),
  publication_url: z.string().nullable().optional(),
  ticket_id: z.string().nullable().optional(),
  baseline_captured_at: z.string().nullable().optional(),
  delivery_captured_at: z.string().nullable().optional(),
  baseline_metrics: z.record(z.string(), z.unknown()).nullable().optional(),
  delivery_metrics: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// ---------- Notification preferences ----------

export const NotifPrefsSchema = z.object({
  order_updates: z.boolean(),
  marketing: z.boolean(),
  reviews: z.boolean(),
  cart_recovery: z.boolean(),
});

// ---------- Subscriptions (Fase 7 — pode ainda não estar deployada) ----------
//
// Outro agente está implementando subscriptions agora. Definimos o schema
// aqui para que o checkout/account possa consumir assim que o endpoint
// estiver pronto. Campos opcionais onde o backend ainda pode mudar.
export const SubscriptionStatusSchema = z.enum([
  "active",
  "past_due",
  "cancelled",
  "paused",
  "expired",
  "pending",
]);

export const SubscriptionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  plan_id: z.string(),
  plan_name: z.string().optional(),
  status: SubscriptionStatusSchema,
  current_period_start: z.string(),
  current_period_end: z.string(),
  cancel_at_period_end: z.boolean().optional(),
  cancelled_at: z.string().nullable().optional(),
  next_billing_at: z.string().nullable().optional(),
  amount_cents: z.number(),
  currency: z.string(),
  display_currency: z.string().optional(),
  display_amount: z.string().optional(),
  settlement_currency: z.string().optional(),
  settlement_amount: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// ---------- Helper: parse com mensagem específica ----------
//
// parseOr<T> roda schema.safeParse(value) e — em caso de erro — joga um
// Error("<context>: <zod issues compactos>"). O context fica visível no
// Sentry/log, então um payload mal-formado de /v1/plans aparece como
// "Invalid /v1/plans response: plans.0.price_cents: Expected number,
// received string" em vez de um genérico "Cannot read property of undefined"
// horas depois quando algum componente tenta renderizar.
export function parseOr<T>(
  schema: z.ZodType<T>,
  value: unknown,
  context: string,
): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => {
        const path = i.path.length > 0 ? i.path.join(".") : "<root>";
        return `${path}: ${i.message}`;
      })
      .join("; ");
    throw new Error(`Invalid ${context} response: ${issues}`);
  }
  return result.data;
}
