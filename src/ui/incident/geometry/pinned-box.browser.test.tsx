import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent, type Locator } from 'vitest/browser';
import { INSPECTION_TEXT, MAP_TEXT, TERMS } from '@/copy';
import { INCIDENTS } from '@/levels';
import {
  OFFICE_IP,
  bringTheLastLineIntoView,
  card,
  holdTheGrace,
  moveTheMouseAway,
  moveTheMouseTo,
  openTerminal,
  passTheGrace,
  passTime,
  releaseTheGrace,
  sendMessage,
  sendTo,
  showTheScreen,
  standStill,
  tapAt,
  type Point,
} from '@/testing/browser-play';
import { inspectionBoxOverCards, isReachable } from '@/testing/card-boxes';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const SLOW_TEST_MS = 60_000;
const INCIDENT = '01-08';
const REFUSED_OR_SILENT = '02-03';
const LUCIA_LAPTOP = 'laptop-lucia';
const LOOPBACK = '127.0.0.1';
const NC_TO_THE_APP = 'nc · puerto 3000';
const NC_TO_THE_CLOSED_PORT = 'nc · puerto 3306';
const STAMPS_AT_LUCIA = 4;
const HIDDEN_AT_LUCIA = 2;
const PACKET_STAMP = /^Paquete:/;
const LISTED_PACKET = 'dl > div';
const SOURCE_OF_THE_PACKET = /^TCP \d+ → /;
const PIECE_LABEL = '.map-button';
const PANEL_CARD = '.incident__panel > .card';
const PANEL_BODY = '.incident__panel > .card > .card__body';
const LOST_TO_THE_OTHER_OFFICE = /^Paquete: ping de tu-laptop a 10\.0\.0\.10\. Perdido\.$/;
const LOST_PING_BOX = 'ping de tu-laptop a 10.0.0.10';
const TRIP_STEPS = 30;
const TRIP_STEP_MS = 30;
const CORNER_INSET_PX = 8;
const TIP_INSET_PX = 3;
const SLOW_STEPS = 10;
const SLOW_STEP_MS = 25;
const OUTSIDE_POINT = { x: 4, y: 4 };
const DESKTOP_WINDOW = { width: 1440, height: 900 };
const LUCIA_REGION = '.incident__lucia';
const LOW_WINDOW = { width: 1280, height: 600 };
const PINNED_MARK = 'data-pinned';
const YOUR_LAPTOP = 'tu-laptop';
const LUCIA_CARD = 'Lucía';
const TERM_WITH_TIP = '.term--tip';
const GLOSSED_TERM = TERMS['public-ip'];
const TRIP_WINDOWS = [
  { name: '1440×900', size: { width: 1440, height: 900 } },
  { name: '1280×800', size: { width: 1280, height: 800 } },
  { name: '1000×700', size: { width: 1000, height: 700 } },
];

function clamp(value: number, least: number, most: number): number {
  return Math.min(Math.max(value, least), most);
}

function show(level: string) {
  return showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={level} nextId={null} onFinish={() => undefined} />);
}

function centerOf(target: Element): Point {
  const { x, y, width, height } = target.getBoundingClientRect();
  return { x: x + width / 2, y: y + height / 2 };
}

function nearestCorner(area: DOMRect, from: Point): Point {
  const middle = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
  const corners = [area.x, area.x + area.width].flatMap((x) => [area.y, area.y + area.height].map((y) => ({ x, y })));
  const closest = corners.reduce((best, corner) => (Math.hypot(corner.x - from.x, corner.y - from.y) < Math.hypot(best.x - from.x, best.y - from.y) ? corner : best));
  return { x: closest.x + Math.sign(middle.x - closest.x) * CORNER_INSET_PX, y: closest.y + Math.sign(middle.y - closest.y) * CORNER_INSET_PX };
}

function straightPath(from: Point, to: Point, steps: number): Point[] {
  return Array.from({ length: steps }, (_, index) => ({ x: from.x + ((to.x - from.x) * (index + 1)) / steps, y: from.y + ((to.y - from.y) * (index + 1)) / steps }));
}

function labelsUnder(path: Point[]): string[] {
  return [...new Set(path.flatMap(({ x, y }) => document.elementFromPoint(x, y)?.closest(PIECE_LABEL)?.textContent?.trim().replace(/\s+/g, ' ') ?? []))];
}

function labelNearestTo(from: Point, to: Point): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const distanceToTheSegment = (point: Point) => {
    const along = Math.min(Math.max(((point.x - from.x) * (to.x - from.x) + (point.y - from.y) * (to.y - from.y)) / length ** 2, 0), 1);
    return Math.hypot(point.x - (from.x + along * (to.x - from.x)), point.y - (from.y + along * (to.y - from.y)));
  };
  const centers = [...document.querySelectorAll(PIECE_LABEL)].flatMap((label) => {
    const center = centerOf(label);
    return document.elementFromPoint(center.x, center.y)?.closest(PIECE_LABEL) === label ? [center] : [];
  });
  const nearest = centers.sort((a, b) => distanceToTheSegment(a) - distanceToTheSegment(b))[0];
  if (nearest === undefined) throw new Error('no label of the map can be reached to route the trip through');
  return nearest;
}

