import { test, expect, type Request } from '@playwright/test';

// E2E do cookie consent gate (LGPD Art. 8 §3 + ANPD Res. 4/2020).
//
// Fluxos cobertos:
//   1. First visit em "incognito": banner aparece, GTM NÃO foi carregado,
//      /v1/track POSTs vão com X-Analytics-Consent: 0.
//   2. "Apenas essenciais": GTM continua bloqueado, localStorage tem o
//      consent salvo com analytics=false, banner some no refresh.
//   3. "Aceitar todos": GTM carrega (script tag aparece + request pro
//      googletagmanager.com), tracking PostOne envia X-Analytics-Consent: 1.
//
// Não dependemos de backend rodando — interceptamos /v1/track localmente.

const STORAGE_KEY = 'viralefy_gdpr_consent';

test.describe('Cookie consent gate (LGPD)', () => {
  test.beforeEach(async ({ context }) => {
    // Garante storage limpo — incognito-equivalente.
    await context.clearCookies();
  });

  test('first visit shows banner, GTM not loaded, track sends consent=0', async ({ page }) => {
    const gtmRequests: string[] = [];
    page.on('request', (req: Request) => {
      const url = req.url();
      if (url.includes('googletagmanager.com') || url.includes('google-analytics.com')) {
        gtmRequests.push(url);
      }
    });

    const trackHeaders: Record<string, string>[] = [];
    await page.route('**/v1/track', (route) => {
      trackHeaders.push(route.request().headers());
      return route.fulfill({ status: 204, body: '' });
    });
    await page.route('**/v1/me/consent', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto('/');

    // Banner aparece.
    const banner = page.getByRole('dialog', { name: /Aviso de cookies|Cookie consent/ });
    await expect(banner).toBeVisible();

    // Storage ainda vazio (não decidiu).
    const storage = await page.evaluate((k) => window.localStorage.getItem(k), STORAGE_KEY);
    expect(storage).toBeNull();

    // Nenhum request pro GTM/GA.
    expect(gtmRequests).toHaveLength(0);

    // Se /v1/track foi chamado, foi com consent=0 (privacy-default).
    for (const h of trackHeaders) {
      expect(h['x-analytics-consent']).toBe('0');
    }
  });

  test('"Apenas essenciais" hides banner, keeps GTM blocked, persists consent=false', async ({
    page,
  }) => {
    const gtmRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('googletagmanager.com')) gtmRequests.push(req.url());
    });

    await page.route('**/v1/track', (route) => route.fulfill({ status: 204, body: '' }));
    await page.route('**/v1/me/consent', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto('/');

    await page.getByTestId('cookie-essential-only').click();

    // Banner some.
    await expect(page.getByRole('dialog', { name: /Aviso de cookies|Cookie consent/ })).toHaveCount(
      0,
    );

    // localStorage tem consent com analytics=false.
    const raw = await page.evaluate((k) => window.localStorage.getItem(k), STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.analytics).toBe(false);
    expect(parsed.marketing).toBe(false);
    expect(parsed.necessary).toBe(true);
    expect(parsed.version).toBe(2);

    // GTM ainda não carregou.
    expect(gtmRequests).toHaveLength(0);

    // Reload — banner não reaparece.
    await page.reload();
    await expect(page.getByRole('dialog', { name: /Aviso de cookies|Cookie consent/ })).toHaveCount(
      0,
    );
  });

  test('"Aceitar todos" loads GTM and tracking sends consent=1', async ({ page }) => {
    const gtmRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('googletagmanager.com')) gtmRequests.push(req.url());
    });

    const trackHeaders: Record<string, string>[] = [];
    await page.route('**/v1/track', (route) => {
      trackHeaders.push(route.request().headers());
      return route.fulfill({ status: 204, body: '' });
    });
    await page.route('**/v1/me/consent', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto('/');

    await page.getByTestId('cookie-accept-all').click();

    const raw = await page.evaluate((k) => window.localStorage.getItem(k), STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed.analytics).toBe(true);
    expect(parsed.marketing).toBe(true);

    // GTM agora carrega — script tag inserido pelo GtmLoader.
    // Espera até a request bater (lazyOnload pode demorar).
    await page.waitForRequest(
      (req) => req.url().includes('googletagmanager.com/gtm.js'),
      { timeout: 10_000 },
    );
    expect(gtmRequests.length).toBeGreaterThan(0);

    // Qualquer chamada subsequente em /v1/track deve enviar consent=1.
    // Navega pra forçar pageview.
    await page.goto('/about').catch(() => undefined);
    const post = trackHeaders.find((h) => h['x-analytics-consent'] === '1');
    expect(post).toBeDefined();
  });

  test('"Personalizar" → toggle analytics only', async ({ page }) => {
    await page.route('**/v1/track', (route) => route.fulfill({ status: 204, body: '' }));
    await page.route('**/v1/me/consent', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto('/');

    await page.getByTestId('cookie-customize').click();

    // Por default no modal: preferences ON, analytics OFF, marketing OFF.
    const analyticsToggle = page.getByTestId('cookie-toggle-analytics');
    await expect(analyticsToggle).not.toBeChecked();
    const marketingToggle = page.getByTestId('cookie-toggle-marketing');
    await expect(marketingToggle).not.toBeChecked();

    await analyticsToggle.check();
    await page.getByTestId('cookie-save-custom').click();

    const raw = await page.evaluate((k) => window.localStorage.getItem(k), STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed.analytics).toBe(true);
    expect(parsed.marketing).toBe(false);
    expect(parsed.preferences).toBe(true);
  });
});
