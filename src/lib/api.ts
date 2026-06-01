const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Platform = "instagram" | "tiktok";
export type TargetType = "profile" | "publication";

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
};

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

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
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
  return json.data as T;
}

export const fetchPlans = () => request<Plan[]>("/v1/plans");
export const fetchCategories = () => request<Category[]>("/v1/categories");
export const fetchCurrencies = () => request<Currency[]>("/v1/currencies");

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
  );

export const userRegister = (body: { email: string; name: string; password: string }) =>
  request<Session>("/v1/auth/user/register", { method: "POST", body: JSON.stringify(body) });

export const userLogin = (email: string, password: string) =>
  request<Session>("/v1/auth/user/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const fetchMyOrders = (token: string) =>
  request<Order[]>("/v1/me/orders", undefined, token);

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
