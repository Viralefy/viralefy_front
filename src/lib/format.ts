import type { Currency, PPPEntry, Plan } from "./api";

// Preço do plano na moeda selecionada.
//
// Ordem de precedência (NUNCA BRL como default global):
//   1. Override manual: `plan.prices[code]` — admin gravou um valor por
//      mercado e isso vence o cálculo automático.
//   2. Conversão automática: pega o canônico USD (`plan.prices["USD"]` ou
//      `price_cents/100`) e multiplica por `currency.rate` (units per 1 USD).
//      Aplica `currency.decimals`.
//   3. SSR (currency=null) — exibe USDT/USD direto, 2 casas.
//
// Antes só usava (1) com fallback pra USDT/USD em string — então mudar
// `rate` no backoffice não mexia em preço nenhum (rate ficava ignorada
// pra planos, embora estivesse correta pra saldo via formatBalance).
export function priceFor(plan: Plan, currency: Currency | null): string {
  // Sem moeda: SSR — usa o canônico USD direto.
  if (!currency) {
    const amount = plan.prices?.["USDT"] ?? plan.prices?.["USD"] ?? (plan.price_cents / 100).toFixed(2);
    return `$ ${amount}`;
  }
  // Override manual por moeda — admin sobrescreveu o cálculo para esse mercado.
  const manual = plan.prices?.[currency.code];
  if (manual != null) return `${currency.symbol} ${manual}`;
  // Conversão a partir do canônico USD via rate.
  const usdStr = plan.prices?.["USD"];
  const usd = usdStr != null ? parseFloat(usdStr) : plan.price_cents / 100;
  const decimals = currency.decimals ?? 2;
  const amount = (usd * (currency.rate || 1)).toFixed(decimals);
  return `${currency.symbol} ${amount}`;
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

// priceForCountry — wrapper PPP em torno de priceFor (Fase 6.5).
//
// Pega o canônico USD do plano, multiplica pelo PPP do país detectado, e SÓ
// DEPOIS aplica a conversão de moeda + formatação. Settlement intocado: o
// gateway segue cobrando o valor canônico em USD. Esse é apenas o número que
// o visitante vê na home.
//
// Regras:
//   - countryCode vazio/desconhecido OU pppMap vazio → fallback exato pra
//     priceFor() (sem qualquer transformação). Garantia: nunca pioramos o
//     comportamento atual ao introduzir PPP.
//   - multiplier ∈ [0.10, 1.00] → display = round(usd × multiplier, decimals).
//   - Override manual (plan.prices[currency.code]) tem precedência absoluta:
//     se o admin gravou um valor pra essa moeda, PPP não toca nele (admin
//     já decidiu o preço local). Idem priceFor().
export function priceForCountry(
  plan: Plan,
  currency: Currency | null,
  countryCode: string | null | undefined,
  pppMap: Record<string, number> | null | undefined,
): string {
  // Sem contexto PPP → comportamento padrão preservado.
  if (!countryCode || !pppMap) return priceFor(plan, currency);
  const cc = countryCode.toLowerCase();
  const mult = pppMap[cc];
  // País fora do catálogo OU multiplier inválido (≥1.0 idem 1.0, mas
  // guardamos por defensividade) → preço cheio.
  if (mult == null || mult >= 1 || mult <= 0) return priceFor(plan, currency);

  // Override manual por moeda — admin já cravou; PPP não sobrescreve.
  if (currency && plan.prices?.[currency.code] != null) {
    return priceFor(plan, currency);
  }

  // Canônico USD ajustado pelo multiplier ANTES da conversão de moeda.
  const usdStr = plan.prices?.["USD"];
  const usd = usdStr != null ? parseFloat(usdStr) : plan.price_cents / 100;
  const adjusted = usd * mult;

  // SSR (sem currency) → renderiza em USDT/USD com 2 casas.
  if (!currency) return `$ ${adjusted.toFixed(2)}`;

  const decimals = currency.decimals ?? 2;
  const amount = (adjusted * (currency.rate || 1)).toFixed(decimals);
  return `${currency.symbol} ${amount}`;
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
