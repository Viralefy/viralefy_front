"use client";

import { langOfCountry } from "@/i18n/languages";

// Botão flutuante (bottom-left) que abre o WhatsApp business da Viralefy.
// Aparece apenas para visitantes pt/es/es_AR — Brasil + LATAM hispânico. Se
// `NEXT_PUBLIC_WHATSAPP_NUMBER` estiver vazio, o componente não renderiza
// nada. O número precisa estar em formato internacional sem `+` (ex.
// "5511999999999").
//
// Recebe `countryCode` opcional pra decidir baseado no país atual. Quando
// não informado (renderização global no layout), o botão fica oculto — antes
// caía em "br" e mostrava mensagem em PT pro mundo todo.
const WHATSAPP_LANGS = new Set(["pt", "es", "es_AR"]);

export function WhatsAppButton({ countryCode }: { countryCode?: string }) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number) return null;
  if (!countryCode) return null;

  const lang = langOfCountry(countryCode);
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
        lineHeight: 1,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.76.46 3.45 1.32 4.95L2 22l5.25-1.38A9.94 9.94 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm5.84 14.13c-.25.7-1.44 1.34-2 1.4-.55.06-1.26.09-2.03-.13-.47-.14-1.07-.34-1.84-.67-3.23-1.4-5.34-4.65-5.5-4.86-.16-.22-1.32-1.75-1.32-3.34 0-1.59.83-2.37 1.13-2.69.3-.32.65-.4.87-.4h.62c.2 0 .47-.08.73.56.27.65.92 2.24 1 2.4.08.16.13.36.03.58-.1.22-.16.36-.31.55-.16.19-.33.42-.47.56-.16.16-.32.33-.14.65.18.32.81 1.34 1.74 2.16 1.2 1.07 2.21 1.4 2.53 1.56.32.16.5.13.69-.08.18-.21.79-.92.99-1.24.21-.32.42-.27.7-.16.29.11 1.83.86 2.14 1.02.31.16.52.24.6.37.07.13.07.78-.18 1.48z" />
      </svg>
    </a>
  );
}
