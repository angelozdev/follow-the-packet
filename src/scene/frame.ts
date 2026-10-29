import type { MapLayout } from '@/scene/layout/arrange/geometry';

export interface Frame {
  x: number;
  y: number;
}

/** Takes the width of the box that holds the map and the size of its drawing; returns where the drawing stands in the box, from its left and top edges: centered to a whole pixel when the box is wider than the drawing and against the left edge otherwise, and against the top edge. */
export function frameOf(boxWidth: number, size: MapLayout['size']): Frame {
  return { x: Math.max(0, Math.floor((boxWidth - size.width) / 2)), y: 0 };
}
