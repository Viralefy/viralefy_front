import type { Metadata } from "next";
import Link from "next/link";
import { legalDoc, legalMetaDescription } from "@/i18n/legal";
import { PACKS, type LangCode } from "@/i18n/languages";
import { renderLegalBody } from "@/lib/legal-render";
import { Footer } from "@/components/Footer";

// Página estática `/legal/cookies` — shadow do dynamic `[doc]` para este slug.
//
// PORQUÊ EXISTE
// -------------
// LGPD (Resolução CD/ANPD 4/2020 + Guia ANPD de Cookies 2022) recomenda
// transparência exaustiva: a Política de Cookies textual NÃO basta — é
// preciso lista pública, item-a-item, do que é setado, por quem, pra
// que e por quanto tempo. Esta página agrega:
//
//   1. O texto narrativo da Política de Cookies (i18n preservado via
//      `legalDoc(lang, "cookies")` — mesma fonte do dynamic `[doc]`).
//   2. Uma tabela exaustiva de cada cookie/storage que o stack pode
//      setar — auditada manualmente contra o que CookieBanner, GTM
//      loader, Cloudflare Turnstile e Sentry config realmente fazem.
//   3. Atalhos pra `/legal/cookie-preferences` (gerenciar consent) e
//      pra Política de Privacidade.
//
// O slug `cookies` permanece registrado em `LEGAL_SLUGS` (footer +
// hreflang continuam funcionando) — Next.js dá precedência ao segmento
// estático sobre `[doc]`, então esta página atende toda a requisição
// pra `/legal/cookies?lang=xx`. As traduções não regridem: o body
// narrativo continua vindo do `i18n/legal.ts`; só a tabela é EN+PT.
//
// CONTEÚDO DA TABELA — REGRA DE OURO
// ----------------------------------
// SE você adicionar um novo cookie / localStorage / sessionStorage / SDK
// que persista qualquer coisa no browser, ATUALIZE esta tabela ANTES de
// shippar. Caso contrário viramos não-conformes com a recomendação ANPD.

export const dynamic = "force-dynamic";

type Search = { lang?: string };

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function resolveLang(raw: string | undefined): LangCode {
  const code = (raw ?? "en") as LangCode;
  return code in PACKS ? code : "en";
}

// Localiza "Other languages:" — espelha o helper do dynamic [doc]/page.tsx
// (BUG-30/118 do QA: rótulo ficava em EN mesmo em /legal/cookies?lang=fr).
function otherLanguagesLabel(lang: LangCode): string {
  if (lang === "pt") return "Outros idiomas:";
  if (lang === "es" || lang === "es_AR") return "Otros idiomas:";
  if (lang === "fr") return "Autres langues :";
  if (lang === "de") return "Andere Sprachen:";
  if (lang === "it") return "Altre lingue:";
  if (lang === "nl") return "Andere talen:";
  if (lang === "ru") return "Другие языки:";
  if (lang === "ja") return "他の言語:";
  if (lang === "ko") return "다른 언어:";
  if (lang === "ar") return "لغات أخرى:";
  if (lang === "tr") return "Diğer diller:";
  if (lang === "pl") return "Inne języki:";
  return "Other languages:";
}

// "Voltar ao início" — espelha o tr().cta.backToHome do pack i18n
// mas evitamos importar tr() inteiro pra manter este arquivo standalone.
function backToHomeLabel(lang: LangCode): string {
  if (lang === "pt") return "Voltar ao início";
  if (lang === "es" || lang === "es_AR") return "Volver al inicio";
  if (lang === "fr") return "Retour à l'accueil";
  if (lang === "de") return "Zurück zur Startseite";
  if (lang === "it") return "Torna alla home";
  if (lang === "nl") return "Terug naar home";
  if (lang === "ru") return "На главную";
  if (lang === "ja") return "ホームに戻る";
  if (lang === "ko") return "홈으로";
  if (lang === "ar") return "العودة إلى الرئيسية";
  if (lang === "tr") return "Ana sayfaya dön";
  if (lang === "pl") return "Powrót do strony głównej";
  return "Back to home";
}

