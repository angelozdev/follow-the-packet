import { cleanup, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { officeTwoFloorsNet } from '@/testing/fixtures';
import { standStill } from '@/testing/browser-play';
import { FLOORS_LABEL_PIECES } from '@/testing/map-pieces';
import { pieceDomId } from '@/scene/overlay/piece-label';
import { layoutMap } from '@/scene/layout/map-layout';
import { MapStage, type MapStageProps } from '@/scene/map-stage';
import { MIN_ZOOM } from './camera-view';
import type { CameraControls } from './use-camera';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const LOW_VIEWPORT = { width: 1280, height: 600 };
const BOX_WIDTH = 1000;
const ONE_PIXEL = 1;
const ZOOMS = [0.5, 1, 2];
const SHORT_GAP_PX = 400;
const TALL_GAP_PX = 4000;
const SLOW_ENOUGH_PX = 1;
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
});
