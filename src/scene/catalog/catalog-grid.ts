import type { Vec2 } from '@/scene/layout';

export const CELL_WIDTH = 5;
export const CELL_HEIGHT = 4.8;
export const CATALOG_ZOOM = 40;
const GROUND_DROP = 0.6;
const LEFT_MARGIN = 0.3;
const SCREEN_RIGHT: Vec2 = [Math.SQRT1_2, -Math.SQRT1_2];
const SCREEN_DOWN: Vec2 = [Math.sqrt(1.5), Math.sqrt(1.5)];

/** Returns the point of the ground that the isometric camera shows this many units to the right of and below the origin. */
export function screenToGround(right: number, down: number): Vec2 {
  return [right * SCREEN_RIGHT[0] + down * SCREEN_DOWN[0], right * SCREEN_RIGHT[1] + down * SCREEN_DOWN[1]];
}

/** Returns where the cell in this column and row stands on the ground, so the cells line up in rows and columns on the screen. */
export function cellPosition(column: number, row: number): Vec2 {
  return screenToGround(column * CELL_WIDTH, row * CELL_HEIGHT);
}

/** Returns the point the camera looks at so a grid of this size fills its canvas, with a margin on the left for the labels that stick out, and each piece standing low in its cell to leave room for its label above. */
export function catalogTarget(columns: number, rows: number): Vec2 {
  return screenToGround(((columns - 1 - LEFT_MARGIN) * CELL_WIDTH) / 2, (rows / 2 - GROUND_DROP) * CELL_HEIGHT);
}

/** Returns the size in pixels of the canvas that holds a grid of this size. */
export function catalogSize(columns: number, rows: number): { width: number; height: number } {
  return { width: (columns + LEFT_MARGIN) * CELL_WIDTH * CATALOG_ZOOM, height: rows * CELL_HEIGHT * CATALOG_ZOOM };
}
