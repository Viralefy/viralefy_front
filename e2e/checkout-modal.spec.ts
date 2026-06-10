import { test, expect, devices, type Page, type Route } from '@playwright/test';

// E2E hardened para o fluxo de CheckoutModal.
//
// O modal bate em vários endpoints durante o mount + submit. Aqui interceptamos
// TUDO via page.route() pra:
//   1) não depender do API estar de pé (CI roda só o front com `npm start`),
//   2) exercitar cenários de erro determinísticos (400/401/402/5xx),
//   3) validar o payload enviado ao POST /v1/checkout (idempotency-key, etc).
//
// Endpoints alvo (vide src/lib/api.ts):
//   GET  /api/geo                              — Next.js route, country detection
//   GET  /v1/tax-rates                         — vat display
//   GET  /v1/plans/:id/payment-methods         — step 2 (gateway picker)
//   POST /v1/checkout                          — submit
//   GET  /v1/me/profiles, /v1/me/credits       — só logged-in (não tocamos aqui)
//
// O front lê NEXT_PUBLIC_API_URL em build time (default http://localhost:8080).
// Usamos glob `**/v1/...` pra cobrir tanto same-origin (proxy) quanto cross-origin
// (8080 direto). Caso o backend esteja num outro host, o glob ainda casa.
//
// TODO(infra): o teste assume que a página /us/instagram-followers renderiza
// pelo menos UM CTA "Buy now" (BuyPlanCta) sem dependência de API. Se a build
// SSR estiver bloqueada por fetchPlans() falhando, precisamos mockar também
// /v1/plans em globalSetup ou trocar a rota de entrada por uma estática.

// ---------------------------------------------------------------------------
// Fixtures de resposta
// ---------------------------------------------------------------------------

const SUCCESS_CHECKOUT_BODY = {
  data: {
    order_id: '00000000-0000-4000-8000-000000000001',
    status: 'pending',
    plan_name: '1,000 IG followers',
    display_currency: 'USD',
    display_symbol: '$',
    display_amount: '8.90',
    settlement_currency: 'USDT',
    settlement_symbol: 'USDT',
    settlement_amount: '8.90',
    account_created: false,
    email: 'e2e@example.com',
    email_sent: true,
    gateway_provider: 'stripe',
    payment_url: 'https://checkout.stripe.com/c/pay/cs_test_e2e',
    payment_method: 'gateway',
    payment_extra: { method_kind: 'card' },
  },
};

const PAYMENT_METHODS_BODY = {
  data: [
    {
      gateway_id: 'gw_stripe_card',
      provider: 'stripe',
      name: 'Credit card',
      kind: 'card',
      charged_currency: 'USD',
      charged_amount: '8.90',
      charged_symbol: '$',
      settlement_currency: 'USDT',
      settlement_amount: '8.90',
      settlement_symbol: 'USDT',
      conversion_note: null,
      network_warning: null,
      network_label: null,
    },
  ],
};

const TAX_RATES_BODY = { data: [] };
const GEO_BODY = { data: { country: 'US' } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockOverrides = {
  /** Substitui o handler de POST /v1/checkout (use pra cenários de erro). */
  checkout?: (route: Route) => Promise<void> | void;
  /** Substitui o handler de payment-methods (default = 1 método stripe card). */
  paymentMethods?: (route: Route) => Promise<void> | void;
};

async function installApiMocks(page: Page, overrides: MockOverrides = {}) {
  // Captura idempotency-key, payload final, etc para asserts.
  const checkoutRequests: Array<{
    headers: Record<string, string>;
    postData: string | null;
  }> = [];

  await page.route('**/api/geo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(GEO_BODY),
    });
  });

  await page.route('**/v1/tax-rates', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TAX_RATES_BODY),
    });
  });

  await page.route('**/v1/plans/*/payment-methods*', async (route) => {
    if (overrides.paymentMethods) return overrides.paymentMethods(route);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PAYMENT_METHODS_BODY),
    });
  });

  await page.route('**/v1/checkout', async (route) => {
    checkoutRequests.push({
      headers: route.request().headers(),
      postData: route.request().postData(),
    });
    if (overrides.checkout) return overrides.checkout(route);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(SUCCESS_CHECKOUT_BODY),
    });
  });

  return { checkoutRequests };
}

/** Abre o modal a partir do CTA principal da página de plano. */
async function openCheckoutModal(page: Page) {
  // TODO: idealmente o componente expõe data-testid="buy-now-cta"; até lá,
  // o seletor caça por texto/role conhecido do BuyPlanCta.
  const planTrigger = page
    .locator(
      '[data-testid="plan-card"], [data-plan], button:has-text("Buy"), button:has-text("Order"), a:has-text("Buy"), a:has-text("Order")'
    )
    .first();
  await expect(planTrigger).toBeVisible();
  await planTrigger.click();

  const modal = page.locator('[role="dialog"], [data-testid="checkout-modal"]').first();
  await expect(modal).toBeVisible();
  return modal;
}

