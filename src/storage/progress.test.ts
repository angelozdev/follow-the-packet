import { describe, expect, it } from 'vitest';
import type { LevelEntry } from '@/levels';
import { PROGRESS_KEY, isUnlocked, loadProgress, saveStars } from './progress';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const blocked = {
  getItem: (): string | null => {
    throw new Error('blocked');
  },
  setItem: (): void => {
    throw new Error('blocked');
  },
};

describe('progress', () => {
  it('keeps the best stars per level and saves them', () => {
    const storage = memoryStorage();
    const first = saveStars({}, '04-01', 2, storage);
    const second = saveStars(first, '04-01', 1, storage);
    expect(second).toEqual({ '04-01': 2 });
    expect(loadProgress(storage)).toEqual({ '04-01': 2 });
  });

  it('with blocked storage, progress accumulates in memory', () => {
    const afterFirst = saveStars({}, '04-01', 3, blocked);
    const afterSecond = saveStars(afterFirst, '04-02', 3, blocked);
    const afterReplay = saveStars(afterSecond, '04-02', 1, blocked);
    expect(afterReplay).toEqual({ '04-01': 3, '04-02': 3 });
  });

  it('drops only the invalid entries', () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: '{"04-01":"three","04-02":9,"04-03":2,"04-04":1.5,"04-05":0}' });
    expect(loadProgress(storage)).toEqual({ '04-03': 2, '04-05': 0 });
  });

  it('progress saved by version 1 keeps loading', () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: '{"04-01":3,"04-07":2}' });
    expect(loadProgress(storage)).toEqual({ '04-01': 3, '04-07': 2 });
  });

  it('broken JSON, a non-object or blocked storage start empty', () => {
    for (const raw of ['{broken', '[1,2]', '"text"', 'null', '7']) {
      expect(loadProgress(memoryStorage({ [PROGRESS_KEY]: raw })), raw).toEqual({});
    }
    expect(loadProgress(blocked)).toEqual({});
  });

  const COURSE: LevelEntry[] = [
    { id: '04-01', chapter: 4, order: 1, title: 'El primer ping', role: 'defender' },
    { id: '04-02', chapter: 4, order: 2, title: 'Abre lo justo', role: 'defender' },
    { id: '05-01', chapter: 5, order: 1, title: 'Uno de otro capítulo', role: 'defender' },
  ];

  it('an incident opens when the one before it has a star', () => {
    expect(isUnlocked(COURSE[0], {}, COURSE)).toBe(true);
    expect(isUnlocked(COURSE[1], {}, COURSE)).toBe(false);
    expect(isUnlocked(COURSE[1], { '04-01': 1 }, COURSE)).toBe(true);
  });

  it('the first incident of a chapter opens when the last one of the chapter before has a star', () => {
    expect(isUnlocked(COURSE[2], { '04-01': 3 }, COURSE)).toBe(false);
    expect(isUnlocked(COURSE[2], { '04-02': 1 }, COURSE)).toBe(true);
  });

  it('an incident with stars stays open even when the one before it has none', () => {
    expect(isUnlocked(COURSE[1], { '04-02': 2 }, COURSE)).toBe(true);
    expect(isUnlocked(COURSE[2], { '05-01': 1 }, COURSE)).toBe(true);
  });
});
