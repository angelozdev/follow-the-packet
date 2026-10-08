import { extraOpenings, type Network } from '@/engine';
import type { Flow } from '@/levels';

export interface Stars {
  closed: boolean;
  tight: boolean;
  explained: boolean;
}

export function countStars(stars: Stars): number {
  return Object.values(stars).filter(Boolean).length;
}

/** True when the probe battery finds nothing reaching a server beyond the incident's required and ambient flows. */
export function isTight(world: Network, flows: Flow[]): boolean {
  const expected = flows.filter((flow) => flow.kind !== 'forbidden').map((flow) => flow.packet);
  return extraOpenings(world, expected).length === 0;
}
