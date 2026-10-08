import { expect, test } from '@playwright/test';
import { collectErrors } from './console-errors';

const SOON_CHAPTER_COUNT = 19;

test('the roadmap loads every chapter without console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  await expect(page.locator('li.chapter--soon')).toHaveCount(SOON_CHAPTER_COUNT);
  expect(errors).toEqual([]);
});

test('an unknown incident leads back to the roadmap', async ({ page }) => {
  await page.goto('/#/level/09-99');
  await expect(page.getByRole('heading', { name: 'Incidente no encontrado' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver al roadmap' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
});
