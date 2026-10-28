import { MIN_ROOM } from './inspection-room';

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
  margin: number;
  current: InspectionPlace | null;
  marks?: readonly Frame[];
}

const GAP = 8;

function touches(place: Frame, other: Frame): boolean {
  const hasSize = other.right > other.left && other.bottom > other.top;
  return hasSize && place.left - GAP < other.right && other.left < place.right + GAP && place.top - GAP < other.bottom && other.top < place.bottom + GAP;
}

/** Returns the place the inspection box takes. The place without a mark in the bottom of the box wins (`marks`, the labels, stamps and names of the map: the box is never shorter than `MIN_ROOM`, so a mark in that height is covered whatever the box shows; a mark above it is left to the height of the box); when the marks cover both places, or none, the one the box already has (`current`, null when it opens) wins, so a box does not jump, and a box that opens takes the right one. `width` is the width of the box and `margin` the distance from the corner of the map to the box. */
export function inspectionPlace({ map, width, margin, current, marks = [] }: PlaceInput): InspectionPlace {
  const bottom = map.bottom - margin;
  const top = bottom - MIN_ROOM;
  const frames: Record<InspectionPlace, Frame> = {
    right: { left: map.right - margin - width, right: map.right - margin, top, bottom },
    left: { left: map.left + margin, right: map.left + margin + width, top, bottom },
  };
  const order: InspectionPlace[] = current === 'left' ? ['left', 'right'] : ['right', 'left'];
  return order.find((place) => !marks.some((mark) => touches(frames[place], mark))) ?? order[0];
}
