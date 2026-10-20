import { fanBox, type Box, type PieceKind, type RowLayout } from '@/scene/map2d/layout/arrange/geometry';
import type { Point } from '@/scene/map2d/layout/graph';

export type CardSide = 'left' | 'right';
/** Where a card opens: on a side of its anchor, or docked in the bottom left corner of the map. */
export type CardPosition = CardSide | 'dock';

export const CARD_WIDTH = 300;
export const LABEL_REACH = 64;
export const TITLE_BAR = 56;

const FIREWALL_CARD_GAP = 110;
const ORIGIN_CARD_GAP = 70;
const CARD_MARGIN = 12;
export const DOCK_MARGIN = 6;
const GROUND_REACH = 16;
const MIN_DOCK_ROOM = 200;

/** How many pixels a docked card needs under the lowest piece of the drawing to find the room of a card that can be used: that room, the margin of the dock and the reach of the feet of a piece. */
export const ROOM_UNDER_THE_DRAWING = MIN_DOCK_ROOM + DOCK_MARGIN + GROUND_REACH;

/** Where a card anchors on the map and how it keeps clear of it, all in pixels from the left and top edges of the map: the point it hangs from (the middle of the icon of its piece), its distance from that point, the places its side must keep clear of (as many `x` as it takes for `LABEL_REACH` on each side of them to cover every label; null when only the room on screen decides its side), and, for the dock, the same places of every piece the card may cover and of every fan of stamps that may stand on the map, with the lowest row each one reaches. */
export interface CardPlacement {
  anchor: Point;
  gap: number;
  avoid: number[] | null;
  pieces: { x: number; bottom: number }[];
  screenPicksSide?: true;
}

interface Reach {
  x: number;
  width: number;
}

function middleOf({ x, y, width, height }: Box): Point {
  return [x + width / 2, y + height / 2];
}

function hullOf(a: Box, b: Box): Box {
  const [left, top] = [Math.min(a.x, b.x), Math.min(a.y, b.y)];
  return { x: left, y: top, width: Math.max(a.x + a.width, b.x + b.width) - left, height: Math.max(a.y + a.height, b.y + b.height) - top };
}

/** Takes the span of a box along `x`; returns the `x` to give to a function that reads a box as `LABEL_REACH` on each side of one `x`: the middle of the box when that covers it, and, for a box wider than that, enough of them, no more than twice `LABEL_REACH` apart, from `LABEL_REACH` inside its left edge to `LABEL_REACH` inside its right one. */
export function reachPoints({ x, width }: Reach): number[] {
  const slack = width - 2 * LABEL_REACH;
  if (slack <= 0) return [x + width / 2];
  const steps = Math.ceil(slack / (2 * LABEL_REACH));
  return Array.from({ length: steps + 1 }, (_, step) => x + LABEL_REACH + (slack * step) / steps);
}

function reachOf(box: Box): { x: number; bottom: number }[] {
  return reachPoints(box).map((x) => ({ x, bottom: box.y + box.height }));
}

/** Takes the piece whose card opens, the other pieces of the map and the layout; returns how the card anchors. The card of a firewall keeps its wide gap, avoids the labels of the other pieces (its own excluded) and takes the side with more room when that side keeps it inside the map and clear of them (`screenPicksSide`: the screen picks the side, never the labels), or docks in the corner when it does not. The terminal of a device or an actor sits closer, just past its icon and the stamp that stands before it, and avoids the labels of every piece, its own included, so it never hides what the player has to read; it docks when it cannot. The gap is measured from the middle of the icon of the piece, and a docked card keeps clear of the pieces and of the fans that may stand beside them. */
export function cardPlacement(piece: { id: string; kind: PieceKind }, others: readonly { id: string }[], layout: Pick<RowLayout, 'labels' | 'icons' | 'marks'>): CardPlacement {
  const ids = [piece.id, ...others.map(({ id }) => id)].filter((id) => layout.labels[id] !== undefined && layout.icons[id] !== undefined);
  const anchor = middleOf(layout.icons[piece.id]);
  const pieces = [...ids.flatMap((id) => reachOf(hullOf(layout.labels[id], layout.icons[id]))), ...layout.marks.flatMap(({ point, axis, casillas }) => reachOf(fanBox(point, axis, casillas)))];
  const labelsOf = (named: readonly string[]) => named.flatMap((id) => reachPoints(layout.labels[id]));
  if (piece.kind === 'firewall') return { anchor, gap: FIREWALL_CARD_GAP, avoid: labelsOf(ids.filter((id) => id !== piece.id)), pieces, screenPicksSide: true };
  return { anchor, gap: ORIGIN_CARD_GAP, avoid: labelsOf(ids), pieces };
}

