import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { LUCIA_TEXT, PIECE_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { openByKeyboard, openCard, pieceLabel, reachWithWheel } from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const STRIP = '.incident__strip';
const LUCIA_ZONE = '.incident__lucia';
const MAP = '.incident__map';
const PANEL = '.incident__panel';
const BAR = '.incident__status';
const PANEL_CARD = '.incident__panel > .card';
const PANEL_BODY = '.incident__panel > .card > .card__body';
const HEADING = '.incident__panel > .card h2';
const MAP_LABEL = 'button.map-button';
const TALL_LUCIA_INCIDENT = '02-12';
const LONG_BOX_INCIDENT = '04-01';
const PACKET_WITH_A_LONG_BOX = /^Paquete: ping de Atacante/;
const PIECE_IN_VIEW_INCIDENT = '04-01';
const CHOSEN_PIECE = /^servidor2/;
const ROUTING_INCIDENT = '02-06';
const YOUR_LAPTOP = 'tu-laptop';
const OFFICE_ROUTER = 'router-oficina';
const ROOM_FOR_THE_BODY_PX = 120;
const EPSILON = 1;
const PANEL_SHARE = 0.24;
const PANEL_FLOOR_PX = 300;
const PANEL_CEILING_PX = 380;
const LUCIA_WIDTH_PX = 316;
const MAP_FLOOR_PX = 360;
const FRAME_WINDOWS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1280, height: 600 },
];
const PANEL_WINDOWS = [
  { width: 901, height: 800 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1080 },
];
const NARROW_WINDOWS = [
  { width: 901, height: 800 },
  { width: 960, height: 800 },
];
const WIDE_ENOUGH_WINDOW = { width: 1100, height: 800 };
const LABEL_ACCEPTANCE_WINDOW = { width: 1280, height: 720 };
const LOW_WINDOW = { width: 1280, height: 600 };
const BREAK_WINDOW = { width: 900, height: 800 };
const PHONE_WINDOW = { width: 390, height: 844 };
const SHORT_PHONE_WINDOW = { width: 390, height: 300 };
const HINTS_ASKED = 2;

function theScreen(incidentId: string) {
  const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={() => undefined} />);
  return expect.poll(() => view.container.querySelectorAll(MAP_LABEL).length).toBeGreaterThan(0).then(() => view);
}

function elementOf(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (element === null) throw new Error(`${selector} is not on the page`);
  return element;
}

function rectOf(selector: string): DOMRect {
  return elementOf(selector).getBoundingClientRect();
}

