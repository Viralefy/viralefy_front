import { test, expect } from '@playwright/test';

test.describe('home page', () => {
  test('renders hero, at least one plan card, and footer', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const h1Text = (await h1.textContent()) || '';
    expect(h1Text).toMatch(/Instagram|TikTok/i);

    // At least one plan card should render somewhere on the homepage.
    // Cards are typically anchors/buttons linking into the plan flow.
    const planCandidates = page.locator(
      '[data-testid="plan-card"], [data-plan], a[href*="/plan"], a[href*="instagram-followers"], a[href*="tiktok-followers"]'
    );
    await expect(planCandidates.first()).toBeVisible();

    // Footer is shared layout — assert by role or tag.
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });
});
