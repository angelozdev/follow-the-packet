import { expect, test } from '@playwright/test';
import { collectErrors } from './console-errors';

const SOON = 'Próximamente';
const SOON_CHAPTER_COUNT = 29;
const TIER_HEADINGS = ['Nivel 0 · Bases', 'Nivel 1 · Fundamentos', 'Nivel 2 · Asociado', 'Nivel 3 · Profesional', 'Nivel 4 · Especialista'];

test('the roadmap loads every chapter, grouped by level, without console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  await expect(page.getByText(SOON, { exact: true })).toHaveCount(SOON_CHAPTER_COUNT);
  for (const name of TIER_HEADINGS) await expect(page.getByRole('region', { name })).toBeVisible();
  expect(errors).toEqual([]);
});
