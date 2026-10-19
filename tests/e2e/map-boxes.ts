import type { Page } from '@playwright/test';

export interface Box {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Area = Omit<Box, 'name'>;

const PIECE_LABELS = '.map-button';
const LABELS = `${PIECE_LABELS}, button.stamp, .html-layer .caption:not(.caption--soft)`;
const PACKET_BOXES = `${LABELS}, .packet-tag`;
const MAP = '.incident__map';
const BAR = '.incident__bar';
const PIECE_HALF_WIDTH = 40;
const PIECE_BELOW_LABEL = 72;
const OPAQUE = 128;
const CANVAS = 'canvas';
const MAP_SVG = '.map-stage__svg';
const DRAWING_SURFACE = `${CANVAS}, ${MAP_SVG}`;
const DRAWING = 'the drawing of the map';
const RECORDED_LABELS = 'recordedLabels';

/** True when two boxes on the screen overlap; a missing box overlaps nothing. */
export function overlaps(a: Area | null, b: Area | null): boolean {
  return a !== null && b !== null && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** True when the box lies wholly inside the area. */
export function isInside(area: Area, box: Area): boolean {
  return box.x >= area.x && box.y >= area.y && box.x + box.width <= area.x + area.width && box.y + box.height <= area.y + area.height;
}

async function boxesOf(page: Page, selector: string): Promise<Box[]> {
  return page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { name: element.getAttribute('aria-label') ?? element.textContent ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
}

/** Returns the box of every label, every stamp and every floor name on the map, named as a screen reader reads it. */
export async function mapBoxes(page: Page): Promise<Box[]> {
  return boxesOf(page, LABELS);
}

/** Starts recording the boxes of the labels of the pieces after every change the page makes to itself, from now on. */
export async function recordLabels(page: Page): Promise<void> {
  await page.evaluate(
    ([selector, key]) => {
      const recorded: unknown[] = [];
      Reflect.set(window, key, recorded);
      new MutationObserver(() => {
        const boxes = [...document.querySelectorAll(selector)].map((element) => {
          const rect = element.getBoundingClientRect();
          return { name: element.getAttribute('aria-label') ?? element.textContent ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });
        if (boxes.length > 0) recorded.push(boxes);
      }).observe(document, { subtree: true, childList: true, attributes: true });
    },
    [PIECE_LABELS, RECORDED_LABELS] as const,
  );
}

/** Returns the boxes of the labels of the pieces as they stood after each change of the page since `recordLabels`, in order. */
export async function recordedLabels(page: Page): Promise<Box[][]> {
  return page.evaluate((key) => Reflect.get(window, key), RECORDED_LABELS);
}

/** Returns the box of every piece label, every stamp, every floor name and every label that a packet with ports wears on the map, named as a screen reader reads them (a packet label is hidden from it, so it is named by its text): what the drawing of a packet puts next to each other. `mapBoxes` does not hold the packet labels, so the tests written before them keep checking what they checked. */
export async function packetBoxes(page: Page): Promise<Box[]> {
  return boxesOf(page, PACKET_BOXES);
}

/** Returns every pair of the boxes that overlap, as "a / b". */
export function pairsThatOverlap(boxes: Box[]): string[] {
  return boxes.flatMap((a, index) => boxes.slice(index + 1).filter((b) => overlaps(a, b)).map((b) => `${a.name} / ${b.name}`));
}

/** Returns every pair of labels, stamps or floor names of the map that overlap, as "a / b". */
export async function overlappingPairs(page: Page): Promise<string[]> {
  return pairsThatOverlap(await mapBoxes(page));
}

/** Returns the box of the piece that hangs from a label: a label floats above the piece it names, which stands under its middle. */
function pieceUnder(label: Box): Box {
  const middle = label.y + label.height / 2;
  return { name: `the piece of ${label.name}`, x: label.x + label.width / 2 - PIECE_HALF_WIDTH, y: middle, width: 2 * PIECE_HALF_WIDTH, height: PIECE_BELOW_LABEL };
}

/** Returns the names of everything on the map that a card covers: the labels, stamps and floor names, and the pieces that hang from the labels of pieces. */
export async function coveredBy(page: Page, card: Area): Promise<string[]> {
  const [boxes, labels] = await Promise.all([mapBoxes(page), boxesOf(page, PIECE_LABELS)]);
  return [...boxes, ...labels.map(pieceUnder)].filter((box) => overlaps(card, box)).map((box) => box.name);
}

/** Returns the area of the map that its labels and drawing must fit: the map without the bar of its title, which floats over its top. */
export async function mapArea(page: Page): Promise<Area> {
  const [map, bar] = await Promise.all([page.locator(MAP).boundingBox(), page.locator(BAR).boundingBox()]);
  if (map === null || bar === null) throw new Error('the map is not on the page');
  return { x: map.x, y: bar.y + bar.height, width: map.width, height: map.y + map.height - (bar.y + bar.height) };
}

type DrawnBox = (Area & { cutOff: boolean }) | null;

async function drawnBoxOfCanvas(page: Page): Promise<DrawnBox> {
  return page.locator(CANVAS).evaluate((canvas: HTMLCanvasElement, opaque) => {
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext('2d');
    if (context === null) return null;
    context.drawImage(canvas, 0, 0);
    const { data } = context.getImageData(0, 0, copy.width, copy.height);
    const columns: number[] = [];
    const rows: number[] = [];
    for (let row = 0; row < copy.height; row++) {
      for (let column = 0; column < copy.width; column++) {
        if (data[(row * copy.width + column) * 4 + 3] >= opaque) {
          columns.push(column);
          rows.push(row);
        }
      }
    }
    if (columns.length === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / copy.width;
    const [x0, x1, y0, y1] = [Math.min(...columns), Math.max(...columns), Math.min(...rows), Math.max(...rows)];
    const cutOff = x0 === 0 || y0 === 0 || x1 === copy.width - 1 || y1 === copy.height - 1;
    return { x: rect.x + x0 * scale, y: rect.y + y0 * scale, width: (x1 - x0 + 1) * scale, height: (y1 - y0 + 1) * scale, cutOff };
  }, OPAQUE);
}

async function drawnBoxOfSvg(page: Page): Promise<DrawnBox> {
  return page.locator(MAP_SVG).evaluate((svg: SVGSVGElement) => {
    const content = svg.getBBox();
    const toPage = svg.getScreenCTM();
    if (toPage === null || (content.width === 0 && content.height === 0)) return null;
    const corner = new DOMPoint(content.x, content.y).matrixTransform(toPage);
    const opposite = new DOMPoint(content.x + content.width, content.y + content.height).matrixTransform(toPage);
    const { width, height } = svg.viewBox.baseVal;
    const cutOff = content.x <= 0 || content.y <= 0 || content.x + content.width >= width || content.y + content.height >= height;
    return { x: corner.x, y: corner.y, width: opposite.x - corner.x, height: opposite.y - corner.y, cutOff };
  });
}

/** Returns the box that holds the drawing of the map, or null when nothing is drawn, and whether that box touches the edge of what it is drawn on, which cuts the drawing off. With the canvas of the 3D map it holds every opaque pixel of the canvas; when the page has no canvas, as with the 2D map, it is the bounding box of the content of the svg of the map (`.map-stage__svg`) taken to the page. */
export async function drawnBox(page: Page): Promise<DrawnBox> {
  await page.locator(DRAWING_SURFACE).first().waitFor({ state: 'attached' });
  return (await page.locator(CANVAS).count()) > 0 ? drawnBoxOfCanvas(page) : drawnBoxOfSvg(page);
}

/** Returns the names of what the map draws outside its area: any label, stamp or floor name, and the drawing itself. */
export async function outsideTheArea(page: Page, area: Area): Promise<string[]> {
  const [boxes, drawing] = await Promise.all([mapBoxes(page), drawnBox(page)]);
  const outside = boxes.filter((box) => !isInside(area, box)).map((box) => box.name);
  return drawing !== null && (drawing.cutOff || !isInside(area, drawing)) ? [...outside, DRAWING] : outside;
}
