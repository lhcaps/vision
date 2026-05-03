# Playwright Testing — Detailed Reference

## Common Test Patterns

### Form Testing

```typescript
test('login form', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

### Navigation Testing

```typescript
test('nav links work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL('/about');
});
```

### API Mocking

```typescript
test('shows mock data', async ({ page }) => {
  await page.route('**/api/users', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'John' }]),
  }));
  await page.goto('/users');
  await expect(page.getByText('John')).toBeVisible();
});
```

### File Download

```typescript
test('downloads file', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download Report' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('report.pdf');
});
```

### Drag and Drop

```typescript
test('drag and drop', async ({ page }) => {
  await page.goto('/kanban');
  const source = page.getByTestId('card-todo');
  const target = page.getByTestId('column-done');
  await source.dragTo(target);
  await expect(source).toBeVisible({ visible: false }); // moved
});
```

### Hover & Tooltip

```typescript
test('tooltip on hover', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Help' });
  await button.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Get help here');
});
```

## Advanced: Custom Fixtures

```typescript
// playwright.config.ts
import { defineConfig, type Page } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
  },
});

// tests/helpers.ts
import { test as base } from '@playwright/test';

export const test = base.extend<{ loginAs: (role: string) => Promise<void> }>({
  loginAs: async ({ page }, use) => {
    await use(async (role: string) => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(`${role}@test.com`);
      await page.getByLabel('Password').fill('password');
      await page.getByRole('button').click();
    });
  },
});
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Test flaky | Use `page.waitForLoadState('networkidle')` after clicks |
| Element not found | Use `page.waitForSelector()` instead of immediate query |
| Screenshot mismatch | Update with `npx playwright test --update-snapshots` |
| Slow CI | Use `fullyParallel: true` and `retries: 1` |
| Memory issues | Use `workers: 4` instead of `workers: undefined` |

## Best Practices Summary

1. Use `page.goto(baseURL + path)` with `baseURL` in config
2. Use locators: `getByRole`, `getByText`, `getByLabel`, `getByTestId`
3. Use `expect().toBeVisible()` not `toBe(true)`
4. Mock API calls for deterministic tests
5. Clean up test data in `test.afterEach()`
6. Use meaningful test names: `test('should show error on invalid email')`
7. Don't screenshot unless necessary — text assertions are faster
8. Use `page.context().newPage()` for multi-page flows
