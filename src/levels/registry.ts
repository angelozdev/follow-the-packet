import type { Incident } from './incident';

const modules = import.meta.glob<{ default: Incident }>('./[0-9][0-9]-*/[0-9][0-9]-*.ts', { eager: true });

export const INCIDENTS: Incident[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.chapter - b.chapter || a.order - b.order);
