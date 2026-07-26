// /llms.txt — índice curado pra LLMs no formato llmstxt.org (Markdown), NÃO
// robots.txt (o arquivo estático antigo em public/ usava sintaxe de robots e
// não dava ponto de entrada nenhum). GERADO das MESMAS fontes do site
// (categorias, países, ajuda, case studies), então nunca desatualiza — mesma
// disciplina do sitemap.
//
// llmstxt.org: um `# H1`, um `>` blockquote de resumo, e seções `##` de links
// `[título](url): descrição`. Funciona como um "sitemap pra LLM": aponta os
// pontos de entrada mais importantes pra assistentes/respostas generativas
// (GEO/AIO §65). Onde: servido em /llms.txt (o middleware não reescreve paths
// com extensão, então chega direto a este handler).

import { CATEGORY_CODES, categoryLabel, categorySlug } from "@/i18n/categories";
import { getCountry } from "@/i18n/countries";
import { LEGAL_SLUGS } from "@/i18n/legal";
import { HELP_TOPICS } from "@/lib/help";
import { CASE_STUDIES } from "@/lib/case-studies";

// Cache 1h — o índice muda devagar (só quando entra categoria/país/guia novo).
export const revalidate = 3600;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Países-âncora no índice — llms.txt é CURADORIA, não catálogo (os 130 vivem
// no sitemap). Amostra representativa dos maiores mercados.
const FEATURED_COUNTRIES = ["us", "gb", "br", "mx", "es", "de", "fr", "it", "in", "id", "tr", "ja"];

// GET — monta o Markdown llmstxt.org a partir das fontes de conteúdo.
export async function GET() {
  const base = siteUrl();
  const en = "en" as const;

  const categoryLines = CATEGORY_CODES.map((cat) => {
    const slug = categorySlug(cat, en);
    return `- [${categoryLabel(cat, en)}](${base}/us/${slug}): ${categoryLabel(cat, en)} — US storefront (every country has its own localized page).`;
  }).join("\n");

  const countryLines = FEATURED_COUNTRIES
    .map((code) => getCountry(code))
    .filter((c): c is NonNullable<ReturnType<typeof getCountry>> => Boolean(c))
    .map((c) => `- [${c.name}](${base}/${c.code}): Localized storefront and pricing for ${c.name}.`)
    .join("\n");

  const helpLines = HELP_TOPICS.map((t) => `- [${t.title}](${base}/help/${t.slug})`).join("\n");
  const caseLines = CASE_STUDIES.map((cs) => `- [${cs.title}](${base}/case-studies/${cs.slug})`).join("\n");
  const legalSlug = LEGAL_SLUGS[0] ?? "terms";

  const md = `# Viralefy

> Viralefy sells real Instagram and TikTok growth — followers, likes, comments, shares and views — plus account recovery and business assets, delivered by automation across 130 country storefronts. Prices display in the visitor's local currency but are always billed in stable USD/USDT. No account password is ever required, orders are anonymous to your audience, and a 30-day refill guarantee covers any drop within the window.

## Start here
- [Home](${base}/): Global catalog and overview of every service.
- [Pricing](${base}/pricing): Transparent USD/USDT pricing for followers, likes and views.
- [Help center](${base}/help): How buying, delivery, payments, safety and refunds work.
- [Comparisons](${base}/vs): How Viralefy compares to other growth providers.
- [Case studies](${base}/case-studies): Directional growth results from composite campaigns.

## Services (English catalog — each localized per country)
${categoryLines}

## Country storefronts (sample — 130 total, see sitemap for all)
${countryLines}

## Guides
${helpLines}

## Case studies
${caseLines}

## Optional
- [Terms, privacy and refund policy](${base}/legal/${legalSlug}?lang=en): Legal documents, available in every supported language via the ?lang= parameter.
- [Sitemap](${base}/sitemap.xml): Full machine-readable URL index.
- [Feed](${base}/feed.xml): RSS of new guides and case studies.
`;

  return new Response(md, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
