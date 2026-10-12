import type { Page } from '@playwright/test';
import { MAX_STARS, PROGRESS_KEY } from '@/storage/progress';

const INCIDENTS_PER_CHAPTER = 14;

/** Returns the saved progress that gives three stars to the fourteen incidents of a chapter, from `NN-01` to `NN-14`. */
function chapterDone(chapter: number): Record<string, number> {
  const prefix = String(chapter).padStart(2, '0');
  return Object.fromEntries(Array.from({ length: INCIDENTS_PER_CHAPTER }, (_, index) => [`${prefix}-${String(index + 1).padStart(2, '0')}`, MAX_STARS]));
}

export const CHAPTER_1_DONE: Record<string, number> = chapterDone(1);

/** Chapter 1 and chapter 2 done, `01-01` to `02-14` with three stars: the progress that opens 04-01 once chapter 2 is registered, and still every incident of chapter 1. */
export const CHAPTER_2_DONE: Record<string, number> = { ...CHAPTER_1_DONE, ...chapterDone(2) };

/** Saves this progress in the page that is open and reloads it, which replaces what the game saved before. */
export async function reloadWithProgress(page: Page, progress: Record<string, number>): Promise<void> {
  await page.evaluate(([key, saved]) => localStorage.setItem(key, saved), [PROGRESS_KEY, JSON.stringify(progress)]);
  await page.reload();
}

/** Opens every page of the test with this saved progress, unless the game already saved its own, so a reload keeps what the test earned. */
export async function startWithProgress(page: Page, progress: Record<string, number>): Promise<void> {
  await page.addInitScript(
    ([key, saved]) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, saved);
    },
    [PROGRESS_KEY, JSON.stringify(progress)] as const,
  );
}
