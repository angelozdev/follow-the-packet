import type { Box } from '@/scene/map2d/layout/arrange/geometry';
import { lengthOf, positionAt, type Point } from '@/scene/map2d/layout/graph';
import type { LabelBox } from '@/scene/map2d/layout/metrics';
import { crowds } from './boxes';
import type { Fan } from './stamp-fan';

export const TAG_STEP = 22;
export const TAG_STEPS_UP = 3;
export const TAG_STEPS_DOWN = 2;
export const GLYPH_STEP = 12;

const SAME_POINT = 1e-6;
const AXES = [0, 1] as const;

export interface PacketTag {
  id: string;
  stamp?: string;
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

function levelsOf(up: number, down: number): number[] {
  const steps = Array.from({ length: Math.max(up, down) }, (_, index) => index + 1);
  return [0, ...steps.flatMap((step) => [...(step <= up ? [-step * TAG_STEP] : []), ...(step <= down ? [step * TAG_STEP] : [])])];
}

const LEVELS = levelsOf(TAG_STEPS_UP, TAG_STEPS_DOWN);

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

function placeOne(tag: PacketTag, obstacles: readonly Box[]): PlacedTag {
  const lengths = lengthOf(tag.path);
  const middle = (lengths.at(-1) ?? 0) / 2;
  const home: Spot = { point: positionAt(tag.path, lengths, middle), along: middle };
  for (const level of LEVELS) {
    const found = spotsFor(tag, lengths, obstacles, level, home).find(({ point }) => !obstacles.some((other) => crowds(boxCenteredAt(point, tag.size, level), other)));
    if (found) return { id: tag.id, at: [found.point[0], found.point[1] + level], box: boxCenteredAt(found.point, tag.size, level), clear: true };
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

/** Takes the labels of packets (each with the path it follows and the size of its box), the boxes they must keep clear of (stamps, labels of pieces, icons and whatever else the caller lists) and, in `fans`, the fans of the stamps of the map; returns, for each label in order, where it stands: in the middle of its path unless a box is in the way, and then as little farther along the path as it takes to clear them, and, when no place of the path is clear, up or down from the path in steps of 22 px (up before down at each step, three steps up and two down at most), trying the whole path at each height before the next one. Each label placed is an obstacle for the ones after it. A label that nothing clears stays in the middle of its path and says it is not `clear`. The label of a packet whose stamp went into a «+N» of `fans` is not placed, so it is not drawn on the still map (O-8) and does not push the others: its text is the line of the list of the «+N». A label with no stamp is always placed. */
export function placeTags(tags: readonly PacketTag[], obstacles: readonly Box[], fans: readonly Fan[] = []): PlacedTag[] {
  const placed: PlacedTag[] = [];
  for (const tag of stillTags(tags, fans)) placed.push(placeOne(tag, [...obstacles, ...placed.map(({ box }) => box)]));
  return placed;
}

/** Takes the glyphs (the shapes of packets) with the path each follows and the distance along it where it stands; returns where each stands, in order: a glyph that falls on the point of one placed before it is moved 12 px further along its own path (back along it when the end of the path is nearer than 12 px), and again until it stands alone. */
export function separateGlyphs(glyphs: readonly Glyph[]): PlacedGlyph[] {
  const placed: PlacedGlyph[] = [];
  for (const glyph of glyphs) placed.push({ id: glyph.id, point: freePoint(glyph, placed.map(({ point }) => point)) });
  return placed;
}
