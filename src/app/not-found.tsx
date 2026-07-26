import Link from "next/link";

// Not-found GLOBAL de topo — fora do segmento `[locale]`, logo fora do root
// layout. Como não há mais `app/layout.tsx` (o root virou `[locale]/layout.tsx`),
// este boundary precisa renderizar o PRÓPRIO `<html>`/`<body>` (exigência do
// Next 15 quando o root layout está sob um segmento).
//
// Quando dispara: caminhos que o middleware não reescreveu para `/{locale}/…`
// (praticamente só edge cases de infra). O 404 localizado, de fato, é
// `app/[locale]/not-found.tsx`, que roda dentro do layout com o lang certo.
// Aqui a copy é EN neutra — superfície mínima, sem depender de locale.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: 640, margin: "10vh auto", padding: "0 1.5rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Page not found</h1>
          <p style={{ color: "#667", marginBottom: "1.5rem" }}>
            The page you were looking for doesn&apos;t exist.
          </p>
          <Link href="/" style={{ color: "#4f46e5", fontWeight: 600 }}>
            Back to home
          </Link>
        </main>
      </body>
    </html>
  );
}
