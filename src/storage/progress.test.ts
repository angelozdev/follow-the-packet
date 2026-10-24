import { describe, expect, it } from 'vitest';
import { INCIDENTS, type LevelEntry } from '@/levels';
import { PROGRESS_KEY, isUnlocked, loadProgress, saveStars, type Progress } from './progress';

const OLD_KEY = 'follow-the-packet:progress:v1';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

function refuse(): never {
  throw new Error('blocked');
}

const blocked = { getItem: refuse, setItem: refuse, removeItem: refuse };

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

  it('starts empty and removes the progress saved under the old key', () => {
    const storage = memoryStorage({ [OLD_KEY]: '{"04-01":3,"01-02":2}' });
    expect(PROGRESS_KEY).not.toBe(OLD_KEY);
    expect(loadProgress(storage)).toEqual({});
    expect(storage.getItem(OLD_KEY)).toBeNull();
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
  });

  it('removes the old key and keeps the progress saved under the current one', () => {
    const storage = memoryStorage({ [OLD_KEY]: '{"04-01":3}', [PROGRESS_KEY]: '{"04-02":1}' });
    expect(loadProgress(storage)).toEqual({ '04-02': 1 });
    expect(storage.getItem(OLD_KEY)).toBeNull();
  });

  it('keeps loading the current progress when storage cannot remove the old key', () => {
    const stuck = { ...memoryStorage({ [PROGRESS_KEY]: '{"04-02":2}' }), removeItem: refuse };
    expect(loadProgress(stuck)).toEqual({ '04-02': 2 });
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

describe('progress along the chapters of the game', () => {
  const entry = (id: string): LevelEntry => ({ id, chapter: Number(id.slice(0, 2)), order: Number(id.slice(3)), title: id, role: 'defender' });
  const [LAST_OF_CHAPTER_1, FIRST_OF_CHAPTER_2, LAST_OF_CHAPTER_2, FIRST_OF_CHAPTER_4] = ['01-14', '02-01', '02-14', '04-01'].map(entry);
  const CHAIN = [LAST_OF_CHAPTER_1, FIRST_OF_CHAPTER_2, LAST_OF_CHAPTER_2, FIRST_OF_CHAPTER_4];

  it('the first incident of a chapter opens with the last incident of the chapter before in game order', () => {
    expect(isUnlocked(FIRST_OF_CHAPTER_2, {}, CHAIN)).toBe(false);
    expect(isUnlocked(FIRST_OF_CHAPTER_2, { [LAST_OF_CHAPTER_1.id]: 1 }, CHAIN)).toBe(true);
    expect(isUnlocked(FIRST_OF_CHAPTER_4, { [LAST_OF_CHAPTER_1.id]: 3 }, CHAIN)).toBe(false);
    expect(isUnlocked(FIRST_OF_CHAPTER_4, { [LAST_OF_CHAPTER_2.id]: 1 }, CHAIN)).toBe(true);
  });

  it('in the registered course 04-01 opens once the last incident of chapter 3 has a star, and not with 02-14, 02-13 or 01-14', () => {
    const course = INCIDENTS.map(({ id, chapter, order, title, role }): LevelEntry => ({ id, chapter, order, title, role }));
    const first = course.find(({ id }) => id === FIRST_OF_CHAPTER_4.id);
    const lastOfChapter3 = first && course.at(course.indexOf(first) - 1);
    expect(lastOfChapter3?.chapter).toBe(3);
    const without: Progress[] = [{ '01-14': 3 }, { '02-13': 3 }, { [LAST_OF_CHAPTER_2.id]: 3 }, {}];
    expect(first && without.map((progress) => isUnlocked(first, progress, course))).toEqual([false, false, false, false]);
    expect(first && lastOfChapter3 && isUnlocked(first, { [lastOfChapter3.id]: 1 }, course)).toBe(true);
  });

  it('the first incident of chapter 3 opens with the last incident of chapter 2 in game order', () => {
    const course = INCIDENTS.map(({ id, chapter, order, title, role }): LevelEntry => ({ id, chapter, order, title, role }));
    const first = course.find(({ chapter }) => chapter === 3);
    expect(first?.id).toBe('03-01');
    expect(first && course.at(course.indexOf(first) - 1)?.id).toBe(LAST_OF_CHAPTER_2.id);
    const without: Progress[] = [{ '01-14': 3 }, { '02-13': 3 }, {}];
    expect(first && without.map((progress) => isUnlocked(first, progress, course))).toEqual([false, false, false]);
    expect(first && isUnlocked(first, { [LAST_OF_CHAPTER_2.id]: 1 }, course)).toBe(true);
  });

  it('an incident with a star stays open even when the one before it has none', () => {
    expect(isUnlocked(FIRST_OF_CHAPTER_4, { [FIRST_OF_CHAPTER_4.id]: 1 }, CHAIN)).toBe(true);
    expect(isUnlocked(LAST_OF_CHAPTER_2, { [LAST_OF_CHAPTER_2.id]: 1 }, CHAIN)).toBe(true);
    expect(isUnlocked(LAST_OF_CHAPTER_2, { [FIRST_OF_CHAPTER_4.id]: 1 }, CHAIN)).toBe(false);
  });
});
