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
    // Responsive: máy nhỏ, máy lớn, máy tính bảng và cửa sổ máy tính (tests/responsive.spec.ts).
    ...(
      [
        ['phone-320', 320, 568],
        ['phone-430', 430, 932],
        ['tablet-768', 768, 1024],
        ['desktop-1366', 1366, 768],
        ['desktop-1920', 1920, 1080],
      ] as const
    ).map(([name, width, height]) => ({
      name,
      testMatch: /responsive\.spec\.ts/,
      use: { browserName: 'chromium' as const, viewport: { width, height }, hasTouch: width < 600 },
    })),
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
  },
});
