import { expect, test, type Locator, type Page } from '@playwright/test';
import { INSPECTION_TEXT, TERMS } from '@/copy';
import { cardProblems, cardsOutsideTheMap, inspectionBoxOverCards, isReachable, reachWithWheel } from './card-boxes';
import { card, confirm, openCard, openTerminal, sendMessage, sendTo } from './cards';
import { IP, LOST_TO_OTHER_OFFICE, SETTINGS_CARD, SETTINGS_TAB, WATCH_CASES, fixTheGateway, sendThePingAndTheTraceroute } from '@e2e/chapter-1/chapter-1-play';
import { submitAndFinish } from './closing';
import {
  ANDRES,
  ANYWHERE,
  BRANCH_HOP,
  CLASSIFY_TAB,
  INSIDE_THE_BLOCK,
  LUCIA,
  NC_TO_THE_WEB_PORT,
  OFFICE_ROUTER,
  OFFICE_ROUTES_CARD,
  OTHER_OFFICE_BLOCK,
  OUTSIDE_THE_BLOCK,
  PROVIDER_HOP,
  ROUTES_TAB,
  SERVICES_CARD,
  SERVICES_TAB,
  TRANSLATIONS_CARD,
  TRANSLATIONS_TAB,
  YOUR_LAPTOP,
  YOUR_ROUTES_CARD,
  addRoute,
  placeInBin,
} from '@e2e/chapter-2/chapter-2-play';
import { collectErrors } from './console-errors';
import type { Area } from './map-boxes';
import { CHAPTER_2_DONE, startWithProgress } from './saved-progress';
import { freezeTime, standStill, stepFrame } from './still-scene';

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
const PIECE_LABEL = '.map-button';
const HTML_LAYER = '.html-layer';
const PHONE_WINDOW = { width: 390, height: 844 };
const GENTLE_WHEEL_PX = 60;
const SECURITY_GROUP = 'Security Group servidor2';
const ECHO_REQUEST_CHIP = 'ICMP · Echo Request';
const ANYWHERE_CHIP = /Anywhere-IPv4/;
const PINNED = 'Fijada';
const CLOSE = INSPECTION_TEXT.closeLabel;
const LUCIA_CARD = 'Lucía';
const LOST_PING_BOX = 'ping de tu-laptop a 10.0.0.10';
const INSPECTION_CARD = '.incident__inspection > .card';
const SCROLLING_INSPECTION = '.incident__inspection[data-scrolls]';
const TRIP_STEPS = 30;
const TRIP_STEP_MS = 30;
const SLOW_STEPS = 10;
const SLOW_STEP_MS = 25;
const CORNER_INSET_PX = 8;
const TIP_INSET_PX = 3;
const GLOSSED_TERM = TERMS['public-ip'];
const OUTSIDE_POINT = { x: 4, y: 4 };
const PINNED_MARK = 'data-pinned';
const DESKTOP_WINDOW = { width: 1440, height: 900 };
const TIGHT_WINDOW = { width: 1000, height: 700 };

const TALL_WINDOWS = [
  { name: '390 px wide', size: { width: 390, height: 844 } },
  { name: 'desktop width', size: { width: 1440, height: 900 } },
];
const LOW_WINDOWS = [
  { name: '390×700', size: { width: 390, height: 700 } },
  { name: '1280×720', size: { width: 1280, height: 720 } },
];

