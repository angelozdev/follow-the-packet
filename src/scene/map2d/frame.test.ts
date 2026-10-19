import { describe, expect, it } from 'vitest';
import { TITLE_BAR } from '@/scene/map2d/cards/placement';
import { frameOf } from './frame';

describe('frameOf', () => {
  it('centers a drawing narrower than its box and puts it under the title bar', () => {
    expect(frameOf(1000, { width: 600, height: 400 })).toEqual({ x: 200, y: TITLE_BAR });
  });

  it('keeps whole pixels when the box and the drawing differ by an odd number', () => {
    expect(frameOf(601, { width: 600, height: 400 }).x).toBe(0);
    expect(frameOf(603, { width: 600, height: 400 }).x).toBe(1);
  });

  it('puts a drawing as wide as its box, or wider, against the left edge', () => {
    expect(frameOf(390, { width: 390, height: 700 }).x).toBe(0);
    expect(frameOf(320, { width: 360, height: 700 }).x).toBe(0);
  });
});
