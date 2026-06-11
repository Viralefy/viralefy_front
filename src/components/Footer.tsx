import Link from "next/link";
import { tr, type LangCode } from "@/i18n/languages";
import { LEGAL_SLUGS } from "@/i18n/legal";
import { countriesByRegion } from "@/i18n/countries";
import { Flag } from "./Flag";

// Rodapé global. Os links jurídicos vivem em `/legal/{slug}?lang=...` —
// renderizamos um por idioma do visitante. Mercados são links de país.
//
// `compact={true}` esconde a lista longa de mercados (útil em páginas internas).
export function Footer({ lang = "en", compact = false }: { lang?: LangCode; compact?: boolean }) {
  const t = tr(lang);
  const year = new Date().getFullYear();

  const legalLabel: Record<typeof LEGAL_SLUGS[number], string> = {
    privacy: t.footer.links.privacy,
    terms: t.footer.links.terms,
    cookies: t.footer.links.cookies,
    refund: t.footer.links.refund,
    about: t.footer.links.about,
    contact: t.footer.links.contact,
  };

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        marginTop: "3rem",
        padding: "2.5rem 0 1.5rem",
        background: "rgba(20, 20, 31, 0.5)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: compact ? "1fr 1fr 1fr 1fr" : "1.4fr 1fr 1fr 1fr 1fr",
            gap: "2rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.4rem" }}>Viralefy</p>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{t.footer.tagline}</p>
          </div>

          {/* Discover — hub p/ as 5 verticais Tier 4: pricing, help, cities,
              vs-competitors, case studies. Cada uma é um pillar SEO próprio. */}
          <nav aria-label="Discover">
            <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.5rem" }}>
              Discover
            </h3>
            <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
              <li><Link href="/pricing" style={{ color: "var(--text)" }}>Pricing</Link></li>
              <li><Link href="/cities" style={{ color: "var(--text)" }}>Cities</Link></li>
              <li><Link href="/vs" style={{ color: "var(--text)" }}>Compare Viralefy</Link></li>
              <li><Link href="/help" style={{ color: "var(--text)" }}>Help center</Link></li>
              <li><Link href="/case-studies" style={{ color: "var(--text)" }}>Case studies</Link></li>
              <li><Link href="/status" style={{ color: "var(--text)" }}>System status</Link></li>
              <li><Link href="/legal/cookie-preferences" style={{ color: "var(--text)" }}>Cookie preferences</Link></li>
              <li><Link href="/account/referral" style={{ color: "var(--text)" }}>Refer &amp; earn</Link></li>
              <li><Link href="/account/subscriptions" style={{ color: "var(--text)" }}>Subscriptions</Link></li>
              <li><Link href="/account/api-keys" style={{ color: "var(--text)" }}>Developer API</Link></li>
            </ul>
          </nav>

          <nav aria-label={t.footer.sections.legal}>
            <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.5rem" }}>
              {t.footer.sections.legal}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
              {LEGAL_SLUGS.map((s) => (
                <li key={s}>
                  <Link href={`/legal/${s}?lang=${lang}`} style={{ color: "var(--text)" }}>
                    {legalLabel[s]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {!compact && (
            <nav aria-label={t.footer.sections.markets}>
              <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "0.5rem" }}>
                {t.footer.sections.markets}
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", fontSize: "0.85rem" }}>
                {[...countriesByRegion("americas"), ...countriesByRegion("sepa")]
                  .slice(0, 18)
                  .map((c) => (
                    <Link key={c.code} href={`/${c.code}`} hrefLang={c.htmlLang} style={{ color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <Flag code={c.code} width={16} title={c.name} />
                      {c.name}
                    </Link>
                  ))}
              </div>
            </nav>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.8rem", color: "var(--muted)" }}>
          <span>© {year} Viralefy. {t.footer.copyright}</span>
          <span>{t.footer.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}