const LOW_MAP_WINDOWS = [
  { name: '1280×360', size: { width: 1280, height: 360 }, boxShows: true },
  { name: '1000×700', size: { width: 1000, height: 700 }, boxShows: false },
  { name: '700×600', size: { width: 700, height: 600 }, boxShows: true },
  { name: '844×460', size: { width: 844, height: 460 }, boxShows: true },
];
const TRIP_WINDOWS = [
  { name: '1440×900', size: { width: 1440, height: 900 }, crosses: OFFICE_ROUTER },
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

async function openTheLaptopByKeyboard(page: Page, laptop = 'tu-laptop') {
  await page.getByRole('button', { name: laptop, exact: true }).focus();
  await page.keyboard.press('Enter');
}

async function reachTheSettings(page: Page) {
  await openTheLaptopByKeyboard(page);
  await page.getByRole('tab', { name: SETTINGS_TAB, exact: true }).click();
}

async function reachTheServices(page: Page) {
  await openTheLaptopByKeyboard(page, 'laptop-lucia');
  await page.getByRole('tab', { name: SERVICES_TAB, exact: true }).click();
}

async function reachTheClassifyCard(page: Page) {
  await openTheLaptopByKeyboard(page);
  await page.getByRole('tab', { name: CLASSIFY_TAB, exact: true }).click();
}

async function placeBothItems(page: Page) {
  await reachTheClassifyCard(page);
  const classify = card(page, YOUR_LAPTOP);
  await placeInBin(classify, PRINTER, INSIDE_THE_BLOCK);
  await placeInBin(classify, ANDRES, OUTSIDE_THE_BLOCK);
}

async function reachYourRoutes(page: Page) {
  await openTheLaptopByKeyboard(page);
  await page.getByRole('tab', { name: ROUTES_TAB, exact: true }).click();
}

async function reachTheOfficeRoutes(page: Page) {
  await openTheLaptopByKeyboard(page, OFFICE_ROUTER);
  const table = card(page, OFFICE_ROUTES_CARD);
  await addRoute(table, ANYWHERE, PROVIDER_HOP);
  await addRoute(table, OTHER_OFFICE_BLOCK, BRANCH_HOP);
}

async function reachTheTranslations(page: Page) {
  for (const laptop of [YOUR_LAPTOP, LUCIA]) {
    const terminal = await openTerminal(page, laptop);
    await sendMessage(terminal, NC_TO_THE_WEB_PORT);
    await confirm(terminal);
    await expect(terminal).toBeHidden();
  }
  await openTheLaptopByKeyboard(page, OFFICE_ROUTER);
  await page.getByRole('tab', { name: TRANSLATIONS_TAB, exact: true }).click();
}

async function sendFromTheTabbedTerminal(page: Page) {
  await openTheLaptopByKeyboard(page);
  await sendTo(card(page, TERMINAL), IP.andres);
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
const THE_SETTINGS: Scene = { name: 'the network settings', level: '01-07', reach: reachTheSettings, last: doneOf(SETTINGS_CARD) };
const THE_TABBED_TERMINAL: Scene = { name: 'the terminal, the first tab of the card of the laptop', level: '01-07', reach: sendFromTheTabbedTerminal, last: doneOf(TERMINAL) };
const THE_SERVICES: Scene = { name: 'the services, a tab of the card of laptop-lucia', level: '02-03', reach: reachTheServices, last: doneOf(SERVICES_CARD) };
const THE_CLASSIFY: Scene = { name: 'the card that classifies, with nothing placed yet', level: '02-04', reach: reachTheClassifyCard, last: doneOf(YOUR_LAPTOP) };
const THE_PLACED_CLASSIFY: Scene = { name: 'the card that classifies, with both items placed and a line under each', level: '02-04', reach: placeBothItems, last: doneOf(YOUR_LAPTOP) };
const THE_ROUTES: Scene = { name: 'the routing table of your laptop, read only, a tab of its card', level: '02-06', reach: reachYourRoutes, last: doneOf(YOUR_ROUTES_CARD) };
const THE_EDITABLE_ROUTES: Scene = {
  name: 'the routing table of router-oficina, with its two routes written and its trays',
  level: '02-07',
  reach: reachTheOfficeRoutes,
  last: doneOf(OFFICE_ROUTES_CARD),
};
const THE_TRANSLATIONS: Scene = {
  name: 'the table of translations of router-oficina, read only, with the rows of two laptops',
  level: '02-08',
  reach: reachTheTranslations,
  last: doneOf(TRANSLATIONS_CARD),
};
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
  THE_TABBED_TERMINAL,
  THE_SERVICES,
  THE_ROUTES,
  THE_EDITABLE_ROUTES,
  THE_TRANSLATIONS,
  THE_FIREWALL,
];

const MAP_SCENES = [THE_TERMINAL, THE_TRACEROUTE, THE_PRINTER, THE_SETTINGS, THE_TABBED_TERMINAL, THE_SERVICES, THE_ROUTES, THE_EDITABLE_ROUTES, THE_TRANSLATIONS, THE_CLASSIFY, THE_PLACED_CLASSIFY, THE_FIREWALL];

async function passTheGrace(page: Page) {
  await page.clock.fastForward(LONGER_THAN_THE_GRACE_MS);
}

async function visit(page: Page, level: string) {
  await page.goto(`/#/level/${level}`);
  await page.reload();
}

async function play(page: Page, scene: Scene) {
  await visit(page, scene.level);
  await scene.reach(page);
}

async function playWithTheClockPaused(page: Page, scene: Scene, eachFrame: (page: Page) => Promise<void>) {
  await page.clock.resume();
  await page.goto(`/#/level/${scene.level}`);
  await page.reload();
  await page.locator(PIECE_LABEL).first().waitFor();
  await standStill(page);
  await freezeTime(page);
  await scene.reach(page);
  await standStill(page, { eachFrame });
}

async function playUntilItRests(page: Page, scene: Scene) {
  await playWithTheClockPaused(page, scene, passTheGrace);
}

async function wrongIpOfThePrinter(page: Page) {
  const printer = await openCard(page, PRINTER);
  await printer.getByRole('button', { name: DONE, exact: true }).click();
}

async function intruderAndRejection(page: Page) {
  const group = await openCard(page, SECURITY_GROUP);
  await group.getByRole('button', { name: ECHO_REQUEST_CHIP }).click();
  await group.getByRole('button', { name: ANYWHERE_CHIP }).click();
  await submit(page);
}

async function messagesCoveringWhatIsAbove(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.message')).flatMap((message) => {
      const tab = message.querySelector('.message__tab')?.getBoundingClientRect();
      const above = message.previousElementSibling?.getBoundingClientRect();
      if (tab === undefined || above === undefined || above.height === 0) return [];
      return tab.top < above.bottom ? [`${message.textContent?.slice(0, 40)}: its tab starts at ${tab.top} and the element above ends at ${above.bottom}`] : [];
    }),
  );
}

