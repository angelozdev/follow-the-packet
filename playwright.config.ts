import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { e2ePortOf } from './scripts/e2e-port';

const PORT = e2ePortOf(fileURLToPath(new URL('.', import.meta.url)));
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: ORIGIN,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: ORIGIN,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
