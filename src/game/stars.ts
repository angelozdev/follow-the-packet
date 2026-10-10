import { extraOpenings, type Network } from '@/engine';
import type { Flow, Incident } from '@/levels';

export interface Stars {
  closed: boolean;
  middle: boolean;
  explained: boolean;
}

export function countStars(stars: Stars): number {
  return Object.values(stars).filter(Boolean).length;
}

/** True when the probe battery finds nothing reaching a device beyond the incident's required and ambient flows. */
export function isTight(world: Network, flows: Flow[]): boolean {
  const expected = flows.filter((flow) => flow.kind !== 'forbidden').map((flow) => flow.packet);
  return extraOpenings(world, expected).length === 0;
}

/** True when the close earns the middle star: for a filter, nothing opened beyond what is needed; for a send or an identify, no hint asked. */
export function earnsMiddle(incident: Incident, world: Network, hintsShown: number): boolean {
  return incident.mechanic === 'filter' ? isTight(world, incident.flows) : hintsShown === 0;
}

/** What happened in a case of a diagnose incident that the player closed: the options named, in order (the last is the right one), and the hints asked in that case. */
export interface CaseResult {
  picks: number[];
  hints: number;
}

/** True when the right cause was the first one named. */
export function firstTry(result: CaseResult): boolean {
  return result.picks.length === 1;
}

/** True when no hint was asked in any of the cases. */
export function noHintInAnyCase(results: CaseResult[]): boolean {
  return results.every((result) => result.hints === 0);
}

/** True when all `cases` are closed and the cause of each was named right at the first try. */
export function everyCauseAtFirstTry(results: CaseResult[], cases: number): boolean {
  return results.length === cases && results.every(firstTry);
}