// "Updated" label — mecânico, mesmo padrão.
function updatedLabel(lang: LangCode): string {
  if (lang === "pt") return "Atualizado em";
  if (lang === "es" || lang === "es_AR") return "Actualizado el";
  if (lang === "fr") return "Mis à jour le";
  if (lang === "de") return "Aktualisiert am";
  if (lang === "it") return "Aggiornato il";
  if (lang === "nl") return "Bijgewerkt op";
  if (lang === "ru") return "Обновлено";
  if (lang === "ja") return "更新日";
  if (lang === "ko") return "업데이트됨";
  if (lang === "ar") return "تم التحديث في";
  if (lang === "tr") return "Güncellendi";
  if (lang === "pl") return "Zaktualizowano";
  return "Updated";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const { lang: rawLang } = await searchParams;
  const lang = resolveLang(rawLang);
  const d = legalDoc(lang, "cookies");

  // Mesmo padrão do dynamic `[doc]/page.tsx`: hreflang completo,
  // self-canonical por idioma, x-default no EN.
  const languages: Record<string, string> = { "x-default": `/legal/cookies?lang=en` };
  for (const code of Object.keys(PACKS) as LangCode[]) {
    languages[code] = `/legal/cookies?lang=${code}`;
  }

  return {
    title: { absolute: `${d.title} | Viralefy` },
    description: legalMetaDescription(lang, "cookies"),
    openGraph: {
      title: `${d.title} | Viralefy`,
      description: legalMetaDescription(lang, "cookies"),
      url: `${siteUrl()}/legal/cookies?lang=${lang}`,
      type: "article",
    },
    alternates: {
      canonical: `/legal/cookies?lang=${lang}`,
      languages,
    },
  };
}

// Linha da tabela de cookies. `category` é o mesmo enum do CookieBanner —
// se você adicionar uma categoria nova lá, espelhe aqui.
type CookieRow = {
  name: string;
  provider: "Viralefy" | "Cloudflare" | "Google Tag Manager" | "Sentry";
  party: "1st" | "3rd";
  purpose: { en: string; pt: string };
  category: "necessary" | "preferences" | "analytics" | "marketing";
  duration: { en: string; pt: string };
  type: "cookie" | "localStorage" | "sessionStorage";
};

