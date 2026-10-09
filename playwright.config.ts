import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  snapshotPathTemplate: '{testDir}/snapshots/{arg}-{platform}{ext}',
  timeout: 60_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4183',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4183 --strictPort',
    url: 'http://localhost:4183',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
