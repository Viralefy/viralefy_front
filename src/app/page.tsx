import type { Metadata } from "next";
import Link from "next/link";
import type { Plan } from "@/lib/api";
import { COUNTRIES, countriesByRegion, type Region } from "@/i18n/countries";
import { CategoryGroupedGrid } from "@/components/CategoryGroupedGrid";
import { Footer } from "@/components/Footer";
import { TrustSignals } from "@/components/TrustSignals";
import { Flag } from "@/components/Flag";
import { tr } from "@/i18n/languages";
import { homeAlternates } from "@/lib/hreflang";
import { buildHomeJsonLd, safeJsonStringify } from "@/lib/jsonld";
import { indexableMeta } from "@/lib/seo-meta";

const seoMeta = indexableMeta();

// Home global. Inglês "international" — atende quem chega sem cookie de
// idioma/país detectado. Conteúdo focado em "global followers" + lista de
// mercados para CTR para subsites por país.
//
// `/` é a entrada canônica para `en` na hreflang.
//
// ISR (round 23 Track XX): home não depende de cookies/headers/sessão. O
// conteúdo varia só com o catálogo de planos, que muda raramente. Antes:
// `force-dynamic` + `fetch(..., no-store)` => SSR a cada hit, p50 ~1.5-2.7s.
// Agora: revalidate 30min => HTML pré-rendado servido em ms; revalidação em
// background quando o TTL expira. Trade-off aceito: até 30min de defasagem
// no catálogo, irrelevante pra home.
export const revalidate = 1800;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export const metadata: Metadata = {
  // absolute = bypass do template "%s | Viralefy" do root layout, já que
  // esse título já termina em "| Viralefy" pra cuidar do SEO da home.
  title: { absolute: "Buy Instagram & TikTok followers worldwide | Viralefy" },
  // 158 chars — Ahrefs flagga > 160 como "meta description too long".
  description:
    "Real Instagram and TikTok followers, engagement and views. Fast delivery, 30-day refill guarantee, support in your language. Pay in USDT, USD or crypto.",
  // Home tem seu próprio grupo hreflang (só ela). Ver lib/hreflang.ts —
  // antes a home declarava hreflang pros 130 country roots, mas eles têm
  // conteúdo diferente (localização) e Ahrefs flagava como hreflang
  // inválido + reciprocidade quebrada (Site Audit 2026-06-05).
  alternates: homeAlternates(),
  robots: seoMeta.robots,
  other: seoMeta.other,
  openGraph: {
    title: "Buy Instagram & TikTok followers worldwide | Viralefy",
    description:
      "Real followers, engagement and views for Instagram and TikTok. Fast delivery, 30-day refill guarantee, support in your language.",
    locale: "en_US",
    type: "website",
    siteName: "Viralefy",
    url: siteUrl(),
    images: [{ url: "/og/global", width: 1200, height: 630, alt: "Viralefy — Instagram & TikTok growth" }],
  },
  twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy", images: ["/og/global"] },
};

async function getPlans(): Promise<Plan[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/v1/plans`, { next: { revalidate: 1800 } });
    const json = await res.json();
    return (json.data as Plan[]) ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const plans = await getPlans();
  const t = tr("en");
  const url = siteUrl();

  // JSON-LD em um único @graph (canônico Schema.org). Antes emitia N scripts
  // separados, o que fazia validators expandir refs @id como nós inlinados
  // (efeito visual de duplicação no Ahrefs/Rich Results).
  const jsonld = buildHomeJsonLd(plans, url);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(jsonld) }} />

      <section className="hero container">
        <h1>{t.home.heroTitle}</h1>
        <p>{t.home.heroSubtitle}</p>
        <TrustSignals lang="en" />
      </section>

      <main className="container" style={{ paddingBottom: "4rem" }}>
        <CategoryGroupedGrid plans={plans} lang="en" countryCode="" />

        <section style={{ marginTop: "3.5rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", textAlign: "center" }}>
            {t.home.pickMarket} <span style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 400 }}>({COUNTRIES.length})</span>
          </h2>
          {([
            ["americas", "Americas"],
            ["sepa", "Europe / SEPA"],
            ["asia", "Asia"],
            ["africa", "Africa"],
            ["oceania", "Oceania"],
            ["europe_other", "Europe (other)"],
          ] as Array<[Region, string]>).map(([region, label]) => {
            const list = countriesByRegion(region);
            if (list.length === 0) return null;
            return (
              <div key={region} style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "0.5rem", textAlign: "center" }}>
                  {label} <span style={{ opacity: 0.6 }}>({list.length})</span>
                </h3>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
                  {list.map((c) => (
                    <Link
                      key={c.code}
                      href={`/${c.code}`}
                      hrefLang={c.htmlLang}
                      style={{ fontSize: "0.85rem", padding: "0.3rem 0.55rem", border: "1px solid var(--border)", borderRadius: "0.4rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                    >
                      <Flag code={c.code} width={20} title={c.name} />
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <Footer lang="en" />
    </>
  );
}
