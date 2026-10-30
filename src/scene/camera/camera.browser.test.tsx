import { cleanup, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { CAMERA_TEXT } from '@/copy';
import { officeTwoFloorsNet } from '@/testing/fixtures';
import { dragFromTo, standStill, wheelAt, type Point } from '@/testing/browser-play';
import { FLOORS_LABEL_PIECES } from '@/testing/map-pieces';
import { pieceDomId } from '@/scene/overlay/piece-label';
import { layoutMap } from '@/scene/layout/map-layout';
import { MapStage, type MapStageProps } from '@/scene/map-stage';
import { KEEP_IN_VIEW_PX, MAX_ZOOM, MIN_ZOOM } from './camera-view';
import { DRAG_THRESHOLD_PX, type CameraControls } from './use-camera';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const LOW_VIEWPORT = { width: 1280, height: 600 };
const BOX_WIDTH = 1000;
const ONE_PIXEL = 1;
const ZOOMS = [0.5, 1, 2];
const SHORT_GAP_PX = 400;
const TALL_GAP_PX = 4000;
const SLOW_ENOUGH_PX = 1;
const FIXED_GAP = { width: BOX_WIDTH, height: 600 };
const DRAG_PX = { x: 80, y: 30 };
const CORNER_PX = 6;
const LUCIA = /^laptop-lucia/;
const LUCIA_PIECE = 'device:lucia-laptop';
const STEPS_TO_THE_LIMIT = 12;
const WHEELS = [
  { deltaY: -200, ctrl: false, name: 'plain, in' },
  { deltaY: 200, ctrl: false, name: 'plain, out' },
  { deltaY: -20, ctrl: true, name: 'with Ctrl, in' },
  { deltaY: 20, ctrl: true, name: 'with Ctrl, out' },
];
const LONG_DRAG_PX = 250;
const DIRECTIONS: Point[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
const RESIZED_VIEWPORT = { width: 1100, height: 700 };
const FLOORS = officeTwoFloorsNet();
const PIECES = FLOORS_LABEL_PIECES.map((piece) => ({ ...piece, state: 'normal' as const }));
const SCREEN_PROPS = { blockName: null, activePieceId: null, still: false, flows: [], sent: [], known: new Set(), inspectTrigger: () => ({}), inspectStampsTrigger: () => ({}), onActivate: () => undefined } satisfies Omit<MapStageProps, 'world' | 'pieces'>;

function mount(extras: Partial<MapStageProps> = {}, boxStyle: object = {}) {
  const view = render(
    <div data-testid="box" style={{ width: BOX_WIDTH, position: 'relative', ...boxStyle }}>
      <MapStage world={FLOORS} pieces={PIECES} {...SCREEN_PROPS} {...extras} />
    </div>,
  );
  return view.getByTestId('box');
}

function mountOnTheScreen(): HTMLElement {
  const { container } = render(
    <main className="incident">
      <div className="incident__map">
        <MapStage world={FLOORS} pieces={PIECES} {...SCREEN_PROPS} />
      </div>
    </main>,
  );
  return container.querySelector('.incident__map') as HTMLElement;
}

const part = (box: HTMLElement, selector: string) => box.querySelector(selector) as HTMLElement;
const scaleOf = (element: Element) => new DOMMatrix(getComputedStyle(element).transform).a;
const center = (element: Element) => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
};

const transformOf = (element: Element) => getComputedStyle(element).transform;
const labelOfLucia = () => page.getByRole('button', { name: LUCIA });
const button = (name: string) => page.getByRole('button', { name, exact: true });
const at = (origin: Point, towards: Point, length: number): Point => ({ x: origin.x + towards.x * length, y: origin.y + towards.y * length });

async function mountToChoose() {
  await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
  const chosen = vi.fn();
  const box = mount({ onActivate: chosen });
  return { chosen, box, svg: await theSvg(box) };
}

async function theSvg(box: HTMLElement): Promise<HTMLElement> {
  await expect.poll(() => part(box, '.map-stage__svg')).not.toBeNull();
  return part(box, '.map-stage__svg');
}

function expectSameBox(first: Element, second: Element, message: string): void {
  const [one, two] = [first, second].map((element) => element.getBoundingClientRect());
  for (const side of ['left', 'top', 'width', 'height'] as const) expect(Math.abs(one[side] - two[side]), `${message}: ${side}`).toBeLessThanOrEqual(ONE_PIXEL);
}

describe('the camera of the map', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it('the svg, the layer of the labels and the svg of the flying labels stay aligned at zoom 0.5, 1 and 2: every label is centered on its piece within 1 px', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const controls = createRef<CameraControls>();
    const box = mount({ controls });
    await expect.poll(() => part(box, '.map-stage__flight-labels')).not.toBeNull();
    const [svg, flight, layer, sheet] = ['.map-stage__svg', '.map-stage__flight-labels', '.html-layer', '.map-stage__sheet'].map((selector) => part(box, selector));
    const labelled = PIECES.flatMap((piece) => {
      const holder = layer.querySelector(`#${pieceDomId(piece.id)}`)?.parentElement;
      const drawn = svg.querySelector(`g.map-piece[data-piece="${piece.id}"]`);
      return holder && drawn ? [{ id: piece.id, holder, drawn }] : [];
    });
    expect(labelled.length, 'pieces with a label').toBeGreaterThan(5);
    const gapOfTheLabels = () => labelled.map(({ holder, drawn }) => ({ x: center(holder).x - center(drawn).x, y: center(holder).y - center(drawn).y }));
    const zoomTo = async (zoom: number) => {
      (controls.current as CameraControls).zoomTo(zoom);
      await expect.poll(() => scaleOf(sheet)).toBeCloseTo(zoom, 5);
      await standStill();
    };
    await zoomTo(1);
    const atOne = gapOfTheLabels();
    for (const zoom of ZOOMS) {
      await zoomTo(zoom);
      for (const layerOfTheMap of [svg, flight, layer]) expect(getComputedStyle(layerOfTheMap).transform, `zoom ${zoom}`).toBe('none');
      expectSameBox(svg, flight, `zoom ${zoom}: the flying labels`);
      expectSameBox(layer, sheet, `zoom ${zoom}: the layer`);
      gapOfTheLabels().forEach((gap, index) => {
        expect(Math.abs(gap.x - zoom * atOne[index].x), `zoom ${zoom}: ${labelled[index].id} sideways`).toBeLessThanOrEqual(ONE_PIXEL);
        expect(Math.abs(gap.y - zoom * atOne[index].y), `zoom ${zoom}: ${labelled[index].id} up and down`).toBeLessThanOrEqual(ONE_PIXEL);
      });
    }
  });
  it('the map is laid out at the width of the gap it is given, and at the width of its own box when it is given none', async () => {
    const widthOfTheSvg = async (box: HTMLElement) => {
      await expect.poll(() => part(box, '.map-stage__svg')).not.toBeNull();
      return Number(part(box, '.map-stage__svg').getAttribute('width'));
    };
    const GAP_WIDTH = 700;
    expect(await widthOfTheSvg(mount({}))).toBe(layoutMap(FLOORS, PIECES, { width: BOX_WIDTH }).size.width);
    cleanup();
    expect(await widthOfTheSvg(mount({ gap: { width: GAP_WIDTH, height: TALL_GAP_PX } }))).toBe(layoutMap(FLOORS, PIECES, { width: GAP_WIDTH }).size.width);
  });

  it('the camera fits a drawing taller than its gap when the map is drawn, and fits it again when the gap changes size', async () => {
    const stage = (height: number) => (
      <div data-testid="box" style={{ width: BOX_WIDTH, position: 'relative' }}>
        <MapStage world={FLOORS} pieces={PIECES} {...SCREEN_PROPS} gap={{ width: BOX_WIDTH, height }} />
      </div>
    );
    const view = render(stage(SHORT_GAP_PX));
    const box = view.getByTestId('box');
    await expect.poll(() => part(box, '.map-stage__svg')).not.toBeNull();
    const [svg, sheet] = [part(box, '.map-stage__svg'), part(box, '.map-stage__sheet')];
    await expect.poll(() => scaleOf(sheet)).toBeCloseTo(MIN_ZOOM, 5);
    const [inTheBox, inTheSvg] = [box.getBoundingClientRect(), svg.getBoundingClientRect()];
    expect(inTheSvg.top, 'against the top edge').toBeCloseTo(inTheBox.top, 0);
    expect(inTheSvg.left - inTheBox.left, 'centered sideways').toBeCloseTo((BOX_WIDTH - inTheSvg.width) / 2, 0);
    view.rerender(stage(TALL_GAP_PX));
    await expect.poll(() => scaleOf(sheet)).toBeCloseTo(1, 5);
    await expect.poll(() => svg.getBoundingClientRect().left - box.getBoundingClientRect().left).toBeLessThan(SLOW_ENOUGH_PX);
  });

  it('a label that focus brings into view moves the camera and leaves the box unscrolled', async () => {
    await page.viewport(LOW_VIEWPORT.width, LOW_VIEWPORT.height);
    const map = mountOnTheScreen();
    const stage = part(map, '.map-stage');
    await expect.poll(() => scaleOf(part(map, '.map-stage__sheet'))).toBeLessThan(1);
    const last = [...map.querySelectorAll<HTMLElement>('button.map-button')].reduce((lowest, label) => (label.getBoundingClientRect().top > lowest.getBoundingClientRect().top ? label : lowest));
    expect(last.getBoundingClientRect().bottom, 'the lowest label starts out of the box').toBeGreaterThan(stage.getBoundingClientRect().bottom);
    last.focus();
    await expect.poll(() => stage.scrollTop, { message: 'the box is not left scrolled' }).toBe(0);
    expect(stage.scrollLeft).toBe(0);
    expect(last.getBoundingClientRect().bottom, 'and the label is in view').toBeLessThanOrEqual(stage.getBoundingClientRect().bottom + SLOW_ENOUGH_PX);
  });
  it('dragging the map N px moves the drawing N px and a press without movement still chooses the piece', async () => {
    const { chosen, svg } = await mountToChoose();
    const start = svg.getBoundingClientRect();
    const from = { x: start.left + CORNER_PX, y: start.top + CORNER_PX };
    await dragFromTo(from, { x: from.x + DRAG_PX.x, y: from.y + DRAG_PX.y });
    await expect.poll(() => svg.getBoundingClientRect().left - start.left).toBeCloseTo(DRAG_PX.x, 0);
    expect(svg.getBoundingClientRect().top - start.top).toBeCloseTo(DRAG_PX.y, 0);
    expect(chosen).not.toHaveBeenCalled();
    await userEvent.click(labelOfLucia());
    expect(chosen).toHaveBeenCalledExactlyOnceWith(LUCIA_PIECE);
  });

  it('a press that moves less than the threshold still chooses the piece', async () => {
    const { chosen } = await mountToChoose();
    const label = center(labelOfLucia().element());
    await dragFromTo(label, { x: label.x + DRAG_THRESHOLD_PX - 2, y: label.y });
    expect(chosen).toHaveBeenCalledExactlyOnceWith(LUCIA_PIECE);
  });

  it('a drag longer than the threshold that ends on a piece does not choose it', async () => {
    const { chosen } = await mountToChoose();
    const label = labelOfLucia().element();
    const from = center(label);
    const to = { x: from.x + DRAG_PX.x, y: from.y };
    await dragFromTo(from, to);
    await expect.poll(() => center(label).x).toBeCloseTo(to.x, 0);
    expect(document.elementFromPoint(to.x, to.y)?.closest('button')).toBe(label);
    expect(chosen).not.toHaveBeenCalled();
  });

  it('with the wheel, plain or with Ctrl, the point under the pointer does not move', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const box = mount();
    await theSvg(box);
    const [piece, sheet] = [part(box, `g.map-piece[data-piece="${LUCIA_PIECE}"]`), part(box, '.map-stage__sheet')];
    const pointer = center(piece);
    for (const { deltaY, ctrl, name } of WHEELS) {
      const before = scaleOf(sheet);
      await wheelAt(pointer, deltaY, { ctrl });
      await expect.poll(() => (deltaY < 0 ? scaleOf(sheet) > before : scaleOf(sheet) < before), { message: name }).toBe(true);
      await standStill();
      expect(Math.abs(center(piece).x - pointer.x), `${name}: sideways`).toBeLessThanOrEqual(ONE_PIXEL);
      expect(Math.abs(center(piece).y - pointer.y), `${name}: up and down`).toBeLessThanOrEqual(ONE_PIXEL);
      expect(window.scrollY, `${name}: the page does not scroll`).toBe(0);
    }
  });

  it('Acercar and Alejar zoom around the center of the free gap and stop at the limits', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const box = mount({ gap: FIXED_GAP });
    await theSvg(box);
    const sheet = part(box, '.map-stage__sheet');
    await expect.poll(() => scaleOf(sheet)).toBeCloseTo(MIN_ZOOM, 5);
    await standStill();
    const stage = box.getBoundingClientRect();
    const middle = { x: stage.left + FIXED_GAP.width / 2, y: stage.top + FIXED_GAP.height / 2 };
    const worldAtTheMiddle = () => {
      const { left, top } = sheet.getBoundingClientRect();
      return { x: (middle.x - left) / scaleOf(sheet), y: (middle.y - top) / scaleOf(sheet) };
    };
    const press = async (name: string, until: (scale: number) => boolean) => {
      for (let step = 0; step < STEPS_TO_THE_LIMIT && !until(scaleOf(sheet)); step++) {
        const before = scaleOf(sheet);
        const world = worldAtTheMiddle();
        await userEvent.click(button(name));
        await expect.poll(() => scaleOf(sheet)).not.toBeCloseTo(before, 4);
        await standStill();
        expect(Math.abs(worldAtTheMiddle().x - world.x), `${name}: sideways`).toBeLessThanOrEqual(ONE_PIXEL);
        expect(Math.abs(worldAtTheMiddle().y - world.y), `${name}: up and down`).toBeLessThanOrEqual(ONE_PIXEL);
      }
    };
    await press(CAMERA_TEXT.zoomIn, (scale) => scale >= MAX_ZOOM - 1e-6);
    expect(scaleOf(sheet)).toBeCloseTo(MAX_ZOOM, 5);
    await userEvent.click(button(CAMERA_TEXT.zoomIn));
    await standStill();
    expect(scaleOf(sheet), 'Acercar stops at the maximum').toBeCloseTo(MAX_ZOOM, 5);
    await press(CAMERA_TEXT.zoomOut, (scale) => scale <= MIN_ZOOM + 1e-6);
    expect(scaleOf(sheet)).toBeCloseTo(MIN_ZOOM, 5);
    await userEvent.click(button(CAMERA_TEXT.zoomOut));
    await standStill();
    expect(scaleOf(sheet), 'Alejar stops at the minimum').toBeCloseTo(MIN_ZOOM, 5);
  });

  it('Ajustar brings back the fit after panning and zooming, and so does a resize of the window', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const map = mountOnTheScreen();
    const sheet = part(map, '.map-stage__sheet');
    await expect.poll(() => scaleOf(sheet)).toBeLessThan(1);
    await standStill();
    const fit = transformOf(sheet);
    const messItUp = async () => {
      const { left, top } = map.getBoundingClientRect();
      await dragFromTo({ x: left + 40, y: top + 60 }, { x: left + 100, y: top + 140 });
      await wheelAt({ x: left + 300, y: top + 200 }, -150);
      await expect.poll(() => transformOf(sheet)).not.toBe(fit);
      await standStill();
    };
    await messItUp();
    await userEvent.click(button(CAMERA_TEXT.fit));
    await expect.poll(() => transformOf(sheet)).toBe(fit);
    await messItUp();
    await page.viewport(RESIZED_VIEWPORT.width, RESIZED_VIEWPORT.height);
    await standStill();
    const resized = transformOf(sheet);
    await userEvent.click(button(CAMERA_TEXT.fit));
    await standStill();
    expect(transformOf(sheet), 'the resize left the fit that Ajustar gives').toBe(resized);
  });

  it('the drawing never leaves the window whole, however far it is dragged or zoomed out', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const map = mountOnTheScreen();
    const [stage, svg] = [part(map, '.map-stage'), await theSvg(map)];
    await standStill();
    const stillInTheWindow = (where: string) => {
      const [drawing, window] = [svg.getBoundingClientRect(), stage.getBoundingClientRect()];
      const seen = (low: number, high: number, from: number, to: number) => Math.min(high, to) - Math.max(low, from);
      expect(seen(drawing.left, drawing.right, window.left, window.right), `${where}: sideways`).toBeGreaterThanOrEqual(Math.min(KEEP_IN_VIEW_PX, drawing.width) - ONE_PIXEL);
      expect(seen(drawing.top, drawing.bottom, window.top, window.bottom), `${where}: up and down`).toBeGreaterThanOrEqual(Math.min(KEEP_IN_VIEW_PX, drawing.height) - ONE_PIXEL);
    };
    const middle = () => center(stage);
    for (const direction of DIRECTIONS) {
      for (let turn = 0; turn < 4; turn++) await dragFromTo(middle(), at(middle(), direction, LONG_DRAG_PX));
      await standStill();
      stillInTheWindow(`dragged towards ${direction.x},${direction.y}`);
      await userEvent.click(button(CAMERA_TEXT.fit));
      await standStill();
    }
    for (let step = 0; step < STEPS_TO_THE_LIMIT; step++) await userEvent.click(button(CAMERA_TEXT.zoomOut));
    await standStill();
    for (const direction of DIRECTIONS) {
      for (let turn = 0; turn < 4; turn++) await dragFromTo(middle(), at(middle(), direction, LONG_DRAG_PX));
      await standStill();
      stillInTheWindow(`zoomed out and dragged towards ${direction.x},${direction.y}`);
    }
  });
});
