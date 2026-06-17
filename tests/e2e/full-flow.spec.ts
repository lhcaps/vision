/**
 * Comprehensive E2E verification: tất cả core features liên kết flawless.
 * - Login + session
 * - Mọi frontend route render không lỗi
 * - Topbar search + quick create dropdown
 * - Case detail 6 tab với CRUD thật trên 4 entity
 * - Cross-page navigation: list → detail → document → back
 * - Không có console error / 5xx
 */
import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill('admin123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

async function attachConsoleWatcher(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  return { consoleErrors, pageErrors };
}

test.describe('Full E2E verification', () => {
  test('all routes render + topbar + case detail + cross-nav, no console errors', async ({ page }) => {
    const apiErrors: string[] = [];
    page.on('response', (res) => {
      if (res.url().includes('/api/') && res.status() >= 500) {
        apiErrors.push(`${res.status()} ${res.request().method()} ${res.url()}`);
      }
    });
    const { consoleErrors, pageErrors } = await attachConsoleWatcher(page);

    // ============================================================
    // 1. Login
    // ============================================================
    await login(page);

    // ============================================================
    // 2. All top-level routes render + visible topbar
    // ============================================================
    const topbarSearch = page.getByPlaceholder('Tìm hồ sơ, biểu mẫu, bị can...');
    const topbarQuickCreate = page.getByRole('button', { name: /Tạo mới/ });

    const routes = [
      { path: '/', expected: ['Tổng quan nghiệp vụ'] },
      { path: '/cases', expected: ['Hồ sơ vụ án'] },
      { path: '/documents', expected: ['Biểu mẫu'] },
      { path: '/imports', expected: ['Import'] },
      { path: '/reports', expected: ['Báo cáo'] },
      { path: '/templates', expected: ['Biểu mẫu', 'Duyệt'] },
      { path: '/settings', expected: ['Cấu hình'] },
    ];

    for (const r of routes) {
      await page.goto(r.path);
      // Topbar luôn có
      await expect(topbarSearch).toBeVisible();
      await expect(topbarQuickCreate).toBeVisible();
      // Ít nhất 1 trong các expected text
      const found = await Promise.any(
        r.expected.map((t) => expect(page.getByText(t).first()).toBeVisible({ timeout: 10_000 })),
      ).then(() => true).catch(() => false);
      expect(found, `Route ${r.path} should render expected text`).toBe(true);
    }

    // ============================================================
    // 3. /cases — verify list có data + cột Mở + ?q= hoạt động
    // ============================================================
    await page.goto('/cases');
    await expect(page.getByText('VKS-2026-0001').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('VKS-2026-0005').first()).toBeVisible();
    const openBtn = page.getByRole('row', { name: /VKS-2026-0001/ }).getByRole('button', { name: 'Mở' });
    await expect(openBtn).toBeVisible();

    // ============================================================
    // 4. Topbar search
    // ============================================================
    await topbarSearch.fill('Trộm');
    await topbarSearch.press('Enter');
    await expect(page).toHaveURL(/\/cases\?q=/, { timeout: 5_000 });
    await expect(page.getByText('VKS-2026-0001').first()).toBeVisible();
    // URL phải chứa q=Tr
    expect(page.url()).toMatch(/q=Tr/);

    // Reset
    await page.goto('/cases');

    // ============================================================
    // 5. Topbar quick create dropdown
    // ============================================================
    await topbarQuickCreate.click();
    // Dropdown có 3 menuitem
    await expect(page.getByRole('menuitem', { name: /Tạo hồ sơ/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Import dữ liệu/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Chọn biểu mẫu/ })).toBeVisible();

    // Click Tạo hồ sơ vụ án → /cases
    await page.getByRole('menuitem', { name: /Tạo hồ sơ/ }).click();
    await expect(page).toHaveURL(/\/cases/, { timeout: 5_000 });

    // ============================================================
    // 6. Click Mở trên case 1 → /cases/1 detail
    // ============================================================
    await page.getByRole('row', { name: /VKS-2026-0001/ }).getByRole('button', { name: 'Mở' }).click();
    await expect(page).toHaveURL(/\/cases\/1$/, { timeout: 10_000 });
    await expect(page.getByText('Vụ án trộm cắp tài sản tại phường Bến Nghé')).toBeVisible();

    // ============================================================
    // 7. 6 tab đều render
    // ============================================================
    const tabLabels = ['Tổng quan', 'Người liên quan', 'Tội danh', 'Phân công', 'Tang vật', 'Biểu mẫu đã tạo'];
    for (const label of tabLabels) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
    }

    // ============================================================
    // 8. CRUD trên tab Người liên quan
    // ============================================================
    await page.getByRole('button', { name: 'Người liên quan', exact: true }).click();
    page.on('dialog', (d) => void d.accept());

    // Add
    const uniqueName = `E2E Full ${Date.now()}`;
    await page.getByRole('button', { name: /\+ Thêm người liên quan/ }).click();
    await page.getByLabel('Họ tên').fill(uniqueName);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText(uniqueName).first()).toBeVisible({ timeout: 10_000 });

    // Edit
    const addedRow = page.getByRole('row', { name: new RegExp(uniqueName) });
    await addedRow.getByRole('button', { name: 'Sửa' }).click();
    const editedNote = `Updated at ${Date.now()}`;
    await page.getByLabel('Ghi chú').fill(editedNote);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText(editedNote).first()).toBeVisible({ timeout: 10_000 });

    // Delete
    await page.getByRole('row', { name: new RegExp(uniqueName) }).getByRole('button', { name: 'Xoá' }).click();
    await expect(page.getByText(uniqueName)).not.toBeVisible({ timeout: 10_000 });

    // ============================================================
    // 9. CRUD trên tab Tội danh
    // ============================================================
    await page.getByRole('button', { name: 'Tội danh', exact: true }).click();
    const uniqueOffense = `E2E Offense ${Date.now()}`;
    await page.getByRole('button', { name: /\+ Thêm tội danh/ }).click();
    await page.getByLabel('Tên tội danh *').fill(uniqueOffense);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText(uniqueOffense).first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole('row', { name: new RegExp(uniqueOffense) }).getByRole('button', { name: 'Xoá' }).click();
    await expect(page.getByText(uniqueOffense)).not.toBeVisible({ timeout: 10_000 });

    // ============================================================
    // 10. CRUD trên tab Phân công
    // ============================================================
    await page.getByRole('button', { name: 'Phân công', exact: true }).click();
    const uniqueRole = `E2E_ROLE_${Date.now()}`;
    await page.getByRole('button', { name: /\+ Thêm phân công/ }).click();
    await page.getByLabel('Vai trò *').fill(uniqueRole);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText(uniqueRole).first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole('row', { name: new RegExp(uniqueRole) }).getByRole('button', { name: 'Xoá' }).click();
    await expect(page.getByText(uniqueRole)).not.toBeVisible({ timeout: 10_000 });

    // ============================================================
    // 11. CRUD trên tab Tang vật
    // ============================================================
    await page.getByRole('button', { name: 'Tang vật', exact: true }).click();
    const uniqueEvidence = `E2E Evidence ${Date.now()}`;
    await page.getByRole('button', { name: /\+ Thêm tang vật/ }).click();
    await page.getByLabel('Tên tang vật *').fill(uniqueEvidence);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText(uniqueEvidence).first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole('row', { name: new RegExp(uniqueEvidence) }).getByRole('button', { name: 'Xoá' }).click();
    await expect(page.getByText(uniqueEvidence)).not.toBeVisible({ timeout: 10_000 });

    // ============================================================
    // 12. Tab Biểu mẫu → link tới document
    // ============================================================
    await page.getByRole('button', { name: 'Biểu mẫu đã tạo', exact: true }).click();
    const openDocLink = page.getByRole('link', { name: 'Mở' }).first();
    await expect(openDocLink).toBeVisible();
    const docHref = await openDocLink.getAttribute('href');
    expect(docHref).toMatch(/^\/documents\/\d+$/);

    // ============================================================
    // 13. Cross-nav: click Mở → /documents/[id] render BM-001
    // ============================================================
    await openDocLink.click();
    await expect(page).toHaveURL(/\/documents\/\d+$/, { timeout: 10_000 });
    await expect(page.getByText(/BM-\d+/).first()).toBeVisible({ timeout: 10_000 });

    // ============================================================
    // 14. Quay về /cases bằng back nav
    // ============================================================
    await page.goBack();
    await expect(page).toHaveURL(/\/cases\/\d+$/, { timeout: 5_000 });
    await page.goBack();
    await expect(page).toHaveURL(/\/cases$/, { timeout: 5_000 });

    // ============================================================
    // 15. No 5xx, no console errors
    // ============================================================
    expect(apiErrors, `Unexpected 5xx:\n${apiErrors.join('\n')}`).toEqual([]);
    expect(pageErrors, `Page errors:\n${pageErrors.join('\n')}`).toEqual([]);
    // Console errors: chỉ fail nếu KHÔNG phải noise. Cho phép một số hydration warning.
    const realConsoleErrors = consoleErrors.filter(
      (e) => !e.includes('hydration') && !e.includes('Warning:') && !e.includes('DevTools'),
    );
    expect(realConsoleErrors, `Console errors:\n${realConsoleErrors.join('\n')}`).toEqual([]);
  });
});
