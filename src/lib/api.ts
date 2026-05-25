const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type Plan = {
  id: string;
  name: string;
  description: string;
  followers_qty: number;
  price_cents: number;
  currency: string;
  active: boolean;
  sort_order: number;
};

export type CheckoutPayload = {
  plan_id: string;
  email: string;
  name: string;
  instagram: string;
  password: string;
};

export type CheckoutResult = {
  user_id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message ?? "Erro na requisição";
    throw new Error(msg);
  }
  return json.data as T;
}

export async function fetchPlans(): Promise<Plan[]> {
  return request<Plan[]>("/v1/plans");
}

export async function checkout(payload: CheckoutPayload): Promise<CheckoutResult> {
  return request<CheckoutResult>("/v1/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function formatPrice(cents: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
    cents / 100
  );
}
