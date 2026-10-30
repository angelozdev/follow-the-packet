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

export function fitView(gap: Size, drawing: Box, limits: ZoomLimits): View {
  const heightScale = gap.height > 0 ? gap.height / drawing.height : 1;
  const scale = Math.max(limits.min, Math.min(1, gap.width / drawing.width, heightScale));
  const width = scale * drawing.width;
  const x = width <= gap.width ? Math.floor((gap.width - width) / 2) : 0;
  return { scale, x: x - scale * drawing.x, y: -scale * drawing.y };
}

export function zoomAt(view: View, point: Point, scale: number, limits: ZoomLimits): View {
  const next = Math.min(limits.max, Math.max(limits.min, scale));
  const ratio = next / view.scale;
  return { scale: next, x: point.x - (point.x - view.x) * ratio, y: point.y - (point.y - view.y) * ratio };
}

export function viewOfPan(pan: View, center: Point): View {
  return { scale: pan.scale, x: center.x * (1 - pan.scale) + pan.scale * pan.x, y: center.y * (1 - pan.scale) + pan.scale * pan.y };
}

export function panOfView(view: View, center: Point): View {
  return { scale: view.scale, x: (view.x - center.x * (1 - view.scale)) / view.scale, y: (view.y - center.y * (1 - view.scale)) / view.scale };
}
