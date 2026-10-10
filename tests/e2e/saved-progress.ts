import type { Page } from '@playwright/test';
import { PROGRESS_KEY } from '@/storage/progress';

export const CHAPTER_1_DONE: Record<string, number> = { '01-01': 3, '01-02': 3, '01-03': 3, '01-04': 3 };

/** Opens every page of the test with this saved progress, unless the game already saved its own, so a reload keeps what the test earned. */
export async function startWithProgress(page: Page, progress: Record<string, number>): Promise<void> {
  await page.addInitScript(
    ([key, saved]) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, saved);
    },
    [PROGRESS_KEY, JSON.stringify(progress)] as const,
  );
}
