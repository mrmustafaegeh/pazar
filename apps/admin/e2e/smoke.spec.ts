import { test, expect } from '@playwright/test';

test.describe('Admin smoke', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/giris');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Admin Girişi/i);
  });
});
