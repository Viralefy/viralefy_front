import { test, expect, devices, type Page, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedCookieConsent } from './helpers/consent';

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
// Entrada dos testes: a categoria /us/instagram-followers lista os planos e o
// CTA de compra (BuyPlanCta) fica na página de plano — ver gotoPlanPage(). O
// catálogo vem do SSR; se fetchPlans() falhar no build, a lista fica vazia e os
// testes falham cedo, no clique do primeiro plano.

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

/**
 * Navega até uma página de PLANO, que é onde vive o `buy-now-cta`.
 *
 * `/us/instagram-followers` é a página de CATEGORIA (`[country]/[category]`):
 * ela lista os planos e linka pra cada um, mas não tem botão de compra. O CTA
 * está na página de plano (`[country]/[category]/[slug]`). Em vez de fixar um
 * slug — que amarraria o teste ao catálogo em produção —, entramos pela
 * categoria e clicamos no primeiro plano, que é o caminho real do usuário.
 */
async function gotoPlanPage(page: Page) {
  // Sem isto o banner LGPD cobre a página e intercepta os cliques do modal.
  await seedCookieConsent(page);
  await page.goto('/us/instagram-followers');
  const firstPlan = page.locator('a[href^="/us/instagram-followers/"]').first();
  await expect(firstPlan).toBeVisible();
  await firstPlan.click();
  await page.waitForURL(/\/us\/instagram-followers\/.+/);
}

/**
 * Avança o passo "Review" (2 de 5), que fica entre o formulário e a lista de
 * métodos de pagamento.
 *
 * O modal virou um fluxo de 5 passos — Details → Review → Payment method →
 * Complete payment → Done. O review existe de propósito: mostra destinatário,
 * plano e total antes de qualquer cobrança. Pular no teste esconderia uma
 * regressão nessa tela, então confirmamos explicitamente.
 */
async function confirmReview(modal: ReturnType<Page['locator']>) {
  const review = modal.locator('[data-testid="checkout-review"]').first();
  await expect(review).toBeVisible();
  await modal.locator('[data-testid="checkout-review-confirm"]').first().click();
}

