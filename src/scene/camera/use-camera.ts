import Panzoom from '@panzoom/panzoom';
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react';
import { ZOOM_LIMITS, fitView, panOfView, viewOfPan, zoomAt, type Box, type Point, type Size, type View, type ZoomLimits } from './camera-view';

const UNLIMITED: ZoomLimits = { min: 0.01, max: 100 };

export interface CameraControls {
  zoomTo: (scale: number) => void;
}

interface Inputs {
  gap: Size | undefined;
  drawing: Box | null;
  limits: ZoomLimits;
}

interface CameraOptions {
  stage: Size;
  gap?: Size;
  drawing: Box | null;
  limits?: ZoomLimits;
  controls?: Ref<CameraControls>;
}

function createController(sheet: HTMLElement, latest: { current: Inputs }) {
  const stage = sheet.parentElement as HTMLElement;
  const sheetCenter = (): Point => ({ x: sheet.offsetWidth / 2, y: sheet.offsetHeight / 2 });
  const room = (): Size => latest.current.gap ?? stage.getBoundingClientRect();
  const gapCenter = (): Point => ({ x: room().width / 2, y: room().height / 2 });
  const fitted = (): View => {
    const { drawing, limits } = latest.current;
    return fitView(room(), drawing as Box, limits);
  };
  const startOf = (view: View) => {
    const pan = panOfView(view, sheetCenter());
    return { startScale: pan.scale, startX: pan.x, startY: pan.y };
  };
  const camera = Panzoom(sheet, {
    noBind: true,
    canvas: true,
    touchAction: '',
    minScale: UNLIMITED.min,
    maxScale: UNLIMITED.max,
    ...startOf(fitted()),
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
  const absorbTheScroll = () => {
    if (stage.scrollLeft !== 0 || stage.scrollTop !== 0) apply(current());
  };
  stage.addEventListener('scroll', absorbTheScroll);
  return {
    fit: () => apply(fitted()),
    zoomTo: (scale: number) => apply(zoomAt(current(), gapCenter(), scale, UNLIMITED)),
    destroy: () => {
      stage.removeEventListener('scroll', absorbTheScroll);
      camera.destroy();
    },
  };
}

type Controller = ReturnType<typeof createController>;

export function useCamera({ stage, gap, drawing, limits = ZOOM_LIMITS, controls }: CameraOptions) {
  const sheet = useRef<HTMLDivElement>(null);
  const controller = useRef<Controller | null>(null);
  const latest = useRef<Inputs>({ gap, drawing, limits });
  const ready = drawing !== null;

  useLayoutEffect(() => {
    latest.current = { gap, drawing, limits };
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

  return { sheet };
}
