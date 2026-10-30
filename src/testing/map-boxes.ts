export interface Box {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Area = Omit<Box, 'name'>;

const DRAWN_PIECES = 'g.map-piece[data-piece]';
const PIECE_DOM_ID_PREFIX = 'piece-';

/** True when two boxes on the screen overlap; a missing box overlaps nothing. */
export function overlaps(a: Area | null, b: Area | null): boolean {
  return a !== null && b !== null && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** Returns the box of every label of a piece, every stamp and every floor name on the map, named as a screen reader reads it. */
export function mapBoxes(): Box[] {
  return [...document.querySelectorAll('.map-button, button.stamp, .html-layer .caption:not(.caption--soft)')].map((element) => {
    const rect = element.getBoundingClientRect();
    return { name: element.getAttribute('aria-label') ?? element.textContent ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
}

function labelOfDrawing(drawing: Element): HTMLElement | null {
  return document.getElementById(`${PIECE_DOM_ID_PREFIX}${(drawing.getAttribute('data-piece') ?? '').replaceAll(':', '-')}`);
}

function boxOf(name: string, element: Element): Box {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { name, x, y, width, height };
}

/** Returns the box of the drawing of every piece of the 2D map, named after its label: `the piece of <label>`. */
function pieceBoxes(): Box[] {
  return [...document.querySelectorAll(DRAWN_PIECES)].map((drawing) => {
    const label = labelOfDrawing(drawing);
    return boxOf(`the piece of ${(label?.getAttribute('aria-label') ?? label?.textContent ?? '').replace(/\s+/g, ' ').trim()}`, drawing);
  });
}

/** Returns the box of the drawing of the piece whose label is the element, or null when the map draws none. */
export function drawingOf(label: Element): Area | null {
  const drawing = [...document.querySelectorAll(DRAWN_PIECES)].find((candidate) => labelOfDrawing(candidate) === label);
  return drawing === undefined ? null : boxOf('', drawing);
}

function zoomOfTheMap(): number {
  const sheet = document.querySelector('.map-stage__sheet');
  return sheet === null ? 1 : new DOMMatrix(getComputedStyle(sheet).transform).a;
}

const STAMP_NAME = /^Paquete:/;
const SAME_PLACE_PX = 0.5;

function centreOf(box: Area): [number, number] {
  return [box.x + box.width / 2, box.y + box.height / 2];
}

function neighboursInAFan(a: Box, b: Box, fanPitch: number): boolean {
  const [[ax, ay], [bx, by]] = [centreOf(a), centreOf(b)];
  return STAMP_NAME.test(a.name) && STAMP_NAME.test(b.name) && Math.abs(Math.hypot(ax - bx, ay - by) - fanPitch) <= SAME_PLACE_PX;
}

/** Returns every pair of the boxes that overlap, as "a / b". With `fanPitch`, two stamps whose centres stand one pitch apart are left out: they are neighbours in the fan of a place, which the 2D map overlaps on purpose. */
function pairsThatOverlap(boxes: Box[], fanPitch?: number): string[] {
  return boxes.flatMap((a, index) =>
    boxes
      .slice(index + 1)
      .filter((b) => overlaps(a, b) && (fanPitch === undefined || !neighboursInAFan(a, b, fanPitch)))
      .map((b) => `${a.name} / ${b.name}`),
  );
}

/** Returns every pair of labels, stamps or floor names of the map that overlap, as "a / b"; `fanPitch` is as in `pairsThatOverlap`. */
export function overlappingPairs(fanPitch?: number): string[] {
  return pairsThatOverlap(mapBoxes(), fanPitch === undefined ? undefined : fanPitch * zoomOfTheMap());
}

/** Returns the names of everything on the map that a card covers: the labels, stamps and floor names, and the drawings of the pieces as the svg of the 2D map draws them. */
export function coveredBy(card: Area): string[] {
  return [...mapBoxes(), ...pieceBoxes()].filter((box) => overlaps(card, box)).map((box) => box.name);
}
