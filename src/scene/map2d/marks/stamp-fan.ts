import { FAN_PITCH, fanBox, type Box, type Mark } from '@/scene/map2d/layout/arrange/geometry';
import type { Point } from '@/scene/map2d/layout/graph';

const LIVE_FLOW_AGE = Number.NEGATIVE_INFINITY;

export interface StampSource {
  id: string;
  problem: boolean;
  send?: number;
}

export type StampsByPlace = Readonly<Record<string, readonly StampSource[]>>;

export interface PlacedStamp {
  id: string;
  point: Point;
  box: Box;
}

export interface MoreStamp {
  point: Point;
  box: Box;
  count: number;
  ids: string[];
}

export interface Fan {
  station: string;
  box: Box;
  stamps: PlacedStamp[];
  more?: MoreStamp;
  hidden: string[];
}

function ageOf({ send }: StampSource): number {
  return send ?? LIVE_FLOW_AGE;
}

function byAge(a: number, b: number): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

function hiddenIndexes(stamps: readonly StampSource[], count: number): Set<number> {
  const order = stamps.map((stamp, index) => ({ stamp, index })).sort((a, b) => Number(a.stamp.problem) - Number(b.stamp.problem) || byAge(ageOf(a.stamp), ageOf(b.stamp)) || a.index - b.index);
  return new Set(order.slice(0, count).map(({ index }) => index));
}

function casillaPoint({ point, axis }: Mark, casilla: number, casillas: number): Point {
  const offset = (casilla - (casillas - 1) / 2) * FAN_PITCH;
  return axis === 'y' ? [point[0], point[1] + offset] : [point[0] + offset, point[1]];
}

function boxAround(point: Point): Box {
  return fanBox(point, 'x', 1);
}

function fanOf(mark: Mark, stamps: readonly StampSource[]): Fan {
  const overflows = stamps.length > mark.casillas;
  const casillas = Math.min(stamps.length, mark.casillas);
  const hiding = overflows ? hiddenIndexes(stamps, stamps.length - (mark.casillas - 1)) : new Set<number>();
  const drawn = stamps.filter((_, index) => !hiding.has(index));
  const placed = drawn.map(({ id }, casilla): PlacedStamp => {
    const point = casillaPoint(mark, casilla, casillas);
    return { id, point, box: boxAround(point) };
  });
  const point = casillaPoint(mark, casillas - 1, casillas);
  return {
    station: mark.station,
    box: fanBox(mark.point, mark.axis, casillas),
    stamps: placed,
    ...(overflows ? { more: { point, box: boxAround(point), count: hiding.size, ids: stamps.map(({ id }) => id) } } : {}),
    hidden: stamps.filter((_, index) => hiding.has(index)).map(({ id }) => id),
  };
}

/** Takes the stamps of each place, by the name of its station, and the marks of the layout; returns the fan of every place that has stamps, in the order of the marks. A fan opens across the link and is centered on its mark, its casillas 25 px apart in the order the stamps were given. When the stamps are more than the casillas the mark holds, the last casilla is the «+N» that counts the rest and the stamps that go into it are the ones with no problem before the ones with, the oldest first (a live flow, which has no `send`, is older than every packet the player sent); the «+N» lists the ids of every stamp of the place. Throws when a place with stamps has no mark. */
export function fanStamps(stamps: StampsByPlace, marks: readonly Mark[]): Fan[] {
  const known = new Set(marks.map(({ station }) => station));
  const lost = Object.keys(stamps).find((place) => stamps[place].length > 0 && !known.has(place));
  if (lost !== undefined) throw new Error(`The place ${lost} has no mark`);
  return marks.flatMap((mark) => {
    const here = stamps[mark.station] ?? [];
    return here.length === 0 ? [] : [fanOf(mark, here)];
  });
}
