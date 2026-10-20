import { describe, expect, it } from 'vitest';
import type { Box } from '@/scene/layout/arrange/geometry';
import { crowds, grown, holds } from './boxes';

const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });

describe('crowds', () => {
  it('is true for boxes that share an area and false for boxes that only touch or stand apart', () => {
    const base = box(0, 0, 40, 20);
    expect(crowds(base, box(39, 19, 40, 20))).toBe(true);
    expect(crowds(base, box(10, 5, 5, 5))).toBe(true);
    expect(crowds(base, box(40, 0, 40, 20))).toBe(false);
    expect(crowds(base, box(0, 20, 40, 20))).toBe(false);
    expect(crowds(base, box(-40, 0, 40, 20))).toBe(false);
    expect(crowds(base, box(41, 0, 40, 20))).toBe(false);
    expect(crowds(base, box(0, -21, 40, 20))).toBe(false);
  });

  it('does not count the rounding noise of a float as an overlap, and counts a hundredth of a pixel', () => {
    const base = box(0, 0, 40, 20);
    expect(crowds(base, box(40 - 1e-9, 0, 40, 20))).toBe(false);
    expect(crowds(base, box(0, 20 - 1e-9, 40, 20))).toBe(false);
    expect(crowds(base, box(40 - 0.01, 0, 40, 20))).toBe(true);
    expect(crowds(base, box(0, 20 - 0.01, 40, 20))).toBe(true);
  });
});

describe('holds', () => {
  it('is true for a box inside another one, flush against its edges included, and false for one that sticks out', () => {
    const outer = box(0, 0, 100, 50);
    expect(holds(outer, box(10, 10, 20, 20))).toBe(true);
    expect(holds(outer, outer)).toBe(true);
    expect(holds(outer, box(80, 30, 20, 20))).toBe(true);
    expect(holds(outer, box(-0.01, 10, 20, 20))).toBe(false);
    expect(holds(outer, box(10, -0.01, 20, 20))).toBe(false);
    expect(holds(outer, box(80.01, 10, 20, 20))).toBe(false);
    expect(holds(outer, box(10, 30.01, 20, 20))).toBe(false);
  });

  it('forgives the rounding noise of a float', () => {
    const outer = box(0, 0, 100, 50);
    expect(holds(outer, box(-1e-9, 0, 100 + 2e-9, 50))).toBe(true);
    expect(holds(outer, box(0, -1e-9, 100, 50 + 2e-9))).toBe(true);
  });
});

describe('grown', () => {
  it('adds the distance on each of the four sides of a box, so a box that only touched another one then crowds it', () => {
    const base = box(10, 20, 40, 30);
    expect(grown(base, 0.5)).toEqual(box(9.5, 19.5, 41, 31));
    expect(grown(base, 0)).toEqual(base);
    expect(crowds(box(50, 20, 10, 30), base)).toBe(false);
    expect(crowds(box(50, 20, 10, 30), grown(base, 0.5))).toBe(true);
  });
});
