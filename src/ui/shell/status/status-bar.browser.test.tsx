import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { INCIDENTS } from '@/levels';
import { OFFICE_IP, openTerminal, sendTo } from '@/testing/browser-play';
import { isReachable } from '@/testing/card-boxes';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const BAR = '.incident__status';
const PANEL = '.incident__panel';
const LUCIA_ZONE = '.incident__lucia';
const MAP = '.incident__map';
const INCIDENT = '02-12';
const INCIDENT_WITH_LINES = '04-01';
const REGISTRY = '.incident__registry';
const REGISTRY_BUTTON = /^Registro \(\d+\)$/;
const CAP_OF_THE_REGISTRY = 0.25;
const INCIDENT_WITH_TABLES = '02-06';
const SEE_ROW = 'Ver fila en la tabla de rutas';
const BAR_LINE = '.incident__status-line';
const LOW_WINDOW = { width: 1280, height: 600 };
const EPSILON = 1;
const COLUMN_WINDOWS = [
  { width: 1280, height: 600 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
];
const ABOVE_900_WINDOWS = [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 901, height: 800 }];
const PHONE_WINDOW = { width: 390, height: 844 };

async function theScreen(incidentId: string) {
  const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={() => undefined} />);
  await expect.poll(() => document.querySelectorAll('button.map-button').length).toBeGreaterThan(0);
  return view;
}

function rectOf(selector: string): DOMRect {
  const rect = document.querySelector(selector)?.getBoundingClientRect();
  if (rect === undefined) throw new Error(`nothing matches ${selector}`);
  return rect;
}

function maxHeightOf(selector: string): number {
  const element = document.querySelector(selector);
  if (element === null) throw new Error(`nothing matches ${selector}`);
  return parseFloat(getComputedStyle(element).maxHeight);
}

function lastControl(): HTMLElement {
  const controls = [...document.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')].filter((control) => !document.querySelector(BAR)?.contains(control));
  const last = controls.at(-1);
  if (last === undefined) throw new Error('the page has no control');
  return last;
}

function isShownInside(control: HTMLElement, regionSelector: string): boolean {
  const box = control.getBoundingClientRect();
  if (box.width === 0) return false;
  for (let ancestor = control.parentElement; ancestor !== null; ancestor = ancestor.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(ancestor);
    const clips = ancestor.matches(regionSelector) || overflowX !== 'visible' || overflowY !== 'visible';
    const edge = ancestor.getBoundingClientRect();
    if (clips && (box.left < edge.left || box.right > edge.right || box.top < edge.top || box.bottom > edge.bottom)) return false;
    if (ancestor.matches(regionSelector)) return true;
  }
  return false;
}

function controlsInView(regionSelector: string): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`${regionSelector} button, ${regionSelector} a[href]`)].filter((control) => isShownInside(control, regionSelector));
}

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the status bar of the incident screen', () => {
  it('the bar stays at the bottom above 900 px and at 390×844 and the last control of the page can be reached by scrolling', async () => {
    for (const size of ABOVE_900_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(INCIDENT);
      expect(rectOf(BAR).bottom, `${size.width}×${size.height}: the bar is at the bottom of the window`).toBeCloseTo(window.innerHeight, 0);
      expect(document.documentElement.scrollHeight - window.innerHeight, `${size.width}×${size.height}: the page does not scroll`).toBeLessThanOrEqual(0);
      view.unmount();
    }

    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    const phone = await theScreen(INCIDENT);
    expect(document.documentElement.scrollHeight, 'the page of the phone scrolls').toBeGreaterThan(window.innerHeight);
    expect(rectOf(BAR).bottom, '390×844: the bar is at the bottom of the window').toBeCloseTo(window.innerHeight, 0);
    window.scrollTo(0, document.documentElement.scrollHeight);
    expect(rectOf(BAR).bottom, 'and stays there after scrolling to the end').toBeCloseTo(window.innerHeight, 0);
    expect(lastControl().getBoundingClientRect().bottom, 'the last control ends above the bar').toBeLessThanOrEqual(rectOf(BAR).top + EPSILON);
    window.scrollTo(0, 0);
    phone.unmount();
  });
});

