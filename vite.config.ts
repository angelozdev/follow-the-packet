import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

const BROWSER_TESTS = 'src/**/*.browser.test.{ts,tsx}';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
          exclude: [...configDefaults.exclude, BROWSER_TESTS],
          setupFiles: ['./src/testing/setup.ts'],
          environment: 'node',
          env: { VITE_MAP_RENDERER: '3d' },
          css: { include: [/\/design\/tokens\.css/] },
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: [BROWSER_TESTS],
          setupFiles: ['./src/testing/browser-setup.ts'],
          browser: { enabled: true, provider: playwright(), instances: [{ browser: 'chromium' }], headless: true },
        },
      },
    ],
  },
});