/** Returns the horizontal span in pixels, from the map's left edge, that a card covers on a side of its anchor. */
export function cardSpan(side: CardSide, anchorX: number, gap: number): [number, number] {
  const near = side === 'right' ? anchorX + gap : anchorX - gap - CARD_WIDTH;
  return [near, near + CARD_WIDTH];
}

function opensClear(side: CardSide, anchorX: number, avoidXs: readonly number[], room: number, gap: number): boolean {
  const [near, far] = cardSpan(side, anchorX, gap);
  if (near < CARD_MARGIN || far > room - CARD_MARGIN) return false;
  return avoidXs.every((x) => x + LABEL_REACH < near || x - LABEL_REACH > far);
}

function atLeastUsable(height: number): number {
  return Math.max(MIN_DOCK_ROOM, height);
}

/** Returns how tall a card docked in the bottom left corner may be, in pixels, so that it stays inside the map: the height of the map less the margin the dock keeps at its bottom and at its top, and never less than `MIN_DOCK_ROOM`. A docked card takes less when a piece stands above it (`dockRoom`). */
export function dockHeight({ height }: { height: number }): number {
  return atLeastUsable(height - 2 * DOCK_MARGIN);
}

/** Returns how tall a card beside a piece may be, in pixels, so that it fits between the title bar of the map and the margin at its bottom, and never less than `MIN_DOCK_ROOM`, so a window too short for the map keeps a card that can be used. Its body scrolls when it is taller. */
export function sideHeight({ height }: { height: number }): number {
  return atLeastUsable(height - TITLE_BAR - DOCK_MARGIN);
}

/** Returns how far from its anchor, in pixels, the top of a card beside a piece may sit at the highest, so the card stays under the title bar that floats over the top of the map: a distance upward, negative while the anchor is lower than that. */
export function cardTop([, anchorY]: Point): number {
  return TITLE_BAR - anchorY;
}

/** Returns how far from its anchor, in pixels, the bottom left corner of a docked card sits, so that corner lands on the map's bottom left corner, `DOCK_MARGIN` in: the card's shadow still fits. The card hangs from that corner, so its height does not matter. */
export function dockOffset([anchorX, anchorY]: Point, { height }: { width: number; height: number }): Point {
  return [DOCK_MARGIN - anchorX, height - DOCK_MARGIN - anchorY];
}

function underTheDock({ x }: { x: number }): boolean {
  return x + LABEL_REACH > DOCK_MARGIN && x - LABEL_REACH < DOCK_MARGIN + CARD_WIDTH;
}

/** Returns how tall a card docked in the bottom left corner may be, in pixels, so that it covers no piece: the height from the corner up to the lowest row a piece the card spans reaches, and `GROUND_REACH` more (`x` is where the piece stands, read as `LABEL_REACH` on each side, and `bottom` the pixel row its body ends at). It is null when no piece stands above the card, and never less than `MIN_DOCK_ROOM`, so a window too short for the map keeps a card that can be used. */
export function dockRoom(pieces: readonly { x: number; bottom: number }[], map: { height: number }): number | null {
  const spanned = pieces.filter(underTheDock);
  if (spanned.length === 0) return null;
  const lowest = Math.max(...spanned.map(({ bottom }) => bottom + GROUND_REACH));
  return atLeastUsable(map.height - DOCK_MARGIN - lowest);
}

/** Picks where a terminal opens, with every `x` in pixels from the map's left edge: the side with more room when it keeps the card inside the map and clear of the labels at `avoidXs` (each read as `LABEL_REACH` on both sides), else the other side when that one does (unless `otherSideToo` is false: then only the side with more room is tried), else the dock in the bottom left corner. A map too narrow to hold the card keeps the side with more room. */
export function terminalSide(anchorX: number, avoidXs: readonly number[], room: number, gap: number, otherSideToo = true): CardPosition {
  const sides: CardSide[] = anchorX * 2 > room ? ['left', 'right'] : ['right', 'left'];
  const clear = sides.slice(0, otherSideToo ? sides.length : 1).find((side) => opensClear(side, anchorX, avoidXs, room, gap));
  if (clear !== undefined) return clear;
  return room >= CARD_WIDTH + 2 * DOCK_MARGIN ? 'dock' : sides[0];
}
