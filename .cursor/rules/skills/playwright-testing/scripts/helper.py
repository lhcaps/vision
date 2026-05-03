#!/usr/bin/env python3
"""
Playwright Testing — Helper utilities for common testing tasks.
"""
import sys
import json

def show_commands():
    print("""
╔══════════════════════════════════════════════════════════════╗
║  PLAYWRIGHT — Common Commands                               ║
╚══════════════════════════════════════════════════════════════╝

  # Install
  npm init playwright@latest
  npm install -D @playwright/test
  npx playwright install --with-deps

  # Run
  npx playwright test                  # all, headless, parallel
  npx playwright test --headed         # see browser
  npx playwright test --ui             # UI mode with watch
  npx playwright test --project=chromium  # single browser
  npx playwright test tests/spec.ts    # single file
  npx playwright test --debug          # debug mode

  # Generate
  npx playwright codegen https://example.com

  # Report
  npx playwright show-report
""")

def show_locators():
    print("""
╔══════════════════════════════════════════════════════════════╗
║  PLAYWRIGHT — Locator Guide (Preferred over CSS selectors)  ║
╚══════════════════════════════════════════════════════════════╝

  # By Role (most accessible)
  page.getByRole('button', { name: 'Submit' })
  page.getByRole('link', { name: 'About' })
  page.getByRole('heading', { level: 1 })

  # By Label (forms)
  page.getByLabel('Email').fill('user@example.com')
  page.getByLabel('Password', { exact: true }).fill('secret')

  # By Placeholder
  page.getByPlaceholder('Search...').fill('query')

  # By Text
  page.getByText('Sign in').click()
  page.getByText('Welcome, John', { exact: true })

  # By Test ID (most stable)
  page.getByTestId('submit-button').click()

  # By Title
  page.getByTitle('Submit form')

  # Chaining
  page.getByRole('listitem').filter({ hasText: 'Item 3' })
""")

def show_config():
    print("""
╔══════════════════════════════════════════════════════════════╗
║  PLAYWRIGHT — playwright.config.ts template                 ║
╚══════════════════════════════════════════════════════════════╝

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
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
""")

def main():
    if len(sys.argv) < 2:
        show_commands()
        sys.exit(0)

    cmd = sys.argv[1]
    if cmd == "commands" or cmd == "help":
        show_commands()
    elif cmd == "locators":
        show_locators()
    elif cmd == "config":
        show_config()
    else:
        show_commands()

if __name__ == "__main__":
    main()
