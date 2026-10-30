import { useEventListener } from '@mantine/hooks';
import Panzoom from '@panzoom/panzoom';
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, type FocusEvent, type KeyboardEvent, type MouseEvent, type PointerEvent, type Ref } from 'react';
import type { TriggerProps } from '@/scene/overlay/inspect-trigger';
import { SAME_PIXEL, ZOOM_LIMITS, bringIntoView, clampView, fitView, panOfView, touchView, viewOfPan, zoomAt, type Box, type Point, type Size, type View, type ZoomLimits } from './camera-view';

const INSTANT = { animate: false, force: true } as const;
const NOT_PASSIVE = { passive: false };
const PASSIVE = { passive: true };
const UNLIMITED: ZoomLimits = { min: 0.01, max: 100 };
const PRIMARY_BUTTON = 0;
const WHEEL_BY_LINES = 1;
const TOUCH = 'touch';
export const DRAG_THRESHOLD_PX = 5;
const WHEEL_ZOOM_PER_PX = 0.002;
const PINCH_WHEEL_FACTOR = 10;
const LINE_PX = 16;
const WHEEL_QUIET_MS = 250;
const BUTTON_ZOOM_STEP = 1.25;
const KEY_PAN_PX = 64;
const TOUCH_ACTION_OURS = 'none';
const CHOSEN = '[data-pinned]';
const GLIDE_MS = 250;
const GLIDE_EASING = 'ease-out';
const NO_TRANSITION = 'none';

export interface CameraControls {
  zoomTo: (scale: number) => void;
  revealChosen: () => void;
}

interface Inputs {
  gap: Size | undefined;
  drawing: Box | null;
  limits: ZoomLimits;
  start: Point | undefined;
  still: boolean;
  onMove: (() => void) | undefined;
}

interface CameraOptions {
  stage: Size;
  gap?: Size;
  drawing: Box | null;
  limits?: ZoomLimits;
  start?: Point;
  still?: boolean;
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
    const { drawing, limits, start } = latest.current;
    return fitView(room(), drawing as Box, limits, start);
  };
  let written = '';
  const place = (pan: View) => {
    const value = `scale(${pan.scale}) translate(${pan.x}px, ${pan.y}px)`;
    if (value === written) return;
    written = value;
    sheet.style.transform = value;
    latest.current.onMove?.();
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
    duration: GLIDE_MS,
    easing: GLIDE_EASING,
    handleStartEvent: () => undefined,
    ...startOf(fitted()),
    setTransform: (_element, pan) => {
      const view = viewOfPan(pan, sheetCenter());
      const inside = kept(view);
      const next = panOfView(inside, sheetCenter());
      if (Math.abs(inside.x - view.x) > SAME_PIXEL || Math.abs(inside.y - view.y) > SAME_PIXEL) camera.pan(next.x, next.y, INSTANT);
      place(next);
    },
  });
  const apply = (view: View, smooth = false) => {
    stage.scrollLeft = 0;
    stage.scrollTop = 0;
    const start = startOf(view);
    const glides = smooth && !latest.current.still;
    camera.reset({ ...start, animate: glides });
    if (glides) return;
    sheet.style.transition = NO_TRANSITION;
    place({ scale: start.startScale, x: start.startX, y: start.startY });
  };
  const gliding = () => typeof sheet.getAnimations === 'function' && sheet.getAnimations().length > 0;
  const current = (): View => {
    const view = viewOfPan({ scale: camera.getScale(), ...camera.getPan() }, sheetCenter());
    return { ...view, x: view.x - stage.scrollLeft, y: view.y - stage.scrollTop };
  };
  const panBy = (dx: number, dy: number) => {
    const view = current();
    apply({ ...view, x: view.x - dx, y: view.y - dy });
  };
  const zoomBy = (factor: number) => apply(zoomAt(current(), gapCenter(), current().scale * factor, latest.current.limits));
  const absorbTheScroll = () => {
    if (stage.scrollLeft !== 0 || stage.scrollTop !== 0) apply(current());
  };
  const boxInSheet = (element: Element): Box => {
    const own = element.getBoundingClientRect();
    const origin = sheet.getBoundingClientRect();
    const zoom = origin.width / sheet.offsetWidth;
    return { x: (own.left - origin.left) / zoom, y: (own.top - origin.top) / zoom, width: own.width / zoom, height: own.height / zoom };
  };

  const reveal = (element: Element, smooth: boolean) => {
    const view = current();
    const next = bringIntoView(view, boxInSheet(element), room());
    if (Math.hypot(next.x - view.x, next.y - view.y) > SAME_PIXEL) apply(next, smooth);
  };

  const inGap = (event: { clientX: number; clientY: number }): Point => {
    const { left, top } = stage.getBoundingClientRect();
    return { x: event.clientX - left - sheet.offsetLeft, y: event.clientY - top - sheet.offsetTop };
  };

  let pressed = false;
  let origin: Point | null = null;
  let lastWheelAt = -Infinity;
  const fingers = new Map<number, Point>();
  const oneFingerIsOurs = () => getComputedStyle(stage).touchAction === TOUCH_ACTION_OURS;
  const move = (event: globalThis.PointerEvent) => {
    if (!fingers.has(event.pointerId)) {
      camera.handleMove(event);
      return;
    }
    const before = [...fingers.values()];
    fingers.set(event.pointerId, inGap(event));
    if (before.length > 1 || oneFingerIsOurs()) apply(touchView(current(), before, [...fingers.values()], latest.current.limits));
  };
  const release = (event: globalThis.PointerEvent) => {
    pressed = false;
    fingers.delete(event.pointerId);
    camera.handleUp(event);
  };
  stage.addEventListener('scroll', absorbTheScroll);
  document.addEventListener('pointermove', move, PASSIVE);
  document.addEventListener('pointerup', release, PASSIVE);
  document.addEventListener('pointercancel', release, PASSIVE);

  return {
    fit: (smooth: boolean) => apply(fitted(), smooth),
    zoomIn: () => zoomBy(BUTTON_ZOOM_STEP),
    zoomOut: () => zoomBy(1 / BUTTON_ZOOM_STEP),
    panBy,
    zoomTo: (scale: number) => apply(zoomAt(current(), gapCenter(), scale, UNLIMITED)),
    reveal,
    land: (element: Element) => {
      if (gliding()) apply(current());
      reveal(element, false);
    },
    isGliding: gliding,
    press: (event: globalThis.PointerEvent) => {
      if (event.button !== PRIMARY_BUTTON) return;
      pressed = true;
      origin = { x: event.clientX, y: event.clientY };
      if (event.pointerType === TOUCH) fingers.set(event.pointerId, inGap(event));
      else camera.handleDown(event);
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
      const view = current();
      apply(zoomAt(view, inGap(event), view.scale * Math.exp(-pixels * perPixel), latest.current.limits));
    },
    isPressed: () => pressed,
    isMoving: (event: { timeStamp: number }) => pressed || event.timeStamp - lastWheelAt < WHEEL_QUIET_MS,
    destroy: () => {
      stage.removeEventListener('scroll', absorbTheScroll);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', release);
      document.removeEventListener('pointercancel', release);
      camera.destroy();
    },
  };
}

