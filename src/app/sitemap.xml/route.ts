// /sitemap.xml — índice (sitemapindex) que aponta pra /sitemap/<id>.xml.
// Next.js generateSitemaps em app/sitemap.ts gera os per-bucket em
// /sitemap/<id>.xml mas NÃO auto-gera o /sitemap.xml de índice — fazemos
// manualmente aqui pra controle de cache + escape correto.
//
// Com a paginação (sitemap-split, 2026-06-08), buckets viram
// "<lang>-<page>" pra páginas 2+. O índice precisa enumerar TODOS os
// shards reais — usar a mesma função de paginatedBuckets garante que o
// crawler nunca veja um <loc> pra sitemap inexistente.

import { allSiteUrls, paginatedBuckets } from "@/lib/site-urls";

export const dynamic = "force-dynamic";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const base = siteUrl();
  const today = new Date().toISOString().slice(0, 10);
  const all = await allSiteUrls();
  const buckets = paginatedBuckets(all);

  const entries = buckets.map((b) => `
  <sitemap>
    <loc>${xmlEscape(`${base}/sitemap/${b.id}.xml`)}</loc>
    <lastmod>${today}</lastmod>
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
