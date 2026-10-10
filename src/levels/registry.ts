import type { Incident } from './contract/incident';

const modules = import.meta.glob<{ default: Incident }>(
  ['./[0-9][0-9]-*/[0-9][0-9]-*.ts', './[0-9][0-9]-*/*/[0-9][0-9]-*.ts', '!./**/*.test.ts'],
  { eager: true },
);

export const INCIDENTS: Incident[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.chapter - b.chapter || a.order - b.order);
