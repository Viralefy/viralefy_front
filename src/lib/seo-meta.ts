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

// dateModified: por padrão usa o ISO do build. Páginas com `dynamic =
// "force-dynamic"` re-renderizam por request, então essa data acaba
// refletindo "agora" sempre. Aceitável: indica conteúdo "fresh" pros
// crawlers sem gerar churn em fingerprinting.
function buildTimeISO(): string {
  return new Date().toISOString();
}

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
  const modified = opts?.modifiedAt ?? buildTimeISO();
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
    dateModified: opts?.modifiedAt ?? buildTimeISO(),
  };
}
