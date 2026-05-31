// Minimal Prometheus exposition para a process do Next.js.
//
// Sem dependências externas (prom-client deixaria o lockfile mais pesado e
// hoje só precisamos de RSS/uptime/eventloop pra fechar o RED do front).
// Diretrizes §17 exigem /metrics — este endpoint é raspado pelo Prometheus
// local em http://127.0.0.1:3000/api/metrics.
//
// Exposição segura: rota pública mas só devolve métricas do processo, sem
// conteúdo de usuário. Caddy não expõe /api/metrics externamente (não há
// rota explícita, e o reverse_proxy default deixa passar — anote no log
// e mantenha o monitor a postos; para bloquear, adicione um `@metrics
// path /api/metrics` deny no Caddyfile).
//
// Formato: text/plain; version=0.0.4 (Prometheus exposition).

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Marco de inicialização — preserva pelo lifetime da function (Node.js process).
const PROCESS_START_TIME = Date.now() / 1000;

function escapeLabel(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

function metricLine(name: string, value: number | string, labels: Record<string, string> = {}): string {
  const labelStr = Object.entries(labels)
    .map(([k, v]) => `${k}="${escapeLabel(v)}"`)
    .join(",");
  return labelStr ? `${name}{${labelStr}} ${value}` : `${name} ${value}`;
}

export async function GET() {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  const now = Date.now() / 1000;
  const uptime = now - PROCESS_START_TIME;

  const lines: string[] = [];

  lines.push("# HELP process_start_time_seconds Start time of the process since unix epoch in seconds.");
  lines.push("# TYPE process_start_time_seconds gauge");
  lines.push(metricLine("process_start_time_seconds", PROCESS_START_TIME.toFixed(3)));

  lines.push("# HELP process_uptime_seconds Uptime of the Node.js process in seconds.");
  lines.push("# TYPE process_uptime_seconds gauge");
  lines.push(metricLine("process_uptime_seconds", uptime.toFixed(3)));

  lines.push("# HELP process_resident_memory_bytes Resident memory size in bytes.");
  lines.push("# TYPE process_resident_memory_bytes gauge");
  lines.push(metricLine("process_resident_memory_bytes", mem.rss));

  lines.push("# HELP process_heap_bytes Node.js heap usage in bytes.");
  lines.push("# TYPE process_heap_bytes gauge");
  lines.push(metricLine("process_heap_bytes", mem.heapUsed, { state: "used" }));
  lines.push(metricLine("process_heap_bytes", mem.heapTotal, { state: "total" }));

  lines.push("# HELP process_external_memory_bytes External (C++) memory bound to JS objects.");
  lines.push("# TYPE process_external_memory_bytes gauge");
  lines.push(metricLine("process_external_memory_bytes", mem.external));

  lines.push("# HELP process_cpu_seconds_total Cumulative CPU time in seconds.");
  lines.push("# TYPE process_cpu_seconds_total counter");
  lines.push(metricLine("process_cpu_seconds_total", (cpu.user / 1e6).toFixed(6), { mode: "user" }));
  lines.push(metricLine("process_cpu_seconds_total", (cpu.system / 1e6).toFixed(6), { mode: "system" }));

  lines.push("# HELP nodejs_version_info Node.js version info.");
  lines.push("# TYPE nodejs_version_info gauge");
  lines.push(metricLine("nodejs_version_info", 1, { version: process.version }));

  lines.push("# HELP viralefy_service_info Service metadata.");
  lines.push("# TYPE viralefy_service_info gauge");
  lines.push(
    metricLine("viralefy_service_info", 1, {
      service: "viralefy-front",
      node_env: process.env.NODE_ENV ?? "unknown",
    }),
  );

  // Event loop lag — quanto demorou setImmediate além do 0. Aproxima saturação.
  const lagStart = process.hrtime.bigint();
  await new Promise<void>((resolve) => setImmediate(resolve));
  const lagSeconds = Number(process.hrtime.bigint() - lagStart) / 1e9;
  lines.push("# HELP nodejs_eventloop_lag_seconds Event loop lag observed via setImmediate.");
  lines.push("# TYPE nodejs_eventloop_lag_seconds gauge");
  lines.push(metricLine("nodejs_eventloop_lag_seconds", lagSeconds.toFixed(6)));

  const body = lines.join("\n") + "\n";
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
