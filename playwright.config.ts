import { defineConfig, devices } from '@playwright/test';

/**
 * The browser tests run against the production build (npm run build), served the way GitHub
 * Pages serves it (e2e/server.mjs). CI runs them in Chromium; locally, WebKit can be added
 * with --project=webkit, though an automated WebKit window never gets sound (its
 * AudioContext stays "interrupted", as for a background app).
 */
export default defineConfig({
  testDir: 'e2e',
  // A production can take 20 s to reach its first picture on a slow runner
  timeout: 90_000,
  fullyParallel: true,
  // Each test runs a whole emulator: more at once starve each other's frames and sound
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    // The service worker would answer from its cache what the test means to fetch
    serviceWorkers: 'block',
    // Off: a recording trace gives the page user activation from the start, as
    // page.evaluate() does, so a link would start a production without its Play screen
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'node e2e/server.mjs dist 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
