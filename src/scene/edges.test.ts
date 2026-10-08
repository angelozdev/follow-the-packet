import { describe, expect, it } from 'vitest';
import { boxEdgePoints } from './edges';

describe('boxEdgePoints', () => {
  it('da las 12 aristas de una caja como 24 puntos en pares', () => {
    const points = boxEdgePoints(2, 4, 6);
    expect(points).toHaveLength(24);
    for (const [x, y, z] of points) {
      expect(Math.abs(x)).toBe(1);
      expect(Math.abs(y)).toBe(2);
      expect(Math.abs(z)).toBe(3);
    }
    for (let i = 0; i < points.length; i += 2) {
      const differing = [0, 1, 2].filter((axis) => points[i][axis] !== points[i + 1][axis]);
      expect(differing).toHaveLength(1);
    }
  });
});
