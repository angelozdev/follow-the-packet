/** The edges of a box on the screen, in pixels from the window. */
export interface Edges {
  left: number;
  right: number;
  bottom: number;
}

const GAP = 8;
const MIN_ROOM = 120;

/** Returns how tall the inspection box may be, in pixels, so that it covers no mark of the map: the height from its bottom edge up to the lowest mark that lies over it (the label of a piece, the stamp of a packet, the name of a floor), less a small gap. A mark counts when it shares some width with the box and ends above the bottom of the box. It is null when no mark lies over the box. It is never less than `MIN_ROOM`, enough for the band, the heading and a line, so a map with a mark just above the box keeps a box that can be read; then the box covers that mark. A box taller than this scrolls its body instead. */
export function inspectionRoom(box: Edges, marks: Edges[]): number | null {
  const over = marks.filter((mark) => mark.left < box.right && mark.right > box.left && mark.bottom <= box.bottom);
  if (over.length === 0) return null;
  return Math.max(MIN_ROOM, box.bottom - Math.max(...over.map((mark) => mark.bottom)) - GAP);
}
