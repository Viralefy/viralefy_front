import type { Currency, Plan } from "./api";

// Preço manual do plano na moeda selecionada (sem conversão automática).
//
// Fallback chain (NUNCA BRL como default global):
//   1. Moeda escolhida (currency!=null + plan.prices tem o code).
//   2. SSR — currency é null no primeiro paint, então caímos em USDT ("$").
//   3. Se nem USDT existe, USD; depois price_cents/100. BRL só aparece se
//      o usuário escolheu BRL explicitamente (selector + localStorage) ou se
//      `/api/geo` detectou BR (CF-IPCountry/Accept-Language). Global default
//      é USDT pra storefront mundial; antes era BRL/R$ e visitantes fora do
//      Brasil viam "R$" no primeiro paint — acidente histórico do MVP.
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

// Converte um valor canônico em USD-cents para uma string formatada na
// moeda escolhida pelo usuário. Tudo no sistema é canonicamente USD (créditos,
// invoices, planos), então só multiplicamos pelo `rate` da moeda alvo.
// SSR/sem moeda → cai em USDT ("$") com 2 casas. NUNCA BRL como fallback.
export function formatBalance(usdCents: number, currency: Currency | null): string {
  if (!currency) return `$ ${(usdCents / 100).toFixed(2)}`;
  const decimals = currency.decimals ?? 2;
  const usd = usdCents / 100;
  const amount = usd * (currency.rate || 1);
  return `${currency.symbol} ${amount.toFixed(decimals)}`;
}

// Converte um preset em USD (ex.: 25, 50, 100) para o valor equivalente já
// formatado na moeda do usuário. Usado nos botões de top-up.
export function formatPresetUsd(usd: number, currency: Currency | null): string {
  if (!currency) return `$ ${usd}`;
  const decimals = currency.decimals ?? 2;
  const amount = usd * (currency.rate || 1);
  // Inteiros sem casas decimais quando bater redondo (ex.: "$ 25" não "$ 25.00").
  const isWhole = Math.abs(amount - Math.round(amount)) < 0.005;
  const text = isWhole && decimals === 2 ? String(Math.round(amount)) : amount.toFixed(decimals);
  return `${currency.symbol} ${text}`;
}
