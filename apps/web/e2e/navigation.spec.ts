import { test, expect } from '@playwright/test'

const SECTIONS = [
  { label: 'Command' },
  { label: 'Media' },
  { label: 'Versions' },
  { label: 'Annotate' },
  { label: 'Pipeline' },
  { label: 'Jobs' },
  { label: 'Replay' },
  { label: 'Diff' },
] as const

test.describe('Navigation', () => {
  for (const section of SECTIONS) {
    test(`navigates to ${section.label} section without errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const navButton = page.getByRole('button', { name: section.label })
      await navButton.click()
      await page.waitForTimeout(400)

      expect(errors).toHaveLength(0)
    })
  }

  test('no console errors on initial load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })

  test('all 8 nav sections are present', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    for (const section of SECTIONS) {
      await expect(page.getByRole('button', { name: section.label })).toBeVisible()
    }
  })
})
