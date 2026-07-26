// /feed.xml — RSS 2.0 do conteúdo serial (case studies + guias do help center).
// Um canal estável e barato pra máquinas e agentes de IA acompanharem as
// novidades editoriais (AIO §64 SHOULD — "feeds quando há conteúdo serial").
// Gerado das mesmas fontes, com datas REAIS por item; nunca à mão.
//
// Onde: servido em /feed.xml (o middleware não reescreve paths com extensão) e
// referenciado por <link rel="alternate" type="application/rss+xml"> no root
// layout (alternates.types).

import { CASE_STUDIES } from "@/lib/case-studies";
import { HELP_TOPICS } from "@/lib/help";

// Cache 1h — conteúdo serial cresce devagar.
export const revalidate = 3600;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Escapa os 5 metacaracteres XML pra não quebrar o feed com títulos/descrições
// que contenham & < > " '.
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type FeedItem = { title: string; link: string; description: string; date: string };

// GET — junta case studies + guias, ordena por data desc e emite RSS 2.0.
export async function GET() {
  const base = siteUrl();
  const items: FeedItem[] = [
    ...CASE_STUDIES.map((cs) => ({
      title: cs.title,
      link: `${base}/case-studies/${cs.slug}`,
      description: cs.challenge,
      date: cs.updatedAt,
    })),
    ...HELP_TOPICS.map((t) => ({
      title: t.title,
      link: `${base}/help/${t.slug}`,
      description: t.intro,
      date: `${t.updatedAt}T00:00:00Z`,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1)); // mais recente primeiro

  const rssItems = items
    .map(
      (it) => `
    <item>
      <title>${xmlEscape(it.title)}</title>
      <link>${xmlEscape(it.link)}</link>
      <guid isPermaLink="true">${xmlEscape(it.link)}</guid>
      <description>${xmlEscape(it.description)}</description>
      <pubDate>${new Date(it.date).toUTCString()}</pubDate>
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Viralefy — guides and case studies</title>
    <link>${base}</link>
    <description>New buying guides, help articles and growth case studies from Viralefy.</description>
    <language>en</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />${rssItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
