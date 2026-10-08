import { expect, test, type Page } from '@playwright/test';

const CHAPTER_COUNT = 20;
const FONT_LOAD_ERROR = /Failed to load resource/;

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !FONT_LOAD_ERROR.test(message.text())) errors.push(message.text());
  });
  return errors;
}

test('the roadmap loads every chapter without console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  await expect(page.locator('li.chapter--soon')).toHaveCount(CHAPTER_COUNT);
  expect(errors).toEqual([]);
});

test('an old level link leads back to the roadmap', async ({ page }) => {
  await page.goto('/#/level/04-01');
  await expect(page.getByRole('heading', { name: 'Nivel no encontrado' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver al roadmap' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
});
