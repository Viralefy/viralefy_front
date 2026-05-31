import type { Metadata } from "next";

// Wrapper só para anexar metadata na rota /register. Vê comentário em
// /login/layout.tsx.
export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Viralefy account to track orders, refills and history.",
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
