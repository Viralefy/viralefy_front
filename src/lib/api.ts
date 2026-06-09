import { z, type ZodType } from "zod";
import {
  PlanSchema,
  CategorySchema,
  CurrencySchema,
  CheckoutResultSchema,
  CouponPreviewSchema,
  OrderSchema,
  OrderDetailSchema,
  SessionSchema,
  NotifPrefsSchema,
  parseOr,
} from "./schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Platform = "instagram" | "tiktok";
export type TargetType = "profile" | "publication";

export type AggregateRating = {
  rating_value: number;
  review_count: number;
  best_rating: number;
  worst_rating: number;
};

export type PublicReview = {
  rating: number;
  title: string;
  body: string;
  author_name: string;
  created_at: string;
};

export type Plan = {
  id: string;
  name: string;
  description: string;
  category: string;
  platform: Platform;
  target_type: TargetType;
  followers_qty: number;
  price_cents: number;
  currency: string;
  active: boolean;
  sort_order: number;
  prices: Record<string, string>; // preço manual por moeda
  // Populado pelo backend quando o plano tem reviews visíveis. nil quando 0.
  aggregate_rating?: AggregateRating | null;
};

export type Category = {
  code: string;
  label: string;
  sort_order: number;
};

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  decimals: number;
  kind: string;
  settlement_code: string;
};

export type CheckoutPayload = {
  plan_id: string;
  email: string;
  name: string;
  display_currency: string;
  profile_id?: string;
  new_profile?: { platform: Platform; handle: string; display_name?: string };
  publication_url?: string;
  payment_method?: "gateway" | "credits";
  // Snapshot do form custom da categoria (BMs, perfis, emails). Backend
  // grava em orders.custom_data e replayed no ticket pós-pagamento.
  custom_data?: Record<string, string>;
  // First-touch tracking (utm/fbclid/gclid/referrer/landing_url +
  // browser context). Backend enriquece com IP+UA antes de salvar em
  // orders.tracking (e users.tracking_data se conta for criada na hora).
  tracking?: Record<string, unknown>;
  // Cupom opcional. Backend valida + aplica desconto; falha = 422.
  coupon_code?: string;
  // País do visitante (ISO alpha-2 lowercase). Se EU/GB e TaxService
  // configurado no API, VAT é cobrado em settlement_amount.
  country?: string;
  // País do MERCADO da entrega — herdado da LP (/us/, /de/...).
  target_country?: string;
  // Gateway escolhido pelo cliente no step de seleção de método de
  // pagamento. Quando ausente, backend cai no pickGateway por settlement
  // (back-compat). Quando presente, valida + usa esse gateway específico.
  gateway_id?: string;
  // Moeda escolhida pra pay-in em gateways multi-currency (Heleket/Stripe).
  // Ex.: gateway Heleket aceita [USDT, BTC, ETH] → cliente escolheu BTC.
  // Ignorado por providers single-currency (PIX, manual_crypto).
  pay_currency?: string;
};

// PaymentMethodOption — uma das opções de pagamento devolvidas por
// /v1/plans/:id/payment-methods. UI usa pra montar a lista de cards no
// step de seleção. conversion_note é populado SÓ quando charged !=
// settlement (transparência: "você paga X em BRL, plataforma recebe Y USDT").
export type PaymentMethodOption = {
  gateway_id: string;
  provider: string;        // woovi | heleket | manual_pix | manual_crypto | manual_usdt | stripe
  name: string;            // nome do gateway (admin escolheu — ex.: "USDT TRC20")
  kind: "card" | "pix" | "crypto_manual" | "crypto_auto" | "other";
  charged_currency: string;
  charged_amount: string;
  charged_symbol: string;
  settlement_currency: string;
  settlement_amount: string;
  settlement_symbol: string;
  display_currency: string;
  display_amount: string;
  conversion_note?: string;
  network_label?: string;
  network_warning?: string;
};

export const fetchPaymentMethods = (
  planId: string,
  displayCurrency?: string,
  country?: string,
): Promise<PaymentMethodOption[]> => {
  const qs = new URLSearchParams();
  if (displayCurrency) qs.set("display_currency", displayCurrency);
  if (country) qs.set("country", country);
  const tail = qs.toString() ? `?${qs}` : "";
  return request<PaymentMethodOption[]>(`/v1/plans/${planId}/payment-methods${tail}`);
};

