import { test, expect } from '@playwright/test';

test.describe('QLLaw smoke test', () => {
  test('home → redirected to login (no session)', async ({ page }) => {
    const apiErrors: string[] = [];
    page.on('response', (res) => {
      if (res.url().includes('/api/') && res.status() >= 500) {
        apiErrors.push(`${res.status()} ${res.request().method()} ${res.url()}`);
      }
    });

    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();

    expect(apiErrors, `Unexpected 5xx:\n${apiErrors.join('\n')}`).toEqual([]);
  });

  test('login page accepts username and authenticates', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test('protected pages reachable after login', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

    for (const path of ['/cases', '/documents', '/templates', '/imports', '/reports', '/settings']) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} status`).toBe(200);
      expect(page.url(), `${path} url`).not.toContain('/login');
    }
  });

  test('templates page loads without redirect', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

    await page.goto('/templates');
    await expect(page).not.toHaveURL(/\/login/);
  });
});
