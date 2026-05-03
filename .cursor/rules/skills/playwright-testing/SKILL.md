---
name: playwright-testing
description: End-to-end testing framework for modern web apps supporting Chromium, Firefox, and WebKit on Windows, Linux, and macOS. Activates when user mentions testing, e2e, browser automation, UI testing, test automation, playwright, or running tests. Supports headless/headed mode, mobile emulation, codegen, and trace viewer. GitHub: github.com/microsoft/playwright (87K stars).
---

# Playwright — Web Testing & Automation

End-to-end testing framework for modern web apps. Supports Chromium, Firefox, and WebKit on Windows, Linux, and macOS — locally or in CI, headless or headed, with native mobile emulation.

## Installation

### In a new project

```bash
npm init playwright@latest
```

Answer prompts: TypeScript (default), tests folder name, GitHub Actions workflow (recommended), install browsers (yes).

### In existing project

```bash
npm install -D @playwright/test
npx playwright install --with-deps
```

### Update

```bash
npm install -D @playwright/test@latest
npx playwright install --with-deps
```

## Core Commands

### Run tests

```bash
npx playwright test                  # headless, parallel across all browsers
npx playwright test --headed         # see browser window
npx playwright test --project=chromium  # single browser
npx playwright test tests/example.spec.ts  # single file
npx playwright test --ui             # UI Mode with watch, live steps, time travel
```

### Generate tests (Codegen)

```bash
npx playwright codegen https://example.com
```

### Inspect & Debug

```bash
npx playwright show-report    # HTML report after test run
npx playwright test --debug   # debug mode
```

## Test File Structure

```typescript
import { test, expect } from '@playwright/test';

test('example', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});
```

## Key Features

### Locators (preferred over selectors)

```typescript
// Role-based (accessible)
await page.getByRole('button', { name: 'Submit' }).click();

// Text-based
await page.getByText('Sign in').click();

// Label-based (forms)
await page.getByLabel('Email').fill('user@example.com');

// Test ID (most stable)
await page.getByTestId('submit-btn').click();
```

### Web-First Assertions

```typescript
await expect(page).toHaveTitle(/Dashboard/);
await expect(page.getByRole('alert')).toBeVisible();
await expect(page.getByTestId('count')).toHaveValue('5');
```

### Mobile Emulation

```typescript
const context = await browser.newContext({
  ...devices['iPhone 13'],
});
```

### Network Interception

```typescript
await page.route('**/api/**', route => route.fulfill({
  status: 200,
  body: JSON.stringify({ mock: true }),
}));
```

## Configuration (playwright.config.ts)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

## When to Use This Skill

Activate when user mentions:
- Testing or test automation
- E2E / end-to-end testing
- Browser automation
- UI testing
- Running `playwright test`
- Installing playwright
- Codegen / test generation
- Trace viewer / debugging tests
- Headless / headed browser testing

## Best Practices

1. **Use locators over CSS/XPath selectors** — role, text, label, test-id are more stable
2. **Use `page.goto()` with `waitUntil: 'load'`** for reliable navigation
3. **Isolate tests** — each test should be independent
4. **Use `test.beforeEach()`** for setup that repeats across tests
5. **Use `page.context().newPage()`** for multi-page scenarios
6. **Always call `await`** — Playwright is fully async
7. **Use `expect().toBeVisible()`** instead of `expect().toBe(true)` for assertions

## Resources

- Docs: https://playwright.dev/docs/intro
- GitHub: https://github.com/microsoft/playwright
- VS Code Extension: Install "Playwright Test for VSCode" from marketplace
