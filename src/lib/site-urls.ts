// Gera a lista canônica de URLs do site, agora particionada por idioma.
//
// O sitemap.xml virou um *índice* que aponta para /sitemap-<lang>.xml. Cada
// per-lang sitemap é gerado por route handler que filtra `allSiteUrls()`
// pelo idioma do país. Páginas legais entram em todos os idiomas pois cada
// uma tem uma URL `?lang=<code>` distinta.
//
// Idiomas no índice = todos os langs presentes em PACKS + "legal" virtual
// para as URLs cross-language.

import { COUNTRIES } from "@/i18n/countries";
import { CATEGORY_CODES, categorySlug } from "@/i18n/categories";
import { LEGAL_SLUGS } from "@/i18n/legal";
import { PACKS, langOfCountry, type LangCode } from "@/i18n/languages";
import { CITIES } from "@/lib/cities";
import { COMPETITORS } from "@/lib/competitors";
import { HELP_TOPICS } from "@/lib/help";
import { CASE_STUDIES } from "@/lib/case-studies";
import type { Plan } from "./api";

export type SiteUrl = {
  url: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  lang: LangCode | "legal";   // lang determina em qual per-lang sitemap a URL cai
  lastModified?: string;       // ISO date — quando conhecido
};

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function fetchPlans(): Promise<Plan[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    // Revalidate=3600 (1h). Antes era `cache: "no-store"` o que forçava o
    // sitemap a regerar 18k URLs em CADA request (~950ms TTFB, 3.2s total —
    // Ahrefs flagou como "slow page" em 2026-06-05). Catálogo muda devagar.
    const res = await fetch(`${base}/v1/plans`, { next: { revalidate: 3600 } });
    const json = await res.json();
    return (json.data as Plan[]) ?? [];
  } catch {
    return [];
  }
}

export async function allSiteUrls(): Promise<SiteUrl[]> {
  const base = siteUrl();
  const plans = await fetchPlans();
  const out: SiteUrl[] = [];

  // Home global = entrada do bloco `en`.
  out.push({ url: base, changeFrequency: "weekly", priority: 1.0, lang: "en" });

  for (const c of COUNTRIES) {
    const lang = langOfCountry(c.code);
    out.push({ url: `${base}/${c.code}`, changeFrequency: "weekly", priority: 0.9, lang });

    for (const cat of CATEGORY_CODES) {
      const slug = categorySlug(cat, lang);
      out.push({ url: `${base}/${c.code}/${slug}`, changeFrequency: "weekly", priority: 0.8, lang });

      const catPlans = plans.filter((p) => p.category === cat);
      // Categorias de serviço (servicos, recuperacao_perfil) têm múltiplos
      // planos com followers_qty=1 — a URL pattern `${qty}-${slug}`
      // colidiria N vezes. Dedup por URL: sitemap lista cada URL uma vez.
      const seenInCat = new Set<string>();
      for (const p of catPlans) {
        const planUrl = `${base}/${c.code}/${slug}/${p.followers_qty}-${slug}`;
        if (seenInCat.has(planUrl)) continue;
        seenInCat.add(planUrl);
        out.push({
          url: planUrl,
          changeFrequency: "weekly",
          priority: 0.7,
          lang,
        });
      }
    }
  }

  // Tier 4 SEO/Growth — landings standalone EN. Caem no bucket "en".
  // /pricing, /cities + 50 cidades, /vs + N competidores, /help + 12 tópicos,
  // /case-studies + 6 estudos. Todas no bucket "en" porque copy é EN-only.
  out.push({ url: `${base}/pricing`, changeFrequency: "weekly", priority: 0.7, lang: "en" });
  out.push({ url: `${base}/status`, changeFrequency: "hourly", priority: 0.4, lang: "en" });
  out.push({ url: `${base}/legal/cookie-preferences`, changeFrequency: "yearly", priority: 0.3, lang: "en" });

  out.push({ url: `${base}/cities`, changeFrequency: "weekly", priority: 0.7, lang: "en" });
  for (const c of CITIES) {
    out.push({ url: `${base}/cities/${c.slug}`, changeFrequency: "monthly", priority: 0.6, lang: "en" });
  }

  out.push({ url: `${base}/vs`, changeFrequency: "weekly", priority: 0.6, lang: "en" });
  for (const c of COMPETITORS) {
    out.push({ url: `${base}/vs/${c.slug}`, changeFrequency: "monthly", priority: 0.5, lang: "en" });
  }

  out.push({ url: `${base}/help`, changeFrequency: "weekly", priority: 0.7, lang: "en" });
  for (const t of HELP_TOPICS) {
    out.push({ url: `${base}/help/${t.slug}`, changeFrequency: "monthly", priority: 0.6, lang: "en" });
  }

  out.push({ url: `${base}/case-studies`, changeFrequency: "monthly", priority: 0.6, lang: "en" });
  for (const cs of CASE_STUDIES) {
    out.push({ url: `${base}/case-studies/${cs.slug}`, changeFrequency: "monthly", priority: 0.5, lang: "en" });
  }

  // Legais — uma URL por idioma. Caem no bucket "legal" pra não inflar nenhum lang.
  for (const slug of LEGAL_SLUGS) {
    for (const code of Object.keys(PACKS) as LangCode[]) {
      out.push({
        url: `${base}/legal/${slug}?lang=${code}`,
        changeFrequency: "monthly",
        priority: 0.3,
        lang: "legal",
      });
    }
  }

  return out;
}

