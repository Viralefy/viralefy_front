import type { MetadataRoute } from "next";
import {
  allSiteUrls,
  paginatedBuckets,
  parseSitemapBucketID,
  urlsForBucket,
  SITEMAP_URLS_PER_PAGE,
} from "@/lib/site-urls";
import { categoryFromSlug, type CategoryCode } from "@/i18n/categories";
import { getCountry } from "@/i18n/countries";
import { categoryAlternates, slugAlternates, countryRootAlternates } from "@/lib/hreflang";

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Computa `alternates.languages` (mapa hreflang) pra cada URL canônica que
// existe em múltiplos idiomas. BUG-59 do QA 2026-06-12: sitemap sem
// hreflang fazia Google não relacionar as variantes localizadas. Agora
// cada entrada de category/slug/country root traz o mapa completo.
function alternatesFor(url: string): Record<string, string> | undefined {
  const base = siteBase();
  if (!url.startsWith(base)) return undefined;
  const path = url.slice(base.length).replace(/^\//, "");
  if (!path) return undefined;
  const parts = path.split("/");
  const country = parts[0];
  if (!getCountry(country)) return undefined;
  const baseLanguages = (alts: { languages: Record<string, string> }): Record<string, string> => {
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(alts.languages)) {
      m[k] = v.startsWith("http") ? v : `${base}${v}`;
    }
    return m;
  };
  // /:country
  if (parts.length === 1) return baseLanguages(countryRootAlternates(country));
  const catSlug = parts[1];
  const cat = categoryFromSlug(catSlug) as CategoryCode | undefined;
  if (!cat) return undefined;
  // /:country/:category
  if (parts.length === 2) return baseLanguages(categoryAlternates(country, cat));
  // /:country/:category/:qty-slug
  if (parts.length === 3) {
    const m = parts[2].match(/^(\d+)-/);
    if (!m) return undefined;
    const qty = parseInt(m[1], 10);
    return baseLanguages(slugAlternates(country, cat, qty));
  }
  return undefined;
}

// Sitemap dividido por (idioma × página). Next.js gera:
//   - /sitemap.xml         → índice (sitemapindex) com 1 entry por bucket
//   - /sitemap/<id>.xml    → urlset com até SITEMAP_URLS_PER_PAGE URLs
//
// IDs:
//   - <lang>        → página 1 (back-compat — crawlers já indexados)
//   - <lang>-2, -3  → páginas seguintes
//   - "legal", "legal-2" → bucket cross-language das páginas jurídicas
//
// Limite de SITEMAP_URLS_PER_PAGE=100 vem do pedido do produto pra reduzir
// granularidade (sitemap leve = crawler atualiza só o slice que mudou; SEO
// audit lê mais rápido). Google/Bing aceitam até 50k URLs/sitemap, então
// estamos MUITO abaixo do limite hard.
//
// Cache (revalidate=3600 = 1h): catálogo muda devagar; IndexNow re-pinga
// pra updates urgentes.

export const revalidate = 3600;

export async function generateSitemaps() {
  const all = await allSiteUrls();
  return paginatedBuckets(all).map((b) => ({ id: b.id }));
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const all = await allSiteUrls();
  const bucket = parseSitemapBucketID(id);
  const slice = urlsForBucket(all, bucket);
  return slice.map((u) => {
    const languages = alternatesFor(u.url);
    return {
      url: u.url,
      lastModified: u.lastModified ? new Date(u.lastModified) : new Date(),
      changeFrequency: u.changeFrequency,
      priority: u.priority,
      ...(languages ? { alternates: { languages } } : {}),
    };
  });
}

// Re-exporta o limite pra testes referenciarem a constante única.
export { SITEMAP_URLS_PER_PAGE };
