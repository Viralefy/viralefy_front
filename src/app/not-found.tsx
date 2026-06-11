import Link from "next/link";
import { COUNTRIES, countriesByRegion } from "@/i18n/countries";
import { Flag } from "@/components/Flag";

export const metadata = {
  title: "Page not found | Viralefy",
  robots: { index: false, follow: true },
};

const FEATURED = ["br", "pt", "us", "es", "ar", "mx", "de", "fr", "it", "gb"];

export default function NotFound() {
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
          This page doesn&apos;t exist — but your next follower does.
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 560, margin: "0 auto" }}>
          The content you were looking for is gone or never existed. Continue where most customers start:
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
        <Link href="/" className="btn btn-primary">
          Browse all services
        </Link>
        <Link href="/account" className="btn btn-outline">
          My account
        </Link>
        <Link href="/login" className="btn btn-outline">
          Sign in
        </Link>
        <Link href="/register" className="btn btn-outline">
          Create account
        </Link>
      </div>

      <section aria-labelledby="popular-markets">
        <h2 id="popular-markets" style={{ fontSize: "1.05rem", marginBottom: "0.75rem", textAlign: "center" }}>
          Popular markets
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
              <Flag code={c.code} width={20} title={c.name} />
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
          View all markets
        </summary>
        <div style={{ marginTop: "1rem" }}>
          <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", marginBottom: "0.5rem" }}>
            Americas
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
                <Flag code={c.code} width={18} title={c.name} />
                {c.name}
              </Link>
            ))}
          </div>
          <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", marginBottom: "0.5rem" }}>
            Europe / SEPA
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
                <Flag code={c.code} width={18} title={c.name} />
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </details>
    </main>
  );
}
