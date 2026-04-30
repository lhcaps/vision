import { test, expect } from '@playwright/test'

test.describe('Annotation Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Annotate' }).click()
    await page.waitForTimeout(500)
  })

  test('annotation section renders without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForTimeout(500)
    expect(errors).toHaveLength(0)
  })

  test('has a canvas or image area', async ({ page }) => {
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
  })
})
