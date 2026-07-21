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
  /**
   * `true` quando o NOME do país já aparece como texto ao lado da bandeira
   * (caso da lista de mercados, footer, megamenu e busca). Aí a imagem é
   * decorativa: `alt` repetindo o nome faz o leitor de tela anunciar
   * "Argentina Argentina" e o Lighthouse reprovar em `image-redundant-alt`.
   * O tooltip (`title`) continua, porque ele é visual, não de acessibilidade.
   */
  nameIsAdjacent?: boolean;
  style?: CSSProperties;
  className?: string;
};

// Canvas de tamanho FIXO (4:3) da flagcdn — `/{W}x{H}/xx.png`.
//
// Antes usávamos os tiers `/w20/`, que preservam a proporção ORIGINAL de cada
// bandeira: Canadá vem 20x10, EUA 20x11, Argentina 20x13, Nepal 20x24, Suíça
// 20x20. Como o componente declarava altura fixa (3:2), width/height mentiam
// pra quase toda bandeira — o Lighthouse reprovava em `image-aspect-ratio` e o
// navegador reservava espaço errado. Com o canvas fixo, a imagem vem
// letterboxed no MESMO tamanho declarado, então width/height são sempre a
// verdade: zero distorção e zero layout shift.
const FLAGCDN_TIERS = [20, 40, 80, 160, 320, 640];

function nearestTier(w: number): number {
  for (const tier of FLAGCDN_TIERS) {
    if (tier >= w) return tier;
  }
  return FLAGCDN_TIERS[FLAGCDN_TIERS.length - 1];
}

/** Caminho do canvas fixo 4:3 pra uma largura de tier (20 → "20x15"). */
function fixedCanvas(tierWidth: number): string {
  return `${tierWidth}x${Math.round((tierWidth / 4) * 3)}`;
}

export function Flag({ code, width = 20, title, style, className, nameIsAdjacent = false }: FlagProps) {
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
  // Canvas 4:3 — é o formato que a flagcdn entrega em `/{W}x{H}/`, e é o que
  // torna width/height declarados verdadeiros pra qualquer país.
  const height = Math.round((width / 4) * 3);
  const x1 = nearestTier(width);
  const x2 = nearestTier(width * 2);
  // a11y BUG-66 do QA 2026-06-12: leitores de tela ignoravam todas as flags
  // (alt=""). Passou-se a usar o `title` (nome do país) como alt. Refinado
  // depois: quando o nome JÁ está escrito ao lado (`nameIsAdjacent`), repetir
  // no alt não ajuda ninguém — anuncia duas vezes e viola a diretriz de texto
  // redundante. Nesses casos a imagem volta a ser decorativa; nos demais
  // (bandeira sozinha) o alt com o nome continua sendo o certo.
  const hasName = typeof title === "string" && title.length > 0 && !nameIsAdjacent;
  return (
    <img
      src={`${FLAG_CDN_BASE}/${fixedCanvas(x1)}/${c}.png`}
      srcSet={`${FLAG_CDN_BASE}/${fixedCanvas(x1)}/${c}.png 1x, ${FLAG_CDN_BASE}/${fixedCanvas(x2)}/${c}.png 2x`}
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
