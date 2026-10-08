import { describe, expect, it } from 'vitest';
import type { LevelEntry } from '@/levels';
import { isUnlocked, loadProgress, saveStars } from './progress';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('progreso', () => {
  it('guarda la mejor marca de cada nivel', () => {
    const storage = memoryStorage();
    saveStars('04-01', 2, storage);
    saveStars('04-01', 1, storage);
    expect(loadProgress(storage)).toEqual({ '04-01': 2 });
  });

  it('JSON roto o valores raros: arranca vacío (Review Focus 1)', () => {
    expect(loadProgress(memoryStorage({ 'follow-the-packet:progress:v1': '{roto' }))).toEqual({});
    expect(loadProgress(memoryStorage({ 'follow-the-packet:progress:v1': '{"04-01":"tres","04-02":9}' }))).toEqual({});
  });

  it('un storage que lanza errores no rompe nada (Review Focus 1)', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    };
    expect(loadProgress(broken)).toEqual({});
    expect(saveStars('04-01', 3, broken)).toEqual({ '04-01': 3 });
  });

  it('a level unlocks when the previous one in its chapter has a star', () => {
    const chapter: LevelEntry[] = [
      { id: '04-01', chapter: 4, order: 1, title: 'El primer ping', role: 'defender' },
      { id: '04-02', chapter: 4, order: 2, title: 'Abre lo justo', role: 'defender' },
    ];
    expect(isUnlocked(chapter[0], {}, chapter)).toBe(true);
    expect(isUnlocked(chapter[1], {}, chapter)).toBe(false);
    expect(isUnlocked(chapter[1], { '04-01': 1 }, chapter)).toBe(true);
  });
});