function overlap(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right - EPSILON && b.left < a.right - EPSILON && a.top < b.bottom - EPSILON && b.top < a.bottom - EPSILON;
}

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the frame of the incident screen above 900 px', () => {
  it('the shell fills the height of the window at 1280×720, 1440×900 and 1280×600: the page does not scroll, Lucía and the panel scroll inside their zones and the box of the map ends where the status bar begins', async () => {
    for (const size of FRAME_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(LONG_BOX_INCIDENT);
      const where = `${size.width}×${size.height}`;
      const [strip, lucia, map, panel, bar] = [STRIP, LUCIA_ZONE, MAP, PANEL, BAR].map(rectOf);

      expect(strip.top, `${where}: the strip is at the top of the window`).toBeCloseTo(0, 0);
      for (const zone of [lucia, map, panel]) expect(zone.top, `${where}: the zones start under the strip`).toBeCloseTo(strip.bottom, 0);
      for (const zone of [map, panel]) expect(zone.bottom, `${where}: the box of the map and the panel end where the status bar begins`).toBeCloseTo(bar.top, 0);
      expect(lucia.bottom, `${where}: the zone of Lucía ends at or above it`).toBeLessThanOrEqual(bar.top + EPSILON);
      expect(bar.bottom, `${where}: the status bar ends with the window`).toBeCloseTo(window.innerHeight, 0);
      expect(document.documentElement.scrollHeight - window.innerHeight, `${where}: the page does not scroll`).toBeLessThanOrEqual(0);
      expect(document.documentElement.scrollWidth - window.innerWidth, `${where}: the page does not scroll sideways`).toBeLessThanOrEqual(0);
      expect(getComputedStyle(elementOf(LUCIA_ZONE)).overflowY, `${where}: Lucía has a zone that scrolls by itself`).toBe('auto');
      expect(rectOf(LUCIA_ZONE).width, `${where}: her zone has a fixed width`).toBeCloseTo(LUCIA_WIDTH_PX, 0);

      await userEvent.click(page.getByRole('button', { name: PACKET_WITH_A_LONG_BOX }));
      await expect.poll(() => document.querySelector(PANEL_CARD), { message: `${where}: the packet chosen fills the panel` }).not.toBeNull();
      const card = rectOf(PANEL_CARD);
      expect(card.top, `${where}: the card of the panel starts at the top of its zone`).toBeGreaterThanOrEqual(rectOf(PANEL).top - EPSILON);
      expect(card.bottom, `${where}: and ends inside it`).toBeLessThanOrEqual(rectOf(PANEL).bottom + EPSILON);
      expect(getComputedStyle(elementOf(PANEL_BODY)).overflowY, `${where}: its body scrolls by itself`).toBe('auto');
      expect(rectOf(PANEL_BODY).height, `${where}: and keeps room to be read`).toBeGreaterThanOrEqual(ROOM_FOR_THE_BODY_PX);
      expect(elementOf(PANEL).scrollHeight - elementOf(PANEL).clientHeight, `${where}: the zone of the panel does not scroll`).toBeLessThanOrEqual(EPSILON);
      view.unmount();
    }
  });

  it('Lucía scrolls inside her zone at 1280×600 and her report and her button can be reached there', async () => {
    await page.viewport(LOW_WINDOW.width, LOW_WINDOW.height);
    await theScreen(TALL_LUCIA_INCIDENT);
    const lucia = elementOf(LUCIA_ZONE);
    const submit = page.getByRole('button', { name: LUCIA_TEXT.submit });

    expect(lucia.scrollHeight, 'her cards do not fit the zone, so it scrolls').toBeGreaterThan(lucia.clientHeight);
    expect(await reachWithWheel(submit, { within: page.elementLocator(lucia) }), 'the wheel over her zone brings «Enviar solución» into reach').toBe(true);
    lucia.scrollTop = 0;
    expect(rectOf(`${LUCIA_ZONE} h2`).top, 'her report starts inside the zone').toBeGreaterThanOrEqual(lucia.getBoundingClientRect().top - EPSILON);
  });

  it('at 1280×720 no label of a piece in any registered incident lies under the panel, the card of Lucía, the strip or the status bar', { timeout: 120_000 }, async () => {
    await page.viewport(LABEL_ACCEPTANCE_WINDOW.width, LABEL_ACCEPTANCE_WINDOW.height);
    const covered: string[] = [];
    for (const { id } of INCIDENTS) {
      const view = await theScreen(id);
      const box = rectOf(MAP);
      for (const label of view.container.querySelectorAll<HTMLElement>(MAP_LABEL)) {
        const { left, top, width, height } = label.getBoundingClientRect();
        const [x, y] = [left + width / 2, top + height / 2];
        const shown = x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
        const above = document.elementFromPoint(x, y);
        if (shown && !(above !== null && label.contains(above))) covered.push(`${id} ${label.textContent?.trim()}: ${above?.className || above?.tagName}`);
      }
      view.unmount();
    }
    expect(covered).toEqual([]);
  });

  it('the box of the map keeps its rectangle when a piece is chosen and freed and when the text of Lucía grows', async () => {
    await page.viewport(LABEL_ACCEPTANCE_WINDOW.width, LABEL_ACCEPTANCE_WINDOW.height);
    await theScreen(TALL_LUCIA_INCIDENT);
    const before = rectOf(MAP).toJSON();

    await openByKeyboard(YOUR_LAPTOP);
    await expect.poll(() => document.querySelector(PANEL_CARD), { message: 'the piece chosen fills the panel' }).not.toBeNull();
    expect(rectOf(MAP).toJSON(), 'with a piece chosen').toEqual(before);

    await userEvent.click(page.getByRole('button', { name: PIECE_TEXT.closeLabel }));
    await expect.poll(() => document.querySelector(PANEL_CARD), { message: 'the X frees the choice' }).toBeNull();
    expect(rectOf(MAP).toJSON(), 'with the choice freed').toEqual(before);

    const textOfLucia = () => elementOf(LUCIA_ZONE).scrollHeight;
    const short = textOfLucia();
    for (let asked = 1; asked <= HINTS_ASKED; asked++) {
      await userEvent.click(page.getByRole('button', { name: LUCIA_TEXT.askHint }));
      await expect.poll(() => document.querySelectorAll('.hint').length).toBe(asked);
    }
    expect(textOfLucia(), 'her text grew').toBeGreaterThan(short);
    expect(rectOf(MAP).toJSON(), 'with her text grown').toEqual(before);
  });

  it('the panel measures a quarter of the window, never under its floor nor over its ceiling', async () => {
    for (const size of PANEL_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(LONG_BOX_INCIDENT);
      const expected = Math.min(PANEL_CEILING_PX, Math.max(PANEL_FLOOR_PX, PANEL_SHARE * window.innerWidth));

      expect(rectOf(PANEL).width, `${size.width}×${size.height}`).toBeCloseTo(expected, 0);
      view.unmount();
    }
  });

  it('between 901 px and the width the zones need the box of the map scrolls sideways and no panel covers it', async () => {
    for (const size of NARROW_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(LONG_BOX_INCIDENT);
      const where = `${size.width}×${size.height}`;
      const [lucia, map, panel] = [LUCIA_ZONE, MAP, PANEL].map(rectOf);
      const stage = elementOf(`${MAP} .map-stage`);

      expect(window.innerWidth - lucia.width - panel.width, `${where}: the zones leave the map less than its floor`).toBeLessThan(MAP_FLOOR_PX);
      expect(stage.scrollWidth, `${where}: the box of the map scrolls sideways`).toBeGreaterThan(stage.clientWidth);
      expect(overlap(map, lucia) || overlap(map, panel), `${where}: no zone covers the box of the map`).toBe(false);
      expect(map.left, `${where}: the box starts where Lucía ends`).toBeCloseTo(lucia.right, 0);
      expect(map.right, `${where}: and ends where the panel begins`).toBeCloseTo(panel.left, 0);
      expect(document.documentElement.scrollWidth - window.innerWidth, `${where}: the page does not scroll sideways`).toBeLessThanOrEqual(0);
      view.unmount();
    }

    await page.viewport(WIDE_ENOUGH_WINDOW.width, WIDE_ENOUGH_WINDOW.height);
    await theScreen(LONG_BOX_INCIDENT);
    const stage = elementOf(`${MAP} .map-stage`);
    expect(rectOf(MAP).width, 'a window wide enough leaves the map its floor').toBeGreaterThanOrEqual(MAP_FLOOR_PX);
    expect(stage.scrollWidth - stage.clientWidth, 'and the box does not scroll sideways').toBeLessThanOrEqual(EPSILON);
  });
});