// Inventário audited 2026-06-11. Próxima revisão sempre que mudar:
//   - components/CookieBanner.tsx
//   - components/GtmLoader.tsx
//   - sentry.client.config.ts
//   - middleware.ts (auth cookie)
//   - lib/geo-currency.ts (currency preference)
//   - lib/gdpr.ts (storage key)
const COOKIES: CookieRow[] = [
  {
    name: "viralefy_token",
    provider: "Viralefy",
    party: "1st",
    purpose: {
      en: "Authenticated session — keeps you signed in across pages and API requests. Required for any logged-in feature.",
      pt: "Sessão autenticada — mantém você logado entre páginas e requisições à API. Necessário para qualquer recurso autenticado.",
    },
    category: "necessary",
    duration: { en: "30 days", pt: "30 dias" },
    type: "cookie",
  },
  {
    name: "vf_currency",
    provider: "Viralefy",
    party: "1st",
    purpose: {
      en: "Remembers the currency you selected (USD, BRL, EUR…) so prices render the same on every visit, across www/auth/admin subdomains.",
      pt: "Lembra a moeda escolhida (USD, BRL, EUR…) para que os preços apareçam iguais a cada visita, em www/auth/admin.",
    },
    category: "preferences",
    duration: { en: "1 year", pt: "1 ano" },
    type: "cookie",
  },
  {
    name: "vf_theme",
    provider: "Viralefy",
    party: "1st",
    purpose: {
      en: "Remembers your dark/light/system theme choice across pages and subdomains. Read server-side to avoid a flash of the wrong theme on first paint.",
      pt: "Lembra sua escolha de tema (escuro/claro/sistema) entre páginas e subdomínios. Lido no servidor para evitar flash do tema errado na primeira pintura.",
    },
    category: "preferences",
    duration: { en: "1 year", pt: "1 ano" },
    type: "cookie",
  },
  {
    name: "viralefy_gdpr_consent",
    provider: "Viralefy",
    party: "1st",
    purpose: {
      en: "Stores your cookie consent choices (preferences, analytics, marketing). Without it the banner cannot remember your decision.",
      pt: "Armazena suas escolhas de consentimento de cookies (preferências, analytics, marketing). Sem ele o banner não consegue lembrar sua decisão.",
    },
    category: "necessary",
    duration: { en: "12 months (re-prompt)", pt: "12 meses (reconfirmação)" },
    type: "localStorage",
  },
  {
    name: "__cf_bm",
    provider: "Cloudflare",
    party: "3rd",
    purpose: {
      en: "Cloudflare Bot Management — distinguishes humans from automated traffic to keep the site online during DDoS or scraping.",
      pt: "Cloudflare Bot Management — distingue humanos de tráfego automatizado para manter o site no ar durante DDoS ou scraping.",
    },
    category: "necessary",
    duration: { en: "30 minutes", pt: "30 minutos" },
    type: "cookie",
  },
  {
    name: "cf_clearance",
    provider: "Cloudflare",
    party: "3rd",
    purpose: {
      en: "Cloudflare challenge clearance — set after you pass a Turnstile/managed challenge, prevents repeated challenges in the same session.",
      pt: "Cleareance de desafio Cloudflare — definido depois de passar um Turnstile/managed challenge, evita repetição do desafio na mesma sessão.",
    },
    category: "necessary",
    duration: { en: "30 days", pt: "30 dias" },
    type: "cookie",
  },
  {
    name: "_ga / _ga_*",
    provider: "Google Tag Manager",
    party: "3rd",
    purpose: {
      en: "Google Analytics 4 — aggregated traffic and product usage metrics. ONLY loaded if you opt in to analytics in the cookie banner.",
      pt: "Google Analytics 4 — métricas agregadas de tráfego e uso do produto. Carregado APENAS se você optar por analytics no banner.",
    },
    category: "analytics",
    duration: { en: "Up to 2 years", pt: "Até 2 anos" },
    type: "cookie",
  },
  {
    name: "_gid",
    provider: "Google Tag Manager",
    party: "3rd",
    purpose: {
      en: "Google Analytics session identifier. ONLY set if analytics consent is given.",
      pt: "Identificador de sessão do Google Analytics. Definido APENAS se houver consent de analytics.",
    },
    category: "analytics",
    duration: { en: "24 hours", pt: "24 horas" },
    type: "cookie",
  },
  {
    name: "sentry-trace / baggage",
    provider: "Sentry",
    party: "3rd",
    purpose: {
      en: "Distributed-tracing request headers used for error monitoring. Currently disabled in production (DSN not configured). Will be gated by analytics consent if enabled.",
      pt: "Cabeçalhos de tracing distribuído usados para monitoramento de erros. Atualmente desabilitado em produção (DSN não configurado). Será gateado por consent de analytics quando ativado.",
    },
    category: "analytics",
    duration: { en: "Session", pt: "Sessão" },
    type: "sessionStorage",
  },
];

// BUG-142 do QA 2026-06-12: badges da tabela de cookies estavam fixas em
// EN ("NECESSARY", "PREFERENCES"…) mesmo no documento PT. Agora aceitam
// `lang` e renderizam no idioma do documento.
function CategoryBadge({
  category,
  lang,
}: {
  category: CookieRow["category"];
  lang: "en" | "pt" | "es";
}) {
  const labels: Record<CookieRow["category"], { en: string; pt: string; es: string }> = {
    necessary:   { en: "Necessary",   pt: "Essenciais",  es: "Necesarias" },
    preferences: { en: "Preferences", pt: "Preferências", es: "Preferencias" },
    analytics:   { en: "Analytics",   pt: "Analíticos",  es: "Analíticas" },
    marketing:   { en: "Marketing",   pt: "Marketing",   es: "Marketing" },
  };
  const palette: Record<CookieRow["category"], { bg: string; fg: string }> = {
    necessary:   { bg: "#1f4f2a", fg: "#a7f3c1" },
    preferences: { bg: "#1f3a4f", fg: "#a7d2f3" },
    analytics:   { bg: "#4f3a1f", fg: "#f3d2a7" },
    marketing:   { bg: "#4f1f3a", fg: "#f3a7d2" },
  };
  const c = palette[category];
  const label = labels[category][lang];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.15rem 0.5rem",
        background: c.bg,
        color: c.fg,
        borderRadius: "999px",
        fontSize: "0.7rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {label}
    </span>
  );
}

