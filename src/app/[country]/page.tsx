import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Plan } from "@/lib/api";
import { COUNTRIES, getCountry, countriesByRegion } from "@/i18n/countries";
import { buildCountryJsonLd } from "@/lib/jsonld";
import { CategoryGroupedGrid } from "@/components/CategoryGroupedGrid";
import { Footer } from "@/components/Footer";
import { TrustSignals } from "@/components/TrustSignals";
import { LiveCounter } from "@/components/LiveCounter";
import { Flag } from "@/components/Flag";
import { langOfCountry, tr } from "@/i18n/languages";
import { CATEGORY_CODES, categoryLabel, categorySlug } from "@/i18n/categories";
import { countryRootAlternates } from "@/lib/hreflang";
import { indexableMeta } from "@/lib/seo-meta";

export const dynamic = "force-dynamic";

type Params = { country: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country } = await params;
  const c = getCountry(country);
  if (!c) return { title: "Not found" };

  // Country roots formam um grupo hreflang isolado da home. x-default
  // aponta pra /us (en-US canônico do grupo), não pra `/` (home global —
  // grupo separado). Ver lib/hreflang.ts.
  const altsCountry = countryRootAlternates(c.code);

  const seoMeta = indexableMeta();
  return {
    // c.title já vem com sufixo "| Viralefy" — usamos absolute para o
    // template do root layout não duplicar.
    title: { absolute: c.title },
    description: c.description,
    alternates: altsCountry,
    robots: seoMeta.robots,
    other: seoMeta.other,
    openGraph: {
      title: c.title,
      description: c.description,
      locale: c.htmlLang.replace("-", "_"),
      type: "website",
      siteName: "Viralefy",
      url: `${siteUrl()}/${c.code}`,
      images: [{ url: `/og/${c.code}`, width: 1200, height: 630, alt: c.title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@viralefy",
      creator: "@viralefy",
      title: c.title,
      description: c.description,
      images: [`/og/${c.code}`],
    },
  };
}

async function getPlans(): Promise<Plan[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/v1/plans`, { cache: "no-store" });
    const json = await res.json();
    return (json.data as Plan[]) ?? [];
  } catch {
    return [];
  }
}

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const c = getCountry(country);
  if (!c) notFound();

  const plans = await getPlans();
  const lang = langOfCountry(c.code);
  const t = tr(lang);

  // JSON-LD pega a categoria primária do país (seguidores IG) — é o
  // produto-âncora pro Service/AggregateOffer. Antes filtrava por "seguidores"
  // que não existia mais (split em seguidores_instagram/_tiktok).
  const anchorPlans = plans.filter((p) => p.category === "seguidores_instagram");
  const jsonld = buildCountryJsonLd(c, anchorPlans, siteUrl());

  const sameRegion = countriesByRegion(c.region).filter((o) => o.code !== c.code);
  const otherRegion = countriesByRegion(c.region === "americas" ? "sepa" : "americas");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />

      <article lang={c.htmlLang}>
        <nav aria-label="Breadcrumb" className="container" style={{ paddingTop: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <ol style={{ listStyle: "none", display: "flex", gap: "0.5rem", padding: 0 }}>
            <li><Link href="/">{t.category.breadcrumb}</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <Flag code={c.code} width={20} title={c.name} />
              {c.name}
            </li>
          </ol>
        </nav>

        <header className="hero container">
          <h1 style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Flag code={c.code} width={40} title={c.name} />
            <span>{c.h1}</span>
          </h1>
          <p>{c.intro}</p>
          <TrustSignals lang={lang} />
        </header>

        <main className="container" style={{ paddingBottom: "4rem" }}>
          {/* Atalhos diretos para cada página de categoria — sinaliza o
              menu de serviços e dá link interno para SEO. */}
          <nav aria-label={t.home.pickService} style={{ marginBottom: "2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {CATEGORY_CODES.map((code) => (
              <Link
                key={code}
                href={`/${c.code}/${categorySlug(code, lang)}`}
                className="btn btn-outline"
                style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
              >
                {categoryLabel(code, lang)}
              </Link>
            ))}
          </nav>

          <CategoryGroupedGrid plans={plans} lang={lang} countryCode={c.code} />

          <p style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link href="/" className="btn btn-outline">
              {c.labels.backToStore}
            </Link>
          </p>

          <section aria-labelledby="markets-heading" style={{ marginTop: "3rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <h2 id="markets-heading" style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
              {c.labels.otherMarkets}
            </h2>
            <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0.5rem 0" }}>
              {c.region === "americas" ? "Americas" : "Europe / SEPA"}
            </h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {sameRegion.map((o) => (
                <Link key={o.code} href={`/${o.code}`} hrefLang={o.htmlLang} style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                  <Flag code={o.code} width={18} title={o.name} />
                  {o.name}
                </Link>
              ))}
            </div>
            <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "1rem 0 0.5rem" }}>
              {c.region === "americas" ? "Europe / SEPA" : "Americas"}
            </h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {otherRegion.map((o) => (
                <Link key={o.code} href={`/${o.code}`} hrefLang={o.htmlLang} style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                  <Flag code={o.code} width={18} title={o.name} />
                  {o.name}
                </Link>
              ))}
            </div>
          </section>
        </main>
      </article>

      <Footer lang={lang} />
      <LiveCounter lang={lang} />
    </>
  );
}
