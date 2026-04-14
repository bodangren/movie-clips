import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
  test('should load the dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should show sidebar navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should navigate to library', async ({ page }) => {
    await page.goto('/');
    const libraryLink = page.getByRole('link', { name: /library/i });
    await libraryLink.click();
    await expect(page).toHaveURL(/\/library/);
  });
});