function isTopmost(point: Point, selector: string): boolean {
  return document.elementFromPoint(point.x, point.y)?.closest(selector) != null;
}

async function travel(path: Point[], stepMs: number): Promise<void> {
  for (const point of path) {
    await moveTheMouseTo(point);
    await passTime(stepMs);
  }
}

async function sendTheLostPing(): Promise<Locator> {
  const terminal = await openTerminal();
  await sendTo(terminal, OFFICE_IP.server);
  await sendTo(terminal, OFFICE_IP.otherOffice);
  const lost = page.getByRole('button', { name: LOST_TO_THE_OTHER_OFFICE });
  await expect.element(lost).toBeVisible();
  return lost;
}

function boxOfTheLostPing(): Locator {
  return page.getByRole('region', { name: LOST_PING_BOX, exact: true });
}

async function sendNc(terminal: Locator, ip: string, message: string): Promise<void> {
  await userEvent.click(terminal.getByRole('button', { name: ip, exact: true }));
  await moveTheMouseAway();
  await sendMessage(terminal, message);
}

async function stackFourStampsAtLucia(): Promise<Locator> {
  const terminal = await openTerminal(LUCIA_LAPTOP);
  for (const ip of [OFFICE_IP.lucia, LOOPBACK]) for (const message of [NC_TO_THE_APP, NC_TO_THE_CLOSED_PORT]) await sendNc(terminal, ip, message);
  await moveTheMouseAway();
  return page.getByRole('button', { name: MAP_TEXT.moreStamps(HIDDEN_AT_LUCIA, STAMPS_AT_LUCIA), exact: true });
}

async function readToTheEnd(box: Locator): Promise<void> {
  const body = document.querySelector(PANEL_BODY) as HTMLElement;
  const last = [...box.element().querySelectorAll('dd')].at(-1) as Element;
  if (body.scrollHeight > body.clientHeight + 1 && !isReachable(last)) await bringTheLastLineIntoView(box);
}

function listOfTheFour(): Locator {
  return page.getByRole('region', { name: INSPECTION_TEXT.stampsTitle(STAMPS_AT_LUCIA), exact: true });
}

