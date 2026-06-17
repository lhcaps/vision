import { test, expect } from '@playwright/test';

test('templates page screenshot', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill('admin123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  await page.goto('/templates');
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
  await page.screenshot({ path: 'test-results/templates-page.png', fullPage: true });
});

test('cases page screenshot', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill('admin123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  await page.goto('/cases');
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
  await page.screenshot({ path: 'test-results/cases-page.png', fullPage: true });
});
