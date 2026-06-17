import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill('admin123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

test.describe('Document form save flow', () => {
  test('login, open a TT 03/2026 template, save form inputs and reload persisted data', async ({
    page,
  }) => {
    const apiErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() >= 500) {
        apiErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`);
      }
    });
    page.on('console', (message: ConsoleMessage) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await login(page);

    await page.goto('/documents');
    await expect(page.getByText('Biểu mẫu trong DB')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('213').first()).toBeVisible();

    const bm004Card = page
      .locator('article')
      .filter({ hasText: 'BM-004' })
      .filter({ hasNotText: 'Điểm phù hợp' });
    await expect(bm004Card).toHaveCount(1);
    await bm004Card.getByRole('button', { name: 'Mở biểu mẫu' }).click();

    await expect(page).toHaveURL(/\/documents\/\d+$/, { timeout: 15_000 });
    await expect(page.getByText('BM-004').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Form dữ liệu chung')).toBeVisible();

    const savedSummary = `QA lưu biểu mẫu BM-004 ${Date.now()}`;
    await page.getByLabel('Nội dung chính').fill(savedSummary);
    await page.getByRole('button', { name: 'Lưu dữ liệu' }).click();
    await expect(page.getByText(/Đã lưu dữ liệu biểu mẫu|Đã lưu thành công/)).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();
    await expect(page.getByText('BM-004').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel('Nội dung chính')).toHaveValue(savedSummary);

    expect(apiErrors, `Unexpected API 5xx:\n${apiErrors.join('\n')}`).toEqual([]);
    expect(
      consoleErrors.filter(
        (entry) => !entry.includes('DevTools') && !entry.toLowerCase().includes('hydration'),
      ),
      `Console errors:\n${consoleErrors.join('\n')}`,
    ).toEqual([]);
  });
});
