import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4183',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    // WebGL por software para que el canvas funcione en modo headless.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4183 --strictPort',
    url: 'http://localhost:4183',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
