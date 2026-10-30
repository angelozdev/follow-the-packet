import { useEventListener } from '@mantine/hooks';
import Panzoom from '@panzoom/panzoom';
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, type MouseEvent, type PointerEvent, type Ref } from 'react';
import type { TriggerProps } from '@/scene/overlay/inspect-trigger';
import { ZOOM_LIMITS, clampView, fitView, panOfView, viewOfPan, zoomAt, type Box, type Point, type Size, type View, type ZoomLimits } from './camera-view';

const INSTANT = { animate: false, force: true } as const;
const NOT_PASSIVE = { passive: false };
const PASSIVE = { passive: true };
const UNLIMITED: ZoomLimits = { min: 0.01, max: 100 };
const SAME_PIXEL = 0.01;
const PRIMARY_BUTTON = 0;
const WHEEL_BY_LINES = 1;
export const DRAG_THRESHOLD_PX = 5;
const WHEEL_ZOOM_PER_PX = 0.002;
const PINCH_WHEEL_FACTOR = 10;
const LINE_PX = 16;
const WHEEL_QUIET_MS = 250;
const BUTTON_ZOOM_STEP = 1.25;

export interface CameraControls {
  zoomTo: (scale: number) => void;
}

interface Inputs {
  gap: Size | undefined;
  drawing: Box | null;
  limits: ZoomLimits;
  onMove: (() => void) | undefined;
}

interface CameraOptions {
  stage: Size;
  gap?: Size;
  drawing: Box | null;
  limits?: ZoomLimits;
  controls?: Ref<CameraControls>;
  onMove?: () => void;
}

function createController(sheet: HTMLElement, latest: { current: Inputs }) {
  const stage = sheet.parentElement as HTMLElement;
  const sheetCenter = (): Point => ({ x: sheet.offsetWidth / 2, y: sheet.offsetHeight / 2 });
  const room = (): Size => latest.current.gap ?? stage.getBoundingClientRect();
  const gapCenter = (): Point => ({ x: room().width / 2, y: room().height / 2 });
  const kept = (view: View): View => {
    const { drawing } = latest.current;
    return drawing ? clampView(view, room(), drawing) : view;
  };
  const fitted = (): View => {
    const { drawing, limits } = latest.current;
    return fitView(room(), drawing as Box, limits);
  };
  const startOf = (view: View) => {
    const pan = panOfView(kept(view), sheetCenter());
    return { startScale: pan.scale, startX: pan.x, startY: pan.y };
  };
  const camera = Panzoom(sheet, {
    noBind: true,
    canvas: true,
    touchAction: '',
    minScale: UNLIMITED.min,
    maxScale: UNLIMITED.max,
    handleStartEvent: () => undefined,
    ...startOf(fitted()),
    setTransform: (element, pan) => {
      const view = viewOfPan(pan, sheetCenter());
      const inside = kept(view);
      const next = panOfView(inside, sheetCenter());
      element.style.transform = `scale(${next.scale}) translate(${next.x}px, ${next.y}px)`;
      if (Math.abs(inside.x - view.x) > SAME_PIXEL || Math.abs(inside.y - view.y) > SAME_PIXEL) camera.pan(next.x, next.y, INSTANT);
      latest.current.onMove?.();
    },
  });
  const apply = (view: View) => {
    stage.scrollLeft = 0;
    stage.scrollTop = 0;
    camera.reset({ ...startOf(view), animate: false });
  };
  const current = (): View => {
    const view = viewOfPan({ scale: camera.getScale(), ...camera.getPan() }, sheetCenter());
    return { ...view, x: view.x - stage.scrollLeft, y: view.y - stage.scrollTop };
  };
  const zoomBy = (factor: number) => apply(zoomAt(current(), gapCenter(), current().scale * factor, latest.current.limits));
  const absorbTheScroll = () => {
    if (stage.scrollLeft !== 0 || stage.scrollTop !== 0) apply(current());
  };

  let pressed = false;
  let origin: Point | null = null;
  let lastWheelAt = -Infinity;
  const release = (event: globalThis.PointerEvent) => {
    pressed = false;
    camera.handleUp(event);
  };
  stage.addEventListener('scroll', absorbTheScroll);
  document.addEventListener('pointermove', camera.handleMove, PASSIVE);
  document.addEventListener('pointerup', release, PASSIVE);
  document.addEventListener('pointercancel', release, PASSIVE);

  return {
    fit: () => apply(fitted()),
    zoomIn: () => zoomBy(BUTTON_ZOOM_STEP),
    zoomOut: () => zoomBy(1 / BUTTON_ZOOM_STEP),
    zoomTo: (scale: number) => apply(zoomAt(current(), gapCenter(), scale, UNLIMITED)),
    press: (event: globalThis.PointerEvent) => {
      if (event.button !== PRIMARY_BUTTON) return;
      pressed = true;
      origin = { x: event.clientX, y: event.clientY };
      camera.handleDown(event);
    },
    wasDragged: (event: globalThis.MouseEvent) => {
      const far = origin !== null && event.detail > 0 && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > DRAG_THRESHOLD_PX;
      origin = null;
      return far;
    },
    wheel: (event: WheelEvent) => {
      lastWheelAt = event.timeStamp;
      const pixels = event.deltaMode === WHEEL_BY_LINES ? event.deltaY * LINE_PX : event.deltaY;
      const perPixel = WHEEL_ZOOM_PER_PX * (event.ctrlKey ? PINCH_WHEEL_FACTOR : 1);
      const { left, top } = stage.getBoundingClientRect();
      const view = current();
      apply(zoomAt(view, { x: event.clientX - left, y: event.clientY - top }, view.scale * Math.exp(-pixels * perPixel), latest.current.limits));
    },
    isMoving: (event: { timeStamp: number }) => pressed || event.timeStamp - lastWheelAt < WHEEL_QUIET_MS,
    destroy: () => {
      stage.removeEventListener('scroll', absorbTheScroll);
      document.removeEventListener('pointermove', camera.handleMove);
      document.removeEventListener('pointerup', release);
      document.removeEventListener('pointercancel', release);
      camera.destroy();
    },
  };
}