const MESSAGE_SCENES: Scene[] = [
  { name: 'the wrong IP of the printer', level: '01-01', reach: wrongIpOfThePrinter, last: doneOf(PRINTER) },
  { name: 'the question after Lucía, answered', level: '01-07', reach: answerTheGatewayQuestion, last: button(SEE_RESULT) },
  { name: 'the case, answered', level: '01-14', reach: answerTheCaseQuestion, last: button(NEXT_CASE) },
  { name: 'the intruder and the rejection of Lucía', level: '04-01', reach: intruderAndRejection, last: button(SUBMIT) },
];

const MOVING_SCENE_LAST_FRAME = 40;
const MOVING_SCENE = `
<div class="card" id="box" style="position: absolute; left: 0; top: 0; width: 100px; height: 40px"></div>
<script>
  const box = document.getElementById('box');
  const watcher = new ResizeObserver(() => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => box.setAttribute('data-scrolls', 'true');
    channel.port2.postMessage(null);
  });
  let frame = 0;
  const move = () => {
    frame += 1;
    box.style.left = frame + 'px';
    if (frame < ${MOVING_SCENE_LAST_FRAME}) requestAnimationFrame(move);
    else {
      watcher.observe(box);
      box.style.width = '160px';
    }
  };
  requestAnimationFrame(move);
</script>`;
const RESTLESS_SCENE = `
<div class="card" id="box" style="position: absolute; left: 0; top: 0; width: 100px; height: 40px"></div>
<script>
  let frame = 0;
  const sway = () => {
    frame += 1;
    document.getElementById('box').style.left = frame + 'px';
    requestAnimationFrame(sway);
  };
  requestAnimationFrame(sway);
</script>`;
const FRAME_BUDGET_OF_THE_RESTLESS_SCENE = 30;
const SLOW_TIMER_MS = 600_000;
const PAUSED_SCENE = `
<div class="card" id="box" style="position: absolute; left: 0; top: 0; width: 100px; height: 40px"></div>
<script>
  const box = document.getElementById('box');
  setTimeout(() => box.remove(), ${SLOW_TIMER_MS});
  let frame = 0;
  const move = () => {
    frame += 1;
    box.style.left = frame + 'px';
    if (frame < ${MOVING_SCENE_LAST_FRAME}) requestAnimationFrame(move);
  };
  requestAnimationFrame(move);
</script>`;

async function sendTheLostPing(page: Page): Promise<Locator> {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.server);
  await sendTo(terminal, IP.otherOffice);
  await confirm(terminal);
  await expect(terminal).toBeHidden();
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

