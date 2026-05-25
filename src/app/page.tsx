import { fetchPlans } from "@/lib/api";
import { PlansSection } from "@/components/PlansSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let plans = [];
  let error: string | null = null;
  try {
    plans = await fetchPlans();
  } catch (e) {
    error = e instanceof Error ? e.message : "API indisponível";
  }

  return (
    <>
      <header className="container" style={{ paddingTop: "1.5rem" }}>
        <strong style={{ fontSize: "1.25rem" }}>Viralefy</strong>
      </header>

      <section className="hero container">
        <h1>Cresça no Instagram com seguidores de qualidade</h1>
        <p>
          Escolha um plano, cadastre-se na compra e receba seus seguidores com
          processo simples e transparente.
        </p>
      </section>

      <main className="container" style={{ paddingBottom: "4rem" }}>
        {error && (
          <div className="alert alert-error">
            Não foi possível carregar os planos: {error}. Verifique se a API
            está rodando em localhost:8080.
          </div>
        )}
        <PlansSection plans={plans} />
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
