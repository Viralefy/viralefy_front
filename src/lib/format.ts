import type { Currency, Plan } from "./api";

// Preço manual do plano na moeda selecionada (sem conversão automática).
// Fallback: se a moeda escolhida não tem preço manual, usa BRL.
export function priceFor(plan: Plan, currency: Currency | null): string {
  const code = currency?.code ?? "BRL";
  const symbol = currency?.symbol ?? "R$";
  const amount = plan.prices?.[code] ?? plan.prices?.["BRL"] ?? (plan.price_cents / 100).toFixed(2);
  return `${symbol} ${amount}`;
}
