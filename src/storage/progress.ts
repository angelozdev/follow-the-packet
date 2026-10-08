import type { LevelEntry } from '@/levels';

const KEY = 'follow-the-packet:progress:v1';

/** id de nivel → mejores estrellas (0-3). */
export type Progress = Record<string, number>;

function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function isValid(value: unknown): value is Progress {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((v) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 3)
  );
}

export function loadProgress(storage: Pick<Storage, 'getItem'> | undefined = browserStorage()): Progress {
  try {
    const raw = storage?.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return isValid(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStars(
  levelId: string,
  stars: number,
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = browserStorage(),
): Progress {
  const current = loadProgress(storage);
  const next = { ...current, [levelId]: Math.max(current[levelId] ?? 0, stars) };
  try {
    storage?.setItem(KEY, JSON.stringify(next));
  } catch {
    // Sin almacenamiento (modo privado): el progreso vive solo en memoria.
  }
  return next;
}

export function isUnlocked(level: LevelEntry, progress: Progress, chapterLevels: LevelEntry[]): boolean {
  const index = chapterLevels.findIndex((l) => l.id === level.id);
  return index <= 0 || (progress[chapterLevels[index - 1].id] ?? 0) > 0;
}
