import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { INCIDENTS } from '@/levels';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const BAR = '.incident__status';
const SIDE = '.incident__side';
const MAP = '.incident__map';
const INCIDENT = '02-12';
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

  it('the column and the map end where the bar begins at 1280×600, 1280×720 and 1440×900', async () => {
    for (const size of COLUMN_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(INCIDENT);
      const where = `${size.width}×${size.height}`;
      const bar = rectOf(BAR);

      expect(rectOf(SIDE).bottom, `${where}: the column ends where the bar begins`).toBeCloseTo(bar.top, 0);
      expect(rectOf(MAP).bottom, `${where}: and the map too`).toBeCloseTo(bar.top, 0);
      expect(bar.bottom, `${where}: the bar ends with the window`).toBeCloseTo(window.innerHeight, 0);
      expect(document.documentElement.scrollHeight - window.innerHeight, `${where}: the page does not scroll`).toBeLessThanOrEqual(0);
      view.unmount();
    }
  });
});