export function urlsForLang(all: SiteUrl[], lang: LangCode | "legal"): SiteUrl[] {
  return all.filter((u) => u.lang === lang);
}

// Limite por sitemap. Google/Bing aceitam até 50k URLs/sitemap, mas o user
// pediu max 100 por XML pra ter granularidade fina (sitemap mais leve =
// crawler atualiza só o slice que mudou; SEO audit lê mais rápido).
//
// Sitemaps maiores que isso quebram em páginas; bucket id vira "<lang>" pra
// página 1 (back-compat) e "<lang>-<n>" pra páginas seguintes (n=2,3,…).
export const SITEMAP_URLS_PER_PAGE = 100;

// SitemapBucketID descreve um shard concreto de URLs no sitemap. id é o
// que vai pra rota /sitemap/<id>.xml; lang/page são os componentes parsed
// pra debug + filtro no sitemap({id}) handler.
export type SitemapBucketID = {
  id: string;                  // "en", "en-2", "legal", "pt-3"
  lang: LangCode | "legal";
  page: number;                // 1-based
};

// parseSitemapBucketID decodifica "en-3" → {lang: "en", page: 3}. "en" sem
// sufixo é page=1. Strings inválidas caem em {lang:"en", page:1} como
// fallback gracioso (evita 500 quando crawler especula com bucket inexistente).
export function parseSitemapBucketID(raw: string): SitemapBucketID {
  const m = raw.match(/^(.+?)(?:-(\d+))?$/);
  if (!m) return { id: raw, lang: "en", page: 1 };
  const lang = m[1] as LangCode | "legal";
  const page = m[2] ? Math.max(1, parseInt(m[2], 10)) : 1;
  return { id: raw, lang, page };
}

// paginatedBuckets enumera TODOS os buckets concretos a partir do snapshot
// de URLs. Usado tanto pelo Next.js (generateSitemaps) quanto pelo route
// handler do índice XML — ambos têm que enumerar a mesma lista pra crawler
// não baixar 404. Buckets vazios são DESCARTADOS (não inserimos lang sem
// URL, evita sitemap vazio que Search Console alerta).
export function paginatedBuckets(all: SiteUrl[]): SitemapBucketID[] {
  const out: SitemapBucketID[] = [];
  for (const lang of SITEMAP_BUCKETS) {
    const slice = urlsForLang(all, lang);
    if (slice.length === 0) continue;
    const pages = Math.max(1, Math.ceil(slice.length / SITEMAP_URLS_PER_PAGE));
    for (let p = 1; p <= pages; p++) {
      out.push({
        id: p === 1 ? lang : `${lang}-${p}`,
        lang,
        page: p,
      });
    }
  }
  return out;
}

// urlsForBucket devolve o slice exato pra um bucket id paginado. Out-of-
// range (page > pages) → [] silencioso; Next.js gera sitemap vazio
// ({ siteMap: [] }), prefer a vazio que erro.
export function urlsForBucket(all: SiteUrl[], b: SitemapBucketID): SiteUrl[] {
  const slice = urlsForLang(all, b.lang);
  const start = (b.page - 1) * SITEMAP_URLS_PER_PAGE;
  const end = start + SITEMAP_URLS_PER_PAGE;
  return slice.slice(start, end);
}

// Lista de buckets — usada pelo índice e pelos route handlers.
// Cada bucket gera um per-lang sitemap. "legal" é o cross-language para
// as variantes ?lang= das páginas jurídicas.
//
// `fa` (persa) foi removido em 2026-06-05: não há Irã/Tajiquistão no catálogo
// de países e o Google Search Console reportava o sitemap vazio como erro.
// Reintroduzir apenas quando `ir` for adicionado em `countries.ts`.
export const SITEMAP_BUCKETS: Array<LangCode | "legal"> = [
  "en", "pt", "es", "es_AR", "fr", "de", "it", "nl",
  "ja", "ko", "ar", "hi", "id", "vi", "th", "tr",
  "ru", "uk",
  "pl", "sv", "da", "no", "fi", "is", "et", "lv", "lt",
  "cs", "sk", "hu", "ro", "bg", "el", "hr", "sl", "ca",
  "tl", "ms", "sr", "sq", "bs", "he", "bn", "ur", "sw", "am",
  "legal",
];
