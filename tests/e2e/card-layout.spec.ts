import { expect, test, type Locator, type Page } from '@playwright/test';
import { INSPECTION_TEXT, TERMS } from '@/copy';
import { cardProblems, cardsOutsideTheMap, isReachable, reachWithWheel } from './card-boxes';
import { card, openCard, openTerminal, sendTo } from './cards';
import { IP, LOST_TO_OTHER_OFFICE, SETTINGS_BUTTON, SETTINGS_CARD, WATCH_CASES, fixTheGateway, sendThePingAndTheTraceroute } from './chapter-1-play';
import { submitAndFinish } from './closing';
import { collectErrors } from './console-errors';
import type { Area } from './map-boxes';
import { CHAPTER_1_DONE, startWithProgress } from './saved-progress';

const DONE = 'Listo';
const SUBMIT = 'Enviar solución';
const SEE_RESULT = 'Ver resultado';
const NEXT_CASE = 'Siguiente caso';
const KNOW_THE_CAUSE = 'Ya sé la causa';
const ASK_HINT = '¿Alguna pista?';
const BACK_TO_ROADMAP = 'Volver al roadmap';
const TERMINAL = 'Terminal de tu-laptop';
const FIREWALL = 'firewall tu-laptop';
const PRINTER = 'impresora';
const INSPECTED_LAPTOP = /laptop-lucia/;
const THIRD_OPTION_OF_THE_GATEWAY = /laptop-andres no tiene/;
const RIGHT_OPTION_OF_THE_GATEWAY = /no tenía puerta de enlace predeterminada/;
const RIGHT_OPTION_OF_THE_GUARD = /descartó el paquete y no avisó/;
const WRONG_CAUSE_OF_CASE_1 = /servidor-internet está caído/;
const THIRD_CAUSE_OF_CASE_1 = /no tiene IP en su red local/;
const [CASE_1] = WATCH_CASES;
const WARNED_PING = 'Paquete: ping de tu-laptop a 192.168.1.50. Apareció un aviso.';
const WARNED_PING_BOX = 'ping de tu-laptop a 192.168.1.50';
const LONGER_THAN_THE_GRACE_MS = 800;
const GENTLE_WHEEL_PX = 60;
const PINNED = 'Fijada';
const CLOSE = INSPECTION_TEXT.closeLabel;
const LUCIA = 'Lucía';
const LOST_PING_BOX = 'ping de tu-laptop a 10.0.0.10';
const INSPECTION_CARD = '.incident__inspection > .card';
const SCROLLING_INSPECTION = '.incident__inspection[data-scrolls]';
const PIECE_LABEL = '.map-button';
const TRIP_STEPS = 30;
const TRIP_STEP_MS = 30;
const SLOW_STEPS = 10;
const SLOW_STEP_MS = 25;
const CORNER_INSET_PX = 8;
const TIP_INSET_PX = 3;
const GLOSSED_TERM = TERMS['public-ip'];
const YOUR_LAPTOP = 'tu-laptop';
const OUTSIDE_POINT = { x: 4, y: 4 };
const PINNED_MARK = 'data-pinned';

const TALL_WINDOWS = [
  { name: '390 px wide', size: { width: 390, height: 844 } },
  { name: 'desktop width', size: { width: 1440, height: 900 } },
];
const LOW_WINDOWS = [
  { name: '390×700', size: { width: 390, height: 700 } },
  { name: '1280×720', size: { width: 1280, height: 720 } },
];

const LOW_MAP_WINDOWS = [
  { name: '1280×360', size: { width: 1280, height: 360 } },
  { name: '1000×700', size: { width: 1000, height: 700 } },
  { name: '700×600', size: { width: 700, height: 600 } },
  { name: '844×460', size: { width: 844, height: 460 } },
];
const TRIP_WINDOWS = [
  { name: '1440×900', size: { width: 1440, height: 900 }, crosses: PRINTER },
  { name: '1280×800', size: { width: 1280, height: 800 }, crosses: undefined },
  { name: '1000×700', size: { width: 1000, height: 700 }, crosses: undefined },
];
const INSPECTION_WINDOWS = [
  { name: '1280×800', size: { width: 1280, height: 800 } },
  { name: '390×844', size: { width: 390, height: 844 } },
  { name: '1000×700', size: { width: 1000, height: 700 } },
  { name: '1280×500', size: { width: 1280, height: 500 } },
];

