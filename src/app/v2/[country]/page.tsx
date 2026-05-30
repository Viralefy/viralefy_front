import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Plan } from "@/lib/api";
import { COUNTRIES, getCountry } from "@/i18n/countries";
import { LandingCalculator } from "@/components/LandingCalculator";

// Variante B (calculadora + tabela). Mesmo conteúdo localizado da /[country],
// presentação diferente para teste A/B. noindex para evitar duplicate content.

export const dynamic = "force-dynamic";

type Params = { country: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country } = await params;
  const c = getCountry(country);
  if (!c) return { title: "Not found" };
  return {
    title: c.title + " (v2)",
    description: c.description,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${c.code}` }, // canonical aponta pra variante A
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

export default async function CountryV2Page({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const c = getCountry(country);
  if (!c) notFound();
  const plans = await getSeguidoresPlans();

  return (
    <article lang={c.htmlLang}>
      <nav aria-label="Breadcrumb" className="container" style={{ paddingTop: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
        <ol style={{ listStyle: "none", display: "flex", gap: "0.5rem", padding: 0 }}>
          <li><Link href="/">Home</Link></li>
          <li aria-hidden>›</li>
          <li><Link href={`/${c.code}`}>{c.flag} {c.name}</Link></li>
          <li aria-hidden>›</li>
          <li aria-current="page">v2 (calculadora)</li>
        </ol>
      </nav>

      <header className="hero container">
        <p style={{ fontSize: "0.75rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.5rem" }}>
          Variante experimental — escolha pelo total
        </p>
        <h1>{c.flag} {c.h1}</h1>
        <p>{c.intro}</p>
        <p style={{ marginTop: "1rem" }}>
          <Link href={`/${c.code}`} style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            ← prefiro a versão com cards
          </Link>
        </p>
      </header>

      <main className="container" style={{ paddingBottom: "4rem" }}>
        <LandingCalculator plans={plans} labels={c.labels} />

        <section style={{ marginTop: "3rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>{c.labels.otherMarkets}</h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {COUNTRIES.filter((o) => o.code !== c.code).slice(0, 12).map((o) => (
              <Link key={o.code} href={`/v2/${o.code}`} hrefLang={o.htmlLang} style={{ fontSize: "0.85rem" }}>
                {o.flag} {o.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </article>
  );
}