/** Preenche os campos mínimos do step 1 (visitante anônimo, plano de profile). */
async function fillStepOne(modal: ReturnType<Page['locator']>) {
  const emailInput = modal.locator('input[type="email"], input[name="email"]').first();
  const nameInput = modal.locator('input[name="name"], input[name="full_name"]').first();
  const handleInput = modal
    .locator('input[name="handle"], input[name="username"], input[placeholder*="@"]')
    .first();

  await emailInput.fill('e2e@example.com');
  await nameInput.fill('E2E Tester');
  // handle só existe para planos target_type=profile; o teste assume
  // que /us/instagram-followers cai em followers (profile). Se a página
  // for trocada pra publication, ajustar pra publication_url.
  if (await handleInput.isVisible().catch(() => false)) {
    await handleInput.fill('e2etester');
  }
  const urlInput = modal.locator('input[name="publication_url"]').first();
  if (await urlInput.isVisible().catch(() => false)) {
    await urlInput.fill('https://www.instagram.com/p/ABC123/');
  }
}

// ---------------------------------------------------------------------------
// Suite principal — desktop
// ---------------------------------------------------------------------------

test.describe('checkout modal — desktop', () => {
  test('opens, accepts customer fields, exposes coupon input, closes', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/us/instagram-followers');

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);

    // Cupom: pode estar inline ou atrás de um toggle.
    const couponToggle = modal
      .locator('button:has-text("coupon"), button:has-text("Coupon"), [data-testid="coupon-toggle"]')
      .first();
    if (await couponToggle.isVisible().catch(() => false)) {
      await couponToggle.click();
    }
    const couponInput = modal
      .locator('input[name="coupon"], input[name="coupon_code"], input[placeholder*="coupon" i], input#coupon_code, [data-testid="coupon-input"]')
      .first();
    await expect(couponInput).toBeVisible();

    // Fecha — preferir botão Cancel/Close; fallback Escape; fallback click-outside.
    const closeBtn = modal
      .locator('button[aria-label="Close"], button:has-text("Close"), button:has-text("Cancel"), [data-testid="modal-close"]')
      .first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(modal).toBeHidden();
  });

  test('successful submit → goes through method picker → instructions/success step', async ({ page }) => {
    const { checkoutRequests } = await installApiMocks(page);
    await page.goto('/us/instagram-followers');

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);

    // Step 1 → Step 2 (Method picker)
    const submitBtn = modal.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Method picker renderiza um card por gateway. Selecionamos o primeiro.
    const methodCard = modal.locator('button:has-text("Credit card"), button:has-text("Stripe")').first();
    await expect(methodCard).toBeVisible({ timeout: 10_000 });
    await methodCard.click();

    // Loading state: confirm button mostra "Creating order…" enquanto fetch corre.
    const confirmBtn = modal.locator('button:has-text("Confirm")').first();
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Step 3 (instructions) — header / open-stripe link visível.
    const stripeLink = modal.locator('a:has-text("Stripe")').first();
    await expect(stripeLink).toBeVisible({ timeout: 10_000 });

    // Asserts no payload — idempotency-key DEVE estar presente em POST /v1/checkout
    expect(checkoutRequests.length).toBeGreaterThan(0);
    const lastReq = checkoutRequests[checkoutRequests.length - 1];
    const idempotencyKey =
      lastReq.headers['idempotency-key'] ?? lastReq.headers['Idempotency-Key'];
    expect(idempotencyKey, 'POST /v1/checkout must carry an Idempotency-Key header').toBeTruthy();
    expect(idempotencyKey!.length).toBeGreaterThan(8);

    // Payload tem os campos esperados.
    const body = JSON.parse(lastReq.postData ?? '{}');
    expect(body.plan_id).toBeTruthy();
    expect(body.email).toBe('e2e@example.com');
    expect(body.name).toBe('E2E Tester');
    expect(body.display_currency).toBeTruthy();
    expect(body.payment_method).toBe('gateway');
    expect(body.gateway_id).toBe('gw_stripe_card');
  });

  test('shows loading indicator while POST /v1/checkout is in flight', async ({ page }) => {
    // Atrasa o checkout 1.5s pra deixar o "Creating order…" visível.
    await installApiMocks(page, {
      checkout: async (route) => {
        await new Promise((r) => setTimeout(r, 1500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SUCCESS_CHECKOUT_BODY),
        });
      },
    });
    await page.goto('/us/instagram-followers');

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('button[type="submit"]').first().click();

    const methodCard = modal.locator('button:has-text("Credit card"), button:has-text("Stripe")').first();
    await methodCard.click();
    const confirmBtn = modal.locator('button:has-text("Confirm")').first();
    await confirmBtn.click();

    // Enquanto o request roda, o botão deve mostrar "Creating order…".
    await expect(modal.locator('button:has-text("Creating order")')).toBeVisible({ timeout: 1000 });
  });

  test('handles 400 validation error — surfaces message and keeps modal open', async ({ page }) => {
    await installApiMocks(page, {
      checkout: (route) =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Invalid email format' } }),
        }),
    });
    await page.goto('/us/instagram-followers');

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('button[type="submit"]').first().click();

    await modal.locator('button:has-text("Credit card"), button:has-text("Stripe")').first().click();
    await modal.locator('button:has-text("Confirm")').first().click();

    // Volta pro step "form" e mostra alert.
    const alert = modal.locator('.alert-error, [role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert).toContainText(/Invalid email|invalid/i);
    await expect(modal).toBeVisible(); // não fechou
  });

  test('handles 401 unauthorized — surfaces auth error', async ({ page }) => {
    await installApiMocks(page, {
      checkout: (route) =>
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Please sign in to continue' } }),
        }),
    });
    await page.goto('/us/instagram-followers');

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('button[type="submit"]').first().click();
    await modal.locator('button:has-text("Credit card"), button:has-text("Stripe")').first().click();
    await modal.locator('button:has-text("Confirm")').first().click();

    const alert = modal.locator('.alert-error, [role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert).toContainText(/sign in|log in|unauth/i);
  });

  test('handles 402 payment failed — surfaces payment error', async ({ page }) => {
    await installApiMocks(page, {
      checkout: (route) =>
        route.fulfill({
          status: 402,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Payment declined by gateway' } }),
        }),
    });
    await page.goto('/us/instagram-followers');

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('button[type="submit"]').first().click();
    await modal.locator('button:has-text("Credit card"), button:has-text("Stripe")').first().click();
    await modal.locator('button:has-text("Confirm")').first().click();

    const alert = modal.locator('.alert-error, [role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert).toContainText(/declined|payment/i);
  });

  test('handles 500 server error — surfaces generic error', async ({ page }) => {
    await installApiMocks(page, {
      checkout: (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Internal server error' } }),
        }),
    });
    await page.goto('/us/instagram-followers');

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('button[type="submit"]').first().click();
    await modal.locator('button:has-text("Credit card"), button:has-text("Stripe")').first().click();
    await modal.locator('button:has-text("Confirm")').first().click();

    const alert = modal.locator('.alert-error, [role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 10_000 });
  });

  test('handles empty payment-methods list — shows fallback UI', async ({ page }) => {
    await installApiMocks(page, {
      paymentMethods: (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        }),
    });
    await page.goto('/us/instagram-followers');

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('button[type="submit"]').first().click();

    await expect(modal).toContainText(/No payment methods available/i, { timeout: 10_000 });
  });

  test('currency picker (if present) is selectable', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/us/instagram-followers');

    // Currency picker mora no header — não no modal. Só validamos que ele
    // existe e abre, sem assumir o shape (não há data-testid hoje).
    const picker = page
      .locator(
        '[data-testid="currency-picker"], select[name="currency"], button[aria-label*="currenc" i]'
      )
      .first();
    if (await picker.isVisible().catch(() => false)) {
      await picker.click().catch(() => undefined);
      // TODO: adicionar data-testid="currency-picker" no header pra
      // assert mais robusto. Por ora, basta verificar que clicar não
      // quebra a página e o modal ainda abre depois.
    }
    const modal = await openCheckoutModal(page);
    await expect(modal).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Mobile viewport — exercita responsividade do modal
// ---------------------------------------------------------------------------

test.describe('checkout modal — mobile (Pixel 5)', () => {
  test.use({ ...devices['Pixel 5'] });

  test('modal abre, é scrollável e completa o fluxo em viewport mobile', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/us/instagram-followers');

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);

    // O card do modal tem maxHeight: 90vh + overflowY auto. Em mobile, o
    // submit pode ficar fora do viewport — scrollIntoView garante o click.
    const submitBtn = modal.locator('button[type="submit"]').first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    const methodCard = modal.locator('button:has-text("Credit card"), button:has-text("Stripe")').first();
    await expect(methodCard).toBeVisible({ timeout: 10_000 });
    await methodCard.scrollIntoViewIfNeeded();
    await methodCard.click();

    const confirmBtn = modal.locator('button:has-text("Confirm")').first();
    await confirmBtn.scrollIntoViewIfNeeded();
    await confirmBtn.click();

    await expect(modal.locator('a:has-text("Stripe")').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Acessibilidade — axe-core/playwright (opcional, depende de dependência)
// ---------------------------------------------------------------------------
//
// TODO(deps): instalar @axe-core/playwright (dev-dep) e remover esse skip.
// O front hoje não tem axe-core no package.json — pra não quebrar o CI sem
// permissão de bumpar deps, o teste fica skipped até instalar:
//
//   npm i -D @axe-core/playwright
//
// Depois disso, trocar o skip por test() e descomentar o body.
test.describe('checkout modal — accessibility', () => {
  test.skip('modal aberto não tem violações axe críticas/sérias', async ({ page }) => {
    // const { default: AxeBuilder } = await import('@axe-core/playwright');
    // await installApiMocks(page);
    // await page.goto('/us/instagram-followers');
    // await openCheckoutModal(page);
    // const results = await new AxeBuilder({ page })
    //   .include('[role="dialog"]')
    //   .withTags(['wcag2a', 'wcag2aa'])
    //   .analyze();
    // const blocking = results.violations.filter(
    //   (v) => v.impact === 'critical' || v.impact === 'serious',
    // );
    // expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
