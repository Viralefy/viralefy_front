"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { getConsent, resetConsent, setConsent, type GdprConsent } from "@/lib/gdpr";
import { recordConsent } from "@/lib/consent-audit";

// Cookie preferences hub. Mostra o estado atual do consentimento e oferece:
//   - Salvar mudanças nos 3 toggles opt-in (preferences, analytics, marketing).
//   - "Reset" → limpa o storage, banner reaparece no próximo carregamento.
//
// LGPD: defaults na primeira visita são OFF para analytics/marketing
// (consent livre, Art. 8 §3). Esta página NÃO altera esses defaults — só
// reflete o estado salvo no localStorage.
//
// Página é client-only (lê localStorage). Sem `generateMetadata` (server-only);
// metadata vem do root layout + JSON-LD inline.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const PAGE_PATH = "/legal/cookie-preferences";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;

export default function CookiePreferencesPage() {
  const [consent, setConsentState] = useState<GdprConsent | null>(null);
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const c = getConsent();
    setConsentState(c);
    setPreferences(c?.preferences ?? true);
    setAnalytics(c?.analytics ?? false);
    setMarketing(c?.marketing ?? false);
  }, []);

  function save() {
    const saved = setConsent({ preferences, analytics, marketing });
    setConsentState(saved);
    setSavedAt(saved.timestamp);
    void recordConsent({
      version: saved.version,
      necessary: saved.necessary,
      preferences: saved.preferences,
      analytics: saved.analytics,
      marketing: saved.marketing,
      timestamp: saved.timestamp,
      source: "custom",
    });
  }

  function reset() {
    resetConsent();
    setConsentState(null);
    setPreferences(true);
    setAnalytics(false);
    setMarketing(false);
    setSavedAt(null);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${PAGE_URL}#webpage`,
        url: PAGE_URL,
        name: "Cookie preferences | Viralefy",
        description:
          "Review and update your cookie preferences for Viralefy. Manage preferences, analytics and marketing cookies, or reset your choices.",
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Legal", item: `${SITE_URL}/legal/privacy?lang=en` },
          { "@type": "ListItem", position: 3, name: "Cookie preferences", item: PAGE_URL },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="container" style={{ padding: "3rem 1rem", maxWidth: 720 }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem" }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Home</Link>
          {" / "}
          <Link href="/legal/privacy?lang=en" style={{ color: "var(--muted)" }}>Legal</Link>
          {" / "}
          <span>Cookie preferences</span>
        </nav>

        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem", color: "var(--text)" }}>
          Cookie preferences
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
          Review and update the cookies Viralefy may use. Necessary cookies keep the site working
          and cannot be disabled. See our{" "}
          <Link href="/legal/privacy?lang=en" style={{ color: "var(--accent)" }}>privacy policy</Link>{" "}
          and{" "}
          <Link href="/legal/cookies?lang=en" style={{ color: "var(--accent)" }}>cookie policy</Link>{" "}
          for the full picture.
        </p>

        <section className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem", color: "var(--text)" }}>
            Current status
          </h2>
          {consent === null ? (
            <p style={{ color: "var(--muted)" }}>
              You have not made a choice yet. The cookie banner will appear on your next visit.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.35rem", color: "var(--text)" }}>
              <li>Necessary: <strong>Always on</strong></li>
              <li>Preferences: <strong>{consent.preferences ? "Enabled" : "Disabled"}</strong></li>
              <li>Analytics: <strong>{consent.analytics ? "Enabled" : "Disabled"}</strong></li>
              <li>Marketing: <strong>{consent.marketing ? "Enabled" : "Disabled"}</strong></li>
              <li style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                Last updated: {new Date(consent.timestamp).toLocaleString()}
              </li>
            </ul>
          )}
        </section>

        <section className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem", color: "var(--text)" }}>
            Update preferences
          </h2>

          <Row label="Necessary" description="Authentication, cart, security. Always active.">
            <input type="checkbox" checked disabled aria-label="Necessary" style={{ width: 20, height: 20, accentColor: "var(--accent)" }} />
          </Row>
          <Row label="Preferences" description="Language, theme, currency. We remember your choices across visits.">
            <input
              type="checkbox"
              checked={preferences}
              onChange={(e) => setPreferences(e.target.checked)}
              aria-label="Preferences"
              style={{ width: 20, height: 20, accentColor: "var(--accent)" }}
            />
          </Row>
          <Row label="Analytics" description="Traffic, performance and aggregated usage metrics. Off by default.">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              aria-label="Analytics"
              style={{ width: 20, height: 20, accentColor: "var(--accent)" }}
            />
          </Row>
          <Row label="Marketing" description="Ad measurement and remarketing audiences. Off by default.">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              aria-label="Marketing"
              style={{ width: 20, height: 20, accentColor: "var(--accent)" }}
            />
          </Row>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-outline" onClick={reset}>
              Reset choices
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              Save preferences
            </button>
          </div>

          {savedAt && (
            <p aria-live="polite" style={{ color: "var(--accent)", fontSize: "0.85rem", marginTop: "0.75rem" }}>
              Preferences saved at {new Date(savedAt).toLocaleString()}.
            </p>
          )}
        </section>
      </main>
      <Footer lang="en" compact />
    </>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "1rem",
        alignItems: "center",
        padding: "0.75rem 0",
        borderTop: "1px solid var(--border)",
      }}
    >
      <span>
        <span style={{ display: "block", fontWeight: 600, color: "var(--text)" }}>{label}</span>
        <span style={{ display: "block", fontSize: "0.85rem", color: "var(--muted)" }}>{description}</span>
      </span>
      {children}
    </label>
  );
}
