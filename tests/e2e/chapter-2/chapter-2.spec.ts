import { expect, test, type Page } from '@playwright/test';
import { ROADMAP_TEXT } from '@/copy';
import { FULL_STARS } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';
import { FIRST_OF_CHAPTER_4, FIRST_OF_CHAPTER_4_TITLE, startWithProgress } from '@e2e/saved-progress';
import { CHAPTER_2 } from './chapter-2-play';

const LAST_OF_CHAPTER_1 = '01-14';
const NEXT_INCIDENT = 'Siguiente incidente';
const ROADMAP = '/#/';

async function openTheNextIncident(page: Page) {
  await page.getByRole('link', { name: NEXT_INCIDENT }).click();
}

test('chapter 2 is played from 02-01 to 02-14, each incident opening the next, with 3 stars each', async ({ page }) => {
  test.slow();
  const errors = collectErrors(page);
  await startWithProgress(page, { [LAST_OF_CHAPTER_1]: 1 });
  await page.goto('/');
  await page.getByRole('link', { name: `1. ${CHAPTER_2[0].title}` }).click();
  for (const [index, { id, title, play }] of CHAPTER_2.entries()) {
    await expect(page.getByRole('heading', { level: 1, name: title }), id).toBeVisible();
    await play(page);
    if (index < CHAPTER_2.length - 1) await openTheNextIncident(page);
  }
  await test.step('04-01 opens after 02-14 has a star', async () => {
    await openTheNextIncident(page);
    await expect(page.getByRole('heading', { level: 1, name: FIRST_OF_CHAPTER_4_TITLE })).toBeVisible();
    await page.goto(ROADMAP);
    const first = page.locator(`li[data-level-id="${FIRST_OF_CHAPTER_4}"]`);
    await expect(first.getByRole('link', { name: FIRST_OF_CHAPTER_4_TITLE }), '04-01 is on the roadmap with a link').toBeVisible();
    await expect(first).not.toContainText(ROADMAP_TEXT.locked);
  });
  for (const { id } of CHAPTER_2) await expect(page.locator(`li[data-level-id="${id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});
