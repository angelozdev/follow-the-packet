export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Box extends Point, Size {}

export interface View {
  scale: number;
  x: number;
  y: number;
}

export interface ZoomLimits {
  min: number;
  max: number;
}

export const MIN_ZOOM = 0.7;
export const MAX_ZOOM = 2;
export const ZOOM_LIMITS: ZoomLimits = { min: MIN_ZOOM, max: MAX_ZOOM };
export const KEEP_IN_VIEW_PX = 96;

export const SAME_PIXEL = 0.01;

function centerOnAxis(point: number, room: number, scale: number, edge: number, extent: number): number {
  const farthestFromTheEdge = room - scale * (edge + extent);
  const nearestToTheEdge = -scale * edge;
  return Math.min(nearestToTheEdge, Math.max(farthestFromTheEdge, room / 2 - scale * point));
}

export function fitView(gap: Size, drawing: Box, limits: ZoomLimits, start?: Point): View {
  const heightScale = gap.height > 0 ? gap.height / drawing.height : 1;
  const scale = Math.max(limits.min, Math.min(1, gap.width / drawing.width, heightScale));
  const [width, height] = [scale * drawing.width, scale * drawing.height];
  const tooWide = width - gap.width > SAME_PIXEL;
  const tooTall = gap.height > 0 && height - gap.height > SAME_PIXEL;
  const sideways = width <= gap.width ? Math.floor((gap.width - width) / 2) : 0;
  return {
    scale,
    x: tooWide && start ? centerOnAxis(start.x, gap.width, scale, drawing.x, drawing.width) : sideways - scale * drawing.x,
    y: tooTall && start ? centerOnAxis(start.y, gap.height, scale, drawing.y, drawing.height) : -scale * drawing.y,
  };
}

export function zoomAt(
  view: View,
  point: Point,
  scale: number,
  limits: ZoomLimits,
): View {
  const next = Math.min(limits.max, Math.max(limits.min, scale));
  const ratio = next / view.scale;
  return {
    scale: next,
    x: point.x - (point.x - view.x) * ratio,
    y: point.y - (point.y - view.y) * ratio,
  };
}

function middleOf([first, second]: readonly Point[]): Point {
  return second ? { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 } : first;
}

function spanOf([first, second]: readonly Point[]): number {
  return second ? Math.hypot(second.x - first.x, second.y - first.y) : 0;
}

export function touchView(view: View, before: readonly Point[], after: readonly Point[], limits: ZoomLimits): View {
  const [from, to] = [middleOf(before), middleOf(after)];
  const wasApart = spanOf(before);
  const zoomed = wasApart > 0 ? zoomAt(view, from, (view.scale * spanOf(after)) / wasApart, limits) : view;
  return { ...zoomed, x: zoomed.x + to.x - from.x, y: zoomed.y + to.y - from.y };
}

function clampAxis(
  offset: number,
  start: number,
  extent: number,
  room: number,
): number {
  const keep = Math.min(KEEP_IN_VIEW_PX, extent, room);
  return Math.min(Math.max(offset, keep - extent - start), room - keep - start);
}

export function clampView(view: View, gap: Size, drawing: Box): View {
  const { scale } = view;
  return {
    scale,
    x: clampAxis(view.x, scale * drawing.x, scale * drawing.width, gap.width),
    y: clampAxis(view.y, scale * drawing.y, scale * drawing.height, gap.height),
  };
}

function nudgeAxis(start: number, extent: number, room: number): number {
  if (room <= 0) return 0;
  if (start < 0 || extent > room) return -start;
  return Math.min(0, room - start - extent);
}

export function bringIntoView(view: View, box: Box, gap: Size): View {
  const { scale } = view;
  return {
    scale,
    x: view.x + nudgeAxis(view.x + scale * box.x, scale * box.width, gap.width),
    y:
      view.y +
      nudgeAxis(view.y + scale * box.y, scale * box.height, gap.height),
  };
}

export function viewOfPan(pan: View, center: Point): View {
  return {
    scale: pan.scale,
    x: center.x * (1 - pan.scale) + pan.scale * pan.x,
    y: center.y * (1 - pan.scale) + pan.scale * pan.y,
  };
}

export function panOfView(view: View, center: Point): View {
  return {
    scale: view.scale,
    x: (view.x - center.x * (1 - view.scale)) / view.scale,
    y: (view.y - center.y * (1 - view.scale)) / view.scale,
  };
}
