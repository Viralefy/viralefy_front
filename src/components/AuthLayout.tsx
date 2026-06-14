"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

// AuthLayout — split screen 2/3 brand + 1/3 form usado SÓ em
// auth.viralefy.com (login/register/reset).
//
// Mobile (<= 900px): brand pane some, form ocupa 100% — não duplicamos a
// brand pane num drawer pra manter o flow rápido e limpo no celular.

type AuthLayoutProps = {
  /** Título grande mostrado acima da pane brand (esquerda). */
  brandHeading: string;
  /** Subtítulo abaixo do heading. */
  brandLead: string;
  /** Conteúdo do form (lado direito). */
  children: ReactNode;
  /** Link de troca form (Login ↔ Register), opcional. */
  altCta?: {
    label: string;
    href: string;
    /**
     * Texto do próprio link (default: "→"). BUG-25 do QA 2026-06-12:
     * antes ficava só "→" sem texto descritivo, deixando o usuário
     * adivinhar o destino.
     */
    linkText?: string;
  };
};

type Pillar = { icon: IconName; title: string; copy: string };

const PILLARS: Pillar[] = [
  {
    icon: "shield",
    title: "Refill 30 days",
    copy: "Lose followers? We restock automatically within the window.",
  },
  {
    icon: "bolt",
    title: "Delivered fast",
    copy: "Most plans start in minutes — large orders pace organically.",
  },
  {
    // Important: o pillar fala sobre NÃO precisar da senha do Instagram/TikTok
    // do cliente (BUG-43 do QA — antes parecia contradizer o campo senha do
    // registro do próprio Viralefy).
    icon: "lock",
    title: "We never ask for your IG / TikTok password",
    copy: "Pay first, claim your delivery later — no platform credentials shared.",
  },
];

export function AuthLayout({ brandHeading, brandLead, children, altCta }: AuthLayoutProps) {
  // Marca o body com data-auth-page enquanto o usuário está em /login,
  // /register, /reset-password etc. CSS global usa esse seletor pra ocultar
  // Header / WhatsAppButton / CookieBanner — auth merece tela limpa.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.dataset.authPage = "1";
    return () => {
      delete document.body.dataset.authPage;
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
        background: "var(--bg)",
      }}
      className="auth-layout"
    >
      {/* Brand pane — esquerda 2/3 */}
      <aside
        className="auth-layout__brand"
        style={{
          position: "relative",
          padding: "3rem 3.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#fff",
          overflow: "hidden",
          background:
            "radial-gradient(at 20% 10%, rgba(0, 254, 214, 0.18), transparent 55%)," +
            "radial-gradient(at 85% 90%, rgba(3, 81, 122, 0.45), transparent 55%)," +
            "linear-gradient(135deg, #03101a 0%, #061421 55%, #0a1f31 100%)",
        }}
      >
        {/* Decorative orbs — puro CSS, sem network fetch */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-20%",
            right: "-15%",
            width: "560px",
            height: "560px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0, 254, 214, 0.18), transparent 65%)",
            filter: "blur(40px)",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-25%",
            left: "-10%",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124, 196, 255, 0.16), transparent 65%)",
            filter: "blur(50px)",
          }}
        />

        <header style={{ position: "relative", zIndex: 1 }}>
          <Link
            href="https://www.viralefy.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Image
              src="/logo.png"
              alt="Viralefy"
              width={2471}
              height={704}
              sizes="180px"
              priority
              style={{ width: "180px", height: "auto" }}
            />
          </Link>
        </header>

        <section style={{ position: "relative", zIndex: 1, maxWidth: 560 }}>
          <h1
            style={{
              fontSize: "clamp(2rem, 3.4vw, 3rem)",
              lineHeight: 1.1,
              margin: "0 0 1rem",
              fontWeight: 700,
            }}
          >
            {brandHeading}
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.55,
              color: "rgba(232, 244, 252, 0.78)",
              margin: 0,
              maxWidth: 480,
            }}
          >
            {brandLead}
          </p>
        </section>

        <ul
          style={{
            position: "relative",
            zIndex: 1,
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: "1.25rem",
            maxWidth: 520,
          }}
        >
          {PILLARS.map((p) => (
            <li
              key={p.title}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "0.85rem",
                alignItems: "flex-start",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: "rgba(0, 254, 214, 0.12)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00fed6",
                  flexShrink: 0,
                }}
              >
                <Icon name={p.icon} size={18} />
              </span>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", marginBottom: "0.15rem" }}>
                  {p.title}
                </strong>
                <span style={{ fontSize: "0.82rem", color: "rgba(232, 244, 252, 0.65)", lineHeight: 1.5 }}>
                  {p.copy}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Form pane — direita 1/3 (ou 100% no mobile) */}
      <main
        className="auth-layout__form"
        style={{
          padding: "2.5rem 2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "var(--surface)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 380,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {children}

          {altCta && (
            <p
              style={{
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "0.85rem",
                margin: "1.25rem 0 0",
              }}
            >
              {altCta.label}{" "}
              <Link href={altCta.href} style={{ color: "var(--accent, #00fed6)", textDecoration: "none", fontWeight: 600 }}>
                {altCta.linkText ?? "→"}
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
