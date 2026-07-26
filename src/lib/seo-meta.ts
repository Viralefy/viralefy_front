// Helpers de metadata SEO que aplicam em todas as páginas indexáveis.
//
// Cobre os campos que Ahrefs Site Audit lista como "Ausente" mesmo sendo
// opcionais — usuário pediu pra explicitar:
//   - <meta name="robots">: directivas explícitas (index, follow, max-image,
//     max-snippet). Default do Google é index/follow, mas validators sinalizam
//     ausente quando a tag não existe no HTML.
//   - <meta property="article:published_time" + article:modified_time>:
//     dates legíveis pelo Open Graph (Facebook, Twitter cards e parsers
//     de crawler). Aplica em landing pages que tenham conteúdo "publicado"
//     no sentido editorial — country/category/slug.
//
// Não confunde com `WebPage.datePublished/dateModified` do JSON-LD, que
// vivem no helper buildCountryJsonLd. Os 2 são complementares: meta tags
// servem os parsers OG/Twitter; JSON-LD serve Google Rich Results.

// Data canônica de "publicação" das landings — Viralefy foi lançada em
// 2026-01-01 (HML). Se um dia tiver controle granular de quando cada
// country/category/slug foi adicionado, troca por timestamp por entidade.
const SITE_LAUNCH_DATE = "2026-01-01T00:00:00Z";

// dateModified: "versão do conteúdo editorial" — a data em que a cópia das
// landings (country/category/slug) foi revisada pela última vez. É uma
// CONSTANTE, bumpada à mão quando o copy muda (i18n/categories.ts,
// i18n/countries.ts, narrativas).
//
// POR QUÊ constante e não `new Date()`: as landings agora são ISR
// (revalidate=1800), não `force-dynamic`. `new Date()` rodava a CADA
// regeneração ISR → `dateModified`/`article:modified_time` avançavam a cada
// 30min mesmo sem o conteúdo mudar. Google/Bing descontam esse sinal de
// "frescor falso" (churn). Uma constante estável reflete a verdade: o
// conteúdo é editorial e estático no repo; só muda no deploy que altera a
// cópia. Páginas com data real por entidade (help.updatedAt,
// case-study.updatedAt) passam `modifiedAt` explícito e ignoram esta default.
const SITE_CONTENT_VERSION = "2026-07-26T00:00:00Z";

export type IndexableMeta = {
  /** robots: directivas explícitas. */
  robots: string;
  /** Open Graph article tags pra cards/parsers que olham OG. */
  other: Record<string, string>;
};

/**
 * Devolve o blob `other` + `robots` que Next.js metadata API consome.
 * Aplica em landing pages indexáveis (home, country, category, slug,
 * marketplace).
 *
 * @param opts.publishedAt ISO date opcional — default = SITE_LAUNCH_DATE
 * @param opts.modifiedAt  ISO date opcional — default = now
 */
export function indexableMeta(opts?: { publishedAt?: string; modifiedAt?: string }): IndexableMeta {
  const published = opts?.publishedAt ?? SITE_LAUNCH_DATE;
  const modified = opts?.modifiedAt ?? SITE_CONTENT_VERSION;
  return {
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    other: {
      "article:published_time": published,
      "article:modified_time": modified,
    },
  };
}

/** Datas no formato que o helper de JSON-LD espera (ISO 8601). */
export function indexableDates(opts?: { publishedAt?: string; modifiedAt?: string }): { datePublished: string; dateModified: string } {
  return {
    datePublished: opts?.publishedAt ?? SITE_LAUNCH_DATE,
    dateModified: opts?.modifiedAt ?? SITE_CONTENT_VERSION,
  };
}

// Exporta a versão do conteúdo pra libs fora do fluxo de metadata (ex.: o
// JSON-LD de country em lib/jsonld.ts) usarem a MESMA data estável, em vez de
// `new Date()`. Fonte única da verdade pro `dateModified` das landings.
export { SITE_CONTENT_VERSION, SITE_LAUNCH_DATE };

// Imagem OG/Twitter padrão (branded, 1200×630) servida por /og/global — o
// mesmo card genérico que o root layout usa como default. As landings SEO/
// growth (pricing, cities, vs, help, legal) definem `openGraph` próprio, e no
// Next isso SUBSTITUI o default do layout inteiro — sem `images`, o card
// social fica em branco (mata o CTR de compartilhamento). Estas helpers
// restauram a imagem preservando o title/description próprios da página.
// Onde: usado no `generateMetadata` das páginas sem OG por país/categoria.
export const OG_FALLBACK_IMAGE = "/og/global";

/** Array de `images` pro openGraph, com dimensão declarada (evita CLS de card). */
export function ogFallbackImages(alt: string): { url: string; width: number; height: number; alt: string }[] {
  return [{ url: OG_FALLBACK_IMAGE, width: 1200, height: 630, alt }];
}