export default async function CookiesLegalPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { lang: rawLang } = await searchParams;
  const lang = resolveLang(rawLang);
  const isPT = lang === "pt";
  const d = legalDoc(lang, "cookies");

  // SEO + estrutura: JSON-LD WebPage + Breadcrumb. Igual padrão do
  // `/legal/cookie-preferences/page.tsx` — Google entende essa relação.
  const pageUrl = `${siteUrl()}/legal/cookies?lang=${lang}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${d.title} | Viralefy`,
        description: legalMetaDescription(lang, "cookies"),
        inLanguage: lang,
        isPartOf: { "@id": `${siteUrl()}/#website` },
        dateModified: d.updatedAt,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
          { "@type": "ListItem", position: 2, name: "Legal", item: `${siteUrl()}/legal/privacy?lang=${lang}` },
          { "@type": "ListItem", position: 3, name: d.title, item: pageUrl },
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
      <article className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem", maxWidth: 880 }}>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
          <Link href="/">← {backToHomeLabel(lang)}</Link>
        </p>
        <h1 style={{ marginBottom: "0.25rem" }}>{d.title}</h1>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          {updatedLabel(lang)} {d.updatedAt}
        </p>

        {/* Corpo narrativo — mesma fonte i18n do dynamic [doc]. */}
        <div style={{ marginTop: "1.5rem" }}>{renderLegalBody(d.body)}</div>

        {/* === Tabela detalhada === */}
        <section style={{ marginTop: "2.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
            {isPT ? "Lista completa de cookies e armazenamento" : "Complete cookie and storage list"}
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
            {isPT
              ? "Esta tabela cobre 100% do que o stack Viralefy pode persistir no seu navegador. Cookies de analytics e marketing só são carregados após consent explícito. Para gerenciar, use as suas "
              : "This table covers 100% of what the Viralefy stack may persist in your browser. Analytics and marketing cookies are only loaded after explicit consent. Manage your "}
            <Link href="/legal/cookie-preferences" style={{ color: "var(--accent)" }}>
              {isPT ? "preferências de cookies" : "cookie preferences"}
            </Link>
            .
          </p>

          <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "0.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: 720 }}>
              <thead>
                <tr style={{ background: "rgba(20, 20, 31, 0.5)", textAlign: "left" }}>
                  <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>{isPT ? "Nome" : "Name"}</th>
                  <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>{isPT ? "Provedor" : "Provider"}</th>
                  <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>{isPT ? "Origem" : "Party"}</th>
                  <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>{isPT ? "Categoria" : "Category"}</th>
                  <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>{isPT ? "Propósito" : "Purpose"}</th>
                  <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>{isPT ? "Duração" : "Duration"}</th>
                  <th scope="col" style={{ padding: "0.6rem 0.8rem" }}>{isPT ? "Tipo" : "Type"}</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c) => (
                  <tr key={c.name} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.6rem 0.8rem", fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap" }}>
                      {c.name}
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "var(--muted)" }}>{c.provider}</td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "var(--muted)" }}>{c.party === "1st" ? (isPT ? "Próprio" : "First") : (isPT ? "Terceiro" : "Third")}</td>
                    <td style={{ padding: "0.6rem 0.8rem" }}>
                      <CategoryBadge category={c.category} lang={isPT ? "pt" : lang === "es" ? "es" : "en"} />
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "var(--muted)" }}>
                      {isPT ? c.purpose.pt : c.purpose.en}
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {isPT ? c.duration.pt : c.duration.en}
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "var(--muted)" }}>{c.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
            {isPT
              ? "Esta lista é auditada manualmente a cada release. Se você notar discrepância entre o que está aqui e o que o seu navegador mostra, escreva para o suporte."
              : "This list is manually audited every release. If you notice a discrepancy between this list and what your browser shows, please contact support."}
          </p>
        </section>

        {/* CTAs */}
        <div style={{ marginTop: "2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/legal/cookie-preferences" className="btn btn-primary">
            {isPT ? "Gerenciar preferências" : "Manage preferences"}
          </Link>
          <Link href={`/legal/privacy?lang=${lang}`} className="btn btn-outline">
            {isPT ? "Política de Privacidade" : "Privacy Policy"}
          </Link>
        </div>

        {/* Idiomas — espelha o dynamic [doc]/page.tsx pra não regredir hreflang UX. */}
        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>{otherLanguagesLabel(lang)}</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {(Object.keys(PACKS) as LangCode[]).map((code) => (
              <Link
                key={code}
                href={`/legal/cookies?lang=${code}`}
                style={{ fontSize: "0.85rem", padding: "0.25rem 0.5rem", border: "1px solid var(--border)", borderRadius: "0.3rem" }}
              >
                {code}
              </Link>
            ))}
          </div>
        </div>
      </article>
      <Footer lang={lang} />
    </>
  );
}
