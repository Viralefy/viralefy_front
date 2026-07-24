import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL_SLUGS, legalDoc, legalMetaDescription, type LegalSlug } from "@/i18n/legal";
import { PACKS, tr, type LangCode } from "@/i18n/languages";
import { renderLegalBody } from "@/lib/legal-render";
import { Footer } from "@/components/Footer";

// Página legal. `?lang=pt` controla o idioma. Sem param cai no en.
// Sempre indexável em en (canônico) com hreflang para as variantes traduzidas.

export const dynamic = "force-dynamic";

type Params = { locale: string; doc: string };
type Search = { lang?: string };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function isSlug(s: string): s is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(s);
}

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

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const { doc } = await params;
  const { lang: rawLang } = await searchParams;
  if (!isSlug(doc)) return { title: "Not found" };
  const rawLangCode = (rawLang ?? "en") as LangCode;
  // Coage pra um lang válido (presente em PACKS) — fora disso cai em "en".
  const lang: LangCode = rawLangCode in PACKS ? rawLangCode : "en";
  const d = legalDoc(lang, doc);

  // hreflang: a mesma rota com cada idioma. x-default aponta pro EN
  // (fallback global). Cada variante self-canonicaliza pra seu próprio
  // ?lang=... (antes TODAS canonicalizavam pra ?lang=en, marcando as
  // outras como duplicatas e gerando short-description em massa).
  const languages: Record<string, string> = { "x-default": `/legal/${doc}?lang=en` };
  for (const code of Object.keys(PACKS) as LangCode[]) {
    languages[code] = `/legal/${doc}?lang=${code}`;
  }

  return {
    // absolute pra não duplicar o "| Viralefy" via template do root layout.
    title: { absolute: `${d.title} | Viralefy` },
    // Description real extraída do body — antes era só `${d.title} — Viralefy`
    // (25 chars), o que Ahrefs flagga como "meta description too short" (33
    // ocorrências no audit 2026-06-05).
    description: legalMetaDescription(lang, doc),
    alternates: {
      canonical: `/legal/${doc}?lang=${lang}`,
      languages,
    },
  };
}

export default async function LegalPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { doc } = await params;
  const { lang: rawLang } = await searchParams;
  if (!isSlug(doc)) notFound();
  const lang = ((rawLang as LangCode) in PACKS ? (rawLang as LangCode) : "en");
  const d = legalDoc(lang, doc);
  const t = tr(lang);

  return (
    <>
      <article className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem", maxWidth: 760 }}>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
          <Link href="/">← {t.cta.backToHome}</Link>
        </p>
        <h1 style={{ marginBottom: "0.25rem" }}>{d.title}</h1>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          {t.category.breadcrumb} — {d.updatedAt}
        </p>
        <div style={{ marginTop: "1.5rem" }}>{renderLegalBody(d.body)}</div>

        {/* Seletor de idioma para essa página legal — label localizado
            (BUG-30 do QA 2026-06-12: "Other languages:" ficava em EN mesmo
            em /legal/contact?lang=pt). */}
        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>{otherLanguagesLabel(lang)}</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {(Object.keys(PACKS) as LangCode[]).map((code) => (
              <Link key={code} href={`/legal/${doc}?lang=${code}`} style={{ fontSize: "0.85rem", padding: "0.25rem 0.5rem", border: "1px solid var(--border)", borderRadius: "0.3rem" }}>
                {code}
              </Link>
            ))}
          </div>
        </div>
      </article>

      <Footer lang={lang} compact />
    </>
  );
}
