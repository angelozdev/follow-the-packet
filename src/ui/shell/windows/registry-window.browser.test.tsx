import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { SCREEN_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { OFFICE_IP, openTerminal, reachWithWheel, sendTo, showTheScreen } from '@/testing/browser-play';
import { isReachable } from '@/testing/card-boxes';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const INCIDENT_WITH_LINES = '04-01';
const INCIDENT_WITH_TABLES = '02-06';
const REGISTRY_BUTTON = /^Registro \(\d+\)$/;
const TOP_STRIP = '.incident__strip';
const BOTTOM_STRIP = '.incident__status';
const WINDOW = '[role="dialog"]';
const FORBIDDEN_ZONES = '.incident__map, .incident__lucia, .incident__panel, .incident__inspection';
const EPSILON = 1;
const SHARE_OF_THE_WIDTH = { least: 0.85, most: 0.95 };
const DESKTOP_WINDOWS = [
  { width: 1280, height: 720 },
  { width: 1280, height: 600 },
];
const LOW_WINDOW = DESKTOP_WINDOWS[1];
const PHONE_WINDOW = { width: 390, height: 844 };
const SENDS = 12;
const ADDRESSES = [OFFICE_IP.printer, OFFICE_IP.andres];
const TAB_STOPS = 40;

const theScreen = (incidentId: string) => showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={() => undefined} />);

function elementOf(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`nothing matches ${selector}`);
  return found;
}

