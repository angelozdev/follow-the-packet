import type { Page } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_STARS, PROGRESS_KEY } from '@/storage/progress';

const INCIDENTS_PER_CHAPTER = 14;
const CHAPTER_3_FOLDER = fileURLToPath(new URL('../../src/levels/03-the-web-inside', import.meta.url));
const INCIDENT_FILE = /^(\d{2})-.+(?<!\.test)\.ts$/;

export const FIRST_OF_CHAPTER_4 = '04-01';
export const FIRST_OF_CHAPTER_4_TITLE = 'El primer ping';

/** Returns the saved progress that gives three stars to the fourteen incidents of a chapter, from `NN-01` to `NN-14`. */
function chapterDone(chapter: number): Record<string, number> {
  const prefix = String(chapter).padStart(2, '0');
  return Object.fromEntries(Array.from({ length: INCIDENTS_PER_CHAPTER }, (_, index) => [`${prefix}-${String(index + 1).padStart(2, '0')}`, MAX_STARS]));
}

const CHAPTER_1_DONE: Record<string, number> = chapterDone(1);

/** Chapter 1 and chapter 2 done, `01-01` to `02-14` with three stars: the progress that opens 04-01 once chapter 2 is registered, and still every incident of chapter 1. */
export const CHAPTER_2_DONE: Record<string, number> = { ...CHAPTER_1_DONE, ...chapterDone(2) };

/** Returns the ids `03-NN` of the incidents of chapter 3, read from the files `NN-<slug>.ts` of its folder as the registry reads them, so that no block has to add its own id by hand. */
function incidentIdsOfChapter3(): string[] {
  const orders = readdirSync(CHAPTER_3_FOLDER, { recursive: true, encoding: 'utf8' }).flatMap((path) => INCIDENT_FILE.exec(basename(path))?.[1] ?? []);
  return orders.sort().map((order) => `03-${order}`);
}

/** Chapter 2 and chapter 3 done, every incident of chapter 1 and 2 and every incident registered in the folder of chapter 3 with three stars: the progress that opens 04-01 once chapter 3 is registered. */
export const CHAPTER_3_DONE: Record<string, number> = { ...CHAPTER_2_DONE, ...Object.fromEntries(incidentIdsOfChapter3().map((id) => [id, MAX_STARS])) };

/** Opens every page of the test with this saved progress, unless the game already saved its own, so a reload keeps what the test earned. */
export async function startWithProgress(page: Page, progress: Record<string, number>): Promise<void> {
  await page.addInitScript(
    ([key, saved]) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, saved);
    },
    [PROGRESS_KEY, JSON.stringify(progress)] as const,
  );
}
