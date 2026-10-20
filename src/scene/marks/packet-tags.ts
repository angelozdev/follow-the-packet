import { toPlainText, type PortLabels } from '@/copy';
import type { Box } from '@/scene/layout/arrange/geometry';
import { lengthOf, positionAt, type Point } from '@/scene/layout/graph';
import type { LabelBox } from '@/scene/layout/metrics';
import { crowds } from './boxes';
import type { Fan } from './stamp-fan';

export const TAG_REACH_UP = 66;
export const TAG_REACH_DOWN = 44;
export const GLYPH_STEP = 12;

const SAME_POINT = 1e-6;
const MICRO = 1e6;
const AXES = [0, 1] as const;

export interface PacketTag {
  id: string;
  stamp?: string;
  staysInDevice?: boolean;
  path: readonly Point[];
  size: LabelBox;
}

export interface PlacedTag {
  id: string;
  at: Point;
  box: Box;
  clear: boolean;
}

export interface Glyph {
  id: string;
  path: readonly Point[];
  at: number;
}

export interface PlacedGlyph {
  id: string;
  point: Point;
}

interface Spot {
  point: Point;
  along: number;
}

function boxCenteredAt([x, y]: Point, { width, height }: LabelBox, level: number): Box {
  return { x: x - width / 2, y: y + level - height / 2, width, height };
}

function targetsOf(obstacles: readonly Box[], { width, height }: LabelBox, level: number): [number[], number[]] {
  return [
    obstacles.flatMap(({ x, width: span }) => [x - width / 2, x + span + width / 2]),
    obstacles.flatMap(({ y, height: span }) => [y - height / 2 - level, y + span + height / 2 - level]),
  ];
}

function crossingsOf(path: readonly Point[], lengths: readonly number[], axis: 0 | 1, targets: readonly number[]): Spot[] {
  const other = axis === 0 ? 1 : 0;
  return path.slice(1).flatMap((end, index) => {
    const start = path[index];
    const [low, high] = [Math.min(start[axis], end[axis]), Math.max(start[axis], end[axis])];
    return targets
      .filter((target) => start[axis] !== end[axis] && target >= low && target <= high)
      .map((target): Spot => {
        const value = start[other] + ((end[other] - start[other]) * (target - start[axis])) / (end[axis] - start[axis]);
        const point: Point = axis === 0 ? [target, value] : [value, target];
        return { point, along: lengths[index] + Math.hypot(point[0] - start[0], point[1] - start[1]) };
      });
  });
}

function spotsFor(tag: PacketTag, lengths: readonly number[], obstacles: readonly Box[], level: number, home: Spot): Spot[] {
  const [xs, ys] = targetsOf(obstacles, tag.size, level);
  const crossings = AXES.flatMap((axis) => crossingsOf(tag.path, lengths, axis, axis === 0 ? xs : ys));
  return [home, ...crossings].sort((a, b) => Math.abs(a.along - home.along) - Math.abs(b.along - home.along) || b.along - a.along);
}

function touchHeights(tag: PacketTag, lengths: readonly number[], obstacles: readonly Box[]): number[] {
  const half = tag.size.height / 2;
  const sideways = crossingsOf(tag.path, lengths, 0, targetsOf(obstacles, tag.size, 0)[0]).map(({ point }) => point);
  const reachable = [...tag.path, ...sideways]
    .flatMap(([, y]) => obstacles.flatMap(({ y: top, height }) => [top - half - y, top + height + half - y]))
    .filter((height) => height >= -TAG_REACH_UP - SAME_POINT && height <= TAG_REACH_DOWN + SAME_POINT);
  const distinct = new Map(reachable.map((height) => [Math.round(height * MICRO), height]));
  return [...distinct]
    .filter(([micro]) => micro !== 0)
    .sort(([a], [b]) => Math.abs(a) - Math.abs(b) || a - b)
    .map(([, height]) => height);
}

function placeAt(tag: PacketTag, lengths: readonly number[], obstacles: readonly Box[], home: Spot, level: number): PlacedTag | undefined {
  const found = spotsFor(tag, lengths, obstacles, level, home).find(({ point }) => !obstacles.some((other) => crowds(boxCenteredAt(point, tag.size, level), other)));
  return found && { id: tag.id, at: [found.point[0], found.point[1] + level], box: boxCenteredAt(found.point, tag.size, level), clear: true };
}

