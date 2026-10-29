import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { ALMANAC_TEXT, CLOCK_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { showTheScreen } from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const NARROWEST_DESKTOP_WINDOW = { width: 901, height: 800 };
const TOP_STRIP = '.incident__strip';
const INCIDENT_WITH_A_CLOCK = '02-12';
const EPSILON = 1;

function elementOf(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`nothing matches ${selector}`);
  return found;
}

function spillOf(strip: HTMLElement): string[] {
  const box = strip.getBoundingClientRect();
  return [...strip.children]
    .filter((child) => {
      const { left, right, top, bottom } = child.getBoundingClientRect();
      return left < box.left - EPSILON || right > box.right + EPSILON || top < box.top - EPSILON || bottom > box.bottom + EPSILON;
    })
    .map((child) => child.textContent?.trim() ?? child.tagName);
}

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the top strip of the real screen', () => {
  it('the top strip is one row of the same height at 901 px in every registered incident, with the clock and the Almanaque', { timeout: 120_000 }, async () => {
    await page.viewport(NARROWEST_DESKTOP_WINDOW.width, NARROWEST_DESKTOP_WINDOW.height);
    const heights = new Map<string, number>();
    const spilled: string[] = [];
    for (const { id } of INCIDENTS) {
      const view = await showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={id} nextId={null} onFinish={() => undefined} />);
      const strip = elementOf(TOP_STRIP);
      heights.set(id, strip.getBoundingClientRect().height);
      if (strip.scrollWidth > strip.clientWidth + EPSILON) spilled.push(`${id}: the strip scrolls sideways`);
      if (![...strip.querySelectorAll('button')].some((button) => button.textContent === ALMANAC_TEXT.open)) spilled.push(`${id}: the Almanaque button is not in the strip`);
      spilled.push(...spillOf(strip).map((name) => `${id}: ${name} lies outside the strip`));
      if (id === INCIDENT_WITH_A_CLOCK) expect(strip.querySelector(`[aria-label="${CLOCK_TEXT.title}"]`), `${id}: the clock is in the strip`).not.toBeNull();
      view.unmount();
    }
    expect(spilled).toEqual([]);
    expect([...new Set(heights.values())], 'one height for every incident').toHaveLength(1);
  });
});
