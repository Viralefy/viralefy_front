// /sitemap.xml — índice (sitemapindex) que aponta pra /sitemap/<id>.xml.
// Next.js generateSitemaps em app/sitemap.ts gera os per-bucket em
// /sitemap/<id>.xml mas NÃO auto-gera o /sitemap.xml de índice — fazemos
// manualmente aqui pra controle de cache + escape correto.
//
// Com a paginação (sitemap-split, 2026-06-08), buckets viram
// "<lang>-<page>" pra páginas 2+. O índice precisa enumerar TODOS os
// shards reais — usar a mesma função de paginatedBuckets garante que o
// crawler nunca veja um <loc> pra sitemap inexistente.

import { allSiteUrls, paginatedBuckets, urlsForBucket } from "@/lib/site-urls";
import { SITE_CONTENT_VERSION } from "@/lib/seo-meta";

// Cacheado 1h (igual aos shards em sitemap.ts). ANTES era `force-dynamic` +
// `new Date()` no <lastmod> → o índice mudava a cada request e reportava
// "agora", frescor falso. Agora cada shard reporta o lastmod REAL da sua
// entrada mais recente (estável entre regenerações).
export const revalidate = 3600;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// bucketLastmod — o lastmod do shard é a data mais recente entre as URLs que
// ele contém (max lastModified). Reflete a verdade: o shard "mudou" quando sua
// entrada mais nova mudou. Fallback pra versão do conteúdo quando nenhuma URL
// do bucket declara data.
function bucketLastmod(urls: { lastModified?: string }[]): string {
  let max = "";
  for (const u of urls) {
    if (u.lastModified && u.lastModified > max) max = u.lastModified;
  }
  return (max || SITE_CONTENT_VERSION).slice(0, 10);
}

export async function GET() {
  const base = siteUrl();
  const all = await allSiteUrls();
  const buckets = paginatedBuckets(all);

  const entries = buckets.map((b) => `
  <sitemap>
    <loc>${xmlEscape(`${base}/sitemap/${b.id}.xml`)}</loc>
    <lastmod>${bucketLastmod(urlsForBucket(all, b))}</lastmod>
  </sitemap>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
