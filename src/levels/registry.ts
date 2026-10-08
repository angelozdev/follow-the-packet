import type { Level } from './schema';

// Solo archivos NN-*.ts dentro de carpetas NN-*: shared.ts y los tests quedan fuera.
const modules = import.meta.glob<{ default: Level }>('./[0-9][0-9]-*/[0-9][0-9]-*.ts', { eager: true });

export const LEVELS: Level[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.chapter - b.chapter || a.order - b.order);

export function levelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function levelsOfChapter(chapter: number): Level[] {
  return LEVELS.filter((l) => l.chapter === chapter);
}