/** Moves the mouse along the path and lets `stepMs` of the time of the page pass after each step, so the trip of a hand that takes `path.length * stepMs` ms takes exactly that long for the timers of the page, however fast or slow the test runs. The clock of the page must be installed, and it should be held, so no timer fires except through this call. */
async function travel(page: Page, path: Point[], stepMs: number) {
  for (const { x, y } of path) {
    await page.mouse.move(x, y);
    await page.clock.runFor(stepMs);
  }
}

/** Lets the scene settle and then stops the clock of the page, so no timer fires until the test moves `page.clock`: the page stays as the last action left it, and a trip of the mouse takes only the time the test gives it. */
async function holdTheClock(page: Page) {
  await page.locator(PIECE_LABEL).first().waitFor();
  await standStill(page);
  await freezeTime(page);
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
  await startWithProgress(page, CHAPTER_2_DONE);
});

test('a box is measured only once the scene stands still', async ({ page }) => {
  await page.setContent(MOVING_SCENE);
  await standStill(page);
  const measured = await page.evaluate(() => {
    const box = document.getElementById('box');
    return box === null ? null : { left: box.getBoundingClientRect().left, width: box.getBoundingClientRect().width, scrolls: box.getAttribute('data-scrolls') };
  });
  expect(measured).toEqual({ left: MOVING_SCENE_LAST_FRAME, width: 160, scrolls: 'true' });
});

test('a scene that never stands still is reported and not measured', async ({ page }) => {
  await page.setContent(RESTLESS_SCENE);
  await expect(standStill(page, { frameBudget: FRAME_BUDGET_OF_THE_RESTLESS_SCENE })).rejects.toThrow(`did not stand still in ${FRAME_BUDGET_OF_THE_RESTLESS_SCENE} frames`);
});

test('with the clock paused the scene still moves to its rest frame by frame, and a timer that is not due has not fired', async ({ page }) => {
  await page.clock.install();
  await page.setContent(PAUSED_SCENE);
  await freezeTime(page);
  await standStill(page, { eachFrame: stepFrame });
  const left = () => page.evaluate(() => document.getElementById('box')?.getBoundingClientRect().left ?? null);
  expect(await left()).toBe(MOVING_SCENE_LAST_FRAME);
  await page.clock.fastForward(SLOW_TIMER_MS);
  await standStill(page, { eachFrame: stepFrame });
  expect(await left()).toBeNull();
});

test('a card opened on a narrow map never scrolls the layer of the labels, so the labels keep their place over the drawing', async ({ page }) => {
  await page.setViewportSize(PHONE_WINDOW);
  await page.goto(`/#/level/${THE_TRANSLATIONS.level}`);
  await page.reload();
  const layer = page.locator(HTML_LAYER);
  const scrolled = () => layer.evaluate((element) => [element.scrollLeft, element.scrollTop]);
  const router = page.getByRole('button', { name: OFFICE_ROUTER, exact: true });
  await standStill(page);
  const home = await router.boundingBox();
  const terminal = await openTerminal(page, LUCIA);
  await standStill(page);
  expect(await scrolled(), 'with the terminal of the laptop at the right edge open').toEqual([0, 0]);
  await confirm(terminal);
  await expect(terminal).toBeHidden();
  await standStill(page);
  expect(await scrolled(), 'after it closes').toEqual([0, 0]);
  expect(await router.boundingBox(), 'the label of the router stands where it stood').toEqual(home);
});

test('the tab of a Message in the cards of the game covers nothing of the element above it', async ({ page }) => {
  for (const scene of MESSAGE_SCENES) {
    await play(page, scene);
    await expect(page.locator('.message').first(), scene.name).toBeVisible();
    expect(await messagesCoveringWhatIsAbove(page), scene.name).toEqual([]);
  }
});

