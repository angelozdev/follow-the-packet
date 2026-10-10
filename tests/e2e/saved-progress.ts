import type { Page } from '@playwright/test';
import { MAX_STARS, PROGRESS_KEY } from '@/storage/progress';

const CHAPTER_1_INCIDENTS = 14;

export const CHAPTER_1_DONE: Record<string, number> = Object.fromEntries(
  Array.from({ length: CHAPTER_1_INCIDENTS }, (_, index) => [`01-${String(index + 1).padStart(2, '0')}`, MAX_STARS]),
);

/** Opens every page of the test with this saved progress, unless the game already saved its own, so a reload keeps what the test earned. */
export async function startWithProgress(page: Page, progress: Record<string, number>): Promise<void> {
  await page.addInitScript(
    ([key, saved]) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, saved);
    },
    [PROGRESS_KEY, JSON.stringify(progress)] as const,
  );
}
