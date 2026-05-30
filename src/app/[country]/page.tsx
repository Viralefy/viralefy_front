import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Plan } from "@/lib/api";
import { COUNTRIES, getCountry, countriesByRegion } from "@/i18n/countries";
import { buildCountryJsonLd } from "@/lib/jsonld";
import { LandingPlans } from "@/components/LandingPlans";

export const dynamic = "force-dynamic";

type Params = { country: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country } = await params;
  const c = getCountry(country);
  if (!c) return { title: "Not found" };

  // hreflang: cada país aponta para a sua URL pelo seu BCP 47 único.
  // x-default aponta para a home.
  const languages: Record<string, string> = { "x-default": "/" };
  for (const other of COUNTRIES) {
    languages[other.htmlLang] = `/${other.code}`;
  }

  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical: `/${c.code}`,
      languages,
    },
    openGraph: {
      title: c.title,
      description: c.description,
      locale: c.htmlLang.replace("-", "_"),
      type: "website",
      url: `${siteUrl()}/${c.code}`,
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description: c.description,
    },
  };
}

async function getSeguidoresPlans(): Promise<Plan[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/v1/plans`, { cache: "no-store" });
    const json = await res.json();
    return (json.data as Plan[]).filter((p) => p.category === "seguidores");
  } catch {
    return [];
  }
}

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const c = getCountry(country);
  if (!c) notFound();

  const plans = await getSeguidoresPlans();
  const jsonld = buildCountryJsonLd(c, plans, siteUrl());

  // Outros mercados (mesma região primeiro, depois a outra).
  const sameRegion = countriesByRegion(c.region).filter((o) => o.code !== c.code);
  const otherRegion = countriesByRegion(c.region === "americas" ? "sepa" : "americas");

  return (
    <>
      {jsonld.map((doc, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }}
        />
      ))}

      <article lang={c.htmlLang}>
        <nav aria-label="Breadcrumb" className="container" style={{ paddingTop: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <ol style={{ listStyle: "none", display: "flex", gap: "0.5rem", padding: 0 }}>
            <li><Link href="/">Home</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">{c.flag} {c.name}</li>
          </ol>
        </nav>

        <header className="hero container">
          <h1>{c.flag} {c.h1}</h1>
          <p>{c.intro}</p>
        </header>

        <main className="container" style={{ paddingBottom: "4rem" }}>
          <section aria-labelledby="plans-heading">
            <LandingPlans plans={plans} labels={c.labels} />
          </section>

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
              {c.region === "americas" ? "Américas / Americas" : "Europa / SEPA"}
            </h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {sameRegion.map((o) => (
                <Link key={o.code} href={`/${o.code}`} hrefLang={o.htmlLang} style={{ fontSize: "0.85rem" }}>
                  {o.flag} {o.name}
                </Link>
              ))}
            </div>
            <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "1rem 0 0.5rem" }}>
              {c.region === "americas" ? "Europa / SEPA" : "Américas / Americas"}
            </h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {otherRegion.map((o) => (
                <Link key={o.code} href={`/${o.code}`} hrefLang={o.htmlLang} style={{ fontSize: "0.85rem" }}>
                  {o.flag} {o.name}
                </Link>
              ))}
            </div>
          </section>
        </main>
      </article>
    </>
  );
}
