export type LevelRole = 'defender' | 'attacker';

export interface LevelEntry {
  id: string;
  chapter: number;
  order: number;
  title: string;
  role: LevelRole;
}
