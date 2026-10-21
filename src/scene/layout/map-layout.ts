import type { Network } from '@/engine';
import { COMPACT, MIN_WIDTH, NORMAL, type MapLayout, type RowLayout, type RowPiece, type TabRoom } from './arrange/geometry';
import { layoutRow } from './arrange/row';
import { layoutStack } from './arrange/stack';
import { MIN_CUT, cutPieces, longestLabel } from './label-cut';

export interface MapOptions extends TabRoom {
  width: number;
}

function snakeWithLabelsCut(world: Network, pieces: readonly RowPiece[], available: number, room: TabRoom): RowLayout | undefined {
  for (let characters = longestLabel(pieces) - 1; characters >= MIN_CUT; characters--) {
    const cut = layoutStack(world, cutPieces(pieces, characters), available, room);
    if (cut.size.width <= available) return cut;
  }
  return undefined;
}

/** Takes a world, the pieces the map draws and the width it has; returns the map in the first mode whose natural width fits: the row, the compact row, and the snake, which is as wide as the width it is given. A width under 360 px counts as 360 px. The layout says its `mode`. It never reads what the player sent. With `blockTab` it leaves 18 px over the first row of each floor, and over each outline of a block that starts lower, for the tab of an outline, and changes no width. When the snake would be wider than its width because a label of one line is too long, the labels of one line are cut (`cutPieces`) to the most characters, never fewer than 12, that bring it back to its width, and the boxes of the layout are the ones of the cut labels; with no such cut the snake widens as `layoutStack` does. A label of two lines is never cut. */
export function layoutMap(world: Network, pieces: readonly RowPiece[], { width, blockTab }: MapOptions): MapLayout {
  const available = Math.max(width, MIN_WIDTH);
  const room = { blockTab };
  const row = layoutRow(world, pieces, NORMAL, room);
  if (row.size.width <= available) return { ...row, mode: 'row' };
  const compact = layoutRow(world, pieces, COMPACT, room);
  if (compact.size.width <= available) return { ...compact, mode: 'row-compact' };
  const stack = layoutStack(world, pieces, available, room);
  const fitted = stack.size.width <= available ? stack : (snakeWithLabelsCut(world, pieces, available, room) ?? stack);
  return { ...fitted, mode: 'stack' };
}
