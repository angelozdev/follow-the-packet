import { describe, expect, it } from 'vitest';
import type { Vec2 } from '@/scene/layout';
import { CATALOG_ZOOM, CELL_HEIGHT, CELL_WIDTH, catalogSize, catalogTarget, cellPosition, screenToGround } from './catalog-grid';

function onScreen([x, z]: Vec2): Vec2 {
  return [(x - z) / Math.SQRT2, (x + z) / Math.sqrt(6)];
}

describe('catalog grid', () => {
  it('moves right and down on the screen of the isometric camera, and nothing else', () => {
    const [right, down] = onScreen(screenToGround(3, 2));
    expect(right).toBeCloseTo(3);
    expect(down).toBeCloseTo(2);
  });

  it('puts the cells of a row side by side and the rows one below the other', () => {
    const [right, down] = onScreen(cellPosition(2, 3));
    expect(right).toBeCloseTo(2 * CELL_WIDTH);
    expect(down).toBeCloseTo(3 * CELL_HEIGHT);
  });

  it('frames the cells exactly, with a margin on the left for the labels that stick out', () => {
    const { width, height } = catalogSize(5, 10);
    const [right] = onScreen(catalogTarget(5, 10));
    const halfWidth = width / CATALOG_ZOOM / 2;
    expect(right + halfWidth).toBeCloseTo(4 * CELL_WIDTH + CELL_WIDTH / 2);
    expect(right - halfWidth).toBeLessThan(-CELL_WIDTH / 2);
    expect(height).toBe(10 * CELL_HEIGHT * CATALOG_ZOOM);
  });
});
