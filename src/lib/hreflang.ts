// Hreflang helper — centraliza a geração de `alternates` pra metadata do
// Next.js cobrindo as 4 superfícies: home, country root, category, slug.
//
// Política (após auditoria Ahrefs Site Audit 2026-06-05):
//
//   1. Cada "tipo de página" é seu próprio grupo hreflang. Home (/) está
//      em um grupo separado dos country roots; country roots em um grupo
//      separado de categories; categories em grupos POR categoria. Isso
//      evita que `/` e `/us` apareçam como alternates entre si — eles têm
//      conteúdo diferente (global vs. localizado) e Ahrefs flagava como
//      "invalid hreflang" quando declaravam reciprocidade.
//
//   2. `x-default` SEMPRE aponta pra variante en-US da página atual (a
//      "canonical English version"), NUNCA pra `/`. Antes, slug pages
//      declaravam `x-default → /` e a home não tinha link reciprocando
//      → 197 "missing reciprocal hreflang" no Ahrefs.
//
//   3. Self-tag (a entrada hreflang da própria página) sempre presente e
//      bate com o canonical.
//
//   4. Todos os 130 países compõem o grupo de country root/category/slug.

import type { CategoryCode } from "@/i18n/categories";
import { categorySlug } from "@/i18n/categories";
import { COUNTRIES, getCountry } from "@/i18n/countries";
import { langOfCountry, type LangCode } from "@/i18n/languages";

// Convenção: en-US é a variante canônica pra x-default (maior mercado
// inglês, fallback razoável pra usuários sem locale match).
const DEFAULT_COUNTRY = "us";

export type Alternates = {
  canonical: string;
  languages: Record<string, string>;
};

/**
 * Home (/) — grupo de UMA página. Próprio x-default, próprio self-tag.
 * Não declara hreflang pros country roots: eles são páginas diferentes
 * num grupo diferente.
 */
export function homeAlternates(): Alternates {
  return {
    canonical: "/",
    languages: {
      "x-default": "/",
      en: "/",
    },
  };
}

/**
 * Country root (/${code}) — grupo dos 130 country roots.
 * x-default aponta pra /us. Cada país aponta pra seu próprio /${code}.
 */
export function countryRootAlternates(currentCode: string): Alternates {
  const languages: Record<string, string> = {
    "x-default": `/${DEFAULT_COUNTRY}`,
  };
  for (const c of COUNTRIES) {
    languages[c.htmlLang] = `/${c.code}`;
  }
  return {
    canonical: `/${currentCode}`,
    languages,
  };
}

/**
 * Category (/${code}/${categorySlug}) — grupo POR categoria.
 * O slug da categoria varia por idioma (ex.: "seguidores-instagram" em es,
 * "instagram-followers" em en). x-default aponta pra variante en-US.
 */
export function categoryAlternates(currentCode: string, cat: CategoryCode): Alternates {
  const enSlug = categorySlug(cat, "en" as LangCode);
  const languages: Record<string, string> = {
    "x-default": `/${DEFAULT_COUNTRY}/${enSlug}`,
  };
  for (const c of COUNTRIES) {
    const lang = langOfCountry(c.code);
    languages[c.htmlLang] = `/${c.code}/${categorySlug(cat, lang)}`;
  }
  const currentLang = langOfCountry(getCountry(currentCode)?.code ?? currentCode);
  return {
    canonical: `/${currentCode}/${categorySlug(cat, currentLang)}`,
    languages,
  };
}

/**
 * Slug (/${code}/${categorySlug}/${qty}-${categorySlug}) — grupo POR plano.
 * Mesma lógica do category, com o qty embutido no path.
 */
export function slugAlternates(currentCode: string, cat: CategoryCode, qty: number): Alternates {
  const enSlug = categorySlug(cat, "en" as LangCode);
  const languages: Record<string, string> = {
    "x-default": `/${DEFAULT_COUNTRY}/${enSlug}/${qty}-${enSlug}`,
  };
  for (const c of COUNTRIES) {
    const lang = langOfCountry(c.code);
    const otherSlug = categorySlug(cat, lang);
    languages[c.htmlLang] = `/${c.code}/${otherSlug}/${qty}-${otherSlug}`;
  }
  const currentLang = langOfCountry(getCountry(currentCode)?.code ?? currentCode);
  const currentSlug = categorySlug(cat, currentLang);
  return {
    canonical: `/${currentCode}/${currentSlug}/${qty}-${currentSlug}`,
    languages,
  };
}
