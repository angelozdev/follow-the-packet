import { expect, test } from '@playwright/test';
import { FULL_STARS } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';
import { startWithProgress } from '@e2e/saved-progress';
import { CHAPTER_2 } from './chapter-2-play';

const LAST_OF_CHAPTER_1 = '01-14';
const NEXT_INCIDENT = 'Siguiente incidente';
const ROADMAP = '/#/';

test('chapter 2 is played from 02-01 to 02-09, each incident opening the next, with 3 stars each', async ({ page }) => {
  test.slow();
  const errors = collectErrors(page);
  await startWithProgress(page, { [LAST_OF_CHAPTER_1]: 1 });
  await page.goto('/');
  await page.getByRole('link', { name: `1. ${CHAPTER_2[0].title}` }).click();
  for (const [index, { id, title, play }] of CHAPTER_2.entries()) {
    await expect(page.getByRole('heading', { level: 1, name: title }), id).toBeVisible();
    await play(page);
    if (index < CHAPTER_2.length - 1) await page.getByRole('link', { name: NEXT_INCIDENT }).click();
  }
  await page.goto(ROADMAP);
  for (const { id } of CHAPTER_2) await expect(page.locator(`li[data-level-id="${id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});
