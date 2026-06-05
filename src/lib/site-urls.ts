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
      for (const p of catPlans) {
        out.push({
          url: `${base}/${c.code}/${slug}/${p.followers_qty}-${slug}`,
          changeFrequency: "weekly",
          priority: 0.7,
          lang,
        });
      }
    }
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

// Lista de buckets — usada pelo índice e pelos route handlers.
// Cada bucket gera um per-lang sitemap. "legal" é o cross-language para
// as variantes ?lang= das páginas jurídicas.
export const SITEMAP_BUCKETS: Array<LangCode | "legal"> = [
  "en", "pt", "es", "es_AR", "fr", "de", "it", "nl",
  "ja", "ko", "ar", "hi", "id", "vi", "th", "tr",
  "ru", "uk",
  "pl", "sv", "da", "no", "fi", "is", "et", "lv", "lt",
  "cs", "sk", "hu", "ro", "bg", "el", "hr", "sl", "ca",
  "tl", "ms", "sr", "sq", "bs", "fa", "he", "bn", "ur", "sw", "am",
  "legal",
];