describe('the frame of the incident screen at 900 px and under', () => {
  it('at 900 px and under the strip, Lucía, the map, the panel and the status bar stack in that order and at 390 px nothing scrolls sideways', async () => {
    await page.viewport(BREAK_WINDOW.width, BREAK_WINDOW.height);
    const stacked = await theScreen(TALL_LUCIA_INCIDENT);
    const lucia = elementOf(LUCIA_ZONE);

    const stack = [STRIP, LUCIA_ZONE, MAP, PANEL];
    stack.slice(1).forEach((selector, at) => {
      expect(rectOf(selector).top, `${selector} lies under ${stack[at]}`).toBeGreaterThanOrEqual(rectOf(stack[at]).bottom - EPSILON);
    });
    expect(lucia.scrollHeight - lucia.clientHeight, 'her zone has no cap of its own').toBeLessThanOrEqual(EPSILON);
    expect(document.documentElement.scrollHeight, 'the page scrolls').toBeGreaterThan(window.innerHeight);
    stacked.unmount();

    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    await theScreen(TALL_LUCIA_INCIDENT);

    expect(document.documentElement.scrollWidth - window.innerWidth, 'at 390 px the page does not scroll sideways').toBeLessThanOrEqual(0);
    expect(elementOf(PANEL).scrollWidth - PHONE_WINDOW.width, 'nor does the panel').toBeLessThanOrEqual(0);
    expect(elementOf(LUCIA_ZONE).scrollWidth - PHONE_WINDOW.width, 'nor does Lucía').toBeLessThanOrEqual(0);
  });

  it('at 390×844 selecting a piece brings its panel into view and a hover scrolls nothing', async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    const view = await theScreen(PIECE_IN_VIEW_INCIDENT);
    const piece = page.getByRole('button', { name: CHOSEN_PIECE });
    piece.element().scrollIntoView({ block: 'center' });
    const before = window.scrollY;

    await userEvent.hover(piece);
    await expect.poll(() => view.container.querySelector('.incident__inspection .card'), { message: 'the hover previews the box' }).not.toBeNull();

    expect(window.scrollY, 'a hover scrolls nothing').toBe(before);
    expect(rectOf('.message--note').bottom, 'the panel lies below the fold of the phone').toBeGreaterThan(window.innerHeight);

    await userEvent.click(piece);
    await expect.poll(() => document.querySelector(PANEL_CARD)).not.toBeNull();

    await expect.poll(() => rectOf(PANEL_CARD).bottom, { message: 'the panel is scrolled into view, its foot above the status bar' }).toBeLessThanOrEqual(rectOf(BAR).top + EPSILON);
    expect(rectOf(PANEL_CARD).top, 'from its top').toBeGreaterThanOrEqual(-EPSILON);
    expect(window.scrollY).toBeGreaterThan(before);
    window.scrollTo(0, 0);
  });

  it('at 390×844 choosing another piece after one brings the foot of its panel above the status bar once its tab has drawn', async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    await theScreen(ROUTING_INCIDENT);
    window.scrollTo(0, 0);

    await openCard(YOUR_LAPTOP);
    await expect.poll(() => rectOf(PANEL_CARD).bottom, { message: 'the first panel is scrolled into view' }).toBeLessThanOrEqual(rectOf(BAR).top + EPSILON);

    pieceLabel(OFFICE_ROUTER).element().scrollIntoView({ block: 'center' });
    const router = await openCard(OFFICE_ROUTER);
    await expect.element(router.getByRole('tab', { name: 'Tablas', exact: true })).toHaveAttribute('aria-selected', 'true');

    await expect.poll(() => rectOf(PANEL_CARD).bottom, { message: 'the panel of the second piece ends above the status bar, its body drawn' }).toBeLessThanOrEqual(rectOf(BAR).top + EPSILON);
    window.scrollTo(0, 0);
  });

  it('at 390×300 the panel of a piece taller than the room above the status bar shows its heading above it', async () => {
    await page.viewport(SHORT_PHONE_WINDOW.width, SHORT_PHONE_WINDOW.height);
    await theScreen(ROUTING_INCIDENT);
    window.scrollTo(0, 0);

    await openCard(OFFICE_ROUTER);
    await expect.poll(() => rectOf(HEADING).top, { message: 'the heading of the panel is in view' }).toBeGreaterThanOrEqual(-EPSILON);

    expect(rectOf(PANEL_CARD).height, 'the panel is taller than the room above the bar').toBeGreaterThan(rectOf(BAR).top);
    expect(rectOf(HEADING).bottom, 'its heading ends above the status bar').toBeLessThanOrEqual(rectOf(BAR).top + EPSILON);
    window.scrollTo(0, 0);
  });
});
