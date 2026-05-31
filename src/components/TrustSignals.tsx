import { tr, type LangCode } from "@/i18n/languages";

// Linha de 3 selos de confiança usados abaixo do hero, no CTA de plano e no
// header do checkout. Pure server-side — sem state, sem effect — só renderiza
// 3 chips com emoji + texto traduzido.
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

  const items: Array<{ icon: string; label: string }> = [
    { icon: "🛡️", label: t.trust.refill },
    { icon: "🔐", label: t.trust.password },
    { icon: "⚡", label: t.trust.delivery },
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
          <span aria-hidden style={{ fontSize: compact ? "0.95rem" : "1.05rem" }}>{it.icon}</span>
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
