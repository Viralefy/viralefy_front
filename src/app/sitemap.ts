import type { MetadataRoute } from "next";
import {
  allSiteUrls,
  paginatedBuckets,
  parseSitemapBucketID,
  urlsForBucket,
  SITEMAP_URLS_PER_PAGE,
} from "@/lib/site-urls";

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
  return slice.map((u) => ({
    url: u.url,
    lastModified: u.lastModified ? new Date(u.lastModified) : new Date(),
    changeFrequency: u.changeFrequency,
    priority: u.priority,
  }));
}

// Re-exporta o limite pra testes referenciarem a constante única.
export { SITEMAP_URLS_PER_PAGE };
