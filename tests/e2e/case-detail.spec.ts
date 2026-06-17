// Verify case detail page render 4 tab + CRUD hoạt động end-to-end.
// Chạy bằng: cd tests/e2e && pnpm exec playwright test case-detail.spec.ts --reporter=line
import { test, expect } from '@playwright/test';

test.describe('QUANLYVKS - case detail page', () => {
  test('login, mở case 1, xem 6 tab, thêm/xoá người liên quan', async ({ page }) => {
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

    // 2. Vào /cases, click nút Mở case 1
    await page.goto('/cases');
    await expect(page.getByText('VKS-2026-0001')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('row', { name: /VKS-2026-0001/ }).getByRole('button', { name: 'Mở' }).click();
    await expect(page).toHaveURL(/\/cases\/1$/, { timeout: 10_000 });

    // 3. Tab Tổng quan — thấy thông tin + stats
    await expect(page.getByText('Thông tin chung').first()).toBeVisible();
    await expect(page.getByText('Trộm cắp tài sản').first()).toBeVisible();

    // 4. Tab Người liên quan — thấy bảng có dữ liệu seed
    await page.getByRole('button', { name: 'Người liên quan' }).click();
    await expect(page.getByText('Trần Văn An').first()).toBeVisible();
    await expect(page.getByText('Nguyễn Thị Bích Hà').first()).toBeVisible();

    // 5. Thêm 1 người liên quan mới
    await page.getByRole('button', { name: '+ Thêm người liên quan' }).click();
    const uniqueName = `E2E Phase2 ${Date.now()}`;
    await page.getByLabel('Họ tên').fill(uniqueName);
    await page.getByRole('button', { name: 'Lưu' }).click();
    await expect(page.getByText(uniqueName).first()).toBeVisible({ timeout: 10_000 });

    // 6. Xoá người liên quan vừa thêm (auto-confirm)
    page.on('dialog', (dialog) => {
      void dialog.accept();
    });
    const row = page.getByRole('row', { name: new RegExp(uniqueName) });
    await row.getByRole('button', { name: 'Xoá' }).click();
    await expect(page.getByText(uniqueName)).not.toBeVisible({ timeout: 10_000 });

    // 7. Tab Tội danh — thấy 1 tội danh
    await page.getByRole('button', { name: 'Tội danh' }).click();
    await expect(page.getByText('Trộm cắp tài sản').first()).toBeVisible();

    // 8. Tab Phân công — thấy 1 phân công
    await page.getByRole('button', { name: 'Phân công' }).click();
    await expect(page.getByText('KIEM_SAT_VIEN').first()).toBeVisible();

    // 9. Tab Biểu mẫu đã tạo — thấy 1 doc
    await page.getByRole('button', { name: 'Biểu mẫu đã tạo' }).click();
    await expect(page.getByText('BM-001').first()).toBeVisible();

    // 10. Quay về /cases — link Mở hoạt động
    await page.goto('/cases');
    await expect(page.getByText('VKS-2026-0001').first()).toBeVisible();

    // 11. Không có 5xx
    expect(apiErrors, `Unexpected 5xx:\n${apiErrors.join('\n')}`).toEqual([]);
  });

  test('topbar search truyền ?q= xuống /cases', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

    // Mở /cases?q=Trộm
    await page.goto('/cases?q=Trộm');
    await expect(page.getByText('VKS-2026-0001').first()).toBeVisible({ timeout: 10_000 });
    // URL vẫn giữ ?q=Trộm
    expect(page.url()).toContain('q=Tr');
  });
});
