import type { Page } from '@playwright/test';
import { GDPR_STORAGE_KEY, GDPR_VERSION } from '../../src/lib/gdpr';

/**
 * Pré-semeia o consentimento de cookies pra o banner LGPD não aparecer.
 *
 * Por que existe: o `CookieBanner` renderiza um `role="dialog"` fixo que cobre a
 * página e **intercepta cliques** — qualquer teste que clique em CTA, botão de
 * modal ou link falha por "subtree intercepts pointer events", sem relação com o
 * que estava sendo testado.
 *
 * Por que semear em vez de clicar em "aceitar": clicar acopla todo teste ao
 * layout do banner e adiciona corrida (o banner monta no client). Semear o
 * storage antes do primeiro load é determinístico e mantém o teste focado.
 *
 * A versão e a chave vêm de `src/lib/gdpr.ts` — se o shape do consent mudar
 * (bump de `GDPR_VERSION`), este helper acompanha sozinho, sem teste podre.
 *
 * NÃO usar na suíte de cookie-consent: lá o banner É o objeto do teste.
 *
 * Entradas: `page` (antes do primeiro `goto` — usa `addInitScript`).
 * Efeitos: escreve `localStorage[viralefy_gdpr_consent]` em toda navegação da page.
 */
export async function seedCookieConsent(page: Page) {
  await page.addInitScript(
    ([key, version]) => {
      window.localStorage.setItem(
        key as string,
        JSON.stringify({
          version,
          necessary: true,
          preferences: true,
          analytics: false,
          marketing: false,
          timestamp: new Date().toISOString(),
        }),
      );
    },
    [GDPR_STORAGE_KEY, GDPR_VERSION] as const,
  );
}
