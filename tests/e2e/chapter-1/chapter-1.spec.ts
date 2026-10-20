import { expect, test } from '@playwright/test';
import { CHAPTER_1 } from './chapter-1-play';
import { FULL_STARS } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';
import { CHAPTER_2 } from '@e2e/chapter-2/chapter-2-play';

const LOCKED = '(bloqueado)';

test('chapter 1 is played from 01-01 to 01-14, each incident opening the next, with 3 stars each', async ({ page }) => {
  test.slow();
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: '1. La oficina' }).click();
  for (const [index, { id, title, play }] of CHAPTER_1.entries()) {
    await expect(page.getByRole('heading', { level: 1, name: title }), id).toBeVisible();
    await play(page);
    const last = index === CHAPTER_1.length - 1;
    await page.getByRole('link', { name: last ? 'Volver al roadmap' : 'Siguiente incidente' }).click();
  }
  for (const { id } of CHAPTER_1) await expect(page.locator(`li[data-level-id="${id}"]`)).toContainText(FULL_STARS);
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(LOCKED);
  await expect(page.getByRole('link', { name: `1. ${CHAPTER_2[0].title}` })).toHaveAttribute('href', `#/level/${CHAPTER_2[0].id}`);
  expect(errors).toEqual([]);
});
