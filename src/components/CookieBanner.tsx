"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConsent, isConsentExpired, setConsent, type GdprConsent } from "@/lib/gdpr";
import { recordConsent } from "@/lib/consent-audit";

// Banner LGPD/GDPR. Aparece quando `getConsent()` devolve null (sem decisão,
// storage corrompido ou consent expirado >12m).
//
// Botões (LGPD Art. 8 §3 — consent LIVRE):
//   - "Apenas essenciais" → analytics=false, marketing=false, preferences=true
//   - "Personalizar"      → abre modal com 4 toggles
//   - "Aceitar todos"     → opt-in EXPLÍCITO (não pré-marcado)
//
// Mobile-friendly: bottom-aligned, não cobre tela inteira, max-height com
// scroll interno. Toggles têm hit area >=44x44 (WCAG 2.1 AAA).
//
// I18n: texto em PT-BR (mercado brasileiro = obrigação LGPD), fallback em EN
// detectado via navigator.language. JSON-LD/SEO não dependem disso.

type Mode = "hidden" | "banner" | "manage";

type ConsentChoice = Pick<GdprConsent, "preferences" | "analytics" | "marketing">;

type Source = "accept_all" | "essential_only" | "custom";

export function CookieBanner() {
  const [mode, setMode] = useState<Mode>("hidden");
  // DEFAULTS no modal "Personalizar": preferences ON (utility), analytics OFF,
  // marketing OFF. O usuário tem que ATIVAR explicitamente — LGPD Art. 8 §3.
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [lang, setLang] = useState<"pt" | "en">("pt");
  // `renewing` distingue o banner de "primeira visita" do banner de
  // "re-prompt anual" (consent prévio expirou >365d). LGPD ANPD recomenda
  // que o usuário reconsente periodicamente — quando esse for o caso
  // mostramos uma copy adicional explicando o motivo.
  const [renewing, setRenewing] = useState(false);

  // Decide on mount: se já houver consent válido, fica hidden; caso contrário banner.
  // Detecta idioma do navegador — default PT-BR (mercado primário), fallback EN.
  useEffect(() => {
    const current = getConsent();
    setMode(current === null ? "banner" : "hidden");
    setRenewing(isConsentExpired());
    if (typeof navigator !== "undefined") {
      const nl = (navigator.language || "pt").toLowerCase();
      setLang(nl.startsWith("pt") ? "pt" : "en");
    }
  }, []);

  function commit(c: ConsentChoice, source: Source) {
    const saved = setConsent(c);
    setMode("hidden");
    // Best-effort: registra no audit log do backend (POST /v1/me/consent).
    // Não bloqueia a UI — se a request falhar, o consent local já está válido.
    void recordConsent({
      version: saved.version,
      necessary: saved.necessary,
      preferences: saved.preferences,
      analytics: saved.analytics,
      marketing: saved.marketing,
      timestamp: saved.timestamp,
      source,
    });
  }

  if (mode === "hidden") return null;

  const t = TEXTS[lang];

  return (
    <>
      {mode === "banner" && (
        <div
          role="dialog"
          aria-label={t.banner_aria}
          aria-live="polite"
          // Bottom-aligned, full-width mas com max-height capped (60vh) e
          // scroll interno — não toma tela inteira no mobile.
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            padding: "1rem",
            background: "var(--surface)",
            borderTop: "1px solid var(--border-strong)",
            boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.35)",
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          <div
            className="container"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <p style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--text)" }}>
                {renewing ? t.banner_title_renewal : t.banner_title}
              </p>
              {renewing && (
                <p
                  data-testid="cookie-renewal-notice"
                  style={{
                    color: "var(--accent)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    marginBottom: "0.35rem",
                  }}
                >
                  {t.banner_renewal_notice}
                </p>
              )}
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.4 }}>
                {t.banner_body}{" "}
                <Link href="/legal/privacy" style={{ color: "var(--accent)" }}>
                  {t.link_privacy}
                </Link>{" "}
                {t.and}{" "}
                <Link href="/legal/cookies" style={{ color: "var(--accent)" }}>
                  {t.link_cookies}
                </Link>
                .
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMode("manage")}
                data-testid="cookie-customize"
              >
                {t.btn_customize}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() =>
                  // "Apenas essenciais" significa SÓ essenciais — preferences
                  // (idioma/tema) também é opt-in. BUG-44 do QA 2026-06-12:
                  // antes ficava preferences=true contradizendo a intenção.
                  commit({ preferences: false, analytics: false, marketing: false }, "essential_only")
                }
                data-testid="cookie-essential-only"
              >
                {t.btn_essential_only}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  commit({ preferences: true, analytics: true, marketing: true }, "accept_all")
                }
                data-testid="cookie-accept-all"
              >
                {t.btn_accept_all}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "manage" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.manage_aria}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            background: "rgba(0, 0, 0, 0.55)",
            display: "grid",
            placeItems: "center",
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 560,
              width: "100%",
              padding: "1.5rem",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem", color: "var(--text)" }}>
              {t.manage_title}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              {t.manage_intro}
            </p>

            <ToggleRow
              label={t.cat_necessary}
              description={t.cat_necessary_desc}
              checked={true}
              disabled
              onChange={() => {}}
            />
            <ToggleRow
              label={t.cat_preferences}
              description={t.cat_preferences_desc}
              checked={preferences}
              onChange={setPreferences}
              testId="cookie-toggle-preferences"
            />
            <ToggleRow
              label={t.cat_analytics}
              description={t.cat_analytics_desc}
              checked={analytics}
              onChange={setAnalytics}
              testId="cookie-toggle-analytics"
            />
            <ToggleRow
              label={t.cat_marketing}
              description={t.cat_marketing_desc}
              checked={marketing}
              onChange={setMarketing}
              testId="cookie-toggle-marketing"
            />

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: "0.5rem",
                marginTop: "1.25rem",
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMode("banner")}
              >
                {t.btn_back}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => commit({ preferences, analytics, marketing }, "custom")}
                data-testid="cookie-save-custom"
              >
                {t.btn_save}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
  testId,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
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
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
        minHeight: 44,
      }}
    >
      <span>
        <span style={{ display: "block", fontWeight: 600, color: "var(--text)" }}>{label}</span>
        <span style={{ display: "block", fontSize: "0.85rem", color: "var(--muted)" }}>
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        data-testid={testId}
        style={{ width: 24, height: 24, accentColor: "var(--accent)" }}
      />
    </label>
  );
}

