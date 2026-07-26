"use client";

// GtmLoader — carrega o Google Tag Manager APENAS após consent analytics.
//
// LGPD Art. 8 §3 + ANPD Resolução 4/2020: cookies analíticos exigem
// consent EXPLÍCITO e LIVRE. GTM não pode disparar no first paint —
// precisamos:
//
//   1. Inicializar dataLayer + Google Consent Mode v2 com TUDO denied
//      (default state). Sinaliza pro Google que nenhum storage/ping é
//      permitido até o usuário escolher.
//
//   2. Só inserir o <script src="...gtm.js"> quando getConsent().analytics
//      virar true. Listener no evento `viralefy:gdpr-update` re-avalia
//      em runtime quando o usuário muda preferência.
//
//   3. Quando consent vira true, despachar `gtag('consent', 'update', ...)`
//      pra liberar o storage no Google Consent Mode.
//
// IMPORTANTE: este componente substitui o snippet inline que estava no
// `app/layout.tsx`. A pseudo-iframe GTM (<noscript>) também sai do
// layout porque, sem JS, não temos como respeitar consent — e LGPD
// não tem exceção pra "sem JS, beleza".

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { GDPR_EVENT, getConsent } from "@/lib/gdpr";

declare global {
  interface Window {
    dataLayer?: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-K7GQ4H32";

export function GtmLoader() {
  const [analyticsOk, setAnalyticsOk] = useState(false);
  const [marketingOk, setMarketingOk] = useState(false);
  // Guarda pra empurrar `gtm.start` UMA vez quando o consent libera (evita
  // eventos duplicados em re-render). Ref, não state — não deve re-renderizar.
  const startedRef = useRef(false);

  useEffect(() => {
    // 1. Initial state — denied por padrão (Google Consent Mode v2).
    //    Tem que estar presente ANTES de qualquer gtag('config').
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gtag = function (...args: any[]) {
        window.dataLayer!.push(args);
      };
      window.gtag = window.gtag ?? gtag;
      window.gtag("consent", "default", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        functionality_storage: "granted",
        security_storage: "granted",
        wait_for_update: 500,
      });
    }

    function sync() {
      const c = getConsent();
      setAnalyticsOk(c !== null && c.analytics === true);
      setMarketingOk(c !== null && c.marketing === true);
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: c?.analytics ? "granted" : "denied",
          ad_storage: c?.marketing ? "granted" : "denied",
          ad_user_data: c?.marketing ? "granted" : "denied",
          ad_personalization: c?.marketing ? "granted" : "denied",
        });
      }
    }

    sync();
    window.addEventListener(GDPR_EVENT, sync as EventListener);
    return () => window.removeEventListener(GDPR_EVENT, sync as EventListener);
  }, []);

  // Carrega o GTM SÓ quando analytics OU marketing consent — antes disso
  // nem o script-tag entra no DOM (network tab fica limpa, fácil de auditar).
  if (!analyticsOk && !marketingOk) return null;

  // ANTES o loader era um <script> INLINE (o IIFE clássico do GTM que injeta
  // gtm.js). Sob a CSP estática (sem nonce, sem strict-dynamic) um inline sem
  // hash é bloqueado. Trocamos pelo carregamento DIRETO do gtm.js EXTERNO —
  // coberto pela allowlist `googletagmanager.com` em script-src, sem inline.
  // O evento `gtm.start` (só métrica de tempo de carga do container) é
  // empurrado pro dataLayer uma única vez, antes do gtm.js executar.
  if (typeof window !== "undefined" && !startedRef.current) {
    startedRef.current = true;
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  }

  return (
    <Script
      id="gtm-loader"
      strategy="lazyOnload"
      data-testid="gtm-loader"
      src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`}
    />
  );
}
