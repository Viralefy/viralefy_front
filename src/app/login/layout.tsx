import type { Metadata } from "next";

// Layout só pra prender metadata na rota /login. `page.tsx` é client
// component e não pode exportar `metadata` direto. Marcamos noindex porque
// é página privada — robots.txt já bloqueia, mas o meta robots é o sinal
// mais forte para o Google quando o crawler pula o robots.txt.
export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Viralefy account to track orders and refills.",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
