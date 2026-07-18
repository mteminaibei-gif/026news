import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for the 026news end-to-end suite.
 *
 * In CI the app is served locally by the GitHub workflow (npm start on
 * :3000) and Endform runs this suite remotely against BASE_URL. Locally you
 * can run `npm start` in one terminal and `npx playwright test` in another.
 */
const baseURL = process.env.BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // The workflow already starts the server, so reuse it if present.
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
