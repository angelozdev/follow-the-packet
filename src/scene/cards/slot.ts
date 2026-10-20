import type { Point } from '@/scene/layout/graph';
import { cardTop, dockHeight, dockOffset, dockRoom, sideHeight, terminalSide, type CardPlacement, type CardPosition } from './placement';

/** The layer a card sits in, in pixels: as wide as the sheet of the map and as tall as the drawing under the title bar plus the room a docked card needs under it, or as the box when that is taller. */
export interface CardLayer {
  width: number;
  height: number;
}

/** Where a card sits in the layer, in pixels from its left and top edges: the point it hangs from, its side or the dock, its gap, how far from the point the bottom left corner of the layer is (what a docked card hangs from), how far above the point the top of a card beside it may rise, and how tall it may be. */
export interface CardSlot {
  position: CardPosition;
  anchor: Point;
  gap: number;
  dock: Point;
  top: number;
  room: number;
}

function shifted(shift: Point, [x, y]: Point): Point {
  return [x + shift[0], y + shift[1]];
}

/** Takes how a card anchors (`cardPlacement`, in the pixels of the drawing), where the drawing stands in the layer (`shift`: the frame), the layer and the height of the window; returns where the card sits in the layer. The side is picked against the width of the layer, which is what the card has to fit in, and not against the width of the drawing, which the row modes center inside it. The card is never taller than the layer allows (beside the piece, between the title bar and the bottom margin; docked, up to the feet of the lowest piece it spans) and never taller than the window allows, so its foot can be in view: its body scrolls when it is taller, and it is never less than a card that can be used. */
export function cardSlot(placement: CardPlacement, shift: Point, layer: CardLayer, windowHeight: number): CardSlot {
  const anchor = shifted(shift, placement.anchor);
  const position = terminalSide(anchor[0], (placement.avoid ?? []).map((x) => x + shift[0]), layer.width, placement.gap, placement.screenPicksSide !== true);
  const standing = placement.pieces.map(({ x, bottom }) => ({ x: x + shift[0], bottom: bottom + shift[1] }));
  const own = position === 'dock' ? (dockRoom(standing, layer) ?? dockHeight(layer)) : sideHeight(layer);
  return { position, anchor, gap: placement.gap, dock: dockOffset(anchor, layer), top: cardTop(anchor), room: Math.min(own, sideHeight({ height: windowHeight })) };
}
