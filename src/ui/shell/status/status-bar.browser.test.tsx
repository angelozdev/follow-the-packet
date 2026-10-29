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
const MAP = '.incident__map';
const TOP_STRIP = '.incident__strip';
const INCIDENT = '02-12';
const INCIDENT_WITH_LINES = '04-01';
const REGISTRY = '.incident__registry';
const REGISTRY_BUTTON = /^Registro \(\d+\)$/;
const CAP_OF_THE_REGISTRY = 0.25;
const INCIDENT_WITH_TABLES = '02-06';
const SEE_ROW = 'Ver fila en la tabla de rutas';
const BAR_LINE = '.incident__newest';
const SYSTEMS = '.incident__systems';
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

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the status bar of the incident screen', () => {
  it('the bar stays at the bottom above 900 px and at 390×844 and the last control of the page can be reached by scrolling', async () => {
    let fixedHeight: number | undefined;
    for (const size of ABOVE_900_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(INCIDENT);
      fixedHeight ??= rectOf(BAR).height;
      expect(rectOf(BAR).height, `${size.width}×${size.height}: the strip has the same fixed height`).toBeCloseTo(fixedHeight, 0);
      expect(rectOf(BAR).bottom, `${size.width}×${size.height}: the bar is at the bottom of the window`).toBeCloseTo(window.innerHeight, 0);
      expect(document.documentElement.scrollHeight - window.innerHeight, `${size.width}×${size.height}: the page does not scroll`).toBeLessThanOrEqual(0);
      view.unmount();
    }

    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    const phone = await theScreen(INCIDENT);
    expect(document.documentElement.scrollHeight, 'the page of the phone scrolls').toBeGreaterThan(window.innerHeight);
    expect(rectOf(BAR).height, '390×844: the strip has the same fixed height').toBeCloseTo(fixedHeight ?? 0, 0);
    expect(rectOf(BAR).bottom, '390×844: the bar is at the bottom of the window').toBeCloseTo(window.innerHeight, 0);
    window.scrollTo(0, document.documentElement.scrollHeight);
    expect(rectOf(BAR).bottom, 'and stays there after scrolling to the end').toBeCloseTo(window.innerHeight, 0);
    expect(lastControl().getBoundingClientRect().bottom, 'the last control ends above the bar').toBeLessThanOrEqual(rectOf(BAR).top + EPSILON);
    window.scrollTo(0, 0);
    phone.unmount();
  });
});

describe('the open registry of the status bar', () => {
  it('the open registry takes no room from the map and the panel and covers no control of the strip, the line or the bar', async () => {
    for (const size of COLUMN_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(INCIDENT_WITH_LINES);
      const where = `${size.width}×${size.height}`;
      const closed = { bar: rectOf(BAR).toJSON(), panel: rectOf(PANEL).toJSON(), map: rectOf(MAP).toJSON() };
      await userEvent.click(page.getByRole('button', { name: REGISTRY_BUTTON }));
      const list = rectOf(REGISTRY);

      expect(rectOf(BAR).toJSON(), `${where}: the strip keeps its rectangle`).toEqual(closed.bar);
      expect(rectOf(PANEL).toJSON(), `${where}: the panel keeps its rectangle`).toEqual(closed.panel);
      expect(rectOf(MAP).toJSON(), `${where}: and the map too`).toEqual(closed.map);
      expect(document.documentElement.scrollHeight - window.innerHeight, `${where}: the page does not scroll`).toBeLessThanOrEqual(0);
      expect(list.bottom, `${where}: the list ends where the strip begins`).toBeLessThanOrEqual(closed.bar.top + EPSILON);
      expect(list.top, `${where}: and starts under the strip of the top`).toBeGreaterThanOrEqual(rectOf(TOP_STRIP).bottom);
      expect(list.height, `${where}: the list has a cap`).toBeLessThanOrEqual(window.innerHeight * CAP_OF_THE_REGISTRY);
      expect(maxHeightOf(REGISTRY), `${where}: the cap is a quarter of the window`).toBeCloseTo(window.innerHeight * CAP_OF_THE_REGISTRY, 1);
      const controls = [...document.querySelectorAll<HTMLElement>(`${TOP_STRIP} a, ${TOP_STRIP} input, ${BAR} button`)];
      expect(controls.length, `${where}: there are controls to look at`).toBeGreaterThan(0);
      for (const control of controls) expect(isReachable(control), `${where}: ${control.textContent?.trim()} is reachable`).toBe(true);
      view.unmount();
    }
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
    const buttons = [...line.querySelectorAll(':scope > button'), ...document.querySelectorAll(`${SYSTEMS} button`)].filter((button) => button.closest(SYSTEMS) === null || REGISTRY_BUTTON.test(button.textContent ?? ''));
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
