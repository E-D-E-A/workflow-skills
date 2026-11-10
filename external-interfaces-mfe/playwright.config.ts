import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    browserName: 'chromium',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    { command: 'npm run preview', url: 'http://127.0.0.1:4173/remoteEntry.var.js', reuseExistingServer: !process.env.CI },
    { command: 'npm run build:harness && npm run preview:harness', url: 'http://127.0.0.1:4174', reuseExistingServer: !process.env.CI },
  ],
});