// Textos em PT-BR (mercado primário, exigência LGPD) e EN (fallback).
// Outros idiomas podem reaproveitar via i18n/legal.ts no futuro.
const TEXTS = {
  pt: {
    banner_aria: "Aviso de cookies",
    banner_title: "Sua privacidade",
    banner_title_renewal: "Renovação anual de consentimento",
    banner_renewal_notice:
      "Por LGPD, atualizamos sua preferência de cookies. Confirme novamente.",
    banner_body:
      "Usamos cookies essenciais para o site funcionar e — somente com seu consentimento — cookies analíticos e de marketing. Você pode revogar a qualquer momento.",
    link_privacy: "política de privacidade",
    link_cookies: "política de cookies",
    and: "e",
    btn_customize: "Personalizar",
    btn_essential_only: "Apenas essenciais",
    btn_accept_all: "Aceitar todos",
    manage_aria: "Preferências de cookies",
    manage_title: "Preferências de cookies",
    manage_intro:
      "Escolha quais cookies aceitar. Cookies essenciais são obrigatórios para login, carrinho e segurança — não podem ser desativados.",
    cat_necessary: "Essenciais",
    cat_necessary_desc: "Sessão, login, anti-fraude, CSRF. Sempre ativos.",
    cat_preferences: "Preferências",
    cat_preferences_desc: "Idioma, tema, moeda. Lembramos suas escolhas entre visitas.",
    cat_analytics: "Analíticos",
    cat_analytics_desc:
      "Google Tag Manager / Analytics. Medimos audiência agregada (IP + user-agent). Desativado por padrão.",
    cat_marketing: "Marketing",
    cat_marketing_desc:
      "Pixels e remarketing (Meta, Google Ads). Permite anúncios mais relevantes. Desativado por padrão.",
    btn_back: "Voltar",
    btn_save: "Salvar preferências",
  },
  en: {
    banner_aria: "Cookie consent",
    banner_title: "Your privacy",
    banner_title_renewal: "Annual consent renewal",
    banner_renewal_notice:
      "Under privacy law we refresh your cookie preferences once a year. Please confirm again.",
    banner_body:
      "We use essential cookies to make the site work and — only with your consent — analytics and marketing cookies. You can revoke anytime.",
    link_privacy: "privacy policy",
    link_cookies: "cookie policy",
    and: "and",
    btn_customize: "Customize",
    btn_essential_only: "Essential only",
    btn_accept_all: "Accept all",
    manage_aria: "Cookie preferences",
    manage_title: "Cookie preferences",
    manage_intro:
      "Choose which cookies we may use. Necessary cookies are required for login, cart and security — they cannot be disabled.",
    cat_necessary: "Necessary",
    cat_necessary_desc: "Session, login, anti-fraud, CSRF. Always active.",
    cat_preferences: "Preferences",
    cat_preferences_desc: "Language, theme, currency. We remember your choices across visits.",
    cat_analytics: "Analytics",
    cat_analytics_desc:
      "Google Tag Manager / Analytics. We measure aggregated audience (IP + user-agent). Off by default.",
    cat_marketing: "Marketing",
    cat_marketing_desc:
      "Pixels and remarketing (Meta, Google Ads). Allow more relevant ads. Off by default.",
    btn_back: "Back",
    btn_save: "Save preferences",
  },
} as const;
