import { defineConfig } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
process.env.TEST_ADMIN_PASSWORD ||= randomBytes(24).toString('base64url');
const browserPath =
  '/Users/bekaans/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell';
export default defineConfig({
  testDir: './tests',
  testMatch: 'browser.spec.ts',
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: 'https://127.0.0.1:5190',
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: existsSync(browserPath) ? { executablePath: browserPath } : undefined,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx tsx tests/fixture-server.ts',
    url: 'https://127.0.0.1:5190',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  reporter: [['list'], ['json', { outputFile: 'artifacts/browser-results.json' }]],
});
