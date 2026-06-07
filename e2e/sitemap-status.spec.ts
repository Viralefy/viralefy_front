import { test, expect } from '@playwright/test';

test.describe('status + sitemap', () => {
  test('/status renders all badges', async ({ page }) => {
    await page.goto('/status');

    // Status page renders a collection of badges (one per service / probe).
    const badges = page.locator('[data-testid="status-badge"], [data-status], .status-badge');
    await expect(badges.first()).toBeVisible();
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('/sitemap.xml returns 200 and is a sitemapindex', async ({ request, baseURL }) => {
    const url = new URL('/sitemap.xml', baseURL).toString();
    const res = await request.get(url);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<sitemapindex');
  });
});
