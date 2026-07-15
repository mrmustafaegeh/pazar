import { test, expect } from '@playwright/test';

test.describe('Public site smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Türkiye/i);
  });

  test('search page loads', async ({ page }) => {
    await page.goto('/ara');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Ara/i);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/giris');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Giriş/i);
  });
});
