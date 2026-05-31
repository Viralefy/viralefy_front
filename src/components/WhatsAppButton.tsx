"use client";

import { langOfCountry } from "@/i18n/languages";

// Botão flutuante (bottom-left) que abre o WhatsApp business da Viralefy.
// Aparece apenas para visitantes pt/es/es_AR — Brasil + LATAM hispânico. Se
// `NEXT_PUBLIC_WHATSAPP_NUMBER` estiver vazio, o componente não renderiza
// nada. O número precisa estar em formato internacional sem `+` (ex.
// "5511999999999").
//
// Recebe `countryCode` opcional pra decidir baseado no país atual; quando
// não informado (renderização global no layout), assume "br".
const WHATSAPP_LANGS = new Set(["pt", "es", "es_AR"]);

export function WhatsAppButton({ countryCode }: { countryCode?: string }) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number) return null;

  const lang = langOfCountry(countryCode ?? "br");
  if (!WHATSAPP_LANGS.has(lang)) return null;

  const message =
    lang === "pt"
      ? "Olá Viralefy, gostaria de tirar uma dúvida."
      : "Hola Viralefy, quisiera hacer una consulta.";
  const href = `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      style={{
        position: "fixed",
        left: "1rem",
        bottom: "1rem",
        zIndex: 40,
        width: "3.25rem",
        height: "3.25rem",
        borderRadius: "50%",
        background: "#25d366",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 20px rgba(37, 211, 102, 0.5)",
        textDecoration: "none",
        fontSize: "1.6rem",
        lineHeight: 1,
      }}
    >
      <span aria-hidden>💬</span>
    </a>
  );
}