type Controller = ReturnType<typeof createController>;

const CAMERA_KEYS = new Map<string, (controller: Controller) => void>([
  ['ArrowLeft', (controller) => controller.panBy(-KEY_PAN_PX, 0)],
  ['ArrowRight', (controller) => controller.panBy(KEY_PAN_PX, 0)],
  ['ArrowUp', (controller) => controller.panBy(0, -KEY_PAN_PX)],
  ['ArrowDown', (controller) => controller.panBy(0, KEY_PAN_PX)],
  ['+', (controller) => controller.zoomIn()],
  ['-', (controller) => controller.zoomOut()],
]);

export function useCamera({ stage, gap, drawing, limits = ZOOM_LIMITS, start, still = false, controls, onMove }: CameraOptions) {
  const sheet = useRef<HTMLDivElement>(null);
  const controller = useRef<Controller | null>(null);
  const latest = useRef<Inputs>({ gap, drawing, limits, start, still, onMove });
  const ready = drawing !== null;

  useLayoutEffect(() => {
    latest.current = { gap, drawing, limits, start, still, onMove };
  });

  useEffect(() => {
    if (!ready || sheet.current === null) return;
    controller.current = createController(sheet.current, latest);
    return () => {
      controller.current?.destroy();
      controller.current = null;
    };
  }, [ready]);

  const placed = useRef(false);
  useEffect(() => {
    controller.current?.fit(placed.current);
    placed.current = ready;
  }, [stage.width, stage.height, gap?.width, gap?.height, ready]);

  useImperativeHandle(
    controls,
    () => ({
      zoomTo: (scale) => controller.current?.zoomTo(scale),
      revealChosen: () => {
        const chosen = sheet.current?.querySelector(CHOSEN);
        if (chosen) controller.current?.reveal(chosen, true);
      },
    }),
    [],
  );

  const turnTheWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    controller.current?.wheel(event);
  }, []);
  const wheelRef = useEventListener('wheel', turnTheWheel, NOT_PASSIVE);

  const quietly = <Args extends unknown[]>(trigger: (...args: Args) => TriggerProps) => {
    return (...args: Args): TriggerProps => {
      const props = trigger(...args);
      const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
        if (!controller.current?.isMoving(event) && !controller.current?.isGliding()) props.onPointerEnter?.(event);
      };
      const onFocus = (event: FocusEvent<HTMLElement>) => {
        if (controller.current?.isPressed()) return;
        controller.current?.land(event.currentTarget);
        if (!controller.current?.isMoving(event)) props.onFocus?.(event);
      };
      return { ...props, onPointerEnter, onFocus };
    };
  };

  return {
    sheet,
    stageRef: wheelRef,
    quietly,
    fit: useCallback(() => controller.current?.fit(true), []),
    zoomIn: useCallback(() => controller.current?.zoomIn(), []),
    zoomOut: useCallback(() => controller.current?.zoomOut(), []),
    onPointerDown: (event: PointerEvent<HTMLElement>) => controller.current?.press(event.nativeEvent),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      const act = CAMERA_KEYS.get(event.key);
      if (!act || !controller.current || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      act(controller.current);
    },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (!controller.current?.wasDragged(event.nativeEvent)) return;
      event.stopPropagation();
      event.preventDefault();
    },
  };
}
