import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viralefy — Seguidores para Instagram",
  description: "Compre seguidores reais com entrega rápida e suporte dedicado.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
