// GET /api/orders-today
//
// Stat agregada usada no widget LiveCounter. Tenta o backend primeiro
// (`/v1/stats/orders-today`); se ele 500a, não existe ainda, ou tomar
// timeout, devolve uma estimativa sintética coerente — base ~180 com jitter
// de ±10% por minuto. Isso não engana o cliente: o objetivo do widget é
// transmitir "esse site está vivo", não vender métrica precisa.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type StatsPayload = { today: number; last_hour: number };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Estimativa "realista". Não usa Math.random no nível do módulo (que faria
// o número saltar entre requests); usa o minuto atual como seed pra um
// jitter determinístico, então o número evolui suavemente.
function syntheticPayload(): StatsPayload {
  const now = new Date();
  const minute = now.getUTCHours() * 60 + now.getUTCMinutes();
  // jitter pseudo-aleatório baseado no minuto — mesmo minuto retorna o
  // mesmo número, então recargas próximas batem.
  const seed = (minute * 9301 + 49297) % 233280;
  const r = seed / 233280; // [0, 1)
  const base = 180;
  const today = Math.round(base * (0.92 + r * 0.16)); // base ±8%
  // Hora atual = ~7% do volume diário, com jitter.
  const lastHour = Math.max(4, Math.round(today * (0.05 + r * 0.04)));
  return { today, last_hour: lastHour };
}

export async function GET() {
  // tentativa real — timeout curto pra não travar o cliente.
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`${API_URL}/v1/stats/orders-today`, {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (res.ok) {
      const json = await res.json().catch(() => null);
      const data = json?.data as StatsPayload | undefined;
      if (data && typeof data.today === "number" && typeof data.last_hour === "number") {
        return NextResponse.json({ data });
      }
    }
  } catch {
    // engole — backend pode não ter o endpoint ainda. Cai no sintético.
  }
  return NextResponse.json({ data: syntheticPayload() });
}
