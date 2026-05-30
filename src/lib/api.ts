const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Plan = {
  id: string;
  name: string;
  description: string;
  category: string;
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
  instagram: string;
  display_currency: string;
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
  gateway_provider: string;
  payment_url?: string;
  payment_extra?: Record<string, string>;
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
    throw new Error(json?.error?.message ?? "Erro na requisição");
  }
  return json.data as T;
}

export const fetchPlans = () => request<Plan[]>("/v1/plans");
export const fetchCategories = () => request<Category[]>("/v1/categories");
export const fetchCurrencies = () => request<Currency[]>("/v1/currencies");

export const checkout = (payload: CheckoutPayload) =>
  request<CheckoutResult>("/v1/checkout", { method: "POST", body: JSON.stringify(payload) });

export const userRegister = (body: { email: string; name: string; instagram: string; password: string }) =>
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
