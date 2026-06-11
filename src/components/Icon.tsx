import type { CSSProperties, ReactNode } from "react";

// Icon — SVG icon set único da aplicação, substitui todos os emojis Unicode
// no UI. Vantagens:
//   - Renderização determinística cross-OS (não depende de fonte de emoji)
//   - SEO/a11y: aria-label opcional; aria-hidden default
//   - Inline SVG = zero round-trip de rede (vs Twemoji CDN)
//   - currentColor permite herdar cor do parent
//
// Adicionar novo ícone: incluir uma entrada em ICONS abaixo, no estilo
// outline 24x24 stroke=1.75 currentColor pra consistência visual.

type IconName =
  | "profile"
  | "credits"
  | "ticket"
  | "chat"
  | "lock"
  | "shield"
  | "bolt"
  | "download"
  | "search"
  | "globe"
  | "menu"
  | "close"
  | "sun"
  | "moon"
  | "card"
  | "crypto"
  | "money"
  | "diamond"
  | "warning"
  | "check"
  | "verified"
  | "instagram"
  | "tiktok"
  | "celebrate"
  | "applause"
  | "star"
  | "starFilled"
  | "chevronDown"
  | "chevronUp"
  | "arrowRight";

type IconProps = {
  name: IconName;
  size?: number | string;
  color?: string;
  label?: string;
  style?: CSSProperties;
  className?: string;
};

const PATHS: Record<IconName, ReactNode> = {
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  credits: (
    <>
      <rect x="2.5" y="6" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M13 6v2M13 11v2M13 16v2" />
    </>
  ),
  chat: (
    <>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.2 8.4 8 9 4.8-.6 8-4.5 8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  moon: (
    <>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6 15h3" />
    </>
  ),
  crypto: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8h5a2.5 2.5 0 0 1 0 5H9zM9 13h5.5a2.5 2.5 0 0 1 0 5H9zM10 6v2M13 6v2M10 18v2M13 18v2" />
    </>
  ),
  money: (
    <>
      <rect x="2.5" y="6" width="19" height="13" rx="2" />
      <circle cx="12" cy="12.5" r="3" />
      <path d="M6 9.5h.01M18 15.5h.01" />
    </>
  ),
  diamond: (
    <>
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M2 9h20M10 3l-4 6 6 12M14 3l4 6-6 12" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 2 21h20z" />
      <path d="M12 10v5M12 18v.01" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 5 5 9-11" />
    </>
  ),
  verified: (
    <>
      <path d="m12 2 2.5 2 3-1 1 3 3 1-1 3 1 3-3 1-1 3-3-1-2.5 2-2.5-2-3 1-1-3-3-1 1-3-1-3 3-1 1-3 3 1z" />
      <path d="m8.5 12 2.5 2.5L15.5 10" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14 3v10.5a3.5 3.5 0 1 1-3.5-3.5h1V13a1 1 0 1 0 1 1h.5V3z" />
      <path d="M14 3c.5 2.5 2.5 4 5 4v3c-2 0-3.7-.7-5-2" />
    </>
  ),
  celebrate: (
    <>
      <path d="M3 21 8 8l8 8z" />
      <path d="M14 6a3 3 0 0 1 4 4M17 3a5 5 0 0 1 4 4M11 11l4 4" />
    </>
  ),
  applause: (
    <>
      <path d="M9 11V5a1.5 1.5 0 0 1 3 0v6" />
      <path d="M12 11V4a1.5 1.5 0 0 1 3 0v7" />
      <path d="M15 11V6a1.5 1.5 0 0 1 3 0v9a6 6 0 0 1-6 6h-1.5A5.5 5.5 0 0 1 5 15.5L4 13a1.5 1.5 0 0 1 2.7-1.3L9 14" />
    </>
  ),
  star: (
    <>
      <path d="m12 3 2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.7 6.7 19.5l1.1-6L3.4 9.3l6-.8z" />
    </>
  ),
  starFilled: (
    <>
      <path d="m12 3 2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.7 6.7 19.5l1.1-6L3.4 9.3l6-.8z" fill="currentColor" />
    </>
  ),
  chevronDown: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  chevronUp: (
    <>
      <path d="m6 15 6-6 6 6" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  color = "currentColor",
  label,
  style,
  className,
}: IconProps) {
  const accessibility = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === "starFilled" ? color : "none"}
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "-0.18em", flexShrink: 0, ...style }}
      className={className}
      focusable="false"
      {...accessibility}
    >
      {PATHS[name]}
    </svg>
  );
}

export type { IconName };