describe('the open registry of the status bar', () => {
  it('the open registry takes room from the map and the panel and covers no control', async () => {
    for (const size of COLUMN_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(INCIDENT_WITH_LINES);
      const where = `${size.width}×${size.height}`;
      const closed = { bar: rectOf(BAR).height, panel: rectOf(PANEL).height, map: rectOf(MAP).height };
      await userEvent.click(page.getByRole('button', { name: REGISTRY_BUTTON }));
      const bar = rectOf(BAR);

      expect(bar.height, `${where}: the bar grows`).toBeGreaterThan(closed.bar);
      expect(rectOf(PANEL).height, `${where}: the panel gives it room`).toBeLessThan(closed.panel);
      expect(rectOf(MAP).height, `${where}: and the map too`).toBeLessThan(closed.map);
      expect(rectOf(PANEL).bottom, `${where}: the panel still ends where the bar begins`).toBeCloseTo(bar.top, 0);
      expect(rectOf(MAP).bottom, `${where}: and the map too`).toBeCloseTo(bar.top, 0);
      expect(bar.bottom, `${where}: the bar ends with the window`).toBeCloseTo(window.innerHeight, 0);
      expect(document.documentElement.scrollHeight - window.innerHeight, `${where}: the page does not scroll`).toBeLessThanOrEqual(0);
      expect(rectOf(REGISTRY).height, `${where}: the list has a cap`).toBeLessThanOrEqual(window.innerHeight * CAP_OF_THE_REGISTRY);
      expect(maxHeightOf(REGISTRY), `${where}: the cap is a quarter of the window`).toBeCloseTo(window.innerHeight * CAP_OF_THE_REGISTRY, 1);
      const controls = [...controlsInView(LUCIA_ZONE), ...controlsInView(PANEL), ...controlsInView(MAP)];
      expect(controls.length, `${where}: there are controls to look at`).toBeGreaterThan(0);
      for (const control of controls) expect(isReachable(control), `${where}: ${control.textContent?.trim()} is reachable`).toBe(true);
      view.unmount();
    }
  });

  it('at 390 px the open registry leaves the last control of the page reachable by scrolling', async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    const phone = await theScreen(INCIDENT_WITH_LINES);
    await userEvent.click(page.getByRole('button', { name: REGISTRY_BUTTON }));
    expect(rectOf(REGISTRY).height, 'the list has a cap').toBeLessThanOrEqual(window.innerHeight * CAP_OF_THE_REGISTRY);
    expect(maxHeightOf(REGISTRY), 'the cap is a quarter of the window').toBeCloseTo(window.innerHeight * CAP_OF_THE_REGISTRY, 1);
    expect(document.documentElement.scrollHeight, 'the page scrolls').toBeGreaterThan(window.innerHeight);
    window.scrollTo(0, document.documentElement.scrollHeight);
    expect(rectOf(BAR).bottom, 'the bar stays at the bottom of the window').toBeCloseTo(window.innerHeight, 0);
    expect(lastControl().getBoundingClientRect().bottom, 'the last control ends above the open registry').toBeLessThanOrEqual(rectOf(REGISTRY).top + EPSILON);
    window.scrollTo(0, 0);
    phone.unmount();
  });
});

describe('Ver fila in the real map', () => {
  it('Ver fila opens Tablas with the row of its send marked, the focus on the heading and the tab in view, at 1280×600 and at 390 px', async () => {
    for (const size of [LOW_WINDOW, PHONE_WINDOW]) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(INCIDENT_WITH_TABLES);
      const where = `${size.width}×${size.height}`;
      const terminal = await openTerminal();
      await sendTo(terminal, OFFICE_IP.printer);
      await sendTo(terminal, OFFICE_IP.andres);
      await userEvent.click(page.getByRole('button', { name: REGISTRY_BUTTON }));
      const registry = page.elementLocator(document.querySelector(REGISTRY) as Element);
      await userEvent.click(registry.getByRole('button', { name: SEE_ROW }).nth(1));

      const panel = document.querySelector(`${PANEL} > section`) as HTMLElement;
      const tabs = panel.querySelector('[role="tablist"]') as HTMLElement;
      const chosen = tabs.querySelector('[aria-selected="true"]') as HTMLElement;
      const inUse = [...panel.querySelectorAll('tr')].filter((row) => row.textContent?.includes('en uso'));
      expect(document.activeElement, `${where}: the focus is on the heading`).toBe(panel.querySelector('h2'));
      expect(chosen.textContent, `${where}: Tablas is the tab`).toBe('Tablas');
      expect(chosen.getBoundingClientRect().left, `${where}: the tab is inside the bar at its left`).toBeGreaterThanOrEqual(tabs.getBoundingClientRect().left - EPSILON);
      expect(chosen.getBoundingClientRect().right, `${where}: and at its right`).toBeLessThanOrEqual(tabs.getBoundingClientRect().right + EPSILON);
      expect(inUse, `${where}: one row is marked`).toHaveLength(1);
      expect(inUse[0].textContent, `${where}: the row of the ping to the printer, not the last`).toContain('192.168.1.0/24');
      view.unmount();
    }
  });

  it('the line of the bar fits at 390×844 after one ping: the page does not scroll sideways and neither button is clipped', async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    const view = await theScreen(INCIDENT_WITH_TABLES);
    const terminal = await openTerminal();
    await sendTo(terminal, OFFICE_IP.printer);
    const line = document.querySelector(BAR_LINE) as HTMLElement;
    const buttons = [...line.querySelectorAll(':scope > button')];
    const bar = rectOf(BAR);

    expect(buttons.map((button) => button.textContent), 'the line has both buttons').toEqual([SEE_ROW, 'Registro (1)']);
    expect(document.documentElement.scrollWidth, 'the page does not scroll sideways').toBeLessThanOrEqual(window.innerWidth);
    for (const button of buttons) {
      const box = button.getBoundingClientRect();
      expect(button.scrollWidth, `${button.textContent}: the label is not cut at its right`).toBeLessThanOrEqual(button.clientWidth + EPSILON);
      expect(button.scrollHeight, `${button.textContent}: nor at its bottom`).toBeLessThanOrEqual(button.clientHeight + EPSILON);
      expect(box.left, `${button.textContent}: inside the bar at its left`).toBeGreaterThanOrEqual(bar.left - EPSILON);
      expect(box.right, `${button.textContent}: and at its right`).toBeLessThanOrEqual(bar.right + EPSILON);
    }
    view.unmount();
  });
});
