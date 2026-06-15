"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { getConsent, resetConsent, setConsent, type GdprConsent } from "@/lib/gdpr";
import { recordConsent } from "@/lib/consent-audit";
import { withGlobalGraph, safeJsonStringify } from "@/lib/jsonld";

// Cookie preferences hub. Mostra o estado atual do consentimento e oferece:
//   - Salvar mudanças nos 3 toggles opt-in (preferences, analytics, marketing).
//   - "Reset" → limpa o storage, banner reaparece no próximo carregamento.
//
// LGPD: defaults na primeira visita são OFF para analytics/marketing
// (consent livre, Art. 8 §3). Esta página NÃO altera esses defaults — só
// reflete o estado salvo no localStorage.
//
// I18n: detecta idioma via navigator.language (PT/EN/ES). BUG-49 do QA
// 2026-06-12: página estava 100% em inglês mesmo pra visitantes do Brasil.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const PAGE_PATH = "/legal/cookie-preferences";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;

type Lang = "pt" | "en" | "es";

const TEXT: Record<Lang, {
  breadcrumbHome: string;
  breadcrumbLegal: string;
  breadcrumbPage: string;
  title: string;
  intro: string;
  privacyPolicy: string;
  cookiePolicy: string;
  and: string;
  currentStatus: string;
  noChoice: string;
  alwaysOn: string;
  enabled: string;
  disabled: string;
  lastUpdated: string;
  updatePrefs: string;
  catNecessary: string;
  descNecessary: string;
  catPreferences: string;
  descPreferences: string;
  catAnalytics: string;
  descAnalytics: string;
  catMarketing: string;
  descMarketing: string;
  reset: string;
  save: string;
  saved: string;
  pageTitleSEO: string;
  pageDescSEO: string;
  otherLanguages: string;
}> = {
  pt: {
    breadcrumbHome: "Início",
    breadcrumbLegal: "Jurídico",
    breadcrumbPage: "Preferências de cookies",
    title: "Preferências de cookies",
    intro: "Revise e atualize quais cookies a Viralefy pode usar. Cookies essenciais mantêm o site funcionando e não podem ser desativados. Veja nossa",
    privacyPolicy: "política de privacidade",
    cookiePolicy: "política de cookies",
    and: "e",
    currentStatus: "Status atual",
    noChoice: "Você ainda não fez uma escolha. O banner de cookies vai aparecer na próxima visita.",
    alwaysOn: "Sempre ativo",
    enabled: "Ativado",
    disabled: "Desativado",
    lastUpdated: "Última atualização",
    updatePrefs: "Atualizar preferências",
    catNecessary: "Essenciais",
    descNecessary: "Autenticação, carrinho, segurança. Sempre ativos.",
    catPreferences: "Preferências",
    descPreferences: "Idioma, tema, moeda. Lembramos suas escolhas entre visitas.",
    catAnalytics: "Analíticos",
    descAnalytics: "Tráfego, performance e métricas agregadas de uso. Desativados por padrão.",
    catMarketing: "Marketing",
    descMarketing: "Mensuração de anúncios e públicos de remarketing. Desativados por padrão.",
    reset: "Resetar escolhas",
    save: "Salvar preferências",
    saved: "Preferências salvas em",
    pageTitleSEO: "Preferências de cookies | Viralefy",
    pageDescSEO: "Revise e atualize suas preferências de cookies na Viralefy. Gerencie cookies de preferências, analytics e marketing, ou resete suas escolhas.",
    otherLanguages: "Outros idiomas",
  },
  en: {
    breadcrumbHome: "Home",
    breadcrumbLegal: "Legal",
    breadcrumbPage: "Cookie preferences",
    title: "Cookie preferences",
    intro: "Review and update the cookies Viralefy may use. Necessary cookies keep the site working and cannot be disabled. See our",
    privacyPolicy: "privacy policy",
    cookiePolicy: "cookie policy",
    and: "and",
    currentStatus: "Current status",
    noChoice: "You have not made a choice yet. The cookie banner will appear on your next visit.",
    alwaysOn: "Always on",
    enabled: "Enabled",
    disabled: "Disabled",
    lastUpdated: "Last updated",
    updatePrefs: "Update preferences",
    catNecessary: "Necessary",
    descNecessary: "Authentication, cart, security. Always active.",
    catPreferences: "Preferences",
    descPreferences: "Language, theme, currency. We remember your choices across visits.",
    catAnalytics: "Analytics",
    descAnalytics: "Traffic, performance and aggregated usage metrics. Off by default.",
    catMarketing: "Marketing",
    descMarketing: "Ad measurement and remarketing audiences. Off by default.",
    reset: "Reset choices",
    save: "Save preferences",
    saved: "Preferences saved at",
    pageTitleSEO: "Cookie preferences | Viralefy",
    pageDescSEO: "Review and update your cookie preferences for Viralefy. Manage preferences, analytics and marketing cookies, or reset your choices.",
    otherLanguages: "Other languages",
  },
  es: {
    breadcrumbHome: "Inicio",
    breadcrumbLegal: "Legal",
    breadcrumbPage: "Preferencias de cookies",
    title: "Preferencias de cookies",
    intro: "Revisa y actualiza qué cookies puede usar Viralefy. Las cookies necesarias mantienen el sitio funcionando y no se pueden desactivar. Mira nuestra",
    privacyPolicy: "política de privacidad",
    cookiePolicy: "política de cookies",
    and: "y",
    currentStatus: "Estado actual",
    noChoice: "Aún no has hecho una elección. El banner de cookies aparecerá en tu próxima visita.",
    alwaysOn: "Siempre activo",
    enabled: "Activado",
    disabled: "Desactivado",
    lastUpdated: "Última actualización",
    updatePrefs: "Actualizar preferencias",
    catNecessary: "Necesarias",
    descNecessary: "Autenticación, carrito, seguridad. Siempre activas.",
    catPreferences: "Preferencias",
    descPreferences: "Idioma, tema, moneda. Recordamos tus elecciones entre visitas.",
    catAnalytics: "Analíticas",
    descAnalytics: "Tráfico, rendimiento y métricas de uso agregadas. Desactivadas por defecto.",
    catMarketing: "Marketing",
    descMarketing: "Medición de anuncios y audiencias de remarketing. Desactivadas por defecto.",
    reset: "Restablecer elecciones",
    save: "Guardar preferencias",
    saved: "Preferencias guardadas a las",
    pageTitleSEO: "Preferencias de cookies | Viralefy",
    pageDescSEO: "Revisa y actualiza tus preferencias de cookies en Viralefy. Gestiona cookies de preferencias, analíticas y marketing, o restablece tus elecciones.",
    otherLanguages: "Otros idiomas",
  },
};

function detectLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const nl = (navigator.language || "en").toLowerCase();
  if (nl.startsWith("pt")) return "pt";
  if (nl.startsWith("es")) return "es";
  return "en";
}

export default function CookiePreferencesPage() {
  const [consent, setConsentState] = useState<GdprConsent | null>(null);
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const t = TEXT[lang];

  useEffect(() => {
    setLang(detectLang());
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

  // Track CC: withGlobalGraph prepende Org+WebSite ao @graph (sem isso,
  // WebPage.isPartOf vira ponteiro pendurado pro validador).
  const jsonLd = withGlobalGraph(
    [
      {
        "@type": "WebPage",
        "@id": `${PAGE_URL}#webpage`,
        url: PAGE_URL,
        name: t.pageTitleSEO,
        description: t.pageDescSEO,
        inLanguage: lang,
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: t.breadcrumbLegal, item: `${SITE_URL}/legal/privacy?lang=${lang}` },
          { "@type": "ListItem", position: 3, name: t.breadcrumbPage, item: PAGE_URL },
        ],
      },
    ],
    { siteUrl: SITE_URL, inLanguage: lang },
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonStringify(jsonLd) }}
      />
      <main className="container" style={{ padding: "3rem 1rem", maxWidth: 720 }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem" }}>
          <Link href="/" style={{ color: "var(--muted)" }}>{t.breadcrumbHome}</Link>
          {" / "}
          <Link href={`/legal/privacy?lang=${lang}`} style={{ color: "var(--muted)" }}>{t.breadcrumbLegal}</Link>
          {" / "}
          <span>{t.breadcrumbPage}</span>
        </nav>

        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem", color: "var(--text)" }}>
          {t.title}
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
          {t.intro}{" "}
          <Link href={`/legal/privacy?lang=${lang}`} style={{ color: "var(--accent)" }}>{t.privacyPolicy}</Link>{" "}
          {t.and}{" "}
          <Link href={`/legal/cookies?lang=${lang}`} style={{ color: "var(--accent)" }}>{t.cookiePolicy}</Link>.
        </p>

        <section className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem", color: "var(--text)" }}>
            {t.currentStatus}
          </h2>
          {consent === null ? (
            <p style={{ color: "var(--muted)" }}>
              {t.noChoice}
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.35rem", color: "var(--text)" }}>
              <li>{t.catNecessary}: <strong>{t.alwaysOn}</strong></li>
              <li>{t.catPreferences}: <strong>{consent.preferences ? t.enabled : t.disabled}</strong></li>
              <li>{t.catAnalytics}: <strong>{consent.analytics ? t.enabled : t.disabled}</strong></li>
              <li>{t.catMarketing}: <strong>{consent.marketing ? t.enabled : t.disabled}</strong></li>
              <li style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                {t.lastUpdated}: {new Date(consent.timestamp).toLocaleString()}
              </li>
            </ul>
          )}
        </section>

        <section className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem", color: "var(--text)" }}>
            {t.updatePrefs}
          </h2>

          <Row label={t.catNecessary} description={t.descNecessary}>
            <input type="checkbox" checked disabled aria-label={t.catNecessary} style={{ width: 20, height: 20, accentColor: "var(--accent)" }} />
          </Row>
          <Row label={t.catPreferences} description={t.descPreferences}>
            <input
              type="checkbox"
              checked={preferences}
              onChange={(e) => setPreferences(e.target.checked)}
              aria-label={t.catPreferences}
              style={{ width: 20, height: 20, accentColor: "var(--accent)" }}
            />
          </Row>
          <Row label={t.catAnalytics} description={t.descAnalytics}>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              aria-label={t.catAnalytics}
              style={{ width: 20, height: 20, accentColor: "var(--accent)" }}
            />
          </Row>
          <Row label={t.catMarketing} description={t.descMarketing}>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              aria-label={t.catMarketing}
              style={{ width: 20, height: 20, accentColor: "var(--accent)" }}
            />
          </Row>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-outline" onClick={reset}>
              {t.reset}
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              {t.save}
            </button>
          </div>

          {savedAt && (
            <p aria-live="polite" style={{ color: "var(--accent)", fontSize: "0.85rem", marginTop: "0.75rem" }}>
              {t.saved} {new Date(savedAt).toLocaleString()}.
            </p>
          )}
        </section>
      </main>
      <Footer lang={lang} compact />
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
