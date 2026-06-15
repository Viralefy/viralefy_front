import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Plan } from "@/lib/api";
import { buildOfferEnhancements, buildAggregateOffer, withGlobalGraph, safeJsonStringify } from "@/lib/jsonld";
import { categoryAlternates } from "@/lib/hreflang";
import { indexableMeta } from "@/lib/seo-meta";
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
import { RecoveryForm } from "@/components/RecoveryForm";
import { Flag } from "@/components/Flag";

// Página de categoria por país. Slug aceita o nome local (`/br/seguidores`,
// `/us/followers`, `/de/follower`). A página entrega:
//   - 500+ palavras de cópia em prosa por idioma com nome do país interpolado
//   - bullets de proposta de valor
//   - duas variantes de apresentação dos planos (cards + slider)
//   - FAQ rico (JSON-LD FAQPage)
//   - JSON-LD Service + AggregateOffer + BreadcrumbList

// ISR (round 23 Track XX): combinação países × categorias gera cardinalidade
// alta (~60 × 5 = 300 rotas). NÃO usamos `generateStaticParams` aqui pra não
// alongar o build — Next gera on-demand no primeiro hit e cacheia por 30min.
// SEO/crawlers veem HTML pré-rendado a partir do 2º hit (cache hit). Trade-off:
// primeiro hit numa combinação fria ainda paga o custo SSR (~1.5-2s), mas
// crawlers e tráfego repetido pagam ~5ms (CDN/edge).
export const revalidate = 1800;

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

  // hreflang via helper centralizado. x-default aponta pra variante en-US
  // DA MESMA categoria (ex.: /us/instagram-followers), NÃO pra `/`. Antes
  // apontava pra home → 197 "missing reciprocal" no Ahrefs (Site Audit
  // 2026-06-05).
  const altsCat = categoryAlternates(c.code, cat);
  const canonical = altsCat.canonical;
  const ogUrl = `/og/${c.code}/${categorySlug(cat, lang)}`;
  const seoMeta = indexableMeta();
  return {
    // metaTitle já vem com "| Viralefy" — absolute pra não duplicar.
    title: { absolute: copy.metaTitle(c.name) },
    description: copy.metaDescription(c.name),
    alternates: altsCat,
    robots: seoMeta.robots,
    other: seoMeta.other,
    openGraph: {
      title: copy.metaTitle(c.name),
      description: copy.metaDescription(c.name),
      url: `${siteUrl()}${canonical}`,
      locale: c.htmlLang.replace("-", "_"),
      type: "website",
      siteName: "Viralefy",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: copy.metaTitle(c.name) }],
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy", images: [ogUrl] },
  };
}

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
  // shippingDetails + hasMerchantReturnPolicy: warnings no GSC sem isso.
  const offerEnhancements = buildOfferEnhancements(c.code);
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
      ...offerEnhancements,
    };
  });
  // BUG-192: AggregateOffer via helper (filtra non-numéricos / zero).
  const aggregateOffer = buildAggregateOffer(offers, { priceCurrency: "USD" });

  // BUG-191: consolida todos os nós em UM @graph. Antes emitia 3 scripts
  // separados (Breadcrumb + Service + FAQPage) que Ahrefs/Rich Results
  // expandem como duplicates.
  // Track CC: withGlobalGraph prepende Org+WebSite — Service.provider passa a
  // referenciar `#organization` por @id (entidade canônica no mesmo graph),
  // não mais um Organization inline anônimo.
  const jsonld = withGlobalGraph(
    [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.category.breadcrumb, item: url },
          { "@type": "ListItem", position: 2, name: c.name, item: `${url}/${c.code}` },
          { "@type": "ListItem", position: 3, name: catLabel, item: pageUrl },
        ],
      },
      {
        "@type": "Service",
        name: copy.h1(c.name),
        description: copy.metaDescription(c.name),
        provider: { "@id": `${url}/#organization` },
        areaServed: { "@type": "Country", name: c.name },
        // `inLanguage` não é válido em Service — Schema.org restringe a
        // propriedade a CreativeWork. O <article lang={c.htmlLang}> da página
        // e o BreadcrumbList já carregam o sinal de idioma.
        offers: aggregateOffer ?? undefined,
      },
      {
        "@type": "FAQPage",
        mainEntity: copy.faq().map((q) => ({
          "@type": "Question",
          name: q.q,
          acceptedAnswer: { "@type": "Answer", text: q.a },
        })),
      },
    ],
    { siteUrl: url, inLanguage: c.htmlLang },
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(jsonld) }} />

      <article lang={c.htmlLang}>
        <nav aria-label="Breadcrumb" className="container" style={{ paddingTop: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <ol style={{ listStyle: "none", display: "flex", gap: "0.5rem", padding: 0, flexWrap: "wrap" }}>
            <li><Link href="/">{t.category.breadcrumb}</Link></li>
            <li aria-hidden>›</li>
            <li><Link href={`/${c.code}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><Flag code={c.code} width={16} />{c.name}</Link></li>
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

          {/* Account Recovery: LP especializada — formulário no lugar dos
              cards de plano. Único item de catálogo nessa categoria. */}
          {cat === "recuperacao_perfil" ? (
            <section style={{ marginTop: "1rem" }}>
              <RecoveryForm lang={lang} />
            </section>
          ) : (
            <>
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

              {/* Variante B — slider só faz sentido em categorias com ladder. */}
              {sortedPlans.length >= 2 &&
                cat !== "servicos" && (
                  <section aria-labelledby="plans-slider" style={{ marginTop: "3rem" }}>
                    <h2 id="plans-slider" style={{ textAlign: "center", marginBottom: "1rem", fontSize: "1.25rem" }}>
                      {t.category.chooseQty}
                    </h2>
                    <QuantitySlider plans={sortedPlans} lang={lang} unitLabel={unitLabel} countryCode={c.code} />
                  </section>
                )}
            </>
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