interface Point {
  x: number;
  y: number;
}

interface Scene {
  name: string;
  level: string;
  reach: (page: Page) => Promise<void>;
  last: (page: Page) => Locator;
}

async function submit(page: Page) {
  await page.getByRole('button', { name: SUBMIT }).click();
}

async function askTheGatewayQuestion(page: Page) {
  await fixTheGateway(page);
  await submit(page);
}

async function answerTheGatewayQuestion(page: Page) {
  await askTheGatewayQuestion(page);
  await page.getByRole('button', { name: RIGHT_OPTION_OF_THE_GATEWAY }).click();
}

async function openTheCaseQuestion(page: Page) {
  await page.getByRole('button', { name: KNOW_THE_CAUSE }).click();
}

async function answerTheCaseQuestion(page: Page) {
  await openTheCaseQuestion(page);
  await page.getByRole('button', { name: WRONG_CAUSE_OF_CASE_1 }).click();
  await page.getByRole('button', { name: CASE_1.cause }).click();
}

async function finishTheGuard(page: Page) {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.marta);
  await sendTo(terminal, IP.lucia);
  await submitAndFinish(page, RIGHT_OPTION_OF_THE_GUARD);
}

async function sendOnePing(page: Page) {
  await sendTo(await openTerminal(page), IP.marta);
}

async function inspectBesideTheTerminal(page: Page) {
  await sendOnePing(page);
  await page.getByRole('button', { name: INSPECTED_LAPTOP }).hover();
  await expect(page.getByRole('heading', { name: INSPECTED_LAPTOP })).toBeVisible();
}

async function openTheSettings(page: Page) {
  await page.getByRole('button', { name: SETTINGS_BUTTON, exact: true }).click();
}

function opening(name: string) {
  return async (page: Page) => {
    await openCard(page, name);
  };
}

function button(name: string) {
  return (page: Page) => page.getByRole('button', { name, exact: true });
}

function doneOf(name: string) {
  return (page: Page) => card(page, name).getByRole('button', { name: DONE, exact: true });
}

async function sendAPingAndATraceroute(page: Page) {
  await sendThePingAndTheTraceroute(await openTerminal(page));
}

const THE_TERMINAL: Scene = { name: 'the terminal', level: '01-11', reach: sendOnePing, last: doneOf(TERMINAL) };
const THE_PRINTER: Scene = { name: 'the card of the printer', level: '01-01', reach: opening(PRINTER), last: doneOf(PRINTER) };
const THE_SETTINGS: Scene = { name: 'the network settings', level: '01-07', reach: openTheSettings, last: doneOf(SETTINGS_CARD) };
const THE_FIREWALL: Scene = { name: 'the firewall with its tabs', level: '01-13', reach: opening(FIREWALL), last: doneOf(FIREWALL) };
const THE_TRACEROUTE: Scene = { name: 'the terminal with a traceroute', level: '01-10', reach: sendAPingAndATraceroute, last: doneOf(TERMINAL) };

const SCENES: Scene[] = [
  { name: 'Lucía alone', level: '01-11', reach: async () => {}, last: button(ASK_HINT) },
  { name: 'the question after Lucía, unanswered', level: '01-07', reach: askTheGatewayQuestion, last: (page) => page.getByRole('button', { name: THIRD_OPTION_OF_THE_GATEWAY }) },
  { name: 'the question after Lucía, answered', level: '01-07', reach: answerTheGatewayQuestion, last: button(SEE_RESULT) },
  { name: 'the result', level: '01-11', reach: finishTheGuard, last: (page) => page.getByRole('link', { name: BACK_TO_ROADMAP, exact: true }) },
  { name: 'the case, with its question open', level: '01-14', reach: openTheCaseQuestion, last: (page) => page.getByRole('button', { name: THIRD_CAUSE_OF_CASE_1 }) },
  { name: 'the case, answered', level: '01-14', reach: answerTheCaseQuestion, last: button(NEXT_CASE) },
  THE_TERMINAL,
  { name: 'the terminal with a piece inspected', level: '01-11', reach: inspectBesideTheTerminal, last: doneOf(TERMINAL) },
  THE_PRINTER,
  THE_SETTINGS,
  THE_FIREWALL,
];

