import type { MetadataRoute } from "next";
import { allSiteUrls, SITEMAP_BUCKETS, urlsForLang } from "@/lib/site-urls";

// Sitemap dividido por idioma. Next.js gera:
//   - /sitemap.xml      → índice (sitemapindex) com 1 entry por bucket
//   - /sitemap/<id>.xml → urlset com URLs do idioma
// Buckets vêm de SITEMAP_BUCKETS (todos os LangCodes + "legal").
//
// Cache (revalidate=3600 = 1h): o sitemap/en.xml tem ~10k URLs e leva
// ~3s pra serializar (Ahrefs Site Audit 2026-06-05 flagou como "slow page").
// Sitemap muda lentamente (planos novos, novos países) → 1h é seguro;
// IndexNow ainda re-pinga na hora pra updates urgentes.
//
// Vantagens:
//   1. Cada per-lang abaixo do limite de 50k URLs.
//   2. Crawlers priorizam idiomas relevantes.
//   3. Mudanças em um idioma só re-pingam o slice via IndexNow.

export const revalidate = 3600;

export async function generateSitemaps() {
  return SITEMAP_BUCKETS.map((b) => ({ id: b }));
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const all = await allSiteUrls();
  const slice = urlsForLang(all, id as (typeof SITEMAP_BUCKETS)[number]);
  return slice.map((u) => ({
    url: u.url,
    lastModified: u.lastModified ? new Date(u.lastModified) : new Date(),
    changeFrequency: u.changeFrequency,
    priority: u.priority,
  }));
}
