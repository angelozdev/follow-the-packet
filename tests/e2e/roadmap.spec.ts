import { expect, test } from '@playwright/test';
import { collectErrors } from './console-errors';

const SOON = 'Próximamente';
const SOON_CHAPTER_COUNT = 31;

test('the roadmap loads every chapter without console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  await expect(page.getByText(SOON, { exact: true })).toHaveCount(SOON_CHAPTER_COUNT);
  expect(errors).toEqual([]);
});

test('an unknown incident leads back to the roadmap', async ({ page }) => {
  await page.goto('/#/level/09-99');
  await expect(page.getByRole('heading', { name: 'Incidente no encontrado' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver al roadmap' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
});
