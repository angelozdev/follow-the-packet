import type { Box, RowLayout } from '@/scene/map2d/layout/arrange/geometry';
import { crowds, holds } from './boxes';
import type { PlacedTag } from './packet-tags';
import type { Fan } from './stamp-fan';

export type Occupant = 'label' | 'icon' | 'caption' | 'stamp' | 'tag';

export interface Entry {
  kind: Occupant;
  id: string;
  fan?: string;
}

export interface Collision {
  first: Entry;
  second: Entry;
}

export type CollisionLayout = Pick<RowLayout, 'labels' | 'icons'> & { captions?: Readonly<Record<string, Box>> };

interface Occupied {
  entry: Entry;
  box: Box;
  room?: Box;
}

function stampsOf({ station, stamps, more, box: room }: Fan): Occupied[] {
  const drawn = stamps.map(({ id, box }): Occupied => ({ entry: { kind: 'stamp', id, fan: station }, box, room }));
  return more ? [...drawn, { entry: { kind: 'stamp', id: more.id, fan: station }, box: more.box, room }] : drawn;
}

function occupantsOf({ labels, icons, captions = {} }: CollisionLayout, fans: readonly Fan[], tags: readonly PlacedTag[]): Occupied[] {
  return [
    ...Object.entries(labels).map(([id, box]): Occupied => ({ entry: { kind: 'label', id }, box })),
    ...Object.entries(icons).map(([id, box]): Occupied => ({ entry: { kind: 'icon', id }, box })),
    ...Object.entries(captions).map(([id, box]): Occupied => ({ entry: { kind: 'caption', id }, box })),
    ...fans.flatMap(stampsOf),
    ...tags.map(({ id, box }): Occupied => ({ entry: { kind: 'tag', id }, box })),
  ];
}

function isOneFan(a: Occupied, b: Occupied): boolean {
  return a.entry.fan !== undefined && a.entry.fan === b.entry.fan && a.room !== undefined && holds(a.room, a.box) && holds(a.room, b.box);
}

/** Takes the layout of a map (its labels and icons and, when it has them, the names of its groups), the fans of stamps that stand on it and the labels of packets placed on it; returns every pair of boxes that overlap, listed as labels of pieces, icons, names of groups, stamps (a «+N» is one) and labels of packets, in that order. Two stamps of one fan overlap by design (25 px apart, 36 px wide) and are not listed while both lie inside the box of their fan; boxes that only touch are not listed. */
export function collisions(layout: CollisionLayout, fans: readonly Fan[], tags: readonly PlacedTag[]): Collision[] {
  const occupants = occupantsOf(layout, fans, tags);
  return occupants.flatMap((first, index) =>
    occupants
      .slice(index + 1)
      .filter((second) => crowds(first.box, second.box) && !isOneFan(first, second))
      .map((second): Collision => ({ first: first.entry, second: second.entry })),
  );
}