test('no card is clipped and cards never overlap, at 390 px and at desktop width', async ({ page }) => {
  test.slow();
  await page.clock.install();
  const errors = collectErrors(page);
  const problems: string[] = [];
  for (const { name, size } of TALL_WINDOWS) {
    await page.setViewportSize(size);
    for (const scene of SCENES) {
      await playUntilItRests(page, scene);
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
  await page.clock.install();
  for (const { name, size } of INSPECTION_WINDOWS) {
    await page.setViewportSize(size);
    await visit(page, '01-05');
    const terminal = await openTerminal(page);
    await sendTo(terminal, IP.nobody);
    await confirm(terminal);
    await expect(terminal).toBeHidden();
    const stamp = page.getByRole('button', { name: WARNED_PING, exact: true });
    const box = page.getByRole('region', { name: WARNED_PING_BOX, exact: true });
    const body = box.locator('.card__body');
    await stamp.hover();
    await expect(box, name).toBeVisible();
    await expect(page.locator(SCROLLING_INSPECTION), `${name}: the box sees that its text does not fit`).toHaveCount(1);
    const previewed = pointOnTheBody(await areaOf(body), size.height);
    await page.mouse.move(previewed.x, previewed.y);
    await passTheGrace(page);
    await expect(box, `${name}: the preview stays while the mouse is over it`).toBeVisible();
    await expect(box, `${name}: a preview is not pinned`).not.toContainText(PINNED);

    await stamp.click();

    await expect(box, `${name}: the click pins the box`).toContainText(PINNED);
    const shown = pointOnTheBody(await areaOf(body), size.height);
    await page.mouse.move(shown.x, shown.y);
    await passTheGrace(page);
    await expect(box, `${name}: the box stays while the mouse is over it`).toBeVisible();
    expect(await body.evaluate((element) => getComputedStyle(element, '::-webkit-scrollbar').width), `${name}: the body draws its own scrollbar, so a scroller that hides it still shows there is more`).not.toBe('auto');
    await bringTheLastLineIntoView(page, box, name);
  }
});

test('the body of the card that classifies scrolls to its last bin, under the mouse, and its foot stays in view', async ({ page }) => {
  test.slow();
  for (const { name, size } of [...LOW_WINDOWS, ...LOW_MAP_WINDOWS]) {
    await page.setViewportSize(size);
    await play(page, THE_PLACED_CLASSIFY);
    await standStill(page);
    const classify = card(page, YOUR_LAPTOP);
    const body = classify.locator('.chip-card__body');
    const lastBin = classify.getByRole('button', { name: `Poner aquí en ${OUTSIDE_THE_BLOCK}`, exact: true });
    expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight), `${name}: the body does not fit, so it scrolls`).toBe(true);
    expect(await isReachable(page, lastBin), `${name}: the last bin starts out of reach`).toBe(false);
    expect(await reachWithWheel(page, lastBin, { within: body, wheelPx: GENTLE_WHEEL_PX }), `${name}: the wheel brings the last bin into view`).toBe(true);
    expect(await isReachable(page, THE_PLACED_CLASSIFY.last(page)), `${name}: the foot stays in reach`).toBe(true);
    expect(await cardsOutsideTheMap(page), `${name}: the card stays inside the map`).toEqual([]);
  }
});

