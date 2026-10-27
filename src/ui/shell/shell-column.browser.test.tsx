import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { LUCIA_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { reachWithWheel } from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const TALL_LUCIA_INCIDENT = '02-12';
const SIDE = '.incident__side';
const LUCIA_REGION = '.incident__lucia';
const MAP = '.incident__map';
const NOTE = '.message--note';
const PANEL_CARD = '.incident__side > .card';
const PANEL_BODY = '.incident__side > .card > .card__body';
const LONG_BOX_INCIDENT = '04-01';
const PACKET_WITH_A_LONG_BOX = /^Paquete: ping de Atacante/;
const CHOSEN_PIECE = /^servidor2/;
const PIECE_IN_VIEW_INCIDENT = '04-01';
const ROOM_FOR_THE_BODY_PX = 120;
const LUCIA_SHARE_KEPT = 0.35;
const EPSILON = 1;
const COLUMN_WINDOWS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1280, height: 600 },
];
const LOW_WINDOW = { width: 1280, height: 600 };
const BREAK_WINDOW = { width: 900, height: 800 };
const PHONE_WINDOW = { width: 390, height: 844 };

function theScreen(incidentId: string) {
  const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={() => undefined} />);
  return expect.poll(() => view.container.querySelectorAll('button.map-button').length).toBeGreaterThan(0).then(() => view);
}