afterEach(async () => {
  releaseTheGrace();
  window.scrollTo(0, 0);
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe.each(TRIP_WINDOWS)('$name', ({ size }) => {
  beforeEach(() => page.viewport(size.width, size.height));

  it('a packet chosen stays in the panel across a human-paced trip over another piece, and its box scrolls under the mouse', { timeout: SLOW_TEST_MS }, async () => {
    holdTheGrace();
    await show(INCIDENT);
    const stamp = await sendTheLostPing();
    await standStill();
    await userEvent.click(stamp);
    const box = boxOfTheLostPing();
    await expect.element(box).toBeVisible();
    expect(box.element().closest(PANEL_CARD), 'the box is in the panel of the column').toBe(box.element());
    await standStill();
    const from = centerOf(stamp.element());
    const corner = nearestCorner(box.element().getBoundingClientRect(), from);
    expect(isTopmost(corner, PANEL_CARD), 'the end of the trip lands on the panel').toBe(true);
    const straight = straightPath(from, corner, TRIP_STEPS);
    const through = labelsUnder(straight).length > 0 ? null : labelNearestTo(from, corner);
    const path = through === null ? straight : [...straightPath(from, through, TRIP_STEPS / 2), ...straightPath(through, corner, TRIP_STEPS / 2)];
    expect(labelsUnder(path), 'the trip passes over a label of another piece').not.toEqual([]);

    await travel(path, TRIP_STEP_MS);

    await expect.element(box, { message: 'after the trip, which outlasts the grace, the panel still shows the lost ping' }).toBeVisible();
    await readToTheEnd(box);
  });
});

describe('at a low window', () => {
  beforeEach(() => page.viewport(LOW_WINDOW.width, LOW_WINDOW.height));

  it('with the keyboard, Enter chooses the packet and PageDown scrolls its box in the panel; Escape gives the focus back and keeps the box', { timeout: SLOW_TEST_MS }, async () => {
    await show(INCIDENT);
    const stamp = await sendTheLostPing();
    const box = boxOfTheLostPing();
    const scrolled = () => ({ page: window.scrollY, lucia: document.querySelector(LUCIA_REGION)?.scrollTop ?? 0 });
    const bodyOfTheBox = () => document.querySelector(PANEL_BODY) as HTMLElement;
    stamp.element().focus();

    await userEvent.keyboard('{Enter}');

    await expect.element(box).toBeVisible();
    await expect.element(box.getByRole('heading', { name: LOST_PING_BOX }), { message: 'Enter moves the focus to the heading of the box' }).toHaveFocus();
    expect(bodyOfTheBox().scrollHeight, 'the box does not fit the panel, so its body scrolls').toBeGreaterThan(bodyOfTheBox().clientHeight);
    const before = scrolled();

    await userEvent.keyboard('{PageDown}');

    await expect.poll(() => bodyOfTheBox().scrollTop, { message: 'PageDown scrolls the body of the box' }).toBeGreaterThan(0);
    expect(scrolled(), 'nothing else scrolls with it').toEqual(before);
    await userEvent.tab({ shift: true });
    expect(document.activeElement, 'Shift+Tab leaves the heading for the body, which scrolls and so takes the focus').toBe(bodyOfTheBox());
    await userEvent.tab({ shift: true });
    await expect.element(box.getByRole('button', { name: INSPECTION_TEXT.closeLabel, exact: true }), { message: 'Shift+Tab again reaches «Cerrar»' }).toHaveFocus();

    await userEvent.keyboard('{Escape}');

    await expect.element(stamp, { message: 'Escape gives the focus back to the stamp' }).toHaveFocus();
    await expect.element(box, { message: 'and keeps the box in the panel' }).toBeVisible();
  });
});

describe('at the desktop window', () => {
  beforeEach(() => page.viewport(DESKTOP_WINDOW.width, DESKTOP_WINDOW.height));

  it("a click on a piece that opens a card opens it, shows the piece in the panel, and a click in the card leaves the panel as it is", { timeout: SLOW_TEST_MS }, async () => {
    holdTheGrace();
    const first = await show(INCIDENT);
    await standStill();
    const label = page.getByRole('button', { name: YOUR_LAPTOP, exact: true });
    const terminal = card(YOUR_LAPTOP);
    const box = page.getByRole('region', { name: YOUR_LAPTOP, exact: true });
    const chip = terminal.getByRole('button', { name: OFFICE_IP.server, exact: true });

    await userEvent.click(label);

    await expect.element(terminal).toBeVisible();
    await expect.element(box, { message: 'the piece is in the panel' }).toBeVisible();
    expect(box.element().closest(PANEL_CARD)).toBe(box.element());
    await expect.element(label).toHaveAttribute(PINNED_MARK, 'true');
    await standStill();
    expect(inspectionBoxOverCards().covered, 'the box of the hover covers none of the cards of the map').toEqual([]);

    await userEvent.click(chip);

    await expect.element(box, { message: 'a click in the card leaves the panel as it is' }).toBeVisible();
    await expect.element(label).toHaveAttribute(PINNED_MARK, 'true');
    await expect.element(chip, { message: 'and the chip is picked' }).toHaveAttribute('aria-pressed', 'true');

    first.unmount();
    await show(INCIDENT);
    await standStill();
    label.element().focus();
    await userEvent.keyboard('{Enter}');

    await expect.element(terminal).toBeVisible();
    await expect.poll(() => box.getByRole('heading', { name: YOUR_LAPTOP }).element() === document.activeElement, { message: 'with the keyboard the focus goes to the heading of the panel' }).toBe(true);
    await expect.element(box, { message: 'with the keyboard the piece is in the panel' }).toBeVisible();
    await expect.element(label).toHaveAttribute(PINNED_MARK, 'true');
  });

  it('a term definition can be reached with the mouse, and Escape closes it', { timeout: SLOW_TEST_MS }, async () => {
    holdTheGrace();
    await show(INCIDENT);
    await standStill();
    const glossed = [...page.getByRole('region', { name: LUCIA_CARD, exact: true }).element().querySelectorAll(TERM_WITH_TIP)].find((candidate) => candidate.textContent?.includes(GLOSSED_TERM.name));
    if (glossed === undefined) throw new Error('the card of Lucía does not use the term');
    const tip = page.getByRole('tooltip');
    const [firstLine] = glossed.getClientRects();
    const from = { x: firstLine.x + firstLine.width / 2, y: firstLine.y + firstLine.height / 2 };

    await moveTheMouseTo(from);

    await expect.element(tip).toMatchTextContent(GLOSSED_TERM.definition);
    const shown = tip.element().getBoundingClientRect();
    const onto = { x: clamp(from.x, shown.x + TIP_INSET_PX, shown.x + shown.width - TIP_INSET_PX), y: clamp(from.y, shown.y + TIP_INSET_PX, shown.y + shown.height - TIP_INSET_PX) };

    await travel(straightPath(from, onto, SLOW_STEPS), SLOW_STEP_MS);
    await passTheGrace();

    await expect.element(tip, { message: 'the definition stays while the mouse is on it' }).toBeVisible();

    await moveTheMouseTo(from);
    await passTheGrace();

    await expect.element(tip, { message: 'the definition stays when the mouse goes back from it onto its term' }).toBeVisible();
    await moveTheMouseTo(OUTSIDE_POINT);
    await passTheGrace();
    await expect.element(tip, { message: 'leaving the term afterwards closes it once the grace ends' }).not.toBeInTheDocument();

    await moveTheMouseTo(from);
    await expect.element(tip).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.element(tip).not.toBeInTheDocument();
    await passTheGrace();
    await expect.element(tip, { message: 'Escape closes it for good' }).not.toBeInTheDocument();
  });
});

describe('the «+N» of 02-03 at the desktop window', () => {
  beforeEach(() => page.viewport(DESKTOP_WINDOW.width, DESKTOP_WINDOW.height));

  it('in 02-03 a fourth stamp at laptop-lucia turns the last casilla into «+2», and hovering it lists the four', { timeout: SLOW_TEST_MS }, async () => {
    await show(REFUSED_OR_SILENT);
    const more = await stackFourStampsAtLucia();
    await expect.element(more).toBeVisible();
    await expect.element(more).toHaveTextContent(`+${HIDDEN_AT_LUCIA}`);
    await expect.poll(() => page.getByRole('button', { name: PACKET_STAMP }).elements().length, { message: 'the fan draws the stamps that fit, one less than the casillas, and the «+2»' }).toBe(STAMPS_AT_LUCIA - HIDDEN_AT_LUCIA);

    await userEvent.hover(more);

    const list = listOfTheFour();
    await expect.element(list).toBeVisible();
    await expect.element(list, { message: 'a hover is a preview: no «Cerrar»' }).not.toMatchTextContent(INSPECTION_TEXT.close);
    const fields = [...list.element().querySelectorAll(LISTED_PACKET)].map((field) => [field.querySelector('dt')?.textContent?.replace(SOURCE_OF_THE_PACKET, ''), field.querySelector('dd')?.textContent]);
    expect(fields, 'one field for each stamp of the place, the drawn ones too, the newest first, with how it ended').toEqual([
      [`3306 de ${LUCIA_LAPTOP} a ${LOOPBACK}`, INSPECTION_TEXT.stampLine('arrived')],
      [`3000 de ${LUCIA_LAPTOP} a ${LOOPBACK}`, INSPECTION_TEXT.stampLine('arrived')],
      [`3306 de ${LUCIA_LAPTOP} a ${OFFICE_IP.lucia}`, INSPECTION_TEXT.stampLine('arrived')],
      [`3000 de ${LUCIA_LAPTOP} a ${OFFICE_IP.lucia}`, INSPECTION_TEXT.stampLine('arrived')],
    ]);
  });

  it('in 02-03 the list of «+2» opens in the panel with the keyboard focus and Escape gives the focus back', { timeout: SLOW_TEST_MS }, async () => {
    await show(REFUSED_OR_SILENT);
    const more = await stackFourStampsAtLucia();
    await expect.element(more).toBeVisible();
    more.element().focus();

    await userEvent.keyboard('{Enter}');

    const list = listOfTheFour();
    await expect.element(list, { message: 'Enter shows the list in the panel, with «Cerrar»' }).toMatchTextContent(INSPECTION_TEXT.close);
    expect(list.element().closest(PANEL_CARD)).toBe(list.element());
    await expect.element(list.getByRole('heading', { name: INSPECTION_TEXT.stampsTitle(STAMPS_AT_LUCIA) }), { message: 'Enter moves the focus to the heading of the list' }).toHaveFocus();

    holdTheGrace();
    await userEvent.keyboard('{Escape}');

    await expect.element(more, { message: 'Escape gives the focus back to «+2»' }).toHaveFocus();
    await passTheGrace();
    await expect.element(list, { message: 'and the list stays in the panel' }).toBeVisible();
  });

  it('in 02-03 a tap on «+2» shows the list in the panel and a tap outside leaves it', { timeout: SLOW_TEST_MS }, async () => {
    await show(REFUSED_OR_SILENT);
    const more = await stackFourStampsAtLucia();
    await expect.element(more).toBeVisible();
    holdTheGrace();

    await tapAt(centerOf(more.element()));

    const list = listOfTheFour();
    await expect.element(list, { message: 'a tap shows the list in the panel, with «Cerrar»' }).toMatchTextContent(INSPECTION_TEXT.close);
    await passTheGrace();
    await expect.element(list, { message: 'the list stays after the finger lifts' }).toBeVisible();

    await tapAt(OUTSIDE_POINT);

    await expect.element(list, { message: 'a tap outside leaves it' }).toBeVisible();
  });
});
