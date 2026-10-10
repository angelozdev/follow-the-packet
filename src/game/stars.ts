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
