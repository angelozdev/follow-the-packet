import { describe, expect, it } from 'vitest';
import { fitView, panOfView, viewOfPan, zoomAt, type Box, type Point, type ZoomLimits } from './camera-view';

const LIMITS: ZoomLimits = { min: 0.5, max: 2 };
const GAP = { width: 600, height: 400 };
const NARROW_DRAWING: Box = { x: 100, y: 0, width: 400, height: 300 };
const screenOf = (view: { scale: number; x: number; y: number }, point: Point): Point => ({ x: view.x + view.scale * point.x, y: view.y + view.scale * point.y });

describe('fitView', () => {
  it('the fit draws at zoom 1 a drawing that fits the gap, centered sideways and against its top', () => {
    const view = fitView(GAP, NARROW_DRAWING, LIMITS);
    expect(view.scale).toBe(1);
    expect(screenOf(view, { x: NARROW_DRAWING.x, y: NARROW_DRAWING.y })).toEqual({ x: 100, y: 0 });
    const alone = fitView(GAP, { x: 0, y: 0, width: 401, height: 300 }, LIMITS);
    expect(alone.scale).toBe(1);
    expect(screenOf(alone, { x: 0, y: 0 })).toEqual({ x: 99, y: 0 });
  });

  it('the fit shrinks a drawing that does not fit, never under the minimum zoom', () => {
    const tall: Box = { x: 0, y: 0, width: 500, height: 800 };
    expect(fitView(GAP, tall, { min: 0.25, max: 2 }).scale).toBe(0.5);
    const shrunk = fitView(GAP, tall, { min: 0.25, max: 2 });
    expect(screenOf(shrunk, { x: 0, y: 0 })).toEqual({ x: 175, y: 0 });
    const stuck = fitView(GAP, tall, { min: 0.75, max: 2 });
    expect(stuck.scale).toBe(0.75);
    expect(screenOf(stuck, { x: 0, y: 0 })).toEqual({ x: 112, y: 0 });
    const wide = fitView({ width: 300, height: 400 }, { x: 0, y: 0, width: 800, height: 100 }, { min: 0.75, max: 2 });
    expect(wide.scale).toBe(0.75);
    expect(screenOf(wide, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });
});

describe('a gap with no height yet', () => {
  it('does not shrink the drawing', () => {
    expect(fitView({ width: 600, height: 0 }, { x: 0, y: 0, width: 400, height: 900 }, LIMITS).scale).toBe(1);
  });
});

describe('zoomAt', () => {
  it('zooming at a point keeps that point still', () => {
    const view = { scale: 1, x: 10, y: -20 };
    const world = { x: 190, y: 130 };
    const point = screenOf(view, world);
    for (const scale of [0.5, 1.25, 2]) {
      const zoomed = zoomAt(view, point, scale, LIMITS);
      expect(zoomed.scale).toBe(scale);
      const after = screenOf(zoomed, world);
      expect(after.x).toBeCloseTo(point.x, 9);
      expect(after.y).toBeCloseTo(point.y, 9);
    }
  });

  it('stops at the limits', () => {
    const view = { scale: 1, x: 0, y: 0 };
    expect(zoomAt(view, { x: 0, y: 0 }, 9, LIMITS).scale).toBe(2);
    expect(zoomAt(view, { x: 0, y: 0 }, 0.1, LIMITS).scale).toBe(0.5);
  });
});

describe('the library pan', () => {
  it('goes back and forth between the library and the view', () => {
    const center = { x: 300, y: 200 };
    const view = { scale: 1.5, x: -42, y: 17 };
    const back = viewOfPan(panOfView(view, center), center);
    expect(back.scale).toBe(view.scale);
    expect(back.x).toBeCloseTo(view.x, 9);
    expect(back.y).toBeCloseTo(view.y, 9);
  });
});
