import { expect, test } from '@playwright/test';
import { collectErrors } from './console-errors';

const SOON = 'Próximamente';
const SOON_CHAPTER_COUNT = 30;
const TIER_HEADINGS = ['Nivel 0 · Bases', 'Nivel 1 · Fundamentos', 'Nivel 2 · Asociado', 'Nivel 3 · Profesional', 'Nivel 4 · Especialista'];
const PHONE = { width: 390, height: 844 };

test('the roadmap loads every chapter, grouped by level, without console errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  await expect(page.getByText(SOON, { exact: true })).toHaveCount(SOON_CHAPTER_COUNT);
  for (const name of TIER_HEADINGS) await expect(page.getByRole('region', { name })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the roadmap fits a phone screen, without a horizontal scroll', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
});

