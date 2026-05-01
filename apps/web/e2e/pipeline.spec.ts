import { test, expect } from '@playwright/test';

test.describe('Pipeline Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Pipeline' }).click();
    await page.waitForTimeout(500);
  });

  test('pipeline section renders without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('pipeline nodes are visible in the canvas', async ({ page }) => {
    await expect(page.locator('.react-flow__node')).toHaveCount({ minimum: 1 });
  });
});
