import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";

// Layout raiz. O `<html lang>` é "en" porque o root agora é a home global;
// páginas de país sobrescrevem o lang no `<article lang>` interno e via
// metadata `htmlLang`. Para evitar flicker do CSR, mantemos o lang base em
// inglês — engines usam tanto o <html lang> quanto o `lang` dos sub-blocos.

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Viralefy — Instagram & TikTok growth",
  description:
    "Real followers, engagement and views for Instagram and TikTok worldwide. Fast delivery, refill guarantee, support in your language.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
