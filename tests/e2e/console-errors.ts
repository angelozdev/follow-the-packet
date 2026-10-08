import type { Page } from '@playwright/test';

const FONT_LOAD_ERROR = /Failed to load resource/;

/** Collects page errors and console errors, leaving out font downloads that fail without network. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !FONT_LOAD_ERROR.test(message.text())) errors.push(message.text());
  });
  return errors;
}
