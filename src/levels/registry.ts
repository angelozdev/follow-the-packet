import type { LevelEntry } from './level-entry';

const modules = import.meta.glob<{ default: LevelEntry }>('./[0-9][0-9]-*/[0-9][0-9]-*.ts', { eager: true });

export const LEVELS: LevelEntry[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.chapter - b.chapter || a.order - b.order);
