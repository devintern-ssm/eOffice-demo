import { defineConfig, devices } from '@playwright/test';

// E2E config for the eOffice demo. Assumes the Vite app is already running on :3000
// and the API on :4000 (see e2e/README.md). Kept minimal and CI-agnostic.
export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // workflow spec mutates shared server state; keep serial
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
