import { render, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { MAP_TEXT, nameTag, type TermId } from '@/copy';
import { OFFICE_FLOORS, device, officeNet, officeTwoFloorsNet, ping, tcp } from '@/testing/fixtures';
import { mapPiece, mapRun, mapRunWithPorts, type MapPieceFixture, type PieceEntity } from '@/testing/map-pieces';
import { tokenColor } from '@/testing/token-color';
import { blockTabBoxes, captionBoxes } from '@/scene/layout/captions';
import { layoutMap } from '@/scene/layout/map-layout';
import { GameScene } from './game-scene';
import { MapStage, type MapStageProps } from './map-stage';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const PHONE_VIEWPORT = { width: 390, height: 844 };
const LANDSCAPE_VIEWPORT = { width: 844, height: 390 };
const SMALL_PHONE_VIEWPORT = { width: 320, height: 640 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const SMALL_DESKTOP_VIEWPORT = { width: 800, height: 800 };
const LUCIA_ZONE_PX = 316;
const PANEL_SHARE = 0.24;
const WIDE = 1000;
const NARROW = 600;
const TOO_NARROW = 320;
const MIN_MAP_WIDTH = 360;
const HALF_A_PIXEL = 0.5;
const GROUP_RADIUS = 14;
const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();
const CIDR_KNOWN: ReadonlySet<TermId> = new Set<TermId>(['cidr']);
const OFFICE_TITLE = MAP_TEXT.groups.office.text;

const VARIANTS = { device: 'laptop', firewall: 'host-firewall', edge: 'router', internet: 'internet', actor: 'you' } as const;
const BLOCK_NAME = OFFICE_FLOORS.floor1.cidr;
const SCREEN_PROPS = { blockName: null, activePieceId: null, still: true, flows: [], sent: [], inspectTrigger: () => ({}), inspectStampsTrigger: () => ({}), onActivate: () => undefined } satisfies Omit<MapStageProps, 'world' | 'pieces' | 'known'>;

const piece = <Kind extends keyof typeof VARIANTS>(kind: Kind, anchorId: string, extras: Partial<MapPieceFixture> = {}): MapPieceFixture => mapPiece({ kind, variant: VARIANTS[kind] } as PieceEntity, anchorId, nameTag(anchorId), extras);
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

function mount(width: number, known: ReadonlySet<TermId> = NOTHING_KNOWN, world = FLOORS, pieces = FLOORS_PIECES, extras: Partial<MapStageProps> = {}): Mounted {
  const stage = (each: ReadonlySet<TermId>) => (
    <div data-testid="box" style={{ width, position: 'relative' }}>
      <MapStage world={world} pieces={pieces} known={each} {...SCREEN_PROPS} {...extras} />
    </div>
  );
  const view = render(stage(known));
  return { box: view.getByTestId('box'), show: (each) => view.rerender(stage(each)) };
}

async function drawing(box: HTMLElement): Promise<SVGSVGElement> {
  await expect.poll(() => box.querySelector('svg')).not.toBeNull();
  return box.querySelector('svg') as SVGSVGElement;
}

function mountOnTheScreen(): HTMLElement {
  const { container } = render(
    <main className="incident">
      <div className="incident__map">
        <MapStage world={FLOORS} pieces={FLOORS_PIECES} known={NOTHING_KNOWN} {...SCREEN_PROPS} />
      </div>
      <aside className="incident__side" />
    </main>,
  );
  return container.querySelector('.incident__map') as HTMLElement;
}

const widthOfTheSvg = (map: HTMLElement) => map.querySelector('svg')?.getBoundingClientRect().width;
const widthOfTheLayoutAt = (width: number) => layoutMap(FLOORS, FLOORS_PIECES, { width }).size.width;
const pageOverflow = () => document.documentElement.scrollWidth - window.innerWidth;

function layerOf(box: HTMLElement): HTMLElement {
  return box.querySelector('.html-layer') as HTMLElement;
}

function expectOverThePiecesAndUnderTheLayer(svg: SVGSVGElement, box: HTMLElement, traffic: Element): void {
  const lastPiece = [...svg.querySelectorAll('g.map-piece')].at(-1) as Element;
  expect(lastPiece.compareDocumentPosition(traffic) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(svg.compareDocumentPosition(layerOf(box)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
    expect(captions()).toEqual([OFFICE_TITLE, OFFICE_FLOORS.floor1.name, OFFICE_FLOORS.floor2.name]);

    show(CIDR_KNOWN);
    await expect.poll(captions).toEqual([`${OFFICE_TITLE} ${OFFICE_FLOORS.range}`, `${OFFICE_FLOORS.floor1.name} ${OFFICE_FLOORS.floor1.cidr}`, `${OFFICE_FLOORS.floor2.name} ${OFFICE_FLOORS.floor2.cidr}`]);
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

  it('the map is centered in its box and drawn against its top edge', async () => {
    const { box } = mount(WIDE, NOTHING_KNOWN, OFFICE, OFFICE_PIECES);
    const svg = await drawing(box);
    const { size } = layoutMap(OFFICE, OFFICE_PIECES, { width: WIDE });
    expect(size.width).toBeLessThan(WIDE);
    const [inBox, inSvg] = [box.getBoundingClientRect(), svg.getBoundingClientRect()];
    expect(inSvg.left - inBox.left).toBeCloseTo(Math.floor((WIDE - size.width) / 2), 0);
    expect(inSvg.top - inBox.top).toBe(0);
    expect(inBox.height).toBe(size.height);
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

  it('draws every piece the layout holds a box for over the links and under the layer, with a label button for each in the layer', async () => {
    const { box } = mount(WIDE);
    const svg = await drawing(box);
    const layout = layoutMap(FLOORS, FLOORS_PIECES, { width: WIDE });
    const drawn = [...svg.querySelectorAll('g.map-piece')];
    expect(drawn.map((each) => each.getAttribute('data-piece'))).toEqual(FLOORS_PIECES.map(({ id }) => id).filter((id) => id in layout.icons));
    expect(drawn.length).toBeGreaterThan(5);
    const lastLink = [...svg.querySelectorAll('polyline.map-link')].at(-1) as Element;
    expect(lastLink.compareDocumentPosition(drawn[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(svg.compareDocumentPosition(layerOf(box)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const labels = [...layerOf(box).querySelectorAll<HTMLElement>('button.map-button')];
    expect(labels.map(({ id }) => id).sort()).toEqual(Object.keys(layout.labels).map((id) => `piece-${id.replaceAll(':', '-')}`).sort());
  });

  it('marks the piece whose card is open as selected', async () => {
    const { box } = mount(WIDE, NOTHING_KNOWN, FLOORS, FLOORS_PIECES, { activePieceId: 'device:your-laptop', still: false });
    const svg = await drawing(box);
    expect(svg.querySelector('[data-piece="device:your-laptop"] .map-piece__mat')).not.toBeNull();
    expect(svg.querySelectorAll('.map-piece__mat')).toHaveLength(1);
  });

  describe('the outline of a block', () => {
    const MARKED = FLOORS_PIECES.map((each) => (['device:your-laptop', 'device:lucia-laptop'].includes(each.id) ? { ...each, insideBlock: true as const } : each));
    const stageOf = (blockName: string | null) => mount(WIDE, NOTHING_KNOWN, FLOORS, MARKED, { blockName });

    it('wears a filled tab with its block over its top edge once cidr is known, and not before, with the same room either way', async () => {
      const { box, show } = stageOf(BLOCK_NAME);
      const svg = await drawing(box);
      const roomy = layoutMap(FLOORS, MARKED, { width: WIDE, blockTab: true });
      const [[id, tab]] = Object.entries(blockTabBoxes(roomy.groups, BLOCK_NAME));
      expect(svg.getBoundingClientRect().height).toBe(roomy.size.height);
      expect(svg.querySelectorAll('rect.map-tab')).toHaveLength(0);
      expect(layerOf(box).querySelector(`.caption[data-group="${id}"]`)).toBeNull();
      show(CIDR_KNOWN);
      await expect.poll(() => svg.querySelectorAll('rect.map-tab').length).toBe(1);
      const drawn = svg.querySelector('rect.map-tab') as SVGRectElement;
      expect([drawn.x.baseVal.value, drawn.y.baseVal.value, drawn.width.baseVal.value, drawn.height.baseVal.value]).toEqual([tab.x, tab.y, tab.width, tab.height]);
      expect(getComputedStyle(drawn).fill).not.toBe('none');
      const name = layerOf(box).querySelector(`.caption[data-group="${id}"]`) as HTMLElement;
      expect(name.textContent).toBe(BLOCK_NAME);
      const [inTheLayer, inTheSvg] = [name.getBoundingClientRect(), drawn.getBoundingClientRect()];
      expect([inTheLayer.left, inTheLayer.top, inTheLayer.width, inTheLayer.height]).toEqual([inTheSvg.left, inTheSvg.top, inTheSvg.width, inTheSvg.height]);
      expect(getComputedStyle(name).color).not.toBe(getComputedStyle(drawn).fill);
      expect(svg.getBoundingClientRect().height).toBe(roomy.size.height);
    });

    it('leaves no room and draws no tab in an incident that has no block', async () => {
      const { box, show } = stageOf(null);
      const svg = await drawing(box);
      show(CIDR_KNOWN);
      expect(svg.getBoundingClientRect().height).toBe(layoutMap(FLOORS, MARKED, { width: WIDE }).size.height);
      expect(svg.querySelectorAll('rect.map-tab')).toHaveLength(0);
    });
  });

  it('the scene hands the stage what the screen gives it: the terms, the block, the open card and the stillness', async () => {
    const marked = FLOORS_PIECES.map((each) => (each.id === 'device:your-laptop' ? { ...each, insideBlock: true as const } : each));
    const scene = (known: ReadonlySet<TermId>) => (
      <div data-testid="box" style={{ width: WIDE, position: 'relative' }}>
        <GameScene world={FLOORS} pieces={marked} flows={[]} sent={[]} still blockName={BLOCK_NAME} activePieceId="device:your-laptop" inspectTrigger={() => ({})} inspectStampsTrigger={() => ({})} onActivate={() => undefined} known={known} />
      </div>
    );
    const view = render(scene(NOTHING_KNOWN));
    const svg = await drawing(view.getByTestId('box'));
    const layer = layerOf(view.getByTestId('box'));
    const texts = () => [...layer.querySelectorAll('.caption')].map((each) => each.textContent);
    expect(texts()).toEqual([OFFICE_TITLE, OFFICE_FLOORS.floor1.name, OFFICE_FLOORS.floor2.name]);
    expect(svg.querySelectorAll('.map-piece__mat')).toHaveLength(1);
    expect(svg.querySelectorAll('rect.map-tab')).toHaveLength(0);
    view.rerender(scene(CIDR_KNOWN));
    await expect.poll(texts).toEqual([`${OFFICE_TITLE} ${OFFICE_FLOORS.range}`, `${OFFICE_FLOORS.floor1.name} ${OFFICE_FLOORS.floor1.cidr}`, `${OFFICE_FLOORS.floor2.name} ${OFFICE_FLOORS.floor2.cidr}`, BLOCK_NAME]);
    expect(svg.querySelectorAll('rect.map-tab')).toHaveLength(1);
  });

  describe('the packets of a still scene', () => {
    const { floor1, officeRouter, server } = OFFICE_FLOORS;
    const YOU = device('your-laptop');
    const ANSWERED = mapRun(FLOORS, ping(YOU, floor1.lucia), 'answered');
    const BLOCKED = mapRun(FLOORS, ping(YOU, floor1.marta), 'blocked', { replied: false, reached: false, blocked: true });
    const LOST = mapRun(FLOORS, ping(YOU, floor1.nobody), 'lost');
    const INTRUDER = mapRun(FLOORS, ping(YOU, floor1.lucia), 'intruder', { intruder: true });
    const NAT = mapRunWithPorts(FLOORS, tcp(YOU, server.ip, 80), 'nat', officeRouter.id);
    const lineOf = (svg: Element, id: string) => svg.querySelector(`g.map-trace[data-packet="${id}"] path.map-trace__line`) as SVGPathElement;

    it('draws the trace and the label of every packet over the pieces and under the layer', async () => {
      const { box } = mount(WIDE, NOTHING_KNOWN, FLOORS, FLOORS_PIECES, { flows: [ANSWERED, NAT] });
      const svg = await drawing(box);
      expect([...svg.querySelectorAll('g.map-trace')].map((each) => each.getAttribute('data-packet'))).toEqual(['answered', 'nat']);
      expect([...svg.querySelectorAll('g.packet-tag')].map((each) => each.textContent)).toEqual(['TCP 51514 → 80']);
      expectOverThePiecesAndUnderTheLayer(svg, box, svg.querySelector('g.map-traffic') as Element);
      expect(box.querySelector('.map-stage__flight-labels')).toBeNull();
      expect(box.querySelectorAll('animate, animateMotion, animateTransform')).toHaveLength(0);
    });

    it('draws no trace while animations are on, and flies the packets and their labels instead', async () => {
      const { box } = mount(WIDE, NOTHING_KNOWN, FLOORS, FLOORS_PIECES, { flows: [ANSWERED, NAT], still: false });
      const svg = await drawing(box);
      expect(svg.querySelector('g.map-traffic')).toBeNull();
      expect(svg.querySelector('g.map-trace')).toBeNull();
      expect([...new Set([...svg.querySelectorAll('g.map-flight')].map((each) => each.getAttribute('data-packet')))]).toEqual(['answered', 'nat']);
      expect(svg.querySelector('.map-flight-tags')).toBeNull();
      expect(box.querySelectorAll('.map-stage__flight-labels .map-flight-tags g.packet-tag').length).toBeGreaterThan(0);
      expectOverThePiecesAndUnderTheLayer(svg, box, svg.querySelector('g.map-flights') as Element);
    });

    it('a send sent again while it flies draws a second packet and a second label from the one list the stage gives both, and animations turned off and on again forget the first', async () => {
      const again = mapRunWithPorts(FLOORS, tcp(YOU, server.ip, 80), 'again', officeRouter.id, { replied: true });
      const stage = (send: number, still: boolean) => (
        <div data-testid="box" style={{ width: WIDE, position: 'relative' }}>
          <MapStage world={FLOORS} pieces={FLOORS_PIECES} known={NOTHING_KNOWN} {...SCREEN_PROPS} still={still} sent={[{ ...again, send }]} />
        </div>
      );
      const view = render(stage(1, false));
      const box = view.getByTestId('box');
      const flights = () => box.querySelectorAll('.map-stage__svg g.map-flight[data-packet="again"]').length;
      const labels = () => box.querySelectorAll('.map-stage__flight-labels g.map-flight-tag[data-packet="again"]').length;
      await expect.poll(flights).toBe(1);
      view.rerender(stage(2, false));
      expect([flights(), labels()]).toEqual([2, 2]);
      view.rerender(stage(2, true));
      view.rerender(stage(2, false));
      expect([flights(), labels()]).toEqual([1, 1]);
    });

    it('draws a blocked trace in the danger colour, a lost one dashed and the others in ink, and the border of an intruder over nothing but air', async () => {
      const { box } = mount(WIDE, NOTHING_KNOWN, FLOORS, FLOORS_PIECES, { flows: [ANSWERED, BLOCKED, LOST, INTRUDER] });
      const svg = await drawing(box);
      expect(getComputedStyle(lineOf(svg, 'blocked')).stroke).toBe(tokenColor('--color-danger'));
      expect(getComputedStyle(lineOf(svg, 'answered')).stroke).toBe(tokenColor('--color-ink'));
      expect(getComputedStyle(lineOf(svg, 'lost')).strokeDasharray).not.toBe('none');
      expect(getComputedStyle(lineOf(svg, 'answered')).strokeDasharray).toBe('none');
      expect(getComputedStyle(lineOf(svg, 'blocked')).strokeDasharray).toBe('none');
      expect(getComputedStyle(lineOf(svg, 'answered')).fill).toBe('none');
      const shapes = [...svg.querySelectorAll('g.map-trace[data-packet="intruder"] g.map-packet[data-role="going"] path')];
      expect(shapes.map((each) => getComputedStyle(each).fill)).toEqual([tokenColor('--color-danger'), 'none']);
      expect(shapes.map((each) => getComputedStyle(each).stroke)).toEqual([tokenColor('--color-danger'), tokenColor('--color-danger')]);
      const answer = svg.querySelector('g.map-trace[data-packet="answered"] g.map-packet[data-role="answer"] path') as Element;
      expect(getComputedStyle(answer).fill).toBe('none');
      const plain = svg.querySelector('g.map-trace[data-packet="answered"] g.map-packet[data-role="going"] path') as Element;
      expect(getComputedStyle(plain).fill).toBe(tokenColor('--color-ink'));
    });

    it('keeps every label of a packet off every shape, stamp and label of a piece as the page draws them', async () => {
      const { box } = mount(WIDE, NOTHING_KNOWN, FLOORS, FLOORS_PIECES, { flows: [NAT, ANSWERED, BLOCKED, LOST] });
      const svg = await drawing(box);
      const tag = svg.querySelector('g.packet-tag rect') as SVGRectElement;
      const label = tag.getBoundingClientRect();
      const overlaps = (other: DOMRect) => label.left < other.right && other.left < label.right && label.top < other.bottom && other.top < label.bottom;
      const painted = [...svg.querySelectorAll('g.map-packet path')].map((each) => each.getBoundingClientRect());
      expect(painted.length).toBeGreaterThan(4);
      expect(painted.filter(overlaps)).toEqual([]);
      const buttons = [...layerOf(box).querySelectorAll('button')].map((each) => each.getBoundingClientRect());
      expect(buttons.length).toBeGreaterThan(5);
      expect(buttons.filter(overlaps)).toEqual([]);
    });
  });

  describe('the packets in flight', () => {
    const { officeRouter, server } = OFFICE_FLOORS;
    const YOU = device('your-laptop');
    const toTheRouter = (from: string, id: string) => mapRun(FLOORS, ping(device(from), officeRouter.uplink), id);
    const FLYING = [mapRunWithPorts(FLOORS, tcp(YOU, server.ip, 80), 'nat', officeRouter.id, { replied: true }), toTheRouter('your-laptop', 'first'), toTheRouter('lucia-laptop', 'second'), toTheRouter('marta-laptop', 'third')];
    const LABEL_SECONDS = 0.05;
    const SECONDS_TO_LOOK = 40;

    const overSheets = (box: HTMLElement) => [...box.querySelectorAll<SVGSVGElement>('.map-stage__sheet > svg')];
    const centerOf = ({ left, top, width, height }: DOMRect): [number, number] => [left + width / 2, top + height / 2];
    const holds = ({ left, right, top, bottom }: DOMRect, [x, y]: [number, number]) => x > left && x < right && y > top && y < bottom;
    const shownLabels = (box: HTMLElement) => [...box.querySelectorAll('.map-flight-tags g.packet-tag')].filter((label) => getComputedStyle(label.parentElement as Element).opacity === '1');

    function crossing(box: HTMLElement): { label: Element; stamp: Element } | undefined {
      const stamps = [...layerOf(box).querySelectorAll('.map-stamp button')];
      for (let seconds = 0; seconds < SECONDS_TO_LOOK; seconds += LABEL_SECONDS) {
        overSheets(box).forEach((sheet) => sheet.setCurrentTime(seconds));
        for (const label of shownLabels(box)) {
          const rect = (label.querySelector('rect') as Element).getBoundingClientRect();
          const stamp = stamps.find((each) => holds(rect, centerOf(each.getBoundingClientRect())));
          if (stamp) return { label, stamp };
        }
      }
      return undefined;
    }

    it('a flying label passes above a stamp, which stays the element under the pointer', async () => {
      await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
      const { box } = mount(WIDE, NOTHING_KNOWN, FLOORS, FLOORS_PIECES, { flows: FLYING, still: false });
      await drawing(box);
      overSheets(box).forEach((sheet) => sheet.pauseAnimations());
      const found = crossing(box);
      expect(found, 'an instant where a label covers the middle of a stamp').toBeDefined();
      const { label, stamp } = found as { label: Element; stamp: Element };
      const [x, y] = centerOf(stamp.getBoundingClientRect());
      const labels = label.closest('svg') as SVGSVGElement;
      expect(labels).not.toBe(box.querySelector('.map-stage__svg'));
      expect(labels.getAttribute('aria-hidden')).toBe('true');
      expect(getComputedStyle(labels).pointerEvents).toBe('none');
      expect(layerOf(box).compareDocumentPosition(labels) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(document.elementFromPoint(x, y)?.closest('button')).toBe(stamp);
      const painted = label.querySelector('rect') as SVGRectElement;
      painted.style.pointerEvents = 'auto';
      expect(document.elementFromPoint(x, y)).toBe(painted);
      painted.style.pointerEvents = '';
      expect(document.elementFromPoint(x, y)?.closest('button')).toBe(stamp);
    });
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
    const map = mountOnTheScreen();
    const svg = await drawing(map);
    const { size } = layoutMap(FLOORS, FLOORS_PIECES, { width: PHONE_VIEWPORT.width });
    expect(svg.getBoundingClientRect().width).toBe(PHONE_VIEWPORT.width);
    expect(size.width).toBe(PHONE_VIEWPORT.width);
    expect(map.getBoundingClientRect().height).toBe(size.height);
    expect(pageOverflow()).toBe(0);
  });

  it('on a phone the map follows its column when the window narrows, and the page does not scroll sideways', async () => {
    await page.viewport(LANDSCAPE_VIEWPORT.width, LANDSCAPE_VIEWPORT.height);
    const map = mountOnTheScreen();
    await drawing(map);
    await expect.poll(() => widthOfTheSvg(map)).toBe(widthOfTheLayoutAt(LANDSCAPE_VIEWPORT.width));
    expect(widthOfTheLayoutAt(LANDSCAPE_VIEWPORT.width)).toBeGreaterThan(PHONE_VIEWPORT.width);
    await page.viewport(PHONE_VIEWPORT.width, PHONE_VIEWPORT.height);
    await expect.poll(() => widthOfTheSvg(map)).toBe(PHONE_VIEWPORT.width);
    expect(map.getBoundingClientRect().width).toBe(PHONE_VIEWPORT.width);
    expect(pageOverflow()).toBe(0);
  });

  it('on a phone narrower than 360 px the stage scrolls sideways and the page does not', async () => {
    await page.viewport(SMALL_PHONE_VIEWPORT.width, SMALL_PHONE_VIEWPORT.height);
    const map = mountOnTheScreen();
    await drawing(map);
    const stage = map.querySelector('.map-stage') as HTMLElement;
    expect(widthOfTheSvg(map)).toBe(MIN_MAP_WIDTH);
    expect(map.getBoundingClientRect().width).toBe(SMALL_PHONE_VIEWPORT.width);
    expect(stage.clientWidth).toBe(SMALL_PHONE_VIEWPORT.width);
    expect(stage.scrollWidth).toBe(MIN_MAP_WIDTH);
    expect(pageOverflow()).toBe(0);
  });

  it('on a desktop the map follows its box when the window narrows past 900 px', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const map = mountOnTheScreen();
    await drawing(map);
    const wide = DESKTOP_VIEWPORT.width - LUCIA_ZONE_PX - PANEL_SHARE * DESKTOP_VIEWPORT.width;
    await expect.poll(() => widthOfTheSvg(map)).toBe(widthOfTheLayoutAt(map.getBoundingClientRect().width));
    expect(map.getBoundingClientRect().width).toBeCloseTo(wide, 0);
    await page.viewport(SMALL_DESKTOP_VIEWPORT.width, SMALL_DESKTOP_VIEWPORT.height);
    await expect.poll(() => widthOfTheSvg(map)).toBe(widthOfTheLayoutAt(SMALL_DESKTOP_VIEWPORT.width));
    expect(map.getBoundingClientRect().width).toBe(SMALL_DESKTOP_VIEWPORT.width);
    expect(pageOverflow()).toBe(0);
  });
});
