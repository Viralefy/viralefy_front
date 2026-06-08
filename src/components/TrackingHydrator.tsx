"use client";

// TrackingHydrator — wrapper client-only montado no root layout.
//
// Responsabilidade: disparar trackPageview() em CADA navegação do App Router.
//
// Implementação:
//   - usePathname() do next/navigation dá o pathname atual; quando ele muda,
//     o efeito reroda e enfileira um novo evento.
//   - O primeiro render dispara o evento "landing" (lógica em track.ts).
//   - Não renderiza nada (`return null`) — efeito puramente side-effect.

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageview } from "@/lib/track";

export function TrackingHydrator(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Inclui search params no path observado — UTM-tagged URLs e variantes
    // do mesmo pathname (?ref=, ?utm=) viram pageviews distintos. O track.ts
    // já lê window.location.search; aqui só estamos triggando o efeito.
    trackPageview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  return null;
}
