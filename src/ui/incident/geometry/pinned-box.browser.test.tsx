import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent, type Locator } from 'vitest/browser';
import { INSPECTION_TEXT, TERMS } from '@/copy';
import { INCIDENTS } from '@/levels';
import {
  OFFICE_IP,
  bringTheLastLineIntoView,
  card,
  confirm,
  holdTheGrace,
  moveTheMouseTo,
  openTerminal,
  passTheGrace,
  passTime,
  releaseTheGrace,
  sendTo,
  showTheScreen,
  standStill,
  type Point,
} from '@/testing/browser-play';
import { inspectionBoxOverCards } from '@/testing/card-boxes';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const SLOW_TEST_MS = 60_000;
const INCIDENT = '01-08';
const PINNED = 'Fijada';
const PIECE_LABEL = '.map-button';
const INSPECTION_CARD = '.incident__inspection > .card';
const SCROLLING_INSPECTION = '.incident__inspection[data-scrolls]';
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
const SIDE_PANEL = '.incident__side';
const BODY_OF_A_CARD = '.card__body';
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
  await confirm(terminal);
  await expect.element(terminal).not.toBeInTheDocument();
  const lost = page.getByRole('button', { name: LOST_TO_THE_OTHER_OFFICE });
  await expect.element(lost).toBeVisible();
  return lost;
}

function boxOfTheLostPing(): Locator {
  return page.getByRole('region', { name: LOST_PING_BOX, exact: true });
}