const MAP_SCENES = [THE_TERMINAL, THE_TRACEROUTE, THE_PRINTER, THE_SETTINGS, THE_FIREWALL];

async function visit(page: Page, level: string) {
  await page.goto(`/#/level/${level}`);
  await page.reload();
}

async function play(page: Page, scene: Scene) {
  await visit(page, scene.level);
  await scene.reach(page);
}

async function sendTheLostPing(page: Page): Promise<Locator> {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.server);
  await sendTo(terminal, IP.otherOffice);
  const lost = page.getByRole('button', { name: LOST_TO_OTHER_OFFICE });
  await expect(lost).toBeVisible();
  return lost;
}

function boxOfTheLostPing(page: Page): Locator {
  return page.getByRole('region', { name: LOST_PING_BOX, exact: true });
}

async function areaOf(target: Locator): Promise<Area> {
  const area = await target.boundingBox();
  if (area === null) throw new Error('the element is not on the page');
  return area;
}

async function centerOf(target: Locator): Promise<Point> {
  const { x, y, width, height } = await areaOf(target);
  return { x: x + width / 2, y: y + height / 2 };
}

function nearestCorner(area: Area, from: Point): Point {
  const middle = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
  const corners = [area.x, area.x + area.width].flatMap((x) => [area.y, area.y + area.height].map((y) => ({ x, y })));
  const closest = corners.reduce((best, corner) => (Math.hypot(corner.x - from.x, corner.y - from.y) < Math.hypot(best.x - from.x, best.y - from.y) ? corner : best));
  return { x: closest.x + Math.sign(middle.x - closest.x) * CORNER_INSET_PX, y: closest.y + Math.sign(middle.y - closest.y) * CORNER_INSET_PX };
}

function straightPath(from: Point, to: Point, steps: number): Point[] {
  return Array.from({ length: steps }, (_, index) => ({ x: from.x + ((to.x - from.x) * (index + 1)) / steps, y: from.y + ((to.y - from.y) * (index + 1)) / steps }));
}

async function travel(page: Page, path: Point[], stepMs: number) {
  for (const { x, y } of path) {
    await page.mouse.move(x, y);
    await page.waitForTimeout(stepMs);
  }
}

async function labelsUnder(page: Page, path: Point[]): Promise<string[]> {
  return page.evaluate(
    ([points, selector]) => [...new Set(points.flatMap(({ x, y }) => document.elementFromPoint(x, y)?.closest(selector)?.textContent?.trim().replace(/\s+/g, ' ') ?? []))],
    [path, PIECE_LABEL] as const,
  );
}

