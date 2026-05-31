import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Plan } from "@/lib/api";
import { COUNTRIES, getCountry } from "@/i18n/countries";
import { langOfCountry, tr } from "@/i18n/languages";
import {
  CATEGORY_CODES,
  categoryFromSlug,
  categoryLabel,
  categorySlug,
  categoryUnit,
  copyFor,
} from "@/i18n/categories";
import { CategoryCardGrid } from "@/components/CategoryCardGrid";
import { QuantitySlider } from "@/components/QuantitySlider";
import { Footer } from "@/components/Footer";
import { TrustSignals } from "@/components/TrustSignals";
import { LiveCounter } from "@/components/LiveCounter";

// Página de categoria por país. Slug aceita o nome local (`/br/seguidores`,
// `/us/followers`, `/de/follower`). A página entrega:
//   - 500+ palavras de cópia em prosa por idioma com nome do país interpolado
//   - bullets de proposta de valor
//   - duas variantes de apresentação dos planos (cards + slider)
//   - FAQ rico (JSON-LD FAQPage)
//   - JSON-LD Service + AggregateOffer + BreadcrumbList

export const dynamic = "force-dynamic";

type Params = { country: string; category: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country, category } = await params;
  const c = getCountry(country);
  const cat = categoryFromSlug(category);
  if (!c || !cat) return { title: "Not found" };

  const lang = langOfCountry(c.code);
  const copy = copyFor(cat, lang);

  // hreflang: este mesmo país-categoria em todos os outros países (com seu slug local).
  const languages: Record<string, string> = { "x-default": "/" };
  for (const other of COUNTRIES) {
    const otherLang = langOfCountry(other.code);
    languages[other.htmlLang] = `/${other.code}/${categorySlug(cat, otherLang)}`;
  }

  const canonical = `/${c.code}/${categorySlug(cat, lang)}`;
  const ogUrl = `/og/${c.code}/${categorySlug(cat, lang)}`;
  return {
    // metaTitle já vem com "| Viralefy" — absolute pra não duplicar.
    title: { absolute: copy.metaTitle(c.name) },
    description: copy.metaDescription(c.name),
    alternates: { canonical, languages },
    openGraph: {
      title: copy.metaTitle(c.name),
      description: copy.metaDescription(c.name),
      url: `${siteUrl()}${canonical}`,
      locale: c.htmlLang.replace("-", "_"),
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy", images: [ogUrl] },
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

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { country, category } = await params;
  const c = getCountry(country);
  const cat = categoryFromSlug(category);
  if (!c || !cat) notFound();

  const lang = langOfCountry(c.code);
  const t = tr(lang);
  const copy = copyFor(cat, lang);
  const plans = (await getPlans()).filter((p) => p.category === cat);
  const sortedPlans = [...plans].sort((a, b) => a.followers_qty - b.followers_qty);

  const catLabel = categoryLabel(cat, lang);
  const catSlug = categorySlug(cat, lang);
  const url = siteUrl();
  const pageUrl = `${url}/${c.code}/${catSlug}`;
  // Unit label sem plataforma — "followers", "likes", "comments", "shares",
  // "views". Mantém o card legível sem duplicar "instagram" / "tiktok".
  const unitLabel = categoryUnit(cat, lang);

  // Offers para AggregateOffer (e cada plano vira ProductGroup ofertado).
  // Schema.org exige priceCurrency em ISO 4217; usamos USD (não USDT, que
  // não é fiat). USD é o canônico interno (plan.prices["USD"]).
  const offers = sortedPlans.map((p) => {
    const usd = p.prices?.["USD"] ?? (p.price_cents / 100).toFixed(2);
    return {
      "@type": "Offer",
      name: p.name,
      price: usd,
      priceCurrency: "USD",
      url: `${pageUrl}/${p.followers_qty}-${catSlug}`,
      availability: "https://schema.org/InStock",
      eligibleRegion: { "@type": "Country", name: c.name },
    };
  });
  const prices = offers.map((o) => parseFloat(o.price)).filter((n) => !isNaN(n));
  const low = prices.length ? Math.min(...prices).toFixed(2) : "0";
  const high = prices.length ? Math.max(...prices).toFixed(2) : "0";

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.category.breadcrumb, item: url },
        { "@type": "ListItem", position: 2, name: c.name, item: `${url}/${c.code}` },
        { "@type": "ListItem", position: 3, name: catLabel, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: copy.h1(c.name),
      description: copy.metaDescription(c.name),
      provider: { "@type": "Organization", name: "Viralefy", url },
      areaServed: { "@type": "Country", name: c.name },
      // `inLanguage` não é válido em Service — Schema.org restringe a
      // propriedade a CreativeWork. O <article lang={c.htmlLang}> da página
      // e o BreadcrumbList já carregam o sinal de idioma.
      offers: offers.length
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: low,
            highPrice: high,
            offerCount: offers.length,
            offers,
          }
        : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: copy.faq().map((q) => ({
        "@type": "Question",
        name: q.q,
        acceptedAnswer: { "@type": "Answer", text: q.a },
      })),
    },
  ];

  return (
    <>
      {jsonld.map((doc, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }} />
      ))}

      <article lang={c.htmlLang}>
        <nav aria-label="Breadcrumb" className="container" style={{ paddingTop: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <ol style={{ listStyle: "none", display: "flex", gap: "0.5rem", padding: 0, flexWrap: "wrap" }}>
            <li><Link href="/">{t.category.breadcrumb}</Link></li>
            <li aria-hidden>›</li>
            <li><Link href={`/${c.code}`}>{c.flag} {c.name}</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">{catLabel}</li>
          </ol>
        </nav>

        <header className="hero container">
          <h1>{copy.h1(c.name)}</h1>
          <p>{copy.paragraphs(c.name)[0]}</p>
          <TrustSignals lang={lang} />
        </header>

        <main className="container" style={{ paddingBottom: "4rem" }}>
          {/* Tabs entre categorias dentro do mesmo país */}
          <nav aria-label={t.home.pickService} style={{ marginBottom: "2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {CATEGORY_CODES.map((code) => {
              const active = code === cat;
              return (
                <Link
                  key={code}
                  href={`/${c.code}/${categorySlug(code, lang)}`}
                  className={`btn ${active ? "btn-primary" : "btn-outline"}`}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                >
                  {categoryLabel(code, lang)}
                </Link>
              );
            })}
          </nav>

          {/* Variante A — cards */}
          <section aria-labelledby="plans-cards">
            <h2 id="plans-cards" style={{ textAlign: "center", marginBottom: "1rem" }}>{t.category.intro}</h2>
            <CategoryCardGrid
              plans={sortedPlans}
              lang={lang}
              countryCode={c.code}
              category={cat}
              unitLabel={unitLabel}
            />
          </section>

          {/* Variante B — slider */}
          {sortedPlans.length >= 2 && cat !== "servicos" && (
            <section aria-labelledby="plans-slider" style={{ marginTop: "3rem" }}>
              <h2 id="plans-slider" style={{ textAlign: "center", marginBottom: "1rem", fontSize: "1.25rem" }}>
                {t.category.chooseQty}
              </h2>
              <QuantitySlider plans={sortedPlans} lang={lang} unitLabel={unitLabel} />
            </section>
          )}

          {/* Cópia longa — parágrafos 2..N */}
          <section style={{ marginTop: "3rem", maxWidth: 760, marginInline: "auto" }}>
            {copy.paragraphs(c.name).slice(1).map((p, i) => (
              <p key={i} style={{ marginBottom: "1rem", color: "var(--muted)", lineHeight: 1.7 }}>{p}</p>
            ))}
          </section>

          {/* Bullets de proposta de valor */}
          <section style={{ marginTop: "2rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              {copy.bullets().map((b, i) => (
                <div key={i} className="card" style={{ padding: "1.25rem" }}>
                  <h3 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>{b.title}</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>{b.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section style={{ marginTop: "3rem", maxWidth: 760, marginInline: "auto" }}>
            <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>{t.category.faq}</h2>
            {copy.faq().map((q, i) => (
              <details key={i} style={{ borderBottom: "1px solid var(--border)", padding: "0.75rem 0" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>{q.q}</summary>
                <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>{q.a}</p>
              </details>
            ))}
          </section>

          <p style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link href={`/${c.code}`} className="btn btn-outline">
              {t.cta.backToHome}
            </Link>
          </p>
        </main>
      </article>

      <Footer lang={lang} />
      <LiveCounter lang={lang} />
    </>
  );
}
