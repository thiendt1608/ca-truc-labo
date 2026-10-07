import { defineConfig, devices } from '@playwright/test';

/** Test giao diện trên khung điện thoại (07-TDD mục 6). */
export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    {
      name: 'phone-360',
      use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 640 }, browserName: 'chromium' },
    },
    {
      name: 'phone-390',
      use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
  },
});