type Controller = ReturnType<typeof createController>;

export function useCamera({ stage, gap, drawing, limits = ZOOM_LIMITS, controls, onMove }: CameraOptions) {
  const sheet = useRef<HTMLDivElement>(null);
  const controller = useRef<Controller | null>(null);
  const latest = useRef<Inputs>({ gap, drawing, limits, onMove });
  const ready = drawing !== null;

  useLayoutEffect(() => {
    latest.current = { gap, drawing, limits, onMove };
  });

  useEffect(() => {
    if (!ready || sheet.current === null) return;
    controller.current = createController(sheet.current, latest);
    return () => {
      controller.current?.destroy();
      controller.current = null;
    };
  }, [ready]);

  useEffect(() => {
    controller.current?.fit();
  }, [stage.width, stage.height, gap?.width, gap?.height, ready]);

  useImperativeHandle(controls, () => ({ zoomTo: (scale) => controller.current?.zoomTo(scale) }), []);

  const turnTheWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    controller.current?.wheel(event);
  }, []);
  const wheelRef = useEventListener('wheel', turnTheWheel, NOT_PASSIVE);

  const quietly = <Args extends unknown[]>(trigger: (...args: Args) => TriggerProps) => {
    return (...args: Args): TriggerProps => {
      const props = trigger(...args);
      const unlessMoving = <E extends { timeStamp: number }>(handler: ((event: E) => void) | undefined) => (event: E) => {
        if (!controller.current?.isMoving(event)) handler?.(event);
      };
      return { ...props, onPointerEnter: unlessMoving(props.onPointerEnter), onFocus: unlessMoving(props.onFocus) };
    };
  };

  return {
    sheet,
    stageRef: wheelRef,
    quietly,
    fit: useCallback(() => controller.current?.fit(), []),
    zoomIn: useCallback(() => controller.current?.zoomIn(), []),
    zoomOut: useCallback(() => controller.current?.zoomOut(), []),
    onPointerDown: (event: PointerEvent<HTMLElement>) => controller.current?.press(event.nativeEvent),
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (!controller.current?.wasDragged(event.nativeEvent)) return;
      event.stopPropagation();
      event.preventDefault();
    },
  };
}
