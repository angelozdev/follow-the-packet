import type { Box, RowLayout } from '@/scene/map2d/layout/arrange/geometry';
import type { Fan } from './stamp-fan';

export interface ReadingEntry {
  kind: 'piece' | 'stamp' | 'more';
  id: string;
}

export interface StampEntry extends ReadingEntry {
  kind: 'stamp' | 'more';
}

interface Body {
  id: string;
  box: Box;
}

function centerOf({ x, y, width, height }: Box): [number, number] {
  return [x + width / 2, y + height / 2];
}

function byReading(a: Box, b: Box): number {
  const [[ax, ay], [bx, by]] = [centerOf(a), centerOf(b)];
  return ay - by || ax - bx;
}

function gapBetween(a: Box, b: Box): number {
  return Math.hypot(Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width), 0), Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height), 0));
}

function nearestPiece(fan: Fan, pieces: readonly Body[]): string | undefined {
  return pieces.reduce<Body | undefined>((best, piece) => (best === undefined || gapBetween(fan.box, piece.box) < gapBetween(fan.box, best.box) ? piece : best), undefined)?.id;
}

function buttonsOf({ stamps, more }: Fan): ReadingEntry[] {
  return [...stamps.map(({ id }): ReadingEntry => ({ kind: 'stamp', id })), ...(more ? [{ kind: 'more' as const, id: more.id }] : [])];
}

/** Takes the layout of a map (the label of every piece and its icon) and the fans of stamps that stand on it; returns the buttons of the map in the order the Tab key must walk them, which is the order a person reads it: the pieces from the top of the map to the bottom and, along one line, from the left to the right (by the center of the icon, so the name of a piece does not move it), and after each piece the stamps that stand beside it, which are the fans nearest to its icon, in the order they are laid out in the fan (from the low end of its axis to the high one, the «+N» last); a «+N» is a button of kind `more` named by its place. A map with no piece lists the stamps by the place of their fans. */
export function readingOrder({ labels, icons }: Pick<RowLayout, 'labels' | 'icons'>, fans: readonly Fan[]): ReadingEntry[] {
  const pieces = Object.keys(labels)
    .map((id): Body => ({ id, box: icons[id] ?? labels[id] }))
    .sort((a, b) => byReading(a.box, b.box));
  const placed = [...fans].sort((a, b) => byReading(a.box, b.box));
  if (pieces.length === 0) return placed.flatMap(buttonsOf);
  return pieces.flatMap(({ id }) => [{ kind: 'piece' as const, id }, ...placed.filter((fan) => nearestPiece(fan, pieces) === id).flatMap(buttonsOf)]);
}
