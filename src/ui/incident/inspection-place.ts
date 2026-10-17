/** A rectangle on the screen, in pixels from the window. */
export interface Frame {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The two places the inspection box may take on the map: the bottom right corner, which is where it opens, and the bottom left one. */
export type InspectionPlace = 'right' | 'left';

interface PlaceInput {
  map: Frame;
  width: number;
  tallest: number;
  margin: number;
  card: Frame | null;
  current: InspectionPlace | null;
}

const GAP = 8;

function touches(place: Frame, card: Frame): boolean {
  const hasSize = card.right > card.left && card.bottom > card.top;
  return hasSize && place.left - GAP < card.right && card.left < place.right + GAP && place.top - GAP < card.bottom && card.top < place.bottom + GAP;
}

/** Returns the place the inspection box takes, or null when it has none. A place is free when the box in it, at the tallest it may be (`tallest`, whatever it shows, so the place does not change from one piece to the next), stays `GAP` pixels or more from the card that is open (`card`, null when none is). A card with no size touches nothing: it is a card that is not drawn yet. Between two free places the one the box already has (`current`, null when it opens) wins, so a box does not jump while the card leaves its place alone; a box that opens takes the right one. `width` is the width of the box and `margin` the distance from the corner of the map to the box. */
export function inspectionPlace({ map, width, tallest, margin, card, current }: PlaceInput): InspectionPlace | null {
  const bottom = map.bottom - margin;
  const top = bottom - tallest;
  const frames: Record<InspectionPlace, Frame> = {
    right: { left: map.right - margin - width, right: map.right - margin, top, bottom },
    left: { left: map.left + margin, right: map.left + margin + width, top, bottom },
  };
  const order: InspectionPlace[] = current === 'left' ? ['left', 'right'] : ['right', 'left'];
  return order.find((place) => card === null || !touches(frames[place], card)) ?? null;
}
