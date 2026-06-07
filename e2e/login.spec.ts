import { test, expect } from '@playwright/test';

test.describe('login page', () => {
  test('renders form, Turnstile container, and disables submit without token', async ({ page }) => {
    await page.goto('/login');

    // Form is visible.
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // Email-ish input exists.
    const emailInput = form.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();

    // Turnstile widget container — Cloudflare injects an iframe inside a div.
    const turnstile = page.locator(
      '.cf-turnstile, [data-testid="turnstile"], [data-sitekey], iframe[src*="challenges.cloudflare.com"]'
    );
    await expect(turnstile.first()).toBeVisible();

    // Submit should be disabled while no Turnstile token has been produced.
    const submit = form.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first();
    await expect(submit).toBeDisabled();
  });
});
