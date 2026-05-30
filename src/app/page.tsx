"use client";

import { useEffect, useState } from "react";
import type { Category, Plan } from "@/lib/api";
import Link from "next/link";
import { fetchCategories, fetchPlans } from "@/lib/api";
import { PlansSection } from "@/components/PlansSection";
import { countriesByRegion } from "@/i18n/countries";

export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPlans(), fetchCategories()])
      .then(([p, c]) => {
        setPlans(p);
        setCategories(c);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "API indisponível"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero container">
        <h1>Impulsione seu Instagram</h1>
        <p>
          Seguidores, engajamento e visualizações com entrega rápida. Escolha um
          serviço, pague na moeda que preferir — inclusive cripto.
        </p>
      </section>

      <main className="container" style={{ paddingBottom: "4rem" }}>
        {error && (
          <div className="alert alert-error">
            Não foi possível carregar os serviços: {error}. Verifique se a API
            está rodando em localhost:8080.
          </div>
        )}
        {loading ? (
          <p style={{ color: "var(--muted)", textAlign: "center" }}>Carregando…</p>
        ) : (
          <PlansSection plans={plans} categories={categories} />
        )}

        <section style={{ marginTop: "3.5rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", textAlign: "center" }}>
            Mercados e idiomas
          </h2>
          <h3 style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "0.5rem", textAlign: "center" }}>
            Américas
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1.25rem" }}>
            {countriesByRegion("americas").map((c) => (
              <Link
                key={c.code}
                href={`/${c.code}`}
                hrefLang={c.htmlLang}
                style={{ fontSize: "0.9rem", padding: "0.35rem 0.6rem", border: "1px solid var(--border)", borderRadius: "0.4rem", textDecoration: "none" }}
              >
                {c.flag} {c.name}
              </Link>
            ))}
          </div>
          <h3 style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "0.5rem", textAlign: "center" }}>
            Europa / SEPA
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {countriesByRegion("sepa").map((c) => (
              <Link
                key={c.code}
                href={`/${c.code}`}
                hrefLang={c.htmlLang}
                style={{ fontSize: "0.9rem", padding: "0.35rem 0.6rem", border: "1px solid var(--border)", borderRadius: "0.4rem", textDecoration: "none" }}
              >
                {c.flag} {c.name}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer
        className="container"
        style={{
          padding: "2rem 0",
          borderTop: "1px solid var(--border)",
          color: "var(--muted)",
          fontSize: "0.875rem",
        }}
      >
        © {new Date().getFullYear()} Viralefy. Uso responsável das redes sociais.
      </footer>
    </>
  );
}
