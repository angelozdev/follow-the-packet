import type { Box } from '@/scene/map2d/layout/arrange/geometry';

const NOISE = 1e-6;

/** Takes two boxes; returns whether they share more than the rounding noise of a float: boxes that only touch do not crowd each other. */
export function crowds(a: Box, b: Box): boolean {
  return a.x + NOISE < b.x + b.width && b.x + NOISE < a.x + a.width && a.y + NOISE < b.y + b.height && b.y + NOISE < a.y + a.height;
}

/** Takes an outer box and an inner box; returns whether the inner one lies inside the outer one, to the rounding noise of a float. */
export function holds(outer: Box, inner: Box): boolean {
  return inner.x >= outer.x - NOISE && inner.y >= outer.y - NOISE && inner.x + inner.width <= outer.x + outer.width + NOISE && inner.y + inner.height <= outer.y + outer.height + NOISE;
}
