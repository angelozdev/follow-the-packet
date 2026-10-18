import type { Network } from '@/engine';
import { COMPACT, MIN_WIDTH, NORMAL, type MapLayout, type RowPiece } from './arrange/geometry';
import { layoutRow } from './arrange/row';
import { layoutStack } from './arrange/stack';

export interface MapOptions {
  width: number;
}

/** Takes a world, the pieces the map draws and the width it has; returns the map in the first mode whose natural width fits: the row, the compact row, and the snake, which is as wide as the width it is given. A width under 360 px counts as 360 px. The layout says its `mode`. It never reads what the player sent. */
export function layoutMap(world: Network, pieces: readonly RowPiece[], { width }: MapOptions): MapLayout {
  const available = Math.max(width, MIN_WIDTH);
  const row = layoutRow(world, pieces, NORMAL);
  if (row.size.width <= available) return { ...row, mode: 'row' };
  const compact = layoutRow(world, pieces, COMPACT);
  if (compact.size.width <= available) return { ...compact, mode: 'row-compact' };
  return { ...layoutStack(world, pieces, available), mode: 'stack' };
}
