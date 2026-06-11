import { tr, type LangCode } from "@/i18n/languages";
import { Icon, type IconName } from "./Icon";

// Linha de 3 selos de confiança usados abaixo do hero, no CTA de plano e no
// header do checkout. Pure server-side — sem state, sem effect — só renderiza
// 3 chips com ícone SVG + texto traduzido.
//
// `variant="compact"` reduz padding/altura pra caber no modal de checkout.
export function TrustSignals({
  lang = "en",
  variant = "default",
}: {
  lang?: LangCode;
  variant?: "default" | "compact";
}) {
  const t = tr(lang);
  const compact = variant === "compact";

  const items: Array<{ icon: IconName; label: string }> = [
    { icon: "shield", label: t.trust.refill },
    { icon: "lock", label: t.trust.password },
    { icon: "bolt", label: t.trust.delivery },
  ];

  return (
    <ul
      aria-label="trust signals"
      style={{
        listStyle: "none",
        padding: 0,
        margin: compact ? "0.5rem 0" : "1.25rem 0",
        display: "flex",
        gap: compact ? "0.5rem" : "1rem",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {items.map((it) => (
        <li
          key={it.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: compact ? "0.35rem 0.7rem" : "0.5rem 0.9rem",
            border: "1px solid var(--border)",
            borderRadius: "999px",
            background: "var(--gradient-subtle, rgba(0, 254, 214, 0.05))",
            fontSize: compact ? "0.78rem" : "0.85rem",
            color: "var(--text)",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name={it.icon} size={compact ? 15 : 17} color="var(--accent, #00fed6)" />
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
