import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { ALMANAC_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { reachWithWheel, showTheScreen } from '@/testing/browser-play';
import { isReachable } from '@/testing/card-boxes';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const INCIDENT_WITH_MANY_TERMS = '04-02';
const TOP_STRIP = '.incident__strip';
const BOTTOM_STRIP = '.incident__status';
const WINDOW = '[role="dialog"]';
const FORBIDDEN_ZONES = '.incident__map, .incident__lucia, .incident__panel, .incident__inspection';
const EPSILON = 1;
const DESKTOP_WINDOWS = [
  { width: 1280, height: 720 },
  { width: 1280, height: 600 },
];
const LOW_WINDOW = DESKTOP_WINDOWS[1];
const TAB_STOPS = 20;

const theScreen = (incidentId: string) => showTheScreen(<IncidentScreen incidents={INCIDENTS} nextId={null} incidentId={incidentId} onFinish={() => undefined} />);
const openTheAlmanac = () => userEvent.click(page.getByRole('button', { name: ALMANAC_TEXT.open }));
const tab = (name: string) => page.getByRole('tab', { name, exact: true });

function elementOf(selector: string): HTMLElement {
  const [found] = document.querySelectorAll<HTMLElement>(selector);
  if (found === undefined) throw new Error(`nothing matches ${selector}`);
  return found;
}

const rectOf = (selector: string) => elementOf(selector).getBoundingClientRect();

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the Almanaque in a window of the real screen', () => {
  it('the window lies between the top strip and the bottom strip, keeps both where they were and scrolls its terms inside it', async () => {
    for (const size of DESKTOP_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(INCIDENT_WITH_MANY_TERMS);
      const where = `${size.width}×${size.height}`;
      const closed = { top: rectOf(TOP_STRIP).toJSON(), bottom: rectOf(BOTTOM_STRIP).toJSON() };
      await openTheAlmanac();
      const box = rectOf(WINDOW);
      expect(box.top, `${where}: the window starts under the top strip`).toBeGreaterThanOrEqual(closed.top.bottom - EPSILON);
      expect(box.bottom, `${where}: and ends over the bottom strip`).toBeLessThanOrEqual(closed.bottom.top + EPSILON);
      expect(rectOf(TOP_STRIP).toJSON(), `${where}: the top strip keeps its rectangle`).toEqual(closed.top);
      expect(rectOf(BOTTOM_STRIP).toJSON(), `${where}: the bottom strip keeps its rectangle`).toEqual(closed.bottom);
      expect(document.documentElement.scrollHeight - window.innerHeight, `${where}: the page does not scroll`).toBeLessThanOrEqual(0);
      expect(isReachable(page.getByRole('button', { name: ALMANAC_TEXT.open }).element()), `${where}: its button is in view and nothing covers it`).toBe(true);
      view.unmount();
    }
  });

  it('the terms scroll inside the window and the last one can be reached', async () => {
    await page.viewport(LOW_WINDOW.width, LOW_WINDOW.height);
    const view = await theScreen(INCIDENT_WITH_MANY_TERMS);
    await openTheAlmanac();
    const body = elementOf(`${WINDOW} .card__body`);
    const lastTerm = page.elementLocator(elementOf(`${WINDOW} dl > div:last-child dt`));
    expect(body.scrollHeight, 'the list is taller than the window').toBeGreaterThan(body.clientHeight);
    expect(isReachable(lastTerm.element()), 'the last term starts out of reach').toBe(false);
    expect(await reachWithWheel(lastTerm, { within: page.elementLocator(body) }), 'the wheel brings the last term into view').toBe(true);
    expect(body.scrollTop, 'the wheel scrolled the list and not the page').toBeGreaterThan(0);
    expect(document.documentElement.scrollTop, 'the page did not move').toBe(0);
    view.unmount();
  });

  it('the button of the open Almanaque closes it with one real click and the next click opens it again', async () => {
    await page.viewport(DESKTOP_WINDOWS[0].width, DESKTOP_WINDOWS[0].height);
    const view = await theScreen(INCIDENT_WITH_MANY_TERMS);
    await openTheAlmanac();
    await expect.poll(() => document.querySelector(WINDOW), { message: 'the first click opens it' }).not.toBeNull();
    await openTheAlmanac();
    await expect.poll(() => document.querySelector(WINDOW), { message: 'the second closes it and does not open it again' }).toBeNull();
    await openTheAlmanac();
    await expect.poll(() => document.querySelector(WINDOW), { message: 'the third opens it again' }).not.toBeNull();
    view.unmount();
  });

  it('inside the open Almanaque the arrow keys, Home and End move between the tabs, and Tab and Shift+Tab never leave the window nor reach a covered zone', async () => {
    await page.viewport(DESKTOP_WINDOWS[0].width, DESKTOP_WINDOWS[0].height);
    const view = await theScreen(INCIDENT_WITH_MANY_TERMS);
    await openTheAlmanac();
    const window = elementOf(WINDOW);
    expect(window.contains(document.activeElement), 'the focus enters the window when it opens').toBe(true);

    tab(ALMANAC_TEXT.terms).element().focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(tab(ALMANAC_TEXT.lessons)).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement, 'ArrowRight moves the focus with the choice').toBe(tab(ALMANAC_TEXT.lessons).element());
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(tab(ALMANAC_TEXT.terms)).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement, 'ArrowLeft moves it back').toBe(tab(ALMANAC_TEXT.terms).element());
    await userEvent.keyboard('{End}');
    await expect.element(tab(ALMANAC_TEXT.lessons)).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Home}');
    await expect.element(tab(ALMANAC_TEXT.terms)).toHaveAttribute('aria-selected', 'true');

    const stops: Element[] = [];
    for (const shift of [false, true]) {
      tab(ALMANAC_TEXT.terms).element().focus();
      for (let stop = 0; stop < TAB_STOPS; stop++) {
        await userEvent.tab({ shift });
        stops.push(document.activeElement as Element);
      }
    }
    expect(stops.filter((element) => !window.contains(element)).map((element) => element.textContent?.trim() || element.tagName), 'every stop is inside the window').toEqual([]);
    expect(stops.filter((element) => element.closest(FORBIDDEN_ZONES) !== null), 'and none in a covered zone').toEqual([]);
    view.unmount();
  });
});