export const uploadOrderProof = (
  token: string,
  orderId: string,
  body: { file_url: string; file_name?: string; mime_type?: string; size_bytes?: number; note?: string },
) =>
  request<OrderDetail>(
    `/v1/me/orders/${orderId}/proof`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Idempotency-Key": newIdempotencyKey() },
    },
    token,
  );

// uploadOrderProofMultipart — preferido. Envia o arquivo como multipart;
// backend faz PutObject no MinIO/R2 e guarda só a key em proof_url. Limite
// 5MB. Fallback automático pro JSON base64 quando server retorna 503
// (storage disabled).
export async function uploadOrderProofMultipart(
  token: string,
  orderId: string,
  file: File,
  note?: string,
): Promise<OrderDetail> {
  const fd = new FormData();
  fd.append("file", file, file.name);
  if (note) fd.append("note", note);
  const res = await fetch(`${API_URL}/v1/me/orders/${orderId}/proof`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Idempotency-Key": newIdempotencyKey(),
    },
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Upload failed (${res.status})`);
  }
  return json.data as OrderDetail;
}

// fetchProofURL — pro user revisar o próprio comprovante (presigned 5min).
export const fetchProofURL = (token: string, orderId: string) =>
  request<{ url: string }>(`/v1/me/orders/${orderId}/proof-url`, undefined, token);

// ======= 2FA — opcional pro user =======

export type TwoFAStatus = { enrolled: boolean; should_prompt: boolean };
export type TwoFAEnroll = { secret_base32: string; otpauth_url: string; backup_codes: string[] };

export const fetchTwoFAStatus = (token: string) =>
  request<TwoFAStatus>("/v1/me/2fa/status", undefined, token);

export const enrollUserTwoFA = (token: string) =>
  request<TwoFAEnroll>("/v1/me/2fa/enroll", { method: "POST" }, token);

export const verifyUserTwoFA = (token: string, code: string) =>
  request<void>(
    "/v1/me/2fa/verify",
    { method: "POST", body: JSON.stringify({ code }) },
    token,
  );

export const disableUserTwoFA = (token: string) =>
  request<void>("/v1/me/2fa/disable", { method: "POST" }, token);

export const dismissTwoFAPrompt = (token: string) =>
  request<void>("/v1/me/2fa/dismiss-prompt", { method: "POST" }, token);

export const completeUserLoginTwoFA = (partialToken: string, code: string) =>
  request<Session>(
    "/v1/auth/user/login/2fa",
    { method: "POST", body: JSON.stringify({ partial_token: partialToken, code }) },
  );

export type CouponPreview = {
  code: string;
  discount_usd_cents: number;
  final_usd_cents: number;
  description: string;
};

export async function previewCoupon(input: {
  code: string;
  plan_id: string;
  email?: string;
  display_currency?: string;
}): Promise<CouponPreview> {
  return request<CouponPreview>(
    "/v1/coupons/validate",
    { method: "POST", body: JSON.stringify(input) },
    undefined,
    CouponPreviewSchema,
  );
}

export type CheckoutResult = {
  order_id: string;
  status: string;
  plan_name: string;
  display_currency: string;
  display_symbol: string;
  display_amount: string;
  settlement_currency: string;
  settlement_symbol: string;
  settlement_amount: string;
  account_created: boolean;
  email: string;
  email_sent: boolean;
  gateway_provider?: string;
  payment_url?: string;
  payment_extra?: Record<string, string>;
  payment_method: "gateway" | "credits";
  credits_used_cents?: number;
  credit_balance_cents?: number;
  coupon_code?: string;
  original_usd_cents?: number;
  discount_usd_cents?: number;
};

export type User = {
  id: string;
  email: string;
  name: string;
  instagram: string;
};

export type Session = {
  token: string;
  expires_at: string;
  user: User;
  // 2FA gate (PHASE-7 §7.2). Quando twofa_required=true, token vem vazio
  // e o cliente DEVE chamar completeUserLoginTwoFA(partial_token, code).
  twofa_required?: boolean;
  partial_token?: string;
};

export type Order = {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_category: string;
  status: string;
  amount_cents: number;
  currency: string;
  // ticket_id é setado automaticamente pelo backend quando a categoria
  // exige handoff manual (recovery/BMs/perfis) e o pagamento confirma.
  // Usado pelo /account pra linkar pro ticket aberto.
  ticket_id?: string | null;
  display_currency: string;
  display_amount: string;
  settlement_currency: string;
  settlement_amount: string;
  created_at: string;
};

// request<T> faz a chamada HTTP e devolve json.data tipado.
//
// Quando passamos `schema`, validamos json.data via Zod e falhamos early
// com mensagem específica do path — esse é o caminho preferido nos boundaries
// (todo endpoint com payload estruturado deveria passar). Quando não passamos
// schema (ex.: respostas vazias / void), caímos no cast `as T` legado.
async function request<T>(
  path: string,
  init?: RequestInit,
  token?: string,
  schema?: ZodType<T>,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message ?? "Request failed");
  }
  if (schema) {
    return parseOr(schema, json.data, path);
  }
  return json.data as T;
}

export const fetchPlans = () =>
  request<Plan[]>("/v1/plans", undefined, undefined, z.array(PlanSchema));
export const fetchCategories = () =>
  request<Category[]>("/v1/categories", undefined, undefined, z.array(CategorySchema));
export const fetchCurrencies = () =>
  request<Currency[]>("/v1/currencies", undefined, undefined, z.array(CurrencySchema));

// PPP (Purchasing Power Parity) — Fase 6.5. multiplier ∈ [0.10, 1.00]. Aplicado
// SÓ no display do front via priceForCountry(); USD canônico e settlement
// permanecem intocados. País fora do catálogo → tratar como multiplier 1.00.
export type PPPEntry = {
  country_code: string;
  multiplier: number;
};

export const fetchCountryPPP = () => request<PPPEntry[]>("/v1/country-ppp");

// Tax rates — VAT UE + GB (Fase 5.3). rate_pct ∈ [0, 27.00]. O front
// pre-computa o display do VAT no checkout; a autoridade do cálculo final
// é o TaxService.ComputeTax server-side. País fora do catálogo (US, BR,
// IN, etc.) = rate 0% e a linha de VAT some do summary.
export type TaxRate = {
  country_code: string;
  rate_pct: number;
  rate_type: string;
};

export const fetchTaxRates = () => request<TaxRate[]>("/v1/tax-rates");

// Gera Idempotency-Key fresca por chamada de checkout. F5 re-tenta com a
// mesma key durante a sessão? NÃO — uma key por click. Se o usuário clicar
// duas vezes acidental, o segundo click reusa a key (porque o form não foi
// remontado), mas o backend devolve a resposta original (idempotência).
function newIdempotencyKey(): string {
  // crypto.randomUUID() é safe em browser moderno e edge runtimes.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const checkout = (payload: CheckoutPayload, token?: string) =>
  request<CheckoutResult>(
    "/v1/checkout",
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Idempotency-Key": newIdempotencyKey() },
    },
    token,
    CheckoutResultSchema,
  );

export const userRegister = (body: {
  email: string;
  name: string;
  password: string;
  // Pelo menos UM dos dois é obrigatório (validado server-side).
  phone?: string;
  telegram?: string;
  turnstile_token?: string;
  tracking?: Record<string, unknown>;
}) =>
  request<Session>(
    "/v1/auth/user/register",
    { method: "POST", body: JSON.stringify(body) },
    undefined,
    SessionSchema,
  );

export const userLogin = (email: string, password: string, turnstileToken?: string) =>
  request<Session>(
    "/v1/auth/user/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password, turnstile_token: turnstileToken ?? "" }),
    },
    undefined,
    SessionSchema,
  );

export const fetchMyOrders = (token: string) =>
  request<Order[]>("/v1/me/orders", undefined, token, z.array(OrderSchema));

// OrderDetail expande o shape básico de Order com os campos crus do
// pedido — payment_url, métricas de baseline/delivery e timestamps de
// captura. Usado pela página de tracking (/account/orders/{id}) pra
// renderizar timeline + CTA "Complete payment" quando pendente.
export type OrderDetail = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  amount_cents: number;
  currency: string;
  display_currency: string;
  display_amount: string;
  settlement_currency: string;
  settlement_amount: string;
  payment_url?: string | null;
  payment_method: string;
  credits_used_cents: number;
  publication_url?: string | null;
  ticket_id?: string | null;
  baseline_captured_at?: string | null;
  delivery_captured_at?: string | null;
  baseline_metrics?: Record<string, unknown> | null;
  delivery_metrics?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export const fetchMyOrder = (token: string, id: string) =>
  request<OrderDetail>(
    `/v1/me/orders/${encodeURIComponent(id)}`,
    undefined,
    token,
    OrderDetailSchema,
  );

// ----- Tickets (helpdesk) ----- //

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  order_id?: string | null;
  assigned_admin_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  author_type: "user" | "admin";
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export type TicketDetail = {
  ticket: Ticket;
  messages: TicketMessage[];
};

export const fetchMyTickets = (token: string) =>
  request<Ticket[]>("/v1/me/tickets", undefined, token);

// Conta tickets em open/pending — usado no badge "💬 (N)" do Header.
export const fetchMyOpenTicketsCount = (token: string) =>
  request<{ open: number }>("/v1/me/tickets/open-count", undefined, token);

export const fetchMyTicket = (token: string, id: string) =>
  request<TicketDetail>(`/v1/me/tickets/${id}`, undefined, token);

export const createTicket = (
  token: string,
  body: { subject: string; body: string; order_id?: string | null }
) =>
  request<Ticket>("/v1/me/tickets", { method: "POST", body: JSON.stringify(body) }, token);

export const replyTicket = (token: string, id: string, body: string) =>
  request<void>(
    `/v1/me/tickets/${id}/messages`,
    { method: "POST", body: JSON.stringify({ body }) },
    token
  );

// ----- Profiles ----- //

export type Profile = {
  id: string;
  user_id: string;
  platform: Platform;
  handle: string;
  display_name: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
};

export const fetchMyProfiles = (token: string) =>
  request<Profile[]>("/v1/me/profiles", undefined, token);

export const addProfile = (
  token: string,
  body: { platform: Platform; handle: string; display_name?: string }
) =>
  request<Profile>("/v1/me/profiles", { method: "POST", body: JSON.stringify(body) }, token);

export const deleteProfile = (token: string, id: string) =>
  request<void>(`/v1/me/profiles/${id}`, { method: "DELETE" }, token);

// ----- Créditos + ledger ----- //

export type CreditAccount = {
  user_id: string;
  balance_cents: number;
  currency: string;
  updated_at: string;
};

export type CreditTxType = "recharge" | "spend" | "refund" | "adjustment";

export type CreditTransaction = {
  id: string;
  user_id: string;
  type: CreditTxType;
  amount_cents: number; // signed
  balance_after_cents: number;
  currency: string;
  order_id?: string | null;
  invoice_id?: string | null;
  description: string;
  metadata: Record<string, string>;
  created_at: string;
};

export const fetchCredits = (token: string) =>
  request<CreditAccount>("/v1/me/credits", undefined, token);

export const fetchTransactions = (token: string) =>
  request<CreditTransaction[]>("/v1/me/transactions", undefined, token);

// ----- Invoices (recargas) ----- //

export type InvoiceStatus = "pending" | "paid" | "failed" | "cancelled";

export type Invoice = {
  id: string;
  user_id: string;
  amount_cents: number;
  currency: string;
  display_currency: string;
  display_amount: string;
  settlement_currency: string;
  settlement_amount: string;
  status: InvoiceStatus;
  gateway_id?: string | null;
  external_ref?: string | null;
  payment_url?: string | null;
  payment_extra: Record<string, string>;
  created_at: string;
  updated_at: string;
  paid_at?: string | null;
};

export const fetchMyInvoices = (token: string) =>
  request<Invoice[]>("/v1/me/invoices", undefined, token);

export const requestRecharge = (
  token: string,
  body: { amount_cents: number; display_currency?: string }
) =>
  request<Invoice>("/v1/me/recharge", { method: "POST", body: JSON.stringify(body) }, token);

// ----- Manage my data (LGPD/GDPR — Fase 5.2) ----- //

export type DeletionRequestStatus = "pending" | "cancelled" | "executed";

export type DeletionRequest = {
  requested_at: string;
  executes_at: string;
  status: DeletionRequestStatus;
  reason: string;
};

// O export é um "saco" tipado fracamente — o backend devolve um dump
// inteiro do usuário e o conteúdo pode evoluir a cada release. Usamos
// `unknown` em vez de `any` pra forçar narrowing onde for usado.
export type ExportedData = {
  exported_at: string;
  user_id: string;
  user?: Record<string, unknown>;
  orders?: Array<Record<string, unknown>>;
  tickets?: Array<Record<string, unknown>>;
  profiles?: Array<Record<string, unknown>>;
  reviews?: Array<Record<string, unknown>>;
  notification_preferences?: unknown;
  deletion_request?: DeletionRequest;
};

// exportMyData consome /v1/me/data/export — o backend manda Content-
// Disposition: attachment, mas como fazemos fetch via JS, lemos como
// JSON e o caller dispara o download client-side via Blob/URL.
export const exportMyData = async (token: string): Promise<ExportedData> => {
  const res = await fetch(`${API_URL}/v1/me/data/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(
      (j as { error?: { message?: string } })?.error?.message ?? "Export failed",
    );
  }
  return (await res.json()) as ExportedData;
};

