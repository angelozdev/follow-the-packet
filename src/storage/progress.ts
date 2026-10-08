import type { LevelEntry } from '@/levels';

export const PROGRESS_KEY = 'follow-the-packet:progress:v1';
export const MAX_STARS = 3;

export type Progress = Record<string, number>;

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function isStarCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_STARS;
}

function persist(storage: WritableStorage | undefined, progress: Progress): boolean {
  try {
    storage?.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

/** Reads the saved progress, keeping every valid entry and dropping the rest; returns {} when nothing usable is saved. */
export function loadProgress(storage: ReadableStorage | undefined = browserStorage()): Progress {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(PROGRESS_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, stars]) => isStarCount(stars)));
  } catch {
    return {};
  }
}

/** Merges a result into the in-memory progress, keeping the best stars per level; saves it when storage allows and returns the merged progress. */
export function saveStars(current: Progress, levelId: string, stars: number, storage: WritableStorage | undefined = browserStorage()): Progress {
  const next = { ...current, [levelId]: Math.max(current[levelId] ?? 0, stars) };
  persist(storage, next);
  return next;
}

/** True when every incident before this one, in course order, has at least one star; the first one is always open. */
export function isUnlocked(level: LevelEntry, progress: Progress, levels: LevelEntry[]): boolean {
  const index = levels.findIndex((l) => l.id === level.id);
  return levels.slice(0, Math.max(index, 0)).every((l) => (progress[l.id] ?? 0) > 0);
}
