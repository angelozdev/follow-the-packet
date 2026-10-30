import { describe, expect, it } from 'vitest';
import { KEEP_IN_VIEW_PX, bringIntoView, clampView, fitView, panOfView, viewOfPan, zoomAt, type Box, type Point, type ZoomLimits } from './camera-view';

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

describe('the initial view', () => {
  const huge: Box = { x: 0, y: 0, width: 2000, height: 900 };
  const piece = { x: 1500, y: 100 };

  it('the initial view centers the piece it is given when the drawing does not fit at the minimum zoom', () => {
    const view = fitView(GAP, huge, LIMITS, piece);
    expect(view.scale).toBe(0.5);
    expect(screenOf(view, piece)).toEqual({ x: GAP.width / 2, y: GAP.height / 2 });
  });

  it('keeps the fit of an axis on which the drawing fits and centers the piece on the other', () => {
    const wide: Box = { x: 0, y: 0, width: 2000, height: 300 };
    const view = fitView(GAP, wide, LIMITS, { x: 1500, y: 40 });
    expect(view.scale).toBe(0.5);
    expect(screenOf(view, { x: 1500, y: 40 }).x).toBe(GAP.width / 2);
    expect(view.y).toBeCloseTo(0, 9);
  });

  it('is the plain fit when the drawing fits or when there is no piece', () => {
    expect(fitView(GAP, NARROW_DRAWING, LIMITS, { x: 150, y: 20 })).toEqual(fitView(GAP, NARROW_DRAWING, LIMITS));
    const shrunk = fitView(GAP, { x: 0, y: 0, width: 1000, height: 700 }, LIMITS, { x: 900, y: 600 });
    expect(shrunk).toEqual(fitView(GAP, { x: 0, y: 0, width: 1000, height: 700 }, LIMITS));
    expect(screenOf(fitView(GAP, huge, LIMITS), { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
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

describe('clampView', () => {
  const view = (x: number, y: number) => ({ scale: 1, x, y });

  it('a pan is clamped so that part of the drawing stays in the window', () => {
    const drawing: Box = { x: 0, y: 0, width: 800, height: 600 };
    const farRight = clampView(view(5000, 0), GAP, drawing);
    expect(farRight.x).toBe(GAP.width - KEEP_IN_VIEW_PX);
    const farLeft = clampView(view(-5000, 0), GAP, drawing);
    expect(farLeft.x).toBe(KEEP_IN_VIEW_PX - drawing.width);
    const farDown = clampView(view(0, 5000), GAP, drawing);
    expect(farDown.y).toBe(GAP.height - KEEP_IN_VIEW_PX);
    const farUp = clampView(view(0, -5000), GAP, drawing);
    expect(farUp.y).toBe(KEEP_IN_VIEW_PX - drawing.height);
    expect(clampView(view(-30, -40), GAP, drawing)).toEqual(view(-30, -40));
  });

  it('counts the place of the drawing in its sheet and the zoom', () => {
    const drawing: Box = { x: 100, y: 0, width: 400, height: 300 };
    const zoomed = clampView({ scale: 0.5, x: 5000, y: 0 }, GAP, drawing);
    expect(screenOf(zoomed, { x: drawing.x, y: 0 }).x).toBe(GAP.width - KEEP_IN_VIEW_PX);
    const small: Box = { x: 0, y: 0, width: 40, height: 30 };
    const whole = clampView(view(5000, 5000), GAP, small);
    expect(whole).toEqual(view(GAP.width - small.width, GAP.height - small.height));
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

describe('bringIntoView', () => {
  const view = { scale: 0.5, x: 40, y: 10 };
  const label: Box = { x: 100, y: 100, width: 80, height: 20 };

  it('bringing a label into the gap pans the least and keeps the zoom', () => {
    expect(bringIntoView(view, label, GAP)).toEqual(view);
    expect(bringIntoView(view, { ...label, x: 1200 }, GAP)).toEqual({ scale: 0.5, x: -40, y: 10 });
    expect(bringIntoView(view, { ...label, x: -200 }, GAP)).toEqual({ scale: 0.5, x: 100, y: 10 });
    expect(bringIntoView(view, { ...label, y: 900 }, GAP)).toEqual({ scale: 0.5, x: 40, y: -60 });
    expect(bringIntoView(view, { ...label, y: -40 }, GAP)).toEqual({ scale: 0.5, x: 40, y: 20 });
    expect(bringIntoView(view, { ...label, x: 1200, y: 900 }, GAP)).toEqual({ scale: 0.5, x: -40, y: -60 });
    const edge = { ...label, x: (GAP.width - 40 - 0.5 * label.width) / 0.5 };
    expect(bringIntoView(view, edge, GAP)).toEqual(view);
  });

  it('a label wider than the gap is brought in by its start', () => {
    expect(bringIntoView(view, { ...label, x: 1200, width: 1600 }, GAP)).toEqual({ scale: 0.5, x: -600, y: 10 });
  });
});