function placeOne(tag: PacketTag, obstacles: readonly Box[]): PlacedTag {
  const lengths = lengthOf(tag.path);
  const middle = (lengths.at(-1) ?? 0) / 2;
  const home: Spot = { point: positionAt(tag.path, lengths, middle), along: middle };
  const onPath = placeAt(tag, lengths, obstacles, home, 0);
  if (onPath) return onPath;
  for (const level of touchHeights(tag, lengths, obstacles)) {
    const moved = placeAt(tag, lengths, obstacles, home, level);
    if (moved) return moved;
  }
  return { id: tag.id, at: home.point, box: boxCenteredAt(home.point, tag.size, 0), clear: false };
}

function isSame([x, y]: Point, [otherX, otherY]: Point): boolean {
  return Math.abs(x - otherX) <= SAME_POINT && Math.abs(y - otherY) <= SAME_POINT;
}

function freePoint({ path, at }: Glyph, taken: readonly Point[]): Point {
  const lengths = lengthOf(path);
  const length = lengths.at(-1) ?? 0;
  const direction = at + GLYPH_STEP <= length ? 1 : -1;
  for (let step = 0; step * GLYPH_STEP <= length; step++) {
    const point = positionAt(path, lengths, at + direction * step * GLYPH_STEP);
    if (!taken.some((other) => isSame(point, other))) return point;
  }
  return positionAt(path, lengths, at);
}

function stillTags(tags: readonly PacketTag[], fans: readonly Fan[]): PacketTag[] {
  const hidden = new Set(fans.flatMap((fan) => fan.hidden));
  return tags.filter(({ stamp }) => stamp === undefined || !hidden.has(stamp));
}

/** Takes the labels of packets (each with the path it follows, the size of its box and, optionally, the id of its stamp and whether its packet never leaves its device), the boxes they must keep clear of (stamps, labels of pieces, icons and whatever else the caller lists) and, in `fans`, the fans of the stamps of the map; returns, for each label in order, where it stands: in the middle of its path unless a box is in the way, and then as little farther along the path as it takes to clear them, and, when no place of the path is clear, up or down from the path to the nearest height at which an edge of its box touches an edge of a box in the way (up before down when both are as near), at most 66 px up and 44 px down, trying the whole path at each height before the next one. Each label placed is an obstacle for the ones after it. A label that nothing clears stays in the middle of its path and says it is not `clear`. The label of a packet whose stamp went into a «+N» of `fans` is not placed, so it is not drawn on the still map (O-8) and does not push the others: its text is the line of the list of the «+N». The label of a packet that never leaves its device (`staysInDevice`: its path ends at its own doorstep) is left out in the same way when nothing clears it, and its text is in the box of its stamp (O-10). A label with no stamp that leaves its device is always placed. */
export function placeTags(tags: readonly PacketTag[], obstacles: readonly Box[], fans: readonly Fan[] = []): PlacedTag[] {
  const placed: PlacedTag[] = [];
  for (const tag of stillTags(tags, fans)) {
    const one = placeOne(tag, [...obstacles, ...placed.map(({ box }) => box)]);
    if (one.clear || !tag.staysInDevice) placed.push(one);
  }
  return placed;
}

/** Takes the glyphs (the shapes of packets) with the path each follows and the distance along it where it stands; returns where each stands, in order: a glyph that falls on the point of one placed before it is moved 12 px further along its own path (back along it when the end of the path is nearer than 12 px), and again until it stands alone. */
export function separateGlyphs(glyphs: readonly Glyph[]): PlacedGlyph[] {
  const placed: PlacedGlyph[] = [];
  for (const glyph of glyphs) placed.push({ id: glyph.id, point: freePoint(glyph, placed.map(({ point }) => point)) });
  return placed;
}

/** Takes the labels a packet wears leg by leg, how far along its path they change (undefined when they do not), a distance along the path and whether the packet is the answer coming back (false when it is missing); returns, in plain text, the label of the leg the packet stands in at that distance: the first before the change and the last from there on, as the packet asks or, coming back, with the ports swapped. */
export function legTextAt(legs: readonly PortLabels[], changesAt: number | undefined, distance: number, back = false): string {
  const leg = changesAt !== undefined && distance >= changesAt ? legs[legs.length - 1] : legs[0];
  return toPlainText(back ? leg.reply : leg.request);
}

/** Takes the points of a path and the point of the router that translates the ports of the packet (undefined when the map does not draw it); returns how far along the path the first of its points that lies on the router is, or undefined when the path does not pass there. */
export function changeDistance(path: readonly Point[], router: Point | undefined): number | undefined {
  if (router === undefined) return undefined;
  const at = path.findIndex(([x, y]) => x === router[0] && y === router[1]);
  return at < 0 ? undefined : lengthOf(path)[at];
}
