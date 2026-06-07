import { test, expect } from '@playwright/test';

test.describe('checkout modal', () => {
  test('opens, accepts customer fields, exposes coupon input, closes', async ({ page }) => {
    await page.goto('/us/instagram-followers');

    // Click the first plan candidate.
    const planTrigger = page
      .locator(
        '[data-testid="plan-card"], [data-plan], button:has-text("Buy"), button:has-text("Order"), a:has-text("Buy"), a:has-text("Order")'
      )
      .first();
    await expect(planTrigger).toBeVisible();
    await planTrigger.click();

    // Modal / dialog should appear.
    const modal = page.locator('[role="dialog"], [data-testid="checkout-modal"]').first();
    await expect(modal).toBeVisible();

    // Fill email, name, handle (best-effort across input naming variants).
    const emailInput = modal.locator('input[type="email"], input[name="email"]').first();
    const nameInput = modal.locator('input[name="name"], input[name="full_name"]').first();
    const handleInput = modal
      .locator('input[name="handle"], input[name="username"], input[placeholder*="@"]')
      .first();

    await emailInput.fill('e2e@example.com');
    await nameInput.fill('E2E Tester');
    await handleInput.fill('e2etester');

    // Coupon input should be present (may be collapsed behind a toggle).
    const couponToggle = modal.locator('button:has-text("coupon"), button:has-text("Coupon"), [data-testid="coupon-toggle"]').first();
    if (await couponToggle.isVisible().catch(() => false)) {
      await couponToggle.click();
    }
    const couponInput = modal
      .locator('input[name="coupon"], input[placeholder*="coupon" i], [data-testid="coupon-input"]')
      .first();
    await expect(couponInput).toBeVisible();

    // Close modal — try close button, then Escape.
    const closeBtn = modal
      .locator('button[aria-label="Close"], button:has-text("Close"), [data-testid="modal-close"]')
      .first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(modal).toBeHidden();
  });
});