async function labelNearestTo(page: Page, from: Point, to: Point): Promise<Point> {
  const found = await page.evaluate(
    ([start, end, selector]) => {
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      const distanceToTheSegment = (point: { x: number; y: number }) => {
        const along = Math.min(Math.max(((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / length ** 2, 0), 1);
        return Math.hypot(point.x - (start.x + along * (end.x - start.x)), point.y - (start.y + along * (end.y - start.y)));
      };
      const centers = [...document.querySelectorAll(selector)].flatMap((label) => {
        const { x, y, width, height } = label.getBoundingClientRect();
        const center = { x: x + width / 2, y: y + height / 2 };
        return document.elementFromPoint(center.x, center.y)?.closest(selector) === label ? [center] : [];
      });
      return centers.sort((a, b) => distanceToTheSegment(a) - distanceToTheSegment(b))[0] ?? null;
    },
    [from, to, PIECE_LABEL] as const,
  );
  if (found === null) throw new Error('no label of the map can be reached to route the trip through');
  return found;
}

async function isTopmost(page: Page, point: Point, selector: string): Promise<boolean> {
  return page.evaluate(([{ x, y }, matching]) => document.elementFromPoint(x, y)?.closest(matching) != null, [point, selector] as const);
}

function pointOnTheBody(body: Area, windowHeight: number): Point {
  return { x: body.x + body.width / 2, y: body.y + Math.min(body.height, windowHeight - body.y) / 2 };
}

async function holdsTheFocus(target: Locator): Promise<boolean> {
  return target.evaluate((element) => element.contains(document.activeElement));
}

async function bringTheLastLineIntoView(page: Page, box: Locator, label: string) {
  const body = box.locator('.card__body');
  const last = box.locator('dd').last();
  expect(await reachWithWheel(page, last, { within: body, wheelPx: GENTLE_WHEEL_PX }), `${label}: the last line comes into view`).toBe(true);
  const [band, text, within] = await Promise.all([box.locator('.card__band').boundingBox(), last.boundingBox(), body.boundingBox()]);
  if (band === null || text === null || within === null) throw new Error('the inspection box lost a part');
  expect(band.y, `${label}: the band stays in the window`).toBeGreaterThanOrEqual(0);
  expect(band.y + band.height, `${label}: the band stays above the body`).toBeLessThanOrEqual(within.y + 1);
  expect(text.y + text.height, `${label}: the last line ends inside the body`).toBeLessThanOrEqual(within.y + within.height + 1);
}

test.beforeEach(async ({ page }) => {
  await startWithProgress(page, CHAPTER_1_DONE);
});

test('no card is clipped and cards never overlap, at 390 px and at desktop width', async ({ page }) => {
  test.slow();
  const errors = collectErrors(page);
  const problems: string[] = [];
  for (const { name, size } of TALL_WINDOWS) {
    await page.setViewportSize(size);
    for (const scene of SCENES) {
      await play(page, scene);
      problems.push(...(await cardProblems(page)).map((problem) => `${name}, ${scene.name}: ${problem}`));
    }
  }
  expect(problems).toEqual([]);
  expect(errors).toEqual([]);
});

test('the last element of every card can be reached by scrolling on a low screen', async ({ page }) => {
  test.slow();
  const stuck: string[] = [];
  for (const { name, size } of LOW_WINDOWS) {
    await page.setViewportSize(size);
    for (const scene of SCENES) {
      await play(page, scene);
      const last = scene.last(page);
      if (await reachWithWheel(page, last)) await last.click({ trial: true, timeout: 2000 });
      else stuck.push(`${name}, ${scene.name}`);
    }
  }
  expect(stuck).toEqual([]);
});

test('an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view', async ({ page }) => {
  test.slow();
  for (const { name, size } of INSPECTION_WINDOWS) {
    await page.setViewportSize(size);
    await visit(page, '01-05');
    await sendTo(await openTerminal(page), IP.nobody);
    const stamp = page.getByRole('button', { name: WARNED_PING, exact: true });
    const box = page.getByRole('region', { name: WARNED_PING_BOX, exact: true });
    const body = box.locator('.card__body');
    await stamp.hover();
    await expect(box, name).toBeVisible();
    await expect(page.locator(SCROLLING_INSPECTION), `${name}: the box sees that its text does not fit`).toHaveCount(1);
    const previewed = pointOnTheBody(await areaOf(body), size.height);
    await page.mouse.move(previewed.x, previewed.y);
    await page.waitForTimeout(LONGER_THAN_THE_GRACE_MS);
    await expect(box, `${name}: the preview stays while the mouse is over it`).toBeVisible();
    await expect(box, `${name}: a preview is not pinned`).not.toContainText(PINNED);

    await stamp.click();

    await expect(box, `${name}: the click pins the box`).toContainText(PINNED);
    const shown = pointOnTheBody(await areaOf(body), size.height);
    await page.mouse.move(shown.x, shown.y);
    await page.waitForTimeout(LONGER_THAN_THE_GRACE_MS);
    await expect(box, `${name}: the box stays while the mouse is over it`).toBeVisible();
    expect(await body.evaluate((element) => getComputedStyle(element, '::-webkit-scrollbar').width), `${name}: the body draws its own scrollbar, so a scroller that hides it still shows there is more`).not.toBe('auto');
    await bringTheLastLineIntoView(page, box, name);
  }
});

for (const { name, size, crosses } of TRIP_WINDOWS) {
  test.describe(name, () => {
    test.use({ viewport: size });

    test('a pinned box survives a human-paced trip across another piece and scrolls under the mouse', async ({ page }) => {
      test.slow();
      await visit(page, '01-08');
      const stamp = await sendTheLostPing(page);
      await stamp.click();
      const box = boxOfTheLostPing(page);
      await expect(box).toContainText(PINNED);
      await expect(page.locator(SCROLLING_INSPECTION)).toHaveCount(1);
      const from = await centerOf(stamp);
      const corner = nearestCorner(await areaOf(box), from);
      expect(await isTopmost(page, corner, INSPECTION_CARD), 'the end of the trip lands on the box').toBe(true);
      const straight = straightPath(from, corner, TRIP_STEPS);
      const through = (await labelsUnder(page, straight)).length > 0 ? null : await labelNearestTo(page, from, corner);
      const path = through === null ? straight : [...straightPath(from, through, TRIP_STEPS / 2), ...straightPath(through, corner, TRIP_STEPS / 2)];
      const crossed = await labelsUnder(page, path);
      expect(crossed, 'the trip passes over a label of another piece').not.toEqual([]);
      if (crosses !== undefined) expect(crossed.some((label) => label.startsWith(crosses))).toBe(true);

      await travel(page, path, TRIP_STEP_MS);

      await expect(box, 'after the trip the box still shows the lost ping, pinned').toContainText(PINNED);
      await bringTheLastLineIntoView(page, box, name);
      await page.keyboard.press('Escape');
      await expect(box).toHaveCount(0);
    });
  });
}

test('with the keyboard, Enter pins the box and PageDown scrolls it; Escape gives the focus back', async ({ page }) => {
  await visit(page, '01-08');
  const stamp = await sendTheLostPing(page);
  const box = boxOfTheLostPing(page);
  const body = box.locator('.card__body');
  const scrolled = () => page.evaluate(() => ({ page: window.scrollY, side: document.querySelector('.incident__side')?.scrollTop ?? 0 }));
  await stamp.focus();
  await page.keyboard.press('Enter');
  await expect(box).toContainText(PINNED);
  await expect(page.locator(SCROLLING_INSPECTION)).toHaveCount(1);
  await expect(box.getByRole('heading', { name: LOST_PING_BOX }), 'Enter moves the focus to the heading of the box').toBeFocused();
  const before = await scrolled();

  await page.keyboard.press('PageDown');

  await expect.poll(() => body.evaluate((element) => element.scrollTop), 'PageDown scrolls the body of the box').toBeGreaterThan(0);
  expect(await scrolled(), 'nothing else scrolls with it').toEqual(before);
  await page.keyboard.press('Shift+Tab');
  await expect(body, 'Shift+Tab leaves the heading for the body, which scrolls and so takes the focus').toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(box.getByRole('button', { name: CLOSE, exact: true }), 'Shift+Tab again reaches «Cerrar»').toBeFocused();

  await page.keyboard.press('Escape');

  await expect(box).toHaveCount(0);
  await expect(stamp, 'Escape gives the focus back to the stamp').toBeFocused();
  await page.waitForTimeout(LONGER_THAN_THE_GRACE_MS);
  await expect(box, 'the focus that comes back does not reopen the box').toHaveCount(0);
});

test.describe('with a touch screen', () => {
  test.use({ hasTouch: true });

  test('with touch, a tap pins the box and a tap outside releases it', async ({ page }) => {
    await visit(page, '01-08');
    const stamp = await sendTheLostPing(page);
    const box = boxOfTheLostPing(page);

    await stamp.tap();

    await expect(box).toContainText(PINNED);
    await page.waitForTimeout(LONGER_THAN_THE_GRACE_MS);
    await expect(box, 'the pinned box stays after the finger lifts').toBeVisible();

    await page.getByRole('heading', { level: 1 }).tap();

    await expect(box).toHaveCount(0);
  });
});

test("a click on a piece that opens a card opens it, pins the piece's box, and a click in the card releases the box", async ({ page }) => {
  await visit(page, '01-08');
  const label = page.getByRole('button', { name: YOUR_LAPTOP, exact: true });
  const terminal = card(page, `Terminal de ${YOUR_LAPTOP}`);
  const box = page.getByRole('region', { name: YOUR_LAPTOP, exact: true });
  const chip = terminal.getByRole('button', { name: IP.server, exact: true });

  await label.click();

  await expect(terminal).toBeVisible();
  await expect.poll(() => holdsTheFocus(terminal), 'the terminal holds the focus').toBe(true);
  await expect(box, 'the box of the piece is pinned').toContainText(PINNED);
  await expect(label).toHaveAttribute(PINNED_MARK, 'true');

  await chip.click();

  await expect(box, 'a click in the card releases the box').toHaveCount(0);
  await expect(label).not.toHaveAttribute(PINNED_MARK);
  await expect(chip, 'and the chip is picked').toHaveAttribute('aria-pressed', 'true');

  await visit(page, '01-08');
  await label.focus();
  await page.keyboard.press('Enter');

  await expect(terminal).toBeVisible();
  await expect.poll(() => holdsTheFocus(terminal), 'with the keyboard the terminal holds the focus too').toBe(true);
  await expect(box, 'with the keyboard the box is pinned').toContainText(PINNED);
  await expect(label).toHaveAttribute(PINNED_MARK, 'true');
});

test('a term definition can be reached with the mouse, and Escape closes it', async ({ page }) => {
  await visit(page, '01-08');
  const term = page.getByRole('region', { name: LUCIA, exact: true }).locator('.term--tip', { hasText: GLOSSED_TERM.name }).first();
  const tip = page.getByRole('tooltip');
  await term.hover();
  await expect(tip).toContainText(GLOSSED_TERM.definition);
  const [from, shown] = [await centerOf(term), await areaOf(tip)];
  const onto = { x: Math.min(Math.max(from.x, shown.x + TIP_INSET_PX), shown.x + shown.width - TIP_INSET_PX), y: Math.min(Math.max(from.y, shown.y + TIP_INSET_PX), shown.y + shown.height - TIP_INSET_PX) };

  await travel(page, straightPath(from, onto, SLOW_STEPS), SLOW_STEP_MS);
  await page.waitForTimeout(LONGER_THAN_THE_GRACE_MS);

  await expect(tip, 'the definition stays while the mouse is on it').toBeVisible();

  await page.mouse.move(from.x, from.y);
  await page.waitForTimeout(LONGER_THAN_THE_GRACE_MS);

  await expect(tip, 'the definition stays when the mouse goes back from it onto its term').toBeVisible();
  await page.mouse.move(OUTSIDE_POINT.x, OUTSIDE_POINT.y);
  await expect(tip, 'leaving the term afterwards closes it once the grace ends').toHaveCount(0);

  await term.hover();
  await expect(tip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);
  await page.waitForTimeout(LONGER_THAN_THE_GRACE_MS);
  await expect(tip, 'Escape closes it for good').toHaveCount(0);
});

test('a card beside a piece stays inside the map, with its foot in view, in a low or narrow window', async ({ page }) => {
  test.slow();
  const problems: string[] = [];
  for (const { name, size } of LOW_MAP_WINDOWS) {
    await page.setViewportSize(size);
    for (const scene of MAP_SCENES) {
      await play(page, scene);
      problems.push(...(await cardsOutsideTheMap(page)).map((problem) => `${name}, ${scene.name}: ${problem}`));
      if (!(await isReachable(page, scene.last(page)))) problems.push(`${name}, ${scene.name}: its foot is out of reach`);
    }
  }
  expect(problems).toEqual([]);
});
