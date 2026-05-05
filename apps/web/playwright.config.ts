import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    // VITE_WEB_BASE_URL is set in .env (e.g. http://localhost:5173).
    // If unset, fall back to static default — do NOT let this become undefined.
    baseURL: (() => {
      const url = process.env.VITE_WEB_BASE_URL;
      return url && url !== 'undefined' ? url : 'http://localhost:5173';
    })(),
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // webServer entries: in CI, these are the authoritative ports (5173/3000).
  // Locally, reuseExistingServer means we may connect to an already-running
  // dev server which may be on 5174 if 5173 was taken. The baseURL fallback
  // above handles the mismatch — if the running server is on 5174, tests will
  // still use 5173 as baseURL but the server is elsewhere. The best local
  // experience is: start dev stack first, then run playwright pointing at it.
  // If the local server is on 5174, set VITE_WEB_BASE_URL=http://localhost:5174
  // in .env to align.
  webServer: [
    {
      command: 'pnpm --filter @visionflow/api dev',
      url: 'http://localhost:3000/api/health/live',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    },
    {
      command: 'pnpm dev:web',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
