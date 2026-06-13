import type { CSSProperties } from "react";

// Flag — renderiza a bandeira do país via flagcdn.com (SVG hospedado por
// CDN especializado em flags). Substitui a renderização de emoji unicode
// 🇺🇸 que ficava em branco em sistemas Linux/Windows sem fonte de emoji
// color (era o motivo do Twemoji estar lá — agora eliminamos os 2 e damos
// SVG por país, ~700B-2KB cada, cacheável forever).
//
// Por que CDN externa em vez de bundle? São ~250 países × 2 variantes;
// bundle = ~600KB inflando o JS. flagcdn.com é gratuito, sem rate limit,
// e tem disponibilidade alta. `loading="lazy"` evita custo no first paint
// de páginas com lista grande de países (megamenu, footer, country index).
//
// Fallback: code uppercase entre `[..]` (ex: `[US]`). Ocorre quando o
// `<img>` falha (offline, ad-block agressivo). a11y: alt="" pois o nome do
// país aparece adjacente em quase todos os call sites.

const FLAG_CDN_BASE = "https://flagcdn.com";

type FlagProps = {
  /** ISO-3166 alpha-2 lowercase (ex: "us", "br", "fr"). */
  code: string;
  /** Largura visível em px. Default 20. CDN serve w20/w40/w80/w160/w320/w640/w1280/w2560
   *  — qualquer width fora desses tiers fallback pra tier mais próximo via Math.max. */
  width?: number;
  /** Title atribuído à imagem (tooltip). */
  title?: string;
  style?: CSSProperties;
  className?: string;
};

const FLAGCDN_TIERS = [20, 40, 80, 160, 320, 640];

function nearestTier(w: number): number {
  for (const tier of FLAGCDN_TIERS) {
    if (tier >= w) return tier;
  }
  return FLAGCDN_TIERS[FLAGCDN_TIERS.length - 1];
}

export function Flag({ code, width = 20, title, style, className }: FlagProps) {
  if (!code || code.length !== 2) {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          fontSize: "0.7rem",
          color: "var(--muted)",
          fontFamily: "monospace",
          ...style,
        }}
        className={className}
      >
        [{code?.toUpperCase() || "??"}]
      </span>
    );
  }
  const c = code.toLowerCase();
  // Aspect ratio 3:2 padrão da flagcdn.
  const height = Math.round((width / 3) * 2);
  const x1 = nearestTier(width);
  const x2 = nearestTier(width * 2);
  // a11y BUG-66 do QA 2026-06-12: leitores de tela ignoravam todas as flags
  // (alt=""). Agora usa o `title` (nome do país) como alt quando fornecido —
  // mesmo redundante com o texto adjacente, é melhor que mudo. Quando não
  // há title (uso decorativo puro), mantém alt="" + aria-hidden.
  const hasName = typeof title === "string" && title.length > 0;
  return (
    <img
      src={`${FLAG_CDN_BASE}/w${x1}/${c}.png`}
      srcSet={`${FLAG_CDN_BASE}/w${x1}/${c}.png 1x, ${FLAG_CDN_BASE}/w${x2}/${c}.png 2x`}
      width={width}
      height={height}
      alt={hasName ? title! : ""}
      aria-hidden={hasName ? undefined : true}
      title={title}
      loading="lazy"
      decoding="async"
      style={{
        display: "inline-block",
        verticalAlign: "-0.18em",
        borderRadius: "2px",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.05)",
        flexShrink: 0,
        ...style,
      }}
      className={className}
    />
  );
}