/** Abre o modal a partir do CTA principal da página de plano. */
async function openCheckoutModal(page: Page) {
  const planTrigger = page.locator('[data-testid="buy-now-cta"]').first();
  await expect(planTrigger).toBeVisible();
  await planTrigger.click();

  const modal = page.locator('[data-testid="checkout-modal"]').first();
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
    await gotoPlanPage(page);

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);

    // Cupom: pode estar inline ou atrás de um toggle.
    const couponToggle = modal
      .locator('button:has-text("coupon"), button:has-text("Coupon"), [data-testid="coupon-toggle"]')
      .first();
    if (await couponToggle.isVisible().catch(() => false)) {
      await couponToggle.click();
    }
    const couponInput = modal.locator('[data-testid="coupon-input"]').first();
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
    await gotoPlanPage(page);

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);

    // Step 1 → Step 2 (Method picker)
    const submitBtn = modal.locator('[data-testid="checkout-submit"]').first();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await confirmReview(modal);

    // Method picker renderiza um card por gateway. Selecionamos o primeiro.
    const methodCard = modal.locator('[data-testid="payment-method-card"]').first();
    await expect(methodCard).toBeVisible({ timeout: 10_000 });
    await methodCard.click();

    // Loading state: confirm button mostra "Creating order…" enquanto fetch corre.
    const confirmBtn = modal.locator('[data-testid="checkout-confirm"]').first();
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
    await gotoPlanPage(page);

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('[data-testid="checkout-submit"]').first().click();
    await confirmReview(modal);

    const methodCard = modal.locator('[data-testid="payment-method-card"]').first();
    await methodCard.click();
    const confirmBtn = modal.locator('[data-testid="checkout-confirm"]').first();
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
    await gotoPlanPage(page);

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('[data-testid="checkout-submit"]').first().click();
    await confirmReview(modal);

    await modal.locator('[data-testid="payment-method-card"]').first().click();
    await modal.locator('[data-testid="checkout-confirm"]').first().click();

    // Volta pro step "form" e mostra alert.
    //
    // Contrato do BUG-29 (QA round 22): erro de validação do backend NÃO é
    // jogado solto no alerta. O modal detecta o campo citado na mensagem
    // ("Invalid email format" → email), destaca o campo com a mensagem
    // traduzida inline, e o alerta traz o resumo. Asserimos os dois lados —
    // é isso que prova que a correção continua de pé.
    const alert = modal.locator('.alert-error, [role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert).toContainText(/fix the highlighted fields/i);

    const emailField = modal.locator('input[type="email"], input[name="email"]').first();
    await expect(emailField).toHaveAttribute('aria-invalid', 'true');
    await expect(modal).toContainText(/Enter a valid email address/i);
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
    await gotoPlanPage(page);

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('[data-testid="checkout-submit"]').first().click();
    await confirmReview(modal);
    await modal.locator('[data-testid="payment-method-card"]').first().click();
    await modal.locator('[data-testid="checkout-confirm"]').first().click();

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
    await gotoPlanPage(page);

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('[data-testid="checkout-submit"]').first().click();
    await confirmReview(modal);
    await modal.locator('[data-testid="payment-method-card"]').first().click();
    await modal.locator('[data-testid="checkout-confirm"]').first().click();

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
    await gotoPlanPage(page);

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('[data-testid="checkout-submit"]').first().click();
    await confirmReview(modal);
    await modal.locator('[data-testid="payment-method-card"]').first().click();
    await modal.locator('[data-testid="checkout-confirm"]').first().click();

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
    await gotoPlanPage(page);

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);
    await modal.locator('[data-testid="checkout-submit"]').first().click();
    await confirmReview(modal);

    await expect(modal).toContainText(/No payment methods available/i, { timeout: 10_000 });
  });

  test('currency picker (if present) is selectable', async ({ page }) => {
    await installApiMocks(page);
    await gotoPlanPage(page);

    // Currency picker mora no header — não no modal. Em desktop ele renderiza
    // inline; em mobile fica atrás do drawer. Aqui validamos só que existe
    // e que o modal abre normalmente depois (não há regressão).
    const picker = page.locator('[data-testid="currency-picker"]').first();
    if (await picker.isVisible().catch(() => false)) {
      await picker.click().catch(() => undefined);
      // O picker abre um dialog próprio (aria-label="Currency") que cobre a
      // página. Sem fechar, ele intercepta o clique no CTA e o teste falha por
      // motivo alheio ao que se quer verificar.
      const currencyDialog = page.locator('[role="dialog"][aria-label="Currency"]');
      if (await currencyDialog.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        await expect(currencyDialog).toBeHidden();
      }
    }
    const modal = await openCheckoutModal(page);
    await expect(modal).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Mobile viewport — exercita responsividade do modal
// ---------------------------------------------------------------------------

// `devices['Pixel 5']` traz `defaultBrowserType`, e o Playwright recusa esse
// campo dentro de um describe (forçaria um worker novo). O projeto já roda em
// chromium (playwright.config.ts), então descartamos o campo e ficamos com o
// que interessa aqui: viewport, userAgent, isMobile, hasTouch e deviceScaleFactor.
const { defaultBrowserType: _unusedBrowserType, ...PIXEL_5 } = devices['Pixel 5'];

test.describe('checkout modal — mobile (Pixel 5)', () => {
  test.use(PIXEL_5);

  test('modal abre, é scrollável e completa o fluxo em viewport mobile', async ({ page }) => {
    await installApiMocks(page);
    await gotoPlanPage(page);

    const modal = await openCheckoutModal(page);
    await fillStepOne(modal);

    // O card do modal tem maxHeight: 90vh + overflowY auto. Em mobile, o
    // submit pode ficar fora do viewport — scrollIntoView garante o click.
    const submitBtn = modal.locator('[data-testid="checkout-submit"]').first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    await confirmReview(modal);

    const methodCard = modal.locator('[data-testid="payment-method-card"]').first();
    await expect(methodCard).toBeVisible({ timeout: 10_000 });
    await methodCard.scrollIntoViewIfNeeded();
    await methodCard.click();

    const confirmBtn = modal.locator('[data-testid="checkout-confirm"]').first();
    await confirmBtn.scrollIntoViewIfNeeded();
    await confirmBtn.click();

    await expect(modal.locator('a:has-text("Stripe")').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Acessibilidade — axe-core/playwright
// ---------------------------------------------------------------------------
//
// Roda axe contra o subtree do modal (escopo com data-testid="checkout-modal")
// pra não pegar ruído da página inteira. Filtra por critical/serious — esses
// são bloqueios reais (alto-contraste, labels faltando, aria inválido). Avisos
// minor/moderate (target-size, landmark warnings) ficam fora pra não floodar
// o CI; o time de design absorve via review manual.
test.describe('checkout modal — accessibility', () => {
  test('modal aberto não tem violações axe críticas/sérias', async ({ page }) => {
    await installApiMocks(page);
    await gotoPlanPage(page);
    await openCheckoutModal(page);

    const results = await new AxeBuilder({ page })
      .include('[data-testid="checkout-modal"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
