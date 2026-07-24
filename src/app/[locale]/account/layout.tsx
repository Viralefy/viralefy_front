import type { Metadata } from "next";

// Wrapper só para anexar metadata em todas as páginas autenticadas de
// /account/* (account, credits, profiles, orders). Sempre noindex.
export const metadata: Metadata = {
  title: "Account",
  description: "Your Viralefy account — orders, refills, credits and profiles.",
  robots: { index: false, follow: true },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
