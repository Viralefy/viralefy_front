import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Footer } from "@/components/Footer";
import { indexableMeta } from "@/lib/seo-meta";
import { COMPETITORS } from "@/lib/competitors";
import { withGlobalGraph, safeJsonStringify } from "@/lib/jsonld";

// Hub de comparações Viralefy vs competidores.
//
// BUG-75 (QA round 22): página vinha 100% EN mesmo em contexto PT/ES.
// Agora resolve lang via header `x-locale` setado pelo middleware e usa
// pack TEXT[lang] pra hero/tabela/footer. Sub-páginas /vs/<comp> ainda
// dependem do dataset COMPETITORS (EN-only) — débito documentado.
//
// ISR (round 23 Track XX): `headers()` força dynamic. Cache vira responsabilidade
// do Caddy (Cache-Control: public, s-maxage=1800, swr=86400). Track WW deve
// avaliar mover i18n pra client context.
export const revalidate = 1800;

type PageLang = "pt" | "en" | "es";

async function resolveLang(): Promise<PageLang> {
  const h = await headers();
  const locale = (h.get("x-locale") || "en").toLowerCase();
  if (locale.startsWith("pt")) return "pt";
  if (locale.startsWith("es")) return "es";
  return "en";
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

const TEXT: Record<PageLang, {
  metaTitle: string;
  metaDesc: string;
  h1: string;
  intro: string;
  tbl: { provider: string; price: string; window: string; refill: string; crypto: string; compare: string };
  hours: (h: number) => string;
  yes: string;
  no: string;
  vs: (name: string) => string;
  disclaimer: (date: string) => string;
  bcHome: string;
  bcComp: string;
  collName: string;
  collDesc: string;
  itemListName: string;
}> = {
  pt: {
    metaTitle: "Viralefy vs o resto — comparações lado a lado | Viralefy",
    metaDesc:
      "Compare a Viralefy com os principais provedores de engajamento social: preço inicial, prazo de entrega, refill, criptomoedas e suporte 24/7.",
    h1: "Viralefy vs o resto",
    intro:
      "Comparações honestas e factuais lado a lado. Preço em USDT, hreflang em 130+ mercados e pagamentos em cripto são nossos padrões — veja como o mercado se compara.",
    tbl: { provider: "Provedor", price: "Preço inicial", window: "Janela de entrega", refill: "Refill", crypto: "Cripto", compare: "Comparar" },
    hours: (h) => `${h}h`,
    yes: "Sim",
    no: "Não",
    vs: (name) => `Viralefy vs ${name}`,
    disclaimer: (d) => `Dados baseados em informação pública até ${d}. Envie correções para o suporte.`,
    bcHome: "Início",
    bcComp: "Comparações",
    collName: "Viralefy vs o resto",
    collDesc: "Comparações lado a lado entre a Viralefy e outros provedores de engajamento social.",
    itemListName: "Páginas de comparação",
  },
  en: {
    metaTitle: "Viralefy vs the rest — side-by-side comparisons | Viralefy",
    metaDesc:
      "Compare Viralefy with the most popular social-engagement providers: starting price, delivery time, refill, crypto payments and 24/7 support.",
    h1: "Viralefy vs the rest",
    intro:
      "Honest, factual side-by-side comparisons. USDT-first pricing, 130+ market hreflang and crypto payments are our defaults — see how the rest of the market stacks up.",
    tbl: { provider: "Provider", price: "Starting price", window: "Delivery window", refill: "Refill", crypto: "Crypto", compare: "Compare" },
    hours: (h) => `${h}h`,
    yes: "Yes",
    no: "No",
    vs: (name) => `Viralefy vs ${name}`,
    disclaimer: (d) => `Data based on public information as of ${d}. Send corrections to support.`,
    bcHome: "Home",
    bcComp: "Comparisons",
    collName: "Viralefy vs the rest",
    collDesc: "Side-by-side comparisons between Viralefy and other social-engagement providers.",
    itemListName: "Comparison pages",
  },
  es: {
    metaTitle: "Viralefy vs el resto — comparaciones lado a lado | Viralefy",
    metaDesc:
      "Compara Viralefy con los proveedores de engagement social más populares: precio inicial, tiempo de entrega, refill, pagos en cripto y soporte 24/7.",
    h1: "Viralefy vs el resto",
    intro:
      "Comparaciones honestas y factuales lado a lado. Precio en USDT, hreflang en 130+ mercados y pagos en cripto son nuestros valores por defecto — mira cómo se compara el resto.",
    tbl: { provider: "Proveedor", price: "Precio inicial", window: "Ventana de entrega", refill: "Refill", crypto: "Cripto", compare: "Comparar" },
    hours: (h) => `${h}h`,
    yes: "Sí",
    no: "No",
    vs: (name) => `Viralefy vs ${name}`,
    disclaimer: (d) => `Datos basados en información pública hasta ${d}. Envía correcciones al soporte.`,
    bcHome: "Inicio",
    bcComp: "Comparaciones",
    collName: "Viralefy vs el resto",
    collDesc: "Comparaciones lado a lado entre Viralefy y otros proveedores de engagement social.",
    itemListName: "Páginas de comparación",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const meta = indexableMeta();
  const canonical = "/vs";
  const lang = await resolveLang();
  const t = TEXT[lang];
  const localeOg = lang === "pt" ? "pt_BR" : lang === "es" ? "es_ES" : "en_US";
  return {
    title: { absolute: t.metaTitle },
    description: t.metaDesc,
    alternates: {
      canonical,
      languages: { "x-default": canonical, en: canonical },
    },
    robots: meta.robots,
    other: meta.other,
    openGraph: {
      title: t.metaTitle,
      description: t.metaDesc,
      url: `${siteUrl()}${canonical}`,
      locale: localeOg,
      type: "website",
    },
    twitter: { card: "summary_large_image", site: "@viralefy", creator: "@viralefy" },
  };
}

export default async function VsHubPage() {
  const lang = await resolveLang();
  const t = TEXT[lang];
  const url = siteUrl();
  const pageUrl = `${url}/vs`;

  const jsonld = withGlobalGraph(
    [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        name: t.collName,
        url: pageUrl,
        description: t.collDesc,
        inLanguage: lang,
        isPartOf: { "@id": `${url}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.bcHome, item: url },
          { "@type": "ListItem", position: 2, name: t.bcComp, item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemlist`,
        name: t.itemListName,
        numberOfItems: COMPETITORS.length,
        itemListElement: COMPETITORS.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.vs(c.name),
          url: `${url}/vs/${c.slug}`,
        })),
      },
    ],
    { siteUrl: url, inLanguage: lang },
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(jsonld) }} />

      <article lang={lang}>
        <header className="hero container">
          <h1>{t.h1}</h1>
          <p style={{ color: "var(--muted)", maxWidth: 720, margin: "0.75rem auto 0" }}>{t.intro}</p>
        </header>

        <main className="container" style={{ paddingBottom: "4rem", maxWidth: 1100 }}>
          <section className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th scope="col" style={{ padding: "0.85rem 1rem" }}>{t.tbl.provider}</th>
                  <th scope="col" style={{ padding: "0.85rem 1rem" }}>{t.tbl.price}</th>
                  <th scope="col" style={{ padding: "0.85rem 1rem" }}>{t.tbl.window}</th>
                  <th scope="col" style={{ padding: "0.85rem 1rem" }}>{t.tbl.refill}</th>
                  <th scope="col" style={{ padding: "0.85rem 1rem" }}>{t.tbl.crypto}</th>
                  <th scope="col" style={{ padding: "0.85rem 1rem" }}>{t.tbl.compare}</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c) => (
                  <tr key={c.slug} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>${c.priceFloorUsd.toFixed(2)}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>{t.hours(c.deliveryWindowHours)}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>{c.offersRefill ? t.yes : t.no}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>{c.cryptoPayments ? t.yes : t.no}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <Link href={`/vs/${c.slug}`} className="btn btn-outline" style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}>
                        {t.vs(c.name)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "1.5rem", textAlign: "center" }}>
            {t.disclaimer(new Date().toISOString().slice(0, 10))}
          </p>
        </main>
      </article>

      <Footer lang={lang} compact />
    </>
  );
}
