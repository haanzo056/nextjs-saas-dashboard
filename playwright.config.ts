import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 3000);

// Specs assume the seed data (npm run db:reset) since they sign in as the demo user.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
