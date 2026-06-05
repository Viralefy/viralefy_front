import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AggregateRating, Plan, PublicReview } from "@/lib/api";
import { buildAggregateRating, buildOfferEnhancements } from "@/lib/jsonld";
import { COUNTRIES, getCountry } from "@/i18n/countries";
import { langOfCountry, tr } from "@/i18n/languages";
import {
  categoryFromSlug,
  categoryLabel,
  categorySlug,
  copyFor,
} from "@/i18n/categories";
import { Footer } from "@/components/Footer";
import { BuyPlanCta } from "@/components/BuyPlanCta";
import { LiveCounter } from "@/components/LiveCounter";

// Página dedicada a um plano específico (`/br/seguidores/1000-seguidores`).
// Slug do plano = `<qty>-<category-slug-local>`. SEO próprio: title/H1 com
// o nome do plano e do país, body com explicação do tamanho, comparação com
// vizinhos e CTA pro checkout.

export const dynamic = "force-dynamic";

type Params = { country: string; category: string; slug: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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

// Server-side reviews fetch. Cacheado por 5min — review novo só aparece no
// próximo revalidate. Trade-off: menor carga no DB vs frescor. Aceitável
// porque reviews crescem devagar.
async function getReviews(planID: string): Promise<{ reviews: PublicReview[]; aggregate: AggregateRating | null }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/v1/plans/${planID}/reviews`, {
      next: { revalidate: 300 },
    });
    const json = await res.json();
    return (json.data as { reviews: PublicReview[]; aggregate: AggregateRating | null }) ?? { reviews: [], aggregate: null };
  } catch {
    return { reviews: [], aggregate: null };
  }
}

// Extrai a qty do slug (`1000-seguidores` → 1000).
function qtyFromSlug(slug: string): number | null {
  const m = slug.match(/^(\d+)-/);
  return m ? parseInt(m[1], 10) : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country, category, slug } = await params;
  const c = getCountry(country);
  const cat = categoryFromSlug(category);
  const qty = qtyFromSlug(slug);
  if (!c || !cat || qty === null) return { title: "Not found" };

  const lang = langOfCountry(c.code);
  const catLabel = categoryLabel(cat, lang);
  const catSlug = categorySlug(cat, lang);

  const plans = (await getPlans()).filter((p) => p.category === cat);
  const plan = plans.find((p) => p.followers_qty === qty);
  if (!plan) return { title: "Not found" };

  const titleByLang: Record<string, string> = {
    en: `${qty.toLocaleString()} ${catLabel} in ${c.name} | Viralefy`,
    pt: `${qty.toLocaleString()} ${catLabel.toLowerCase()} em ${c.name} | Viralefy`,
    es: `${qty.toLocaleString()} ${catLabel.toLowerCase()} en ${c.name} | Viralefy`,
    fr: `${qty.toLocaleString()} ${catLabel.toLowerCase()} en ${c.name} | Viralefy`,
    de: `${qty.toLocaleString()} ${catLabel} in ${c.name} | Viralefy`,
    it: `${qty.toLocaleString()} ${catLabel.toLowerCase()} in ${c.name} | Viralefy`,
  };
  const descByLang: Record<string, string> = {
    en: `Buy ${qty.toLocaleString()} ${catLabel.toLowerCase()} for Instagram or TikTok in ${c.name}. Fast delivery, 30-day refill guarantee.`,
    pt: `Compre ${qty.toLocaleString()} ${catLabel.toLowerCase()} para Instagram ou TikTok em ${c.name}. Entrega rápida, reposição em 30 dias.`,
    es: `Compra ${qty.toLocaleString()} ${catLabel.toLowerCase()} para Instagram o TikTok en ${c.name}. Entrega rápida, reposición de 30 días.`,
    fr: `Achetez ${qty.toLocaleString()} ${catLabel.toLowerCase()} pour Instagram ou TikTok en ${c.name}. Livraison rapide, garantie de 30 jours.`,
    de: `Kaufen Sie ${qty.toLocaleString()} ${catLabel} für Instagram oder TikTok in ${c.name}. Schnelle Lieferung, 30-Tage-Garantie.`,
    it: `Acquista ${qty.toLocaleString()} ${catLabel.toLowerCase()} per Instagram o TikTok in ${c.name}. Consegna rapida, garanzia di 30 giorni.`,
  };
  const title = titleByLang[lang] ?? titleByLang.en;
  const description = descByLang[lang] ?? descByLang.en;

  const languages: Record<string, string> = { "x-default": "/" };
  for (const other of COUNTRIES) {
    const oLang = langOfCountry(other.code);
    languages[other.htmlLang] = `/${other.code}/${categorySlug(cat, oLang)}/${qty}-${categorySlug(cat, oLang)}`;
  }
  const canonical = `/${c.code}/${catSlug}/${qty}-${catSlug}`;

  const ogUrl = `/og/${c.code}/${catSlug}/${qty}-${catSlug}`;
  return {
    // titleByLang já termina em "| Viralefy" — absolute pra não duplicar.
    title: { absolute: title },
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      url: `${siteUrl()}${canonical}`,
      locale: c.htmlLang.replace("-", "_"),
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy", images: [ogUrl] },
  };
}

// Bloco descritivo do pacote por idioma — interpola qty, categoria, país.
function planNarrative(lang: string, cat: string, catLabel: string, qty: number, country: string): string[] {
  const labelLower = catLabel.toLowerCase();
  const NARR: Record<string, (q: number, country: string, label: string) => string[]> = {
    en: (q, ctry, label) => [
      `${q.toLocaleString()} ${label} delivered to your Instagram or TikTok account in ${ctry}. Fast pacing, 30-day refill guarantee, no password required.`,
      `This package is sized for ${describeSize(q)}. We start delivery within 30 minutes of payment confirmation and finish over a window of ${windowFor(q)} — long enough to look natural to the platform algorithm, short enough that you see the impact the same day.`,
      `Every order is anonymous and never visible to your audience. We never request your password. Just hand us your public @ handle (or the public post URL for engagement and views) and we handle the rest.`,
      `If anyone drops within 30 days we top your count back up at no cost. Pay in USDT, USD, EUR or crypto — invoices are emailed automatically.`,
    ],
    pt: (q, ctry, label) => [
      `${q.toLocaleString()} ${label} entregues na sua conta de Instagram ou TikTok em ${ctry}. Pacing rápido, reposição de 30 dias, sem senha.`,
      `O tamanho desse pacote é ideal para ${describeSizePt(q)}. Começamos a entregar em até 30 minutos depois da confirmação do pagamento e finalizamos numa janela de ${windowForPt(q)} — tempo suficiente pra parecer natural pro algoritmo, curto o bastante pra você ver o impacto no mesmo dia.`,
      `Cada pedido é anônimo e invisível pra sua audiência. Nunca pedimos senha. Você passa o seu @ público (ou a URL pública do post pra engajamento/views) e a gente cuida do resto.`,
      `Se alguém cair em 30 dias, repomos sem custo. Pague em real, dólar, euro ou cripto — recibos chegam automáticos no e-mail.`,
    ],
    es: (q, ctry, label) => [
      `${q.toLocaleString()} ${label} entregados a tu Instagram o TikTok en ${ctry}. Pacing rápido, reposición de 30 días, sin contraseña.`,
      `Este paquete es para ${describeSizeEs(q)}. Empezamos a entregar en menos de 30 minutos tras confirmar el pago y terminamos en una ventana de ${windowForPt(q)}.`,
      `Cada pedido es anónimo e invisible para tu audiencia. Nunca pedimos contraseña.`,
      `Si alguien se va dentro de 30 días, reponemos sin coste. Paga en USD, EUR o cripto.`,
    ],
  };
  const fn = NARR[lang] ?? NARR.en;
  return fn(qty, country, labelLower);
}

function describeSize(q: number): string {
  if (q <= 250) return "testing the waters — your first growth purchase";
  if (q <= 1000) return "a fresh profile that needs a credibility boost";
  if (q <= 10000) return "an account that's gaining traction and needs scale";
  if (q <= 100000) return "an account ready to chase authority status";
  return "creators going for maximum reach";
}
function describeSizePt(q: number): string {
  if (q <= 250) return "testar a água — sua primeira compra de crescimento";
  if (q <= 1000) return "perfil novo que precisa de credibilidade";
  if (q <= 10000) return "uma conta ganhando tração que precisa escalar";
  if (q <= 100000) return "uma conta indo atrás de status de autoridade";
  return "criadores buscando alcance máximo";
}
function describeSizeEs(q: number): string {
  if (q <= 250) return "probar la água — tu primera compra";
  if (q <= 1000) return "perfil nuevo que necesita credibilidad";
  if (q <= 10000) return "una cuenta ganando tracción que necesita escalar";
  if (q <= 100000) return "una cuenta yendo por estatus de autoridad";
  return "creadores buscando máximo alcance";
}
function windowFor(q: number): string {
  if (q <= 500) return "a few hours";
  if (q <= 10000) return "12–24 hours";
  return "24–72 hours";
}
function windowForPt(q: number): string {
  if (q <= 500) return "algumas horas";
  if (q <= 10000) return "12 a 24 horas";
  return "24 a 72 horas";
}

export default async function PlanPage({ params }: { params: Promise<Params> }) {
  const { country, category, slug } = await params;
  const c = getCountry(country);
  const cat = categoryFromSlug(category);
  const qty = qtyFromSlug(slug);
  if (!c || !cat || qty === null) notFound();

  const lang = langOfCountry(c.code);
  const t = tr(lang);
  const copy = copyFor(cat, lang);
  const catLabel = categoryLabel(cat, lang);
  const catSlug = categorySlug(cat, lang);

  const allPlans = await getPlans();
  const catPlans = allPlans.filter((p) => p.category === cat).sort((a, b) => a.followers_qty - b.followers_qty);
  const plan = catPlans.find((p) => p.followers_qty === qty);
  if (!plan) notFound();

  // Fetch reviews paralelo aos outros lookups (não bloqueia o crítico).
  const { reviews, aggregate } = await getReviews(plan.id);

  const idx = catPlans.findIndex((p) => p.id === plan.id);
  const related = [catPlans[idx - 1], catPlans[idx + 1]].filter(Boolean) as Plan[];
  const url = siteUrl();
  const pageUrl = `${url}/${c.code}/${catSlug}/${qty}-${catSlug}`;
  const narrative = planNarrative(lang, cat, catLabel, qty, c.name);
  // OG image absoluta — Google Merchant Listings exige `image` em Product;
  // sem isso o item é INVÁLIDO pra rich snippet (erro no GSC).
  const ogImageUrl = `${url}/og/${c.code}/${catSlug}/${qty}-${catSlug}`;
  const offerEnhancements = buildOfferEnhancements(c.code);

  const jsonld: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.category.breadcrumb, item: url },
        { "@type": "ListItem", position: 2, name: c.name, item: `${url}/${c.code}` },
        { "@type": "ListItem", position: 3, name: catLabel, item: `${url}/${c.code}/${catSlug}` },
        { "@type": "ListItem", position: 4, name: plan.name, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${plan.name} — ${c.name}`,
      description: narrative[0],
      brand: { "@type": "Brand", name: "Viralefy" },
      category: catLabel,
      // image: REQUIRED por Google Merchant Listings. Usa a OG dinâmica do
      // próprio plano — gerada server-side por src/app/og/[...slug]/route.tsx
      // em 1200×630 (formato amplo aceito pelo Google).
      image: ogImageUrl,
      // aggregateRating só entra quando há reviews REAIS no plano. O backend
      // (ListPublicPlans) devolve null quando review_count=0; buildAggregateRating
      // também devolve null nesse caso. Spread condicional pra omitir a key.
      ...(buildAggregateRating(aggregate ?? plan.aggregate_rating) ? { aggregateRating: buildAggregateRating(aggregate ?? plan.aggregate_rating) } : {}),
      offers: {
        "@type": "Offer",
        price: plan.prices?.["USD"] ?? (plan.price_cents / 100).toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: pageUrl,
        eligibleRegion: { "@type": "Country", name: c.name },
        // priceValidUntil (1 ano a partir de agora) atende validação do Google.
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        // shippingDetails + hasMerchantReturnPolicy: warnings no GSC — items
        // são válidos sem eles mas perdem recursos visuais. Storefront é
        // 100% digital, então shipping=$0 e return policy=30-day refill.
        ...offerEnhancements,
      },
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
            <li><Link href={`/${c.code}/${catSlug}`}>{catLabel}</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page">{plan.name}</li>
          </ol>
        </nav>

        <header className="hero container" style={{ paddingBottom: "1.5rem" }}>
          <h1>{plan.name} — {c.name}</h1>
          <p>{narrative[0]}</p>
          {aggregate && aggregate.review_count > 0 && (
            <ReviewStars aggregate={aggregate} />
          )}
        </header>

        <main className="container" style={{ paddingBottom: "4rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
            <div className="card">
              <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{t.plan.detailsTitle}</h2>
              <ul style={{ paddingLeft: "1.25rem", color: "var(--muted)" }}>
                {copy.bullets().slice(0, 4).map((b, i) => (
                  <li key={i} style={{ margin: "0.4rem 0" }}>
                    <strong style={{ color: "var(--text)" }}>{b.title}.</strong> {b.body}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{t.plan.whyTitle}</h2>
              {narrative.slice(1).map((p, i) => (
                <p key={i} style={{ color: "var(--muted)", margin: "0.5rem 0" }}>{p}</p>
              ))}
            </div>
          </div>

          <BuyPlanCta plan={plan} lang={lang} />

          {reviews.length > 0 && (
            <ReviewsSection reviews={reviews} aggregate={aggregate} />
          )}

          {related.length > 0 && (
            <section style={{ marginTop: "3rem" }}>
              <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>{t.plan.relatedTitle}</h2>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/${c.code}/${catSlug}/${r.followers_qty}-${catSlug}`}
                    className="card"
                    style={{ textDecoration: "none", color: "var(--text)", flex: "1 1 200px", minWidth: 200 }}
                  >
                    <strong>{r.name}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{r.description}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <p style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link href={`/${c.code}/${catSlug}`} className="btn btn-outline">
              {t.cta.backToCategory}
            </Link>
          </p>
        </main>
      </article>

      <Footer lang={lang} />
      <LiveCounter lang={lang} />
    </>
  );
}

// ReviewStars renderiza o badge agregado abaixo do H1: ★★★★★ 4.7 (12 reviews)
// Server-component puro, sem JS no cliente.
function ReviewStars({ aggregate }: { aggregate: AggregateRating }) {
  const filled = Math.round(aggregate.rating_value);
  const stars = "★".repeat(filled) + "☆".repeat(5 - filled);
  return (
    <p
      style={{
        display: "inline-flex",
        gap: "0.5rem",
        alignItems: "center",
        fontSize: "0.95rem",
        color: "var(--muted)",
        marginTop: "0.5rem",
      }}
      aria-label={`Average rating ${aggregate.rating_value.toFixed(1)} out of 5 based on ${aggregate.review_count} customer reviews`}
    >
      <span style={{ color: "#f59e0b", letterSpacing: "0.1em" }} aria-hidden>{stars}</span>
      <span>
        <strong style={{ color: "var(--text)" }}>{aggregate.rating_value.toFixed(1)}</strong>
        {" · "}
        {aggregate.review_count} {aggregate.review_count === 1 ? "review" : "reviews"}
      </span>
    </p>
  );
}

// ReviewsSection — social proof na página do plano. Mostra agregado + até 5
// reviews recentes. Resto fica acessível via "Show more" (UI futura — por ora
// render-truncate é suficiente).
function ReviewsSection({ reviews, aggregate }: { reviews: PublicReview[]; aggregate: AggregateRating | null }) {
  const top = reviews.slice(0, 5);
  return (
    <section style={{ marginTop: "3rem" }}>
      <h2 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>
        Customer reviews
        {aggregate && (
          <span style={{ fontWeight: 400, fontSize: "0.9rem", color: "var(--muted)", marginLeft: "0.5rem" }}>
            · <strong>{aggregate.rating_value.toFixed(1)}</strong>/5 ({aggregate.review_count})
          </span>
        )}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        {top.map((r, i) => (
          <ReviewCard key={i} review={r} />
        ))}
      </div>
      {reviews.length > top.length && (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.75rem" }}>
          Showing {top.length} of {reviews.length} reviews.
        </p>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  const filled = Math.max(0, Math.min(5, review.rating));
  const stars = "★".repeat(filled) + "☆".repeat(5 - filled);
  const date = new Date(review.created_at);
  return (
    <article className="card" style={{ padding: "1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "baseline", marginBottom: "0.5rem" }}>
        <strong style={{ fontSize: "0.95rem" }}>{review.author_name}</strong>
        <time
          dateTime={review.created_at}
          style={{ color: "var(--muted)", fontSize: "0.78rem" }}
        >
          {date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </time>
      </header>
      <p style={{ color: "#f59e0b", letterSpacing: "0.05em", margin: "0 0 0.5rem", fontSize: "1rem" }} aria-label={`${filled} out of 5 stars`}>
        <span aria-hidden>{stars}</span>
      </p>
      {review.title && <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{review.title}</p>}
      {review.body && (
        <p style={{ color: "var(--muted)", margin: 0, whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
          {review.body}
        </p>
      )}
    </article>
  );
}