// requestDeletion agenda exclusão; backend devolve 202 sem body.
export const requestDeletion = async (
  token: string,
  body: { reason?: string },
): Promise<void> => {
  const res = await fetch(`${API_URL}/v1/me/data/deletion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(
      (j as { error?: { message?: string } })?.error?.message ?? "Request failed",
    );
  }
};

// cancelDeletion desfaz o pedido pendente. Idempotente — backend 204.
export const cancelDeletion = async (token: string): Promise<void> => {
  const res = await fetch(`${API_URL}/v1/me/data/deletion`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(
      (j as { error?: { message?: string } })?.error?.message ?? "Cancel failed",
    );
  }
};

// ----- Reviews ----- //

export type Review = {
  id: string;
  user_id: string;
  order_id: string;
  plan_id: string;
  plan_category: string;
  country_code: string;
  rating: number;
  title: string;
  body: string;
  visible: boolean;
  created_at: string;
  updated_at: string;
};

function newIdempotencyKeyForReview(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const submitReview = (
  token: string,
  body: { order_id: string; rating: number; title: string; body: string; country_code?: string }
) =>
  request<Review>(
    "/v1/me/reviews",
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Idempotency-Key": newIdempotencyKeyForReview() },
    },
    token,
  );

export const fetchMyReviewForOrder = (token: string, orderID: string) =>
  request<Review>(`/v1/me/reviews/by-order/${orderID}`, undefined, token);

export const fetchPlanReviews = (planID: string) =>
  request<{ reviews: PublicReview[]; aggregate: AggregateRating | null }>(
    `/v1/plans/${planID}/reviews`,
  );

export const fetchCategoryReviewAggregate = (categoryCode: string) =>
  request<{ aggregate: AggregateRating | null }>(
    `/v1/categories/${categoryCode}/reviews`,
  );

// ----- Notification preferences ----- //

// NotifPrefs espelha o JSONB users.notif_prefs. As 4 chaves vêm sempre
// presentes do backend (defaults aplicados ao GET), então o front pode
// renderizar os 4 toggles sem fallback condicional.
export type NotifPrefs = {
  order_updates: boolean;
  marketing: boolean;
  reviews: boolean;
  cart_recovery: boolean;
};

export const fetchNotifPrefs = (token: string) =>
  request<NotifPrefs>("/v1/me/notif-prefs", undefined, token, NotifPrefsSchema);

// updateNotifPrefs envia o snapshot completo no PUT. Backend faz merge
// JSONB (||), então mandar parcial é seguro — mas o front sempre tem o
// estado completo na tela, então não há razão pra dividir.
export const updateNotifPrefs = (prefs: NotifPrefs, token: string) =>
  request<NotifPrefs>(
    "/v1/me/notif-prefs",
    { method: "PUT", body: JSON.stringify(prefs) },
    token,
    NotifPrefsSchema,
  );

// --- A/B testing harness (Fase 6.6) --- //
//
// Backend trackeia experiments + assignments + events. Front lê variant via
// abAssign() (sticky por visitor_id) e dispara abTrack() em pontos chave
// (exposure auto via <ABExperiment>, conversion na thank-you page, etc.).

export type ABAssignmentResponse = {
  variant: string;
};

// abAssign — devolve a variant atribuída ao visitor no experimento. Se o
// experimento está inativo, backend devolve { variant: "control" } como
// fallback seguro. Se não existir, throw.
export const abAssign = (visitorId: string, experimentKey: string) =>
  request<ABAssignmentResponse>("/v1/ab/assign", {
    method: "POST",
    body: JSON.stringify({ visitor_id: visitorId, experiment_key: experimentKey }),
  });

// abTrack — registra um evento. event_name canônicos: "exposure" |
// "conversion" | qualquer string custom. Payload opcional (objeto serializável).
// Fire-and-forget no front: a UI não bloqueia esperando o ack.
export const abTrack = (
  visitorId: string,
  experimentKey: string,
  eventName: string,
  payload?: Record<string, unknown>,
): Promise<void> =>
  fetch(`${API_URL}/v1/ab/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitor_id: visitorId,
      experiment_key: experimentKey,
      event_name: eventName,
      payload,
    }),
  }).then(() => undefined);

