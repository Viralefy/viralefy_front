import type { Metadata } from "next";

// Wrapper só para metadata nas páginas de helpdesk (/tickets, /tickets/new,
// /tickets/:id). Privado, noindex.
export const metadata: Metadata = {
  title: "Support tickets",
  description: "Open and follow support tickets with the Viralefy team.",
  robots: { index: false, follow: true },
};

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