function rectOf(selector: string): DOMRect {
  const element = document.querySelector(selector);
  if (element === null) throw new Error(`${selector} is not on the page`);
  return element.getBoundingClientRect();
}

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the fixed column of the incident screen', () => {
  it('the column fills the height of the window at 1280×720, 1440×900 and 1280×600: the page does not scroll, Lucía scrolls inside her region and the panel keeps room for its body', async () => {
    for (const size of COLUMN_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(LONG_BOX_INCIDENT);
      const where = `${size.width}×${size.height}`;
      const side = rectOf(SIDE);
      const lucia = view.container.querySelector(LUCIA_REGION) as HTMLElement;
      const note = rectOf(NOTE);

      expect(side.height, `${where}: the column is as tall as the window`).toBeCloseTo(window.innerHeight, 0);
      expect(document.documentElement.scrollHeight - window.innerHeight, `${where}: the page does not scroll`).toBeLessThanOrEqual(0);
      expect(document.documentElement.scrollWidth - window.innerWidth, `${where}: the page does not scroll sideways`).toBeLessThanOrEqual(0);
      const column = view.container.querySelector(SIDE) as HTMLElement;
      expect(column.scrollHeight - column.clientHeight, `${where}: the column holds its two regions without scrolling`).toBeLessThanOrEqual(EPSILON);
      expect(getComputedStyle(lucia).overflowY, `${where}: Lucía has a region that scrolls by itself`).toBe('auto');
      expect(lucia.getBoundingClientRect().bottom, `${where}: her region ends above the panel`).toBeLessThanOrEqual(note.top + EPSILON);
      expect(note.bottom, `${where}: the panel stays inside the column`).toBeLessThanOrEqual(side.bottom + EPSILON);
      expect(note.height, `${where}: the panel keeps room for its body`).toBeGreaterThan(0);
      await userEvent.click(page.getByRole('button', { name: PACKET_WITH_A_LONG_BOX }));
      await expect.poll(() => document.querySelector(PANEL_CARD), { message: `${where}: the packet chosen fills the panel` }).not.toBeNull();
      const card = rectOf(PANEL_CARD);
      expect(card.top, `${where}: the card of the panel starts under Lucía`).toBeGreaterThanOrEqual(lucia.getBoundingClientRect().bottom - EPSILON);
      expect(card.bottom, `${where}: and ends inside the column`).toBeLessThanOrEqual(side.bottom + EPSILON);
      expect(rectOf(PANEL_BODY).height, `${where}: its body keeps room to be read`).toBeGreaterThanOrEqual(ROOM_FOR_THE_BODY_PX);
      expect(lucia.clientHeight, `${where}: and does not squeeze the region of Lucía`).toBeGreaterThanOrEqual(Math.min(lucia.scrollHeight, LUCIA_SHARE_KEPT * column.clientHeight) - EPSILON);
      expect(column.scrollHeight - column.clientHeight, `${where}: the column still holds its regions without scrolling`).toBeLessThanOrEqual(EPSILON);
      view.unmount();
    }
  });

  it('Lucía scrolls inside her region at 1280×600 and her report and her button can be reached there', async () => {
    await page.viewport(LOW_WINDOW.width, LOW_WINDOW.height);
    const view = await theScreen(TALL_LUCIA_INCIDENT);
    const lucia = view.container.querySelector(LUCIA_REGION) as HTMLElement;
    const submit = page.getByRole('button', { name: LUCIA_TEXT.submit });

    expect(lucia.scrollHeight, 'her cards do not fit the region, so it scrolls').toBeGreaterThan(lucia.clientHeight);
    expect(await reachWithWheel(submit, { within: page.elementLocator(lucia) }), 'the wheel over her region brings «Enviar solución» into reach').toBe(true);
    lucia.scrollTop = 0;
    expect(rectOf(`${LUCIA_REGION} h2`).top, 'her report starts inside the region').toBeGreaterThanOrEqual(lucia.getBoundingClientRect().top - EPSILON);
  });

  it('at 900 px and under the column stacks under the map and at 390 px nothing scrolls sideways', async () => {
    await page.viewport(BREAK_WINDOW.width, BREAK_WINDOW.height);
    const stacked = await theScreen(TALL_LUCIA_INCIDENT);
    const lucia = stacked.container.querySelector(LUCIA_REGION) as HTMLElement;

    expect(rectOf(SIDE).top, 'the column lies under the map').toBeGreaterThanOrEqual(rectOf(MAP).bottom - EPSILON);
    expect(rectOf(NOTE).top, 'the panel lies under Lucía').toBeGreaterThanOrEqual(lucia.getBoundingClientRect().bottom - EPSILON);
    expect(lucia.scrollHeight - lucia.clientHeight, 'her region has no cap of its own').toBeLessThanOrEqual(EPSILON);
    expect(document.documentElement.scrollHeight, 'the page scrolls').toBeGreaterThan(window.innerHeight);
    stacked.unmount();

    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    const phone = await theScreen(TALL_LUCIA_INCIDENT);

    expect(document.documentElement.scrollWidth - window.innerWidth, 'at 390 px the page does not scroll sideways').toBeLessThanOrEqual(0);
    expect((phone.container.querySelector(SIDE) as HTMLElement).scrollWidth - PHONE_WINDOW.width, 'nor does the column').toBeLessThanOrEqual(0);
  });

  it('at 390×844 selecting a piece brings its panel into view and a hover scrolls nothing', async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    const view = await theScreen(PIECE_IN_VIEW_INCIDENT);
    const piece = page.getByRole('button', { name: CHOSEN_PIECE });
    window.scrollTo(0, 0);

    await userEvent.hover(piece);
    await expect.poll(() => view.container.querySelector('.incident__inspection .card'), { message: 'the hover previews the box' }).not.toBeNull();

    expect(window.scrollY, 'a hover scrolls nothing').toBe(0);
    expect(rectOf(NOTE).top, 'the panel lies below the fold of the phone').toBeGreaterThan(window.innerHeight);

    await userEvent.click(piece);
    await expect.poll(() => document.querySelector(PANEL_CARD)).not.toBeNull();

    await expect.poll(() => rectOf(PANEL_CARD).bottom, { message: 'the panel is scrolled into view' }).toBeLessThanOrEqual(window.innerHeight + EPSILON);
    expect(rectOf(PANEL_CARD).top, 'from its top').toBeGreaterThanOrEqual(-EPSILON);
    expect(window.scrollY).toBeGreaterThan(0);
    window.scrollTo(0, 0);
  });
});