// ----- Referrals (Fase 6.4) ----- //

// MyReferral mostra o painel "Refer & earn": código próprio + métricas
// de referrals concedidos + créditos ganhos (USD-cents).
export type MyReferral = {
  code: string;
  total_referred: number;
  total_earned_cents: number;
};

export const fetchMyReferral = (token: string) =>
  request<MyReferral>("/v1/me/referral", undefined, token);

// ReferralInfo é a resposta pública de /v1/referrals/{code}/info — usada
// pelo checkout pra mostrar selo "Convidado por X" sem vazar email/IDs.
// Quando valid=false o front degrada silenciosamente.
export type ReferralInfo = {
  valid: boolean;
  referrer_name?: string;
};

export const lookupReferralCode = (code: string) =>
  request<ReferralInfo>(`/v1/referrals/${encodeURIComponent(code)}/info`);

// ----- WhatsApp opt-in (Fase 7.3) ----- //
//
// Separado do NotifPrefs porque carrega PII (número E.164) e tem um toggle
// de opt-in dedicado. Backend valida o formato no PUT; o front deixa o
// usuário digitar livre e mostra erro do backend se inválido.

export type WhatsAppPref = {
  number: string;
  opt_in: boolean;
};

export const fetchWhatsAppPref = (token: string) =>
  request<WhatsAppPref>("/v1/me/whatsapp", undefined, token);

