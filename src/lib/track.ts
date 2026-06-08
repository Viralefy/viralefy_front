// track.ts — captura comportamental client-side (pageview/click/modal/
// checkout) que vai pro endpoint público /v1/track.
//
// Decisões:
//   - Batch in-memory com flush a cada 10s OU 10 eventos OU beforeunload.
//     Evita martelar a API a cada pageview num SPA com nav rápida.
//   - sendBeacon no beforeunload pra garantir entrega final mesmo se o
//     browser estiver tearing down. Fallback fetch+keepalive quando o
//     beacon não estiver disponível.
//   - visitor_id vem do helper unificado (getVisitorId — Wave 2 A/B). Não
//     duplicamos a lógica de geração aqui.
//   - utm é extraído do snapshot `getTracking()` (sessionStorage) e enviado
//     SÓ no evento "landing" pra reduzir payload nos pageviews subsequentes.
//   - SSR-safe: todas as funções no-op quando window é undefined.

import { getVisitorId } from "./visitor";
import { getTracking } from "./tracking";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type EventType =
  | "pageview"
  | "click"
  | "modal_open"
  | "modal_close"
  | "checkout_start"
  | "checkout_complete"
  | "abandon"
  | "landing";

type QueuedEvent = {
  visitor_id: string;
  event_type: EventType;
  path: string;
  referrer: string;
  payload?: Record<string, unknown>;
  utm?: Record<string, unknown>;
};

const BATCH_MAX = 10;
const BATCH_INTERVAL_MS = 10_000;

// Estado in-memory por aba. Flush automático via setInterval — montado
// preguiçosamente na primeira chamada de trackEvent.
let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let landingSent = false;

function ensureTimer() {
  if (typeof window === "undefined") return;
  if (timer) return;
  timer = setInterval(() => {
    flush();
  }, BATCH_INTERVAL_MS);
  // beforeunload: garante entrega final do batch pendente.
  window.addEventListener("beforeunload", flushBeacon);
  // pagehide cobre mobile Safari (bf-cache não dispara beforeunload).
  window.addEventListener("pagehide", flushBeacon);
}

function postOne(body: QueuedEvent): Promise<void> {
  return fetch(`${API_URL}/v1/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined);
}

// flush dispara cada evento individualmente (a API não tem batch endpoint
// ainda — futuro: /v1/track/batch). Best-effort; falhas silenciam.
function flush(): void {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  for (const ev of batch) {
    void postOne(ev);
  }
}

// flushBeacon — usado em beforeunload/pagehide. sendBeacon mantém o request
// vivo mesmo se a aba fechar. Fallback fetch+keepalive quando indisponível.
//
// Importante: NÃO limpamos a queue antes do sendBeacon retornar. sendBeacon
// pode retornar false (payload >64KB no Chrome, ou queue do browser cheia)
// — nesse caso queremos o evento na queue pra próxima tentativa.
function flushBeacon(): void {
  if (typeof navigator === "undefined" || queue.length === 0) return;
  const survivors: typeof queue = [];
  for (const ev of queue) {
    try {
      const url = `${API_URL}/v1/track`;
      const blob = new Blob([JSON.stringify(ev)], { type: "application/json" });
      if ("sendBeacon" in navigator) {
        const ok = navigator.sendBeacon(url, blob);
        if (!ok) survivors.push(ev);
      } else {
        void postOne(ev);
      }
    } catch {
      survivors.push(ev);
    }
  }
  queue = survivors;
}

function currentPath(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname + window.location.search;
}

function currentReferrer(): string {
  if (typeof document === "undefined") return "";
  return document.referrer ?? "";
}

// trackEvent enfileira o evento. visitor_id é lido do helper unificado.
// Quando o batch atinge BATCH_MAX, flush imediato pra não acumular sem fim.
export function trackEvent(type: EventType, payload?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const visitorId = getVisitorId();
  if (!visitorId) return;
  ensureTimer();
  const ev: QueuedEvent = {
    visitor_id: visitorId,
    event_type: type,
    path: currentPath(),
    referrer: currentReferrer(),
    payload,
  };
  // utm só no "landing" — outros eventos não precisam carregar.
  if (type === "landing") {
    const t = getTracking();
    const utm: Record<string, unknown> = {};
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ] as const) {
      const v = (t as unknown as Record<string, string | undefined>)[k];
      if (v) utm[k] = v;
    }
    if (Object.keys(utm).length > 0) ev.utm = utm;
  }
  queue.push(ev);
  if (queue.length >= BATCH_MAX) flush();
}

// trackPageview é o helper principal usado pelo TrackingHydrator. Dispara
// "landing" UMA vez por sessão (primeiro pageview) e "pageview" nas
// navegações subsequentes do SPA.
export function trackPageview(): void {
  if (typeof window === "undefined") return;
  if (!landingSent) {
    landingSent = true;
    trackEvent("landing");
    return;
  }
  trackEvent("pageview");
}

// flushNow — disponibilizado pra callers que querem garantir entrega antes
// de uma ação destrutiva (ex.: logout). Não chama beacon — é síncrono no
// dispatch mas async na rede.
export function flushNow(): void {
  flush();
}