const rectOf = (selector: string) => elementOf(selector).getBoundingClientRect();
const openTheRegistry = () => userEvent.click(page.getByRole('button', { name: REGISTRY_BUTTON }));
const controlsOfTheStrips = () => [...document.querySelectorAll<HTMLElement>(`${TOP_STRIP} a, ${TOP_STRIP} input, ${BOTTOM_STRIP} button, ${BOTTOM_STRIP} [role="log"]`)];

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the registry in a window of the real screen', () => {
  it('the window lies between the top strip and the bottom strip and leaves both in view at 1280×720 and 1280×600', async () => {
    for (const size of DESKTOP_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(INCIDENT_WITH_LINES);
      const where = `${size.width}×${size.height}`;
      const closed = { top: rectOf(TOP_STRIP).toJSON(), bottom: rectOf(BOTTOM_STRIP).toJSON() };

      await openTheRegistry();
      const box = rectOf(WINDOW);

      expect(box.top, `${where}: the window starts under the top strip`).toBeGreaterThanOrEqual(closed.top.bottom - EPSILON);
      expect(box.bottom, `${where}: and ends over the bottom strip`).toBeLessThanOrEqual(closed.bottom.top + EPSILON);
      expect(box.width / window.innerWidth, `${where}: it takes about nine tenths of the width`).toBeGreaterThan(SHARE_OF_THE_WIDTH.least);
      expect(box.width / window.innerWidth, `${where}: and no more`).toBeLessThan(SHARE_OF_THE_WIDTH.most);
      expect(box.left + box.width / 2, `${where}: centered`).toBeCloseTo(window.innerWidth / 2, 0);
      expect(rectOf(TOP_STRIP).toJSON(), `${where}: the top strip keeps its rectangle`).toEqual(closed.top);
      expect(rectOf(BOTTOM_STRIP).toJSON(), `${where}: the bottom strip keeps its rectangle`).toEqual(closed.bottom);
      expect(document.documentElement.scrollHeight - window.innerHeight, `${where}: the page does not scroll`).toBeLessThanOrEqual(0);
      const controls = controlsOfTheStrips();
      expect(controls.length, `${where}: there are controls to look at`).toBeGreaterThan(0);
      for (const control of controls) expect(isReachable(control), `${where}: ${control.textContent?.trim() || control.tagName} is in view and nothing covers it`).toBe(true);
      view.unmount();
    }
  });

  it('the list of the registry scrolls inside the window and its last line can be reached', async () => {
    await page.viewport(LOW_WINDOW.width, LOW_WINDOW.height);
    const view = await theScreen(INCIDENT_WITH_TABLES);
    const terminal = await openTerminal();
    for (let send = 0; send < SENDS; send++) await sendTo(terminal, ADDRESSES[send % ADDRESSES.length]);
    await openTheRegistry();
    const body = elementOf(`${WINDOW} .card__body`);
    const lastLine = page.elementLocator(elementOf(`${WINDOW} ol > li:last-child button`));

    expect(body.scrollHeight, 'the list is taller than the window').toBeGreaterThan(body.clientHeight);
    expect(isReachable(lastLine.element()), 'the last line starts out of reach').toBe(false);
    expect(await reachWithWheel(lastLine, { within: page.elementLocator(body), wheelPx: 60 }), 'the wheel brings the last line into view').toBe(true);
    expect(body.scrollTop, 'the wheel scrolled the list and not the page').toBeGreaterThan(0);
    expect(document.documentElement.scrollTop, 'the page did not move').toBe(0);
    expect(rectOf(WINDOW).bottom, 'the window stays over the bottom strip').toBeLessThanOrEqual(rectOf(BOTTOM_STRIP).top + EPSILON);
    view.unmount();
  });

  it('at 390×844 the window fills the screen above the bottom strip and the bar stays operable', async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    const view = await theScreen(INCIDENT_WITH_LINES);

    await openTheRegistry();
    const box = rectOf(WINDOW);
    const strip = rectOf(BOTTOM_STRIP);

    expect(box.left, 'the window starts at the left edge').toBeCloseTo(0, 0);
    expect(box.right, 'and ends at the right edge').toBeCloseTo(window.innerWidth, 0);
    expect(box.top, 'it starts at the top of the screen').toBeCloseTo(0, 0);
    expect(box.bottom, 'and ends where the bottom strip begins').toBeCloseTo(strip.top, 0);
    expect(strip.bottom, 'the bottom strip is at the bottom of the screen').toBeCloseTo(window.innerHeight, 0);
    for (const control of controlsOfTheStrips().filter((candidate) => candidate.closest(BOTTOM_STRIP) !== null)) expect(isReachable(control), `${control.textContent?.trim()} is in view and nothing covers it`).toBe(true);
    await openTheRegistry();
    expect(document.querySelector(WINDOW), 'the button of the bar closes the window').toBeNull();
    view.unmount();
  });

  it('the button of the open window closes it with one real click and the next click opens it again, at 1280×720 and at 390×844', async () => {
    for (const size of [DESKTOP_WINDOWS[0], PHONE_WINDOW]) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(INCIDENT_WITH_LINES);
      const where = `${size.width}×${size.height}`;

      await openTheRegistry();
      await expect.poll(() => document.querySelector(WINDOW), { message: `${where}: the first click opens it` }).not.toBeNull();
      await openTheRegistry();
      await expect.poll(() => document.querySelector(WINDOW), { message: `${where}: the second click closes it and does not open it again` }).toBeNull();
      await openTheRegistry();
      await expect.poll(() => document.querySelector(WINDOW), { message: `${where}: the third opens it again` }).not.toBeNull();
      view.unmount();
    }
  });

  it('with a system window open Tab reaches neither the map, the card of Lucía nor the panel, and the strip, the newest line and the bar stay operable', async () => {
    await page.viewport(DESKTOP_WINDOWS[0].width, DESKTOP_WINDOWS[0].height);
    const view = await theScreen(INCIDENT_WITH_LINES);
    await openTheRegistry();
    const motion = page.getByRole('checkbox', { name: SCREEN_TEXT.motion }).element() as HTMLElement;
    const forward = new Set<Element>();
    const backward = new Set<Element>();

    motion.focus();
    for (let stop = 0; stop < TAB_STOPS; stop++) {
      await userEvent.tab();
      forward.add(document.activeElement as Element);
    }
    motion.focus();
    for (let stop = 0; stop < TAB_STOPS; stop++) {
      await userEvent.tab({ shift: true });
      backward.add(document.activeElement as Element);
    }

    const inside = (stops: Set<Element>, selector: string) => [...stops].some((element) => element.closest(selector) !== null);
    for (const stops of [forward, backward]) expect([...stops].filter((element) => element.closest(FORBIDDEN_ZONES) !== null).map((element) => element.textContent?.trim()), 'no stop in a covered zone').toEqual([]);
    expect(inside(backward, TOP_STRIP), 'Shift+Tab from the checkbox reaches the link of the top strip').toBe(true);
    expect(inside(forward, '[role="log"]'), 'Tab reaches the newest line').toBe(true);
    expect(inside(forward, '.incident__systems'), 'then the bar').toBe(true);
    expect(inside(forward, WINDOW), 'and then the window').toBe(true);
    for (const control of controlsOfTheStrips()) expect(isReachable(control), `${control.textContent?.trim() || control.tagName} is operable`).toBe(true);
    await userEvent.click(page.getByRole('checkbox', { name: SCREEN_TEXT.motion }));
    expect(motion.matches(':checked'), 'a click on the checkbox of the top strip works').toBe(true);
    expect(document.querySelector(WINDOW), 'and leaves the window open').not.toBeNull();
    view.unmount();
  });
});