afterEach(async () => {
  releaseTheGrace();
  window.scrollTo(0, 0);
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe.each(TRIP_WINDOWS)('$name', ({ size }) => {
  beforeEach(() => page.viewport(size.width, size.height));

  it('a pinned box survives a human-paced trip across another piece and scrolls under the mouse', { timeout: SLOW_TEST_MS }, async () => {
    holdTheGrace();
    await show(INCIDENT);
    const stamp = await sendTheLostPing();
    await standStill();
    await userEvent.click(stamp);
    const box = boxOfTheLostPing();
    await expect.element(box).toMatchTextContent(PINNED);
    await expect.poll(() => document.querySelectorAll(SCROLLING_INSPECTION).length).toBe(1);
    await standStill();
    const from = centerOf(stamp.element());
    const corner = nearestCorner(box.element().getBoundingClientRect(), from);
    expect(isTopmost(corner, INSPECTION_CARD), 'the end of the trip lands on the box').toBe(true);
    const straight = straightPath(from, corner, TRIP_STEPS);
    const through = labelsUnder(straight).length > 0 ? null : labelNearestTo(from, corner);
    const path = through === null ? straight : [...straightPath(from, through, TRIP_STEPS / 2), ...straightPath(through, corner, TRIP_STEPS / 2)];
    expect(labelsUnder(path), 'the trip passes over a label of another piece').not.toEqual([]);

    await travel(path, TRIP_STEP_MS);

    await expect.element(box, { message: 'after the trip, which outlasts the grace, the box still shows the lost ping, pinned' }).toMatchTextContent(PINNED);
    await bringTheLastLineIntoView(box);
    await userEvent.keyboard('{Escape}');
    await expect.element(box).not.toBeInTheDocument();
  });
});

describe('at the desktop window', () => {
  beforeEach(() => page.viewport(DESKTOP_WINDOW.width, DESKTOP_WINDOW.height));

  it('with the keyboard, Enter pins the box and PageDown scrolls it; Escape gives the focus back', { timeout: SLOW_TEST_MS }, async () => {
    await show(INCIDENT);
    const stamp = await sendTheLostPing();
    const box = boxOfTheLostPing();
    const scrolled = () => ({ page: window.scrollY, side: document.querySelector(SIDE_PANEL)?.scrollTop ?? 0 });
    const bodyOfTheBox = () => box.element().querySelector(BODY_OF_A_CARD) as HTMLElement;
    stamp.element().focus();

    await userEvent.keyboard('{Enter}');

    await expect.element(box).toMatchTextContent(PINNED);
    await expect.poll(() => document.querySelectorAll(SCROLLING_INSPECTION).length).toBe(1);
    await expect.element(box.getByRole('heading', { name: LOST_PING_BOX }), { message: 'Enter moves the focus to the heading of the box' }).toHaveFocus();
    const before = scrolled();

    await userEvent.keyboard('{PageDown}');

    await expect.poll(() => bodyOfTheBox().scrollTop, { message: 'PageDown scrolls the body of the box' }).toBeGreaterThan(0);
    expect(scrolled(), 'nothing else scrolls with it').toEqual(before);
    await userEvent.tab({ shift: true });
    expect(document.activeElement, 'Shift+Tab leaves the heading for the body, which scrolls and so takes the focus').toBe(bodyOfTheBox());
    await userEvent.tab({ shift: true });
    await expect.element(box.getByRole('button', { name: INSPECTION_TEXT.closeLabel, exact: true }), { message: 'Shift+Tab again reaches «Cerrar»' }).toHaveFocus();

    holdTheGrace();
    await userEvent.keyboard('{Escape}');

    await expect.element(box).not.toBeInTheDocument();
    await expect.element(stamp, { message: 'Escape gives the focus back to the stamp' }).toHaveFocus();
    await passTheGrace();
    expect(box.query(), 'the focus that comes back does not reopen the box').toBeNull();
  });

  it("a click on a piece that opens a card opens it, pins the piece's box, and a click in the card releases the box", { timeout: SLOW_TEST_MS }, async () => {
    holdTheGrace();
    const first = await show(INCIDENT);
    await standStill();
    const label = page.getByRole('button', { name: YOUR_LAPTOP, exact: true });
    const terminal = card(`Terminal de ${YOUR_LAPTOP}`);
    const box = page.getByRole('region', { name: YOUR_LAPTOP, exact: true });
    const chip = terminal.getByRole('button', { name: OFFICE_IP.server, exact: true });

    await userEvent.click(label);

    await expect.element(terminal).toBeVisible();
    await expect.poll(() => terminal.element().contains(document.activeElement), { message: 'the terminal holds the focus' }).toBe(true);
    await expect.element(box, { message: 'the box of the piece is pinned' }).toMatchTextContent(PINNED);
    await expect.element(label).toHaveAttribute(PINNED_MARK, 'true');
    await standStill();
    expect(inspectionBoxOverCards(), 'the pinned box is on show and covers none of the cards of the map').toEqual({ shown: true, covered: [] });

    await userEvent.click(chip);

    await expect.element(box, { message: 'a click in the card releases the box' }).not.toBeInTheDocument();
    await expect.element(label).not.toHaveAttribute(PINNED_MARK);
    await expect.element(chip, { message: 'and the chip is picked' }).toHaveAttribute('aria-pressed', 'true');

    first.unmount();
    await show(INCIDENT);
    await standStill();
    label.element().focus();
    await userEvent.keyboard('{Enter}');

    await expect.element(terminal).toBeVisible();
    await expect.poll(() => terminal.element().contains(document.activeElement), { message: 'with the keyboard the terminal holds the focus too' }).toBe(true);
    await expect.element(box, { message: 'with the keyboard the box is pinned' }).toMatchTextContent(PINNED);
    await expect.element(label).toHaveAttribute(PINNED_MARK, 'true');
  });

  it('a term definition can be reached with the mouse, and Escape closes it', { timeout: SLOW_TEST_MS }, async () => {
    holdTheGrace();
    await show(INCIDENT);
    await standStill();
    const glossed = [...page.getByRole('region', { name: LUCIA_CARD, exact: true }).element().querySelectorAll(TERM_WITH_TIP)].find((candidate) => candidate.textContent?.includes(GLOSSED_TERM.name));
    if (glossed === undefined) throw new Error('the card of Lucía does not use the term');
    const term = page.elementLocator(glossed);
    const tip = page.getByRole('tooltip');

    await userEvent.hover(term);

    await expect.element(tip).toMatchTextContent(GLOSSED_TERM.definition);
    const [from, shown] = [centerOf(term.element()), tip.element().getBoundingClientRect()];
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

    await userEvent.hover(term);
    await expect.element(tip).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.element(tip).not.toBeInTheDocument();
    await passTheGrace();
    await expect.element(tip, { message: 'Escape closes it for good' }).not.toBeInTheDocument();
  });
});
