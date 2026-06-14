"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

// Modal — overlay full-viewport, renderizado via portal no document.body
// pra ESCAPAR qualquer stacking context (o .site-header tem position:sticky
// + z-index: 50, e modais filhos do header ficavam presos dentro dele,
// renderizando "abaixo" do menu em vez de cobrir o site todo).
//
// Comportamento:
//   - ESC fecha
//   - Click no backdrop fecha (click no card NÃO fecha)
//   - Foco move pra dentro do modal ao abrir; restora no trigger ao fechar
//   - body.overflow=hidden enquanto aberto (sem scroll do background)
//   - z-index 1000 — bem acima de qualquer header/sticky/dropdown
//
// O Portal só monta no client (Next.js SSR-safe: typeof window check).

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Largura máxima do card. Default 720px. */
  maxWidth?: number | string;
  /** Botão/elemento que voltará a receber foco quando fecha. */
  returnFocusTo?: HTMLElement | null;
  children: ReactNode;
  /** Conteúdo opcional no footer (botões, links). */
  footer?: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  maxWidth = 720,
  returnFocusTo,
  children,
  footer,
}: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // ESC + restore focus
  useEffect(() => {
    if (!open) return;
    const previousFocus = (returnFocusTo ?? document.activeElement) as HTMLElement | null;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);

    // Move foco pra dentro do modal pra screen-readers + Tab navigation.
    const t = setTimeout(() => {
      const first = cardRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    }, 30);

    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
      previousFocus?.focus?.();
    };
  }, [open, onClose, returnFocusTo]);

  // Scroll-lock no body — paddingInlineEnd evita "pulo" do layout no desktop
  // por causa do scrollbar que some. Em RTL o scrollbar fica na borda
  // inline-start visualmente; logical property cobre os dois casos.
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingInlineEnd;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingInlineEnd = `${scrollbarWidth}px`;
    }
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingInlineEnd = prevPadding;
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(5, 7, 14, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "3vh 1rem 2rem",
        overflowY: "auto",
      }}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          padding: "1.5rem 1.5rem 1.75rem",
          borderRadius: "0.9rem",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 25px 70px rgba(0,0,0,0.6)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text)" }}>{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              padding: "0.4rem",
              cursor: "pointer",
              color: "var(--text)",
              display: "inline-flex",
            }}
          >
            <Icon name="close" size={18} />
          </button>
        </header>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingInlineEnd: "0.25rem",
            minHeight: 0,
          }}
        >
          {children}
        </div>
        {footer && (
          <footer
            style={{
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
