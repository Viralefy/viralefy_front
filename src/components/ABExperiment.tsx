"use client";

// ABExperiment — wrapper de A/B testing client-side (Fase 6.6).
//
// Uso:
//   <ABExperiment
//     experimentKey="homepage_hero_v1"
//     variants={{
//       control:   <HeroControl />,
//       variant_a: <HeroVariantA />,
//     }}
//     fallback={<HeroControl />}
//   />
//
// Comportamento:
//   1. No mount, lê (ou cria) o visitor_id via getVisitorId().
//   2. Chama abAssign() pra obter a variant. Backend é sticky — mesmo
//      visitor sempre cai na mesma.
//   3. Renderiza o child correspondente. Auto-dispara abTrack(exposure)
//      uma única vez por (visitor, experiment) por sessão (dedupe via Set).
//   4. Enquanto a chamada está em flight, renderiza `fallback`. Esse
//      fallback DEVE ser idêntico ao "control" pra evitar layout shift —
//      o pattern recomendado é passar a mesma instância em ambos.
//   5. Se a chamada falha (network, 404), renderiza fallback e segue.
//
// Performance:
//   - SSR-safe: SSR renderiza fallback (window undefined).
//   - Hydration: 0 mismatch porque o estado começa idêntico ao SSR.
//   - Chamada de rede: 1 POST pequeno, paralelo a hydration.

import { useEffect, useState, type ReactNode } from "react";
import { abAssign, abTrack } from "@/lib/api";
import { getVisitorId } from "@/lib/visitor";

type ABExperimentProps = {
  experimentKey: string;
  variants: Record<string, ReactNode>;
  fallback: ReactNode;
};

// Dedupe de exposure events por sessão. Compartilhado no módulo — sobrevive
// re-renders mas não navegações fullpage (que é o que queremos).
const exposureFired = new Set<string>();

export default function ABExperiment({ experimentKey, variants, fallback }: ABExperimentProps) {
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    const visitorId = getVisitorId();
    if (!visitorId) return;

    let cancelled = false;
    abAssign(visitorId, experimentKey)
      .then((res) => {
        if (cancelled) return;
        const chosen = variants[res.variant] ? res.variant : null;
        setVariant(chosen);
        if (chosen) {
          const dedupeKey = `${visitorId}|${experimentKey}`;
          if (!exposureFired.has(dedupeKey)) {
            exposureFired.add(dedupeKey);
            void abTrack(visitorId, experimentKey, "exposure").catch(() => {
              // Telemetria best-effort — descarta falhas.
            });
          }
        }
      })
      .catch(() => {
        // Falhou (404, network) — fica no fallback. Não é erro pro user.
      });

    return () => {
      cancelled = true;
    };
  }, [experimentKey, variants]);

  if (variant && variants[variant]) {
    return <>{variants[variant]}</>;
  }
  return <>{fallback}</>;
}
