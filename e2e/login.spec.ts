import { test, expect } from '@playwright/test';

// Identidade unificada (2026-06-11): a UI de login vive em `auth.viralefy.com`.
// Quem cai em `/login` neste host (bookmark antigo, link de e-mail não migrado)
// é redirecionado pra lá com `return_to` apontando pro /sso/callback do PRÓPRIO
// host — é assim que a sessão termina no localStorage certo.
//
// O teste antigo assertava o formulário local + widget Turnstile. Esse formulário
// só renderiza quando a página roda NO host de auth; fora dele o handoff acontece
// antes, e o teste falhava procurando um Turnstile que nunca ia existir aqui.
// Testar a página remota de auth também não é papel deste repo (acoplaria o CI do
// front ao deploy do auth), então verificamos o contrato do handoff.
test.describe('login page', () => {
  test('faz handoff pro SSO com return_to do próprio host', async ({ page }) => {
    // O destino é externo e não precisa responder pro teste valer: o que importa
    // é PRA ONDE o front manda o usuário. Interceptamos a navegação pra não
    // depender da rede nem do deploy do auth.
    let ssoUrl: string | null = null;
    await page.route('**auth.viralefy.com/**', async (route) => {
      ssoUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>auth stub</body></html>',
      });
    });

    await page.goto('/login');
    await expect.poll(() => ssoUrl, { timeout: 10_000 }).not.toBeNull();

    const url = new URL(ssoUrl!);
    expect(url.pathname).toBe('/login');

    // return_to tem que voltar pro /sso/callback DESTE host — se apontar pra
    // outro lugar, a sessão cai no localStorage errado (ou vaza pra terceiro).
    const returnTo = url.searchParams.get('return_to');
    expect(returnTo).not.toBeNull();
    const back = new URL(returnTo!);
    expect(back.pathname).toBe('/sso/callback');
    expect(back.origin).toBe(new URL(test.info().project.use.baseURL ?? 'http://localhost:3000').origin);
  });
});
