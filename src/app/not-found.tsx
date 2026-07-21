import Link from "next/link";
import { headers } from "next/headers";
import { COUNTRIES, countriesByRegion } from "@/i18n/countries";
import { Flag } from "@/components/Flag";
import { tr, type LangCode } from "@/i18n/languages";

export const metadata = {
  title: "Page not found | Viralefy",
  // BUG-186/201 do QA: 404 NÃO deve ser index + canonical pra "/" engana
  // o Google. Marca noindex/nofollow + sem canonical (deixa o crawler tratar
  // como soft-404 / drop).
  robots: { index: false, follow: false },
  alternates: { canonical: undefined },
};

const FEATURED = ["br", "pt", "us", "es", "ar", "mx", "de", "fr", "it", "gb"];

// Resolve o LangCode a partir do segmento de país detectado pelo middleware
// (header x-locale = "pt-BR", "ja-JP", "en"...). Fallback: "en".
function langFromLocale(locale: string): LangCode {
  const base = locale.split("-")[0] as LangCode;
  // tr() valida e devolve fallback se LangCode for desconhecido, então
  // basta tentar a base e deixar o tr cuidar.
  return base;
}

// Resolve país atual do pathname pra manter contexto no "Browse all services".
// BUG-188 do QA: cair em "/" perde o mercado.
function countryFromPathname(path: string): string | null {
  const seg = path.split("/")[1] ?? "";
  return COUNTRIES.some((c) => c.code === seg) ? seg : null;
}

export default async function NotFound() {
  const h = await headers();
  const locale = h.get("x-locale") || "en";
  const path = h.get("x-pathname") || "/";
  const lang = langFromLocale(locale);
  const t = tr(lang);
  const country = countryFromPathname(path);
  const browseHref = country ? `/${country}` : "/";

  const featured = FEATURED.map((code) => COUNTRIES.find((c) => c.code === code))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <main className="container" style={{ paddingTop: "3rem", paddingBottom: "5rem" }}>
      <section style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <p
          style={{
            fontSize: "clamp(4rem, 12vw, 7rem)",
            fontWeight: 800,
            lineHeight: 1,
            marginBottom: "0.25rem",
            background: "var(--gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </p>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", marginBottom: "0.75rem" }}>
          {t.notFound.title}
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 560, margin: "0 auto" }}>
          {t.notFound.description}
        </p>
      </section>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "3rem",
        }}
      >
        <Link href={browseHref} className="btn btn-primary">
          {t.notFound.browseAll}
        </Link>
        <Link href="/account" className="btn btn-outline">
          {t.notFound.myAccount}
        </Link>
        <Link href="/login" className="btn btn-outline">
          {t.notFound.signIn}
        </Link>
        <Link href="/register" className="btn btn-outline">
          {t.notFound.createAccount}
        </Link>
      </div>

      <section aria-labelledby="popular-markets">
        <h2 id="popular-markets" style={{ fontSize: "1.05rem", marginBottom: "0.75rem", textAlign: "center" }}>
          {t.notFound.popularMarkets}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2.5rem" }}>
          {featured.map((c) => (
            <Link
              key={c.code}
              href={`/${c.code}`}
              hrefLang={c.htmlLang}
              className="btn btn-outline"
              style={{ padding: "0.45rem 0.9rem", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
            >
              <Flag code={c.code} width={20} title={c.name} nameIsAdjacent />
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <details>
        <summary
          style={{
            cursor: "pointer",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: "0.9rem",
            marginBottom: "1rem",
          }}
        >
          {t.notFound.viewAllMarkets}
        </summary>
        <div style={{ marginTop: "1rem" }}>
          <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", marginBottom: "0.5rem" }}>
            {t.notFound.regionAmericas}
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1.5rem" }}>
            {countriesByRegion("americas").map((c) => (
              <Link
                key={c.code}
                href={`/${c.code}`}
                hrefLang={c.htmlLang}
                style={{
                  fontSize: "0.85rem",
                  padding: "0.3rem 0.55rem",
                  border: "1px solid var(--border)",
                  borderRadius: "0.4rem",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Flag code={c.code} width={18} title={c.name} nameIsAdjacent />
                {c.name}
              </Link>
            ))}
          </div>
          <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", marginBottom: "0.5rem" }}>
            {t.notFound.regionSepa}
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {countriesByRegion("sepa").map((c) => (
              <Link
                key={c.code}
                href={`/${c.code}`}
                hrefLang={c.htmlLang}
                style={{
                  fontSize: "0.85rem",
                  padding: "0.3rem 0.55rem",
                  border: "1px solid var(--border)",
                  borderRadius: "0.4rem",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Flag code={c.code} width={18} title={c.name} nameIsAdjacent />
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </details>
    </main>
  );
}
