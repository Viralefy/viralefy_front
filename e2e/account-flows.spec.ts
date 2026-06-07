import { test, expect } from '@playwright/test';

const protectedRoutes = [
  '/account/credits',
  '/account/notifications',
  '/account/data',
  '/account/orders',
  '/account/subscriptions',
  '/account/referral',
];

test.describe('account routes — unauthenticated redirects', () => {
  for (const route of protectedRoutes) {
    test(`${route} redirects to /login when no token`, async ({ page, context }) => {
      // Ensure no auth cookies / storage.
      await context.clearCookies();
      await page.goto(route);

      // Wait for the navigation chain to settle.
      await page.waitForLoadState('networkidle').catch(() => {
        /* tolerate cases where network never goes idle */
      });

      const url = new URL(page.url());
      expect(url.pathname.startsWith('/login')).toBeTruthy();
    });
  }
});
