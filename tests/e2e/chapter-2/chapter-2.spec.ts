import { expect, test } from '@playwright/test';
import { FULL_STARS } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';
import { startWithProgress } from '@e2e/saved-progress';
import { CHAPTER_2 } from './chapter-2-play';

const [ONE_MACHINE] = CHAPTER_2;
const FIRST_LINK = `1. ${ONE_MACHINE.title}`;
const OPENING = CHAPTER_2[1];
const SECOND_LINK = `2. ${OPENING.title}`;
const REFUSED_OR_SILENT = CHAPTER_2[2];
const THIRD_LINK = `3. ${REFUSED_OR_SILENT.title}`;
const IN_MY_BLOCK = CHAPTER_2[3];
const FOURTH_LINK = `4. ${IN_MY_BLOCK.title}`;
const WHOLE_RULE = CHAPTER_2[4];
const FIFTH_LINK = `5. ${WHOLE_RULE.title}`;
const YOUR_TABLE = CHAPTER_2[5];
const SIXTH_LINK = `6. ${YOUR_TABLE.title}`;
const OTHER_OFFICE_WAY = CHAPTER_2[6];
const SEVENTH_LINK = `7. ${OTHER_OFFICE_WAY.title}`;
const ONE_ADDRESS = CHAPTER_2[7];
const EIGHTH_LINK = `8. ${ONE_ADDRESS.title}`;
const FROM_OUTSIDE = CHAPTER_2[8];
const NINTH_LINK = `9. ${FROM_OUTSIDE.title}`;
const PROGRESS_BEFORE_03 = { '01-14': 1, [ONE_MACHINE.id]: 1, [OPENING.id]: 1 };
const PROGRESS_BEFORE_04 = { ...PROGRESS_BEFORE_03, [REFUSED_OR_SILENT.id]: 1 };
const PROGRESS_BEFORE_05 = { ...PROGRESS_BEFORE_04, [IN_MY_BLOCK.id]: 1 };
const PROGRESS_BEFORE_06 = { ...PROGRESS_BEFORE_05, [WHOLE_RULE.id]: 1 };
const PROGRESS_BEFORE_07 = { ...PROGRESS_BEFORE_06, [YOUR_TABLE.id]: 1 };
const PROGRESS_BEFORE_08 = { ...PROGRESS_BEFORE_07, [OTHER_OFFICE_WAY.id]: 1 };
const PROGRESS_BEFORE_09 = { ...PROGRESS_BEFORE_08, [ONE_ADDRESS.id]: 1 };

test('02-01 is played with the mouse from the roadmap and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, { '01-14': 1 });
  await page.goto('/');
  await page.getByRole('link', { name: FIRST_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: ONE_MACHINE.title })).toBeVisible();
  await ONE_MACHINE.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${ONE_MACHINE.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-02 is played with the mouse after 02-01 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, { '01-14': 1, [ONE_MACHINE.id]: 1 });
  await page.goto('/');
  await page.getByRole('link', { name: SECOND_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: OPENING.title })).toBeVisible();
  await OPENING.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${OPENING.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-03 is played with the mouse after 02-02 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_03);
  await page.goto('/');
  await page.getByRole('link', { name: THIRD_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: REFUSED_OR_SILENT.title })).toBeVisible();
  await REFUSED_OR_SILENT.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${REFUSED_OR_SILENT.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-04 is played with the mouse after 02-03 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_04);
  await page.goto('/');
  await page.getByRole('link', { name: FOURTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: IN_MY_BLOCK.title })).toBeVisible();
  await IN_MY_BLOCK.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${IN_MY_BLOCK.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-05 is played with the mouse after 02-04 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_05);
  await page.goto('/');
  await page.getByRole('link', { name: FIFTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: WHOLE_RULE.title })).toBeVisible();
  await WHOLE_RULE.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${WHOLE_RULE.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-06 is played with the mouse after 02-05 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_06);
  await page.goto('/');
  await page.getByRole('link', { name: SIXTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: YOUR_TABLE.title })).toBeVisible();
  await YOUR_TABLE.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${YOUR_TABLE.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-07 is played with the mouse after 02-06 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_07);
  await page.goto('/');
  await page.getByRole('link', { name: SEVENTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: OTHER_OFFICE_WAY.title })).toBeVisible();
  await OTHER_OFFICE_WAY.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${OTHER_OFFICE_WAY.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-08 is played with the mouse after 02-07 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_08);
  await page.goto('/');
  await page.getByRole('link', { name: EIGHTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: ONE_ADDRESS.title })).toBeVisible();
  await ONE_ADDRESS.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${ONE_ADDRESS.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-09 is played with the mouse after 02-08 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_09);
  await page.goto('/');
  await page.getByRole('link', { name: NINTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: FROM_OUTSIDE.title })).toBeVisible();
  await FROM_OUTSIDE.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${FROM_OUTSIDE.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});
