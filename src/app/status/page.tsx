import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { withGlobalGraph } from "@/lib/jsonld";

// Status page público — consome /v1/status do API por request.
//
// force-dynamic (não ISR): durante o build o API está PARADO (build_node
// roda antes de 70-start.sh) — qualquer prerender capturaria "Down" e
// cachearia indefinidamente. Renderizar por request garante estado fresh
// no exato momento do hit.
//
// Renderização tolerante a falha: se a API estiver fora, mostra "API down"
// e segue exibindo a página (próprio /status precisa funcionar pra você
// saber que o resto está fora).

export const dynamic = "force-dynamic";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata(): Promise<Metadata> {
  const meta = indexableMeta();
  const canonical = "/status";
  const title = "System status — Viralefy";
  const description = "Live status of the Viralefy API, database, and core services.";
  return {
    title: { absolute: title },
    description,
    robots: meta.robots,
    other: meta.other,
    alternates: {
      canonical,
      languages: { "x-default": canonical, en: canonical },
    },
    openGraph: {
      title, description, type: "website",
      url: `${siteUrl()}${canonical}`, locale: "en_US",
      siteName: "Viralefy",
    },
  };
}

type Status = "operational" | "degraded" | "down";
type Service = { name: string; status: Status; detail?: string; latency_ms?: number };
type Payload = { timestamp: string; overall: Status; services: Service[] };

async function fetchStatus(): Promise<Payload | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/v1/status`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as Payload;
  } catch {
    return null;
  }
}

const COLORS: Record<Status, { bg: string; fg: string; label: string }> = {
  operational: { bg: "rgba(50, 200, 100, 0.15)", fg: "#3cd87d", label: "Operational" },
  degraded:    { bg: "rgba(240, 180, 50, 0.15)", fg: "#f0b432", label: "Degraded" },
  down:        { bg: "rgba(230, 90, 90, 0.15)",  fg: "#e65a5a", label: "Down" },
};

export default async function StatusPage() {
  const data = await fetchStatus();
  const url = siteUrl();
  const pageUrl = `${url}/status`;

  // Quando /v1/status não responde, montamos um payload sintético marcando
  // a API como down — assim a página continua útil mesmo offline.
  const payload: Payload = data ?? {
    timestamp: new Date().toISOString(),
    overall: "down",
    services: [{ name: "API", status: "down", detail: "unreachable" }],
  };

  const overall = COLORS[payload.overall];

  // BUG-191: consolida WebPage + BreadcrumbList em UM @graph.
  // Track CC: withGlobalGraph prepende Org+WebSite pra fechar o gráfico
  // (isPartOf aponta pra #website existente no mesmo documento).
  const jsonld = withGlobalGraph(
    [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: "System status",
        url: pageUrl,
        description: "Live status of the Viralefy services.",
        inLanguage: "en",
        isPartOf: { "@id": `${url}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: url },
          { "@type": "ListItem", position: 2, name: "Status", item: pageUrl },
        ],
      },
    ],
    { siteUrl: url, inLanguage: "en" },
  );

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />

      <article lang="en">
        <header className="hero container">
          <h1>System status</h1>
          <p style={{ color: "var(--muted)", maxWidth: 640, margin: "0.75rem auto 0" }}>
            Real-time health of the Viralefy platform.
          </p>
          <div
            style={{
              display: "inline-block",
              marginTop: "1rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "999px",
              background: overall.bg,
              color: overall.fg,
              fontWeight: 600,
              fontSize: "0.95rem",
            }}
          >
            {overall.label}
          </div>
          <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--muted)" }}>
            Last checked {new Date(payload.timestamp).toLocaleString("en-US", {
              timeZone: "UTC", dateStyle: "medium", timeStyle: "short",
            })} UTC
          </p>
        </header>

        <main className="container" style={{ paddingBottom: "4rem", maxWidth: 760 }}>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
            {payload.services.map((s) => {
              const c = COLORS[s.status];
              return (
                <li
                  key={s.name}
                  className="card"
                  style={{
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{s.name}</p>
                    {s.detail && (
                      <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                        {s.detail}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {typeof s.latency_ms === "number" && s.latency_ms > 0 && (
                      <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                        {s.latency_ms}ms
                      </span>
                    )}
                    <span
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "999px",
                        background: c.bg,
                        color: c.fg,
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <section style={{ marginTop: "2.5rem", textAlign: "center" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Page refreshes every 15 seconds. Incidents are tracked manually
              by the team; expect updates here within minutes of any disruption.
            </p>
            <Link href="/help" className="btn btn-outline">
              Help center
            </Link>
          </section>
        </main>
      </article>

      <Footer lang="en" compact />
    </>
  );
}
