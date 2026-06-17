// Verify toàn bộ UI render dữ liệu thật sau seed.
// Chạy bằng: cd tests/e2e && pnpm exec playwright test verify-after-seed.spec.ts --reporter=line
import { test, expect } from '@playwright/test';

test.describe('QUANLYVKS - verify data renders after seed', () => {
  test('login admin and inspect every page renders real data', async ({ page }) => {
    const apiErrors: string[] = [];
    page.on('response', (res) => {
      if (res.url().includes('/api/') && res.status() >= 500) {
        apiErrors.push(`${res.status()} ${res.request().method()} ${res.url()}`);
      }
    });

    // 1. Login
    await page.goto('/login');
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

    // 2. /cases — phải thấy 5 vụ án
    await page.goto('/cases');
    await expect(page.getByText('VKS-2026-0001')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('VKS-2026-0002')).toBeVisible();
    await expect(page.getByText('VKS-2026-0003')).toBeVisible();
    await expect(page.getByText('VKS-2026-0004')).toBeVisible();
    await expect(page.getByText('VKS-2026-0005')).toBeVisible();
    await expect(page.getByText('Vụ án trộm cắp tài sản tại phường Bến Nghé')).toBeVisible();

    // 3. /templates (review queue) — phải có document
    await page.goto('/templates');
    await expect(page.getByText('BM-001').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('BM-023').first()).toBeVisible();
    await expect(page.getByText('BM-156').first()).toBeVisible();
    await expect(page.getByText('Cần phê duyệt').first()).toBeVisible();
    await expect(page.getByText('Đã duyệt').first()).toBeVisible();

    // 4. /documents (template selector) — phải có case thật đang chọn
    await page.goto('/documents');
    await expect(page.getByText('VKS-2026').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Mở biểu mẫu').first()).toBeVisible();

    // 5. /reports — báo cáo thống kê có số liệu
    await page.goto('/reports');
    await expect(page.getByText(/Hồ sơ trong kỳ/).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Phường Bến Nghé').first()).toBeVisible();

    // 6. /settings — hiển thị admin, agency
    await page.goto('/settings');
    await expect(page.getByText('VKS-DEFAULT').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Viện kiểm sát').first()).toBeVisible();
    await expect(page.getByText('Quan tri he thong').first()).toBeVisible();

    // 7. /documents/1 — deep link, document workspace render
    await page.goto('/documents/1');
    await expect(page.getByText('BM-001').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('VKS-2026-0001').first()).toBeVisible();

    // 8. Lỗi 5xx (server bug) — không được có
    expect(apiErrors, `Unexpected 5xx:\n${apiErrors.join('\n')}`).toEqual([]);
  });
});