export const updateWhatsApp = (pref: WhatsAppPref, token: string) =>
  request<WhatsAppPref>(
    "/v1/me/whatsapp",
    { method: "PUT", body: JSON.stringify(pref) },
    token,
  );

// ----- B2B API keys (Fase 7.5) ----- //

// APIKey é o metadata público de uma credencial. NUNCA inclui o plain.
export type APIKey = {
  id: string;
  label: string;
  owner_user_id: string;
  revoked_at?: string | null;
  created_at: string;
  last_used_at?: string | null;
};

// CreateAPIKeyResult inclui o plain UMA vez no campo "key". Após esse
// response não há como recuperar — front mostra em modal com warning.
export type CreateAPIKeyResult = {
  api_key: APIKey;
  key: string;
};

export const fetchMyAPIKeys = (token: string) =>
  request<APIKey[]>("/v1/me/api-keys", undefined, token);

export const createMyAPIKey = (label: string, token: string) =>
  request<CreateAPIKeyResult>(
    "/v1/me/api-keys",
    { method: "POST", body: JSON.stringify({ label }) },
    token,
  );

export const revokeMyAPIKey = (id: string, token: string) =>
  fetch(`${API_URL}/v1/me/api-keys/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to revoke key");
  });

// ----- Subscriptions (Fase 6.3) ----- //

// Subscription é um plano mensal recorrente. Cron de renovação gera
// uma order pending a cada ciclo (via CheckoutService público); o user
// paga via payment_url normal. N falhas seguidas → cancela auto.
export type SubscriptionStatus = "active" | "paused" | "cancelled";

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  interval: string; // "month"
  next_billing_at: string;
  cancelled_at?: string | null;
  failed_payments: number;
  created_at: string;
  updated_at: string;
};

export const fetchMySubscriptions = (token: string) =>
  request<Subscription[]>("/v1/me/subscriptions", undefined, token);

export const subscribe = (token: string, planID: string) =>
  request<Subscription>(
    "/v1/me/subscriptions",
    { method: "POST", body: JSON.stringify({ plan_id: planID }) },
    token,
  );

export const cancelSubscription = (token: string, id: string) =>
  fetch(`${API_URL}/v1/me/subscriptions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to cancel subscription");
  });