for (const { name, size, crosses } of TRIP_WINDOWS) {
  test.describe(name, () => {
    test.use({ viewport: size });

    test('a pinned box survives a human-paced trip across another piece and scrolls under the mouse', async ({ page }) => {
      test.slow();
      await page.clock.install();
      await visit(page, '01-08');
      const stamp = await sendTheLostPing(page);
      await holdTheClock(page);
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

      await expect(box, 'after the trip, which outlasts the grace, the box still shows the lost ping, pinned').toContainText(PINNED);
      await page.clock.resume();
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

  await page.clock.install();
  await page.keyboard.press('Escape');

  await expect(box).toHaveCount(0);
  await expect(stamp, 'Escape gives the focus back to the stamp').toBeFocused();
  await passTheGrace(page);
  await expect(box, 'the focus that comes back does not reopen the box').toHaveCount(0);
});

test.describe('with a touch screen', () => {
  test.use({ hasTouch: true });

  test('with touch, a tap pins the box and a tap outside releases it', async ({ page }) => {
    await page.clock.install();
    await visit(page, '01-08');
    const stamp = await sendTheLostPing(page);
    await holdTheClock(page);
    const box = boxOfTheLostPing(page);

    await stamp.tap();

    await expect(box).toContainText(PINNED);
    await passTheGrace(page);
    await expect(box, 'the pinned box stays after the finger lifts').toBeVisible();

    await page.getByRole('heading', { level: 1 }).tap();

    await expect(box).toHaveCount(0);
  });
});

test("a click on a piece that opens a card opens it, pins the piece's box, and a click in the card releases the box", async ({ page }) => {
  await page.clock.install();
  await visit(page, '01-08');
  await holdTheClock(page);
  const label = page.getByRole('button', { name: YOUR_LAPTOP, exact: true });
  const terminal = card(page, `Terminal de ${YOUR_LAPTOP}`);
  const box = page.getByRole('region', { name: YOUR_LAPTOP, exact: true });
  const chip = terminal.getByRole('button', { name: IP.server, exact: true });

  await label.click();

  await expect(terminal).toBeVisible();
  await expect.poll(() => holdsTheFocus(terminal), 'the terminal holds the focus').toBe(true);
  await expect(box, 'the box of the piece is pinned').toContainText(PINNED);
  await expect(label).toHaveAttribute(PINNED_MARK, 'true');
  await standStill(page, { eachFrame: stepFrame });
  expect(await inspectionBoxOverCards(page), 'the pinned box is on show and covers none of the cards of the map').toEqual({ shown: true, covered: [] });

  await chip.click();

  await expect(box, 'a click in the card releases the box').toHaveCount(0);
  await expect(label).not.toHaveAttribute(PINNED_MARK);
  await expect(chip, 'and the chip is picked').toHaveAttribute('aria-pressed', 'true');

  await page.clock.resume();
  await visit(page, '01-08');
  await holdTheClock(page);
  await label.focus();
  await page.keyboard.press('Enter');

  await expect(terminal).toBeVisible();
  await expect.poll(() => holdsTheFocus(terminal), 'with the keyboard the terminal holds the focus too').toBe(true);
  await expect(box, 'with the keyboard the box is pinned').toContainText(PINNED);
  await expect(label).toHaveAttribute(PINNED_MARK, 'true');
});

test('a term definition can be reached with the mouse, and Escape closes it', async ({ page }) => {
  await page.clock.install();
  await visit(page, '01-08');
  await holdTheClock(page);
  const term = page.getByRole('region', { name: LUCIA_CARD, exact: true }).locator('.term--tip', { hasText: GLOSSED_TERM.name }).first();
  const tip = page.getByRole('tooltip');
  await term.hover();
  await expect(tip).toContainText(GLOSSED_TERM.definition);
  const [from, shown] = [await centerOf(term), await areaOf(tip)];
  const onto = { x: Math.min(Math.max(from.x, shown.x + TIP_INSET_PX), shown.x + shown.width - TIP_INSET_PX), y: Math.min(Math.max(from.y, shown.y + TIP_INSET_PX), shown.y + shown.height - TIP_INSET_PX) };

  await travel(page, straightPath(from, onto, SLOW_STEPS), SLOW_STEP_MS);
  await passTheGrace(page);

  await expect(tip, 'the definition stays while the mouse is on it').toBeVisible();

  await page.mouse.move(from.x, from.y);
  await passTheGrace(page);

  await expect(tip, 'the definition stays when the mouse goes back from it onto its term').toBeVisible();
  await page.mouse.move(OUTSIDE_POINT.x, OUTSIDE_POINT.y);
  await passTheGrace(page);
  await expect(tip, 'leaving the term afterwards closes it once the grace ends').toHaveCount(0);

  await term.hover();
  await expect(tip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);
  await passTheGrace(page);
  await expect(tip, 'Escape closes it for good').toHaveCount(0);
});

async function problemsOfTheCardsOfTheMap(page: Page, eachFrame: (page: Page) => Promise<void>, windows: readonly { name: string; size: { width: number; height: number } }[] = LOW_MAP_WINDOWS): Promise<string[]> {
  const problems: string[] = [];
  for (const { name, size } of windows) {
    await page.setViewportSize(size);
    for (const scene of MAP_SCENES) {
      await playWithTheClockPaused(page, scene, eachFrame);
      problems.push(...(await cardsOutsideTheMap(page)).map((problem) => `${name}, ${scene.name}: ${problem}`));
      if (!(await isReachable(page, scene.last(page)))) problems.push(`${name}, ${scene.name}: its foot is out of reach`);
    }
  }
  return problems;
}

test('a card beside a piece stays inside the map, with its foot in view, in a low or narrow window', async ({ page }) => {
  test.slow();
  await page.clock.install();
  expect(await problemsOfTheCardsOfTheMap(page, passTheGrace)).toEqual([]);
});

for (const { name, size } of LOW_MAP_WINDOWS) {
  test.describe(name, () => {
    test.use({ viewport: size });

    test('a card beside a piece keeps its foot in reach right after the click, in a low or narrow window', async ({ page }) => {
      test.slow();
      await page.clock.install();
      expect(await problemsOfTheCardsOfTheMap(page, stepFrame, [{ name, size }])).toEqual([]);
    });
  });
}

for (const { name, size, boxShows } of LOW_MAP_WINDOWS) {
  test.describe(name, () => {
    test.use({ viewport: size });

    test('the inspection box covers no card of the map, right after the click and at rest, in a low or narrow window', async ({ page }) => {
      test.slow();
      await page.clock.install();
      const covered = new Set<string>();
      let framesWithABox = 0;
      for (const scene of MAP_SCENES) {
        const sample = async () => {
          const seen = await inspectionBoxOverCards(page);
          if (seen.shown) framesWithABox += 1;
          for (const problem of seen.covered) covered.add(`${name}, ${scene.name}: ${problem}`);
        };
        const reachAndSample = async (reached: Page) => {
          await scene.reach(reached);
          await sample();
        };
        await playWithTheClockPaused(page, { ...scene, reach: reachAndSample }, async (stepped) => {
          await stepFrame(stepped);
          await sample();
        });
      }
      expect([...covered]).toEqual([]);
      expect(framesWithABox > 0, 'the box was up in some of the frames exactly where this window leaves it room, so the test looked at something').toBe(boxShows);
    });
  });
}

function labelOf(piece: string): RegExp {
  return new RegExp(`^${piece}`);
}

function sideOf(box: Area, beside: Area): 'left' | 'right' | 'over it' {
  if (box.x >= beside.x + beside.width) return 'right';
  return box.x + box.width <= beside.x ? 'left' : 'over it';
}

async function openAndLetGoOfItsBox(opened: Locator, page: Page) {
  await opened.locator('h2').first().click();
  await standStill(page);
}

const CARD_AND_ITS_FREE_SIDE = [
  { name: 'the terminal of 01-08, docked at the left of the map', level: '01-08', open: openTerminal, over: OFFICE_ROUTER, takes: 'right' },
  { name: 'the card of the firewall of 01-13, at the right of its piece', level: '01-13', open: (page: Page) => openCard(page, FIREWALL), over: YOUR_LAPTOP, takes: 'left' },
] as const;

test('with a card open and room beside it, the box of another piece takes the side the card leaves free', async ({ page }) => {
  await page.setViewportSize(DESKTOP_WINDOW);
  for (const { name, level, open, over, takes } of CARD_AND_ITS_FREE_SIDE) {
    await visit(page, level);
    await page.locator(PIECE_LABEL).first().waitFor();
    await standStill(page);
    const opened = await open(page);
    await openAndLetGoOfItsBox(opened, page);

    await page.getByRole('button', { name: labelOf(over) }).hover();

    const box = page.getByRole('region', { name: over, exact: true });
    await expect(box, `${name}: hovering ${over} shows its box`).toBeVisible();
    await standStill(page);
    expect(sideOf(await areaOf(box), await areaOf(opened)), `${name}: the box takes the side the card leaves free`).toBe(takes);
  }
});

test('with a card open and no room beside it, a hover shows no box and a pinned box is released', async ({ page }) => {
  await page.setViewportSize(TIGHT_WINDOW);
  await visit(page, '01-08');
  await page.locator(PIECE_LABEL).first().waitFor();
  await standStill(page);
  const terminal = await openTerminal(page);
  await openAndLetGoOfItsBox(terminal, page);
  const piece = page.getByRole('button', { name: labelOf(OFFICE_ROUTER) });
  const box = page.getByRole('region', { name: OFFICE_ROUTER, exact: true });

  await piece.hover();
  await standStill(page);

  await expect(box, 'the terminal takes both places, so a hover shows no box').toHaveCount(0);

  await piece.click();
  await standStill(page);

  await expect(box, 'a click shows no box either: the pin is released').toHaveCount(0);
  await expect(piece, 'and the piece wears no pin').not.toHaveAttribute(PINNED_MARK);
  await expect(terminal, 'the terminal stays open').toBeVisible();
});
