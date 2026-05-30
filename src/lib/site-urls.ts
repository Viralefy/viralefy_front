// Gera a lista canônica de URLs do site. Usada por:
//   - app/sitemap.ts (sitemap.xml)
//   - app/api/indexnow (submissão IndexNow)
//   - script CLI scripts/indexnow.mjs
//
// A lista cobre:
//   /                                    (home global EN)
//   /{country}                           (67 subsites)
//   /{country}/{category-slug}           (67 × 4 = 268)
//   /{country}/{category}/{qty}-{slug}   (variável, ~67 × 7 = ~469)
//   /legal/{slug}?lang={langs}           (6 docs × 8 idiomas = 48)

import { COUNTRIES } from "@/i18n/countries";
import { CATEGORY_CODES, categorySlug } from "@/i18n/categories";
import { LEGAL_SLUGS } from "@/i18n/legal";
import { PACKS, langOfCountry, type LangCode } from "@/i18n/languages";
import type { Plan } from "./api";

type SiteUrl = { url: string; changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"; priority: number };

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function fetchPlans(): Promise<Plan[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/v1/plans`, { cache: "no-store" });
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

  // Home global
  out.push({ url: base, changeFrequency: "weekly", priority: 1.0 });

  // Cada país
  for (const c of COUNTRIES) {
    out.push({ url: `${base}/${c.code}`, changeFrequency: "weekly", priority: 0.9 });
    const lang = langOfCountry(c.code);

    // Cada categoria (do país)
    for (const cat of CATEGORY_CODES) {
      const slug = categorySlug(cat, lang);
      out.push({ url: `${base}/${c.code}/${slug}`, changeFrequency: "weekly", priority: 0.8 });

      // Cada plano dessa categoria
      const catPlans = plans.filter((p) => p.category === cat);
      for (const p of catPlans) {
        out.push({
          url: `${base}/${c.code}/${slug}/${p.followers_qty}-${slug}`,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  // Páginas legais — uma URL por idioma com pacote.
  for (const slug of LEGAL_SLUGS) {
    for (const code of Object.keys(PACKS) as LangCode[]) {
      out.push({ url: `${base}/legal/${slug}?lang=${code}`, changeFrequency: "monthly", priority: 0.3 });
    }
  }

  return out;
}
