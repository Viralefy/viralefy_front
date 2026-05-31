import type { Currency, Plan } from "./api";

// Preço manual do plano na moeda selecionada (sem conversão automática).
//
// Fallback chain:
//   1. Moeda escolhida (currency!=null + plan.prices tem o code).
//   2. SSR — currency é null no primeiro paint, então caímos em USDT ("$").
//   3. Se nem USDT existe, USD; depois price_cents/100. Nunca BRL — antes o
//      fallback final era BRL/R$ e visitantes fora do Brasil viam "R$" no
//      primeiro paint.
export function priceFor(plan: Plan, currency: Currency | null): string {
  const code = currency?.code ?? "USDT";
  const symbol = currency?.symbol ?? "$";
  const amount =
    plan.prices?.[code] ??
    plan.prices?.["USDT"] ??
    plan.prices?.["USD"] ??
    (plan.price_cents / 100).toFixed(2);
  return `${symbol} ${amount}`;
}
