import { render, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { nameTag, type TermId } from '@/copy';
import { OFFICE_FLOORS, officeNet, officeTwoFloorsNet } from '@/testing/fixtures';
import { TITLE_BAR } from '@/scene/map2d/cards/placement';
import type { RowPiece } from '@/scene/map2d/layout/arrange/geometry';
import { captionBoxes } from '@/scene/map2d/layout/captions';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import { MapStage } from './map-stage';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const PHONE_VIEWPORT = { width: 390, height: 844 };
const WIDE = 1000;
const NARROW = 600;
const TOO_NARROW = 320;
const MIN_MAP_WIDTH = 360;
const HALF_A_PIXEL = 0.5;
const GROUP_RADIUS = 14;
const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();
const CIDR_KNOWN: ReadonlySet<TermId> = new Set<TermId>(['cidr']);

const piece = (kind: RowPiece['kind'], anchorId: string, extras: Partial<RowPiece> = {}): RowPiece => ({ id: `${kind}:${anchorId}`, kind, anchorId, label: nameTag(anchorId), locked: false, state: 'normal', ...extras });
const { officeRouter, server } = OFFICE_FLOORS;
const FLOORS = officeTwoFloorsNet();
const FLOORS_PIECES = [
  ...['your-laptop', 'lucia-laptop', 'marta-laptop', 'andres-laptop'].map((id) => piece('device', id)),
  piece('edge', officeRouter.id, { inOffice: true }),
  piece('internet', 'internet'),
  piece('device', server.id),
];
const OFFICE = officeNet();
const OFFICE_PIECES = [piece('device', 'your-laptop'), piece('device', 'printer'), piece('edge', 'edge'), piece('internet', 'internet')];

interface Mounted {
  box: HTMLElement;
  show: (known: ReadonlySet<TermId>) => void;
}

function mount(width: number, known: ReadonlySet<TermId> = NOTHING_KNOWN, world = FLOORS, pieces = FLOORS_PIECES): Mounted {
  const stage = (each: ReadonlySet<TermId>) => (
    <div data-testid="box" style={{ width, position: 'relative' }}>
      <MapStage world={world} pieces={pieces} known={each} />
    </div>
  );
  const view = render(stage(known));
  return { box: view.getByTestId('box'), show: (each) => view.rerender(stage(each)) };
}

async function drawing(box: HTMLElement): Promise<SVGSVGElement> {
  await expect.poll(() => box.querySelector('svg')).not.toBeNull();
  return box.querySelector('svg') as SVGSVGElement;
}

function layerOf(box: HTMLElement): HTMLElement {
  return box.querySelector('.html-layer') as HTMLElement;
}

describe('MapStage', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it('the svg is hidden from screen readers and the overlay is what they read', async () => {
    const { box } = mount(WIDE);
    const svg = await drawing(box);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('text, title, desc')).toBeNull();
    const layer = layerOf(box);
    expect(layer.closest('[aria-hidden="true"]')).toBeNull();
    expect(within(layer).getByText(OFFICE_FLOORS.floor1.name)).toBeTruthy();
    expect(within(layer).getByText(OFFICE_FLOORS.floor2.name)).toBeTruthy();
  });

  it('the viewBox is the size of the layout and the layout takes the width of its container', async () => {
    const { box } = mount(WIDE);
    const svg = await drawing(box);
    const wide = layoutMap(FLOORS, FLOORS_PIECES, { width: WIDE }).size;
    const narrow = layoutMap(FLOORS, FLOORS_PIECES, { width: NARROW }).size;
    expect(narrow).not.toEqual(wide);
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${wide.width} ${wide.height}`);
    expect([svg.getBoundingClientRect().width, svg.getBoundingClientRect().height]).toEqual([wide.width, wide.height]);
    box.style.width = `${NARROW}px`;
    await expect.poll(() => box.querySelector('svg')?.getAttribute('viewBox')).toBe(`0 0 ${narrow.width} ${narrow.height}`);
    expect(box.querySelector('svg')?.getBoundingClientRect().width).toBe(narrow.width);
  });

  it('a group is a dashed box with its name, and the name shows the block only when cidr is known', async () => {
    const { box, show } = mount(WIDE);
    const svg = await drawing(box);
    const layout = layoutMap(FLOORS, FLOORS_PIECES, { width: WIDE });
    const boxes = [...svg.querySelectorAll<SVGRectElement>('rect.map-group')];
    expect(boxes.map((each) => each.getAttribute('data-group'))).toEqual(layout.groups.map(({ id }) => id));
    for (const each of boxes) {
      const style = getComputedStyle(each);
      expect(style.strokeDasharray).not.toBe('none');
      expect(style.fill).toBe('none');
      expect(style.getPropertyValue('rx')).toBe(`${GROUP_RADIUS}px`);
    }
    const first = layout.groups.find(({ id }) => id === OFFICE_FLOORS.floor1.id)?.box;
    const drawn = boxes.find((each) => each.getAttribute('data-group') === OFFICE_FLOORS.floor1.id);
    expect([drawn?.x.baseVal.value, drawn?.y.baseVal.value, drawn?.width.baseVal.value, drawn?.height.baseVal.value]).toEqual([first?.x, first?.y, first?.width, first?.height]);

    const layer = layerOf(box);
    const captions = () => [...layer.querySelectorAll<HTMLElement>('.caption')].map((each) => each.textContent);
    expect(captions()).toEqual([OFFICE_FLOORS.floor1.name, OFFICE_FLOORS.floor2.name]);

    show(CIDR_KNOWN);
    await expect.poll(captions).toEqual([OFFICE_FLOORS.range, `${OFFICE_FLOORS.floor1.name} ${OFFICE_FLOORS.floor1.cidr}`, `${OFFICE_FLOORS.floor2.name} ${OFFICE_FLOORS.floor2.cidr}`]);
    const reserved = captionBoxes(layout.groups);
    const svgBox = svg.getBoundingClientRect();
    for (const caption of layer.querySelectorAll<HTMLElement>('.caption')) {
      const group = layout.groups.find(({ id }) => id === caption.getAttribute('data-group'));
      const room = reserved[group?.id ?? ''];
      const shape = caption.getBoundingClientRect();
      expect(shape.left - svgBox.left).toBeGreaterThanOrEqual(room.x - HALF_A_PIXEL);
      expect(shape.top - svgBox.top).toBeGreaterThanOrEqual(room.y - HALF_A_PIXEL);
      expect(shape.right - svgBox.left).toBeLessThanOrEqual(room.x + room.width + HALF_A_PIXEL);
      expect(shape.bottom - svgBox.top).toBeLessThanOrEqual(room.y + room.height + HALF_A_PIXEL);
    }
  });

  it('the map is centered in its box and drawn under the title bar', async () => {
    const { box } = mount(WIDE, NOTHING_KNOWN, OFFICE, OFFICE_PIECES);
    const svg = await drawing(box);
    const { size } = layoutMap(OFFICE, OFFICE_PIECES, { width: WIDE });
    expect(size.width).toBeLessThan(WIDE);
    const [inBox, inSvg] = [box.getBoundingClientRect(), svg.getBoundingClientRect()];
    expect(inSvg.left - inBox.left).toBeCloseTo(Math.floor((WIDE - size.width) / 2), 0);
    expect(inSvg.top - inBox.top).toBe(TITLE_BAR);
    expect(inBox.height).toBe(TITLE_BAR + size.height);
    expect(layerOf(box).getBoundingClientRect()).toMatchObject({ left: inBox.left, top: inBox.top, width: inBox.width, height: inBox.height });
  });

  it('draws a link for every link of the layout, the stub of the line end included, and a mark for every place of a stamp', async () => {
    const { box } = mount(WIDE);
    const svg = await drawing(box);
    const layout = layoutMap(FLOORS, FLOORS_PIECES, { width: WIDE });
    const links = [...svg.querySelectorAll<SVGPolylineElement>('polyline.map-link')];
    expect(links.map((each) => each.getAttribute('points'))).toEqual(layout.links.map(({ points }) => points.map(([x, y]) => `${x},${y}`).join(' ')));
    expect(layout.links.some(({ kind }) => kind === 'stub')).toBe(true);
    expect(getComputedStyle(links[0]).strokeWidth).not.toBe('0px');
    expect(getComputedStyle(links[0]).fill).toBe('none');
    const marks = [...svg.querySelectorAll<SVGCircleElement>('circle.map-mark')];
    expect(marks.map((each) => [each.cx.baseVal.value, each.cy.baseVal.value])).toEqual(layout.marks.map(({ point }) => point));
  });

  it('below 360 px the drawing keeps 360 px, against the left edge, and the stage scrolls sideways', async () => {
    const { box } = mount(TOO_NARROW);
    const svg = await drawing(box);
    const stage = box.querySelector('.map-stage') as HTMLElement;
    expect(svg.getBoundingClientRect().width).toBe(MIN_MAP_WIDTH);
    expect(svg.getBoundingClientRect().left).toBe(box.getBoundingClientRect().left);
    expect(stage.clientWidth).toBe(TOO_NARROW);
    expect(stage.scrollWidth).toBe(MIN_MAP_WIDTH);
  });

  it('draws no svg in its first render, before its container has been measured', () => {
    const { box } = mount(0);
    expect(box.querySelector('svg')).toBeNull();
    expect(box.querySelector('.map-stage')).not.toBeNull();
  });

  it('at 390 px the map is as wide as its container and the page does not scroll sideways', async () => {
    await page.viewport(PHONE_VIEWPORT.width, PHONE_VIEWPORT.height);
    const { container } = render(
      <main className="incident incident--map2d">
        <div className="incident__map">
          <MapStage world={FLOORS} pieces={FLOORS_PIECES} known={NOTHING_KNOWN} />
        </div>
      </main>,
    );
    const map = container.querySelector('.incident__map') as HTMLElement;
    const svg = await drawing(map);
    const { size } = layoutMap(FLOORS, FLOORS_PIECES, { width: PHONE_VIEWPORT.width });
    expect(svg.getBoundingClientRect().width).toBe(PHONE_VIEWPORT.width);
    expect(size.width).toBe(PHONE_VIEWPORT.width);
    expect(map.getBoundingClientRect().height).toBe(TITLE_BAR + size.height);
    expect(document.documentElement.scrollWidth).toBe(window.innerWidth);
  });
});
