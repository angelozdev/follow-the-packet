import { expect, test, type Page } from '@playwright/test';
import { ROADMAP_TEXT } from '@/copy';
import { PROGRESS_KEY } from '@/storage/progress';
import { CHAPTER_3_DONE, FIRST_OF_CHAPTER_4, FIRST_OF_CHAPTER_4_TITLE, LAST_OF_CHAPTER_3, startWithProgress } from './saved-progress';

const SAVED = { '01-01': 3, '01-02': 1, '01-14': 2, '04-01': 3 };
const OPEN_BY_THE_STAR_BEFORE = ['01-02', '01-03', '02-01', '04-02'];
const OPEN_BY_ITS_OWN_STARS = ['01-14', '04-01'];
const STILL_LOCKED = ['01-04', '01-13', '02-02'];
const ONE_STAR = 1;

function incident(page: Page, id: string) {
  return page.locator(`li[data-level-id="${id}"]`);
}

async function expectWhatTheStarsOpen(page: Page) {
  for (const id of [...OPEN_BY_THE_STAR_BEFORE, ...OPEN_BY_ITS_OWN_STARS]) await expect(incident(page, id), id).not.toContainText(ROADMAP_TEXT.locked);
  for (const id of STILL_LOCKED) await expect(incident(page, id), id).toContainText(ROADMAP_TEXT.locked);
  for (const [id, stars] of Object.entries(SAVED)) await expect(incident(page, id), id).toContainText(ROADMAP_TEXT.starsOf(stars));
}

test('the stars saved in the browser come back after a reload and open what they should', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(([key, saved]) => localStorage.setItem(key, saved), [PROGRESS_KEY, JSON.stringify(SAVED)] as const);

  await page.reload();
  await expectWhatTheStarsOpen(page);

  await page.reload();
  await expectWhatTheStarsOpen(page);
});

test('04-01 opens once the last incident of chapter 3 has a star', async ({ page }) => {
  const beforeTheLast = Object.fromEntries(Object.entries(CHAPTER_3_DONE).filter(([id]) => id !== LAST_OF_CHAPTER_3));
  await startWithProgress(page, beforeTheLast);
  await page.goto('/');
  await expect(incident(page, LAST_OF_CHAPTER_3), `open: the incident before ${LAST_OF_CHAPTER_3} has its stars`).not.toContainText(ROADMAP_TEXT.locked);
  await expect(incident(page, FIRST_OF_CHAPTER_4), `locked: ${LAST_OF_CHAPTER_3} has none`).toContainText(ROADMAP_TEXT.locked);

  await page.evaluate(([key, saved]) => localStorage.setItem(key, saved), [PROGRESS_KEY, JSON.stringify({ ...beforeTheLast, [LAST_OF_CHAPTER_3]: ONE_STAR })] as const);
  await page.reload();
  await expect(incident(page, FIRST_OF_CHAPTER_4), `open: ${LAST_OF_CHAPTER_3} has a star`).not.toContainText(ROADMAP_TEXT.locked);
  await incident(page, FIRST_OF_CHAPTER_4).getByRole('link', { name: FIRST_OF_CHAPTER_4_TITLE }).click();
  await expect(page.getByRole('heading', { level: 1, name: FIRST_OF_CHAPTER_4_TITLE })).toBeVisible();
});
