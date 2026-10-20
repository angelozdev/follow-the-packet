import { render, type RenderResult } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { SCREEN_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { MAP_MARKS } from '@/scene';
import { IncidentScreen } from './incident-screen';

vi.mock('@/scene/renderer', () => ({ MAP_RENDERER: '2d' }));

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const LOW_DESKTOP = { width: 1280, height: 720 };
const DESKTOP_WINDOWS = [{ width: 1280, height: 800 }, { width: 1440, height: 900 }];
const FIRST_INCIDENT = '04-01';
const INSPECTED = [/^servidor1/, /^servidor2/, /^Security Group servidor1/, /^Atacante/, /^internet$/, /^Internet gateway/];
const INCIDENT = '04-02';
const CARD_OF = /^Security Group servidor2/;
const ATTACKER = /^Atacante/;
const BOX = '.incident__inspection > .card';
const CARD = '.map-card .card';
const EPSILON = 0.5;
const DOCKED_CARD_INCIDENT = '01-07';
const DOCKED_CARD_WINDOW = { width: 1440, height: 900 };
const LAPTOP = 'tu-laptop';
const BODY_OF_A_CARD = '.map-card .chip-card__body';
const HIDDEN_PX_ALLOWED = 1;
const PHONE = { width: 390, height: 844 };
const HOLDER = '.incident__inspection';
const PINNED_BOX = '.incident__inspection > .card';
const SOMETHING_TO_INSPECT = /^internet$/;
const HELP_WINDOWS = [{ width: 1280, height: 800 }, { width: 1440, height: 900 }, { width: 1280, height: 720 }];
const WIDEST_NARROW_WINDOW = { width: 900, height: 800 };
const NARROWEST_WIDE_WINDOW = { width: 901, height: 800 };
const INCIDENT_IDS = INCIDENTS.map((incident) => incident.id);
const SIDE_PANEL = '.incident__side';
const MAP = '.incident__map';
const NOTE = '.message--note';

function rectOf(selector: string): DOMRect | null {
  return document.querySelector(selector)?.getBoundingClientRect() ?? null;
}

function overlap(a: DOMRect | null, b: DOMRect | null): boolean {
  if (a === null || b === null) return false;
  return a.left < b.right - EPSILON && b.left < a.right - EPSILON && a.top < b.bottom - EPSILON && b.top < a.bottom - EPSILON;
}

describe('the inspection box of the 2D screen', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it('covers no card of the map after the stage scrolls under an open card', async () => {
    await page.viewport(LOW_DESKTOP.width, LOW_DESKTOP.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={INCIDENT} nextId={null} onFinish={() => undefined} />);
    const label = (name: RegExp) => page.getByRole('button', { name });
    const stage = view.container.querySelector('.map-stage') as HTMLElement;
    await expect.poll(() => view.container.querySelectorAll('button.map-button').length).toBeGreaterThan(0);

    await userEvent.click(label(CARD_OF));
    await expect.poll(() => rectOf(CARD)).not.toBeNull();
    expect(stage.scrollHeight - stage.clientHeight, 'the drawing is taller than the window, so the stage scrolls').toBeGreaterThan(0);

    stage.scrollTop = stage.scrollHeight;
    await expect.poll(() => stage.scrollTop).toBe(stage.scrollHeight - stage.clientHeight);
    await userEvent.click(label(ATTACKER));
    await expect.poll(() => rectOf(BOX), { message: 'the box of the attacker is pinned beside the card' }).not.toBeNull();
    expect(overlap(rectOf(BOX), rectOf(CARD)), 'with the stage at the end').toBe(false);

    stage.scrollTop = 0;
    await expect.poll(() => stage.scrollTop).toBe(0);
    await expect.poll(() => overlap(rectOf(BOX), rectOf(CARD)), { message: 'with the stage back at the top, the card has moved under the place of the box' }).toBe(false);
  });
  it('stands in the corner where it covers no label, stamp or name of the map, whichever piece is inspected', async () => {
    for (const size of DESKTOP_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST_INCIDENT} nextId={null} onFinish={() => undefined} />);
      await expect.poll(() => view.container.querySelectorAll('button.map-button').length).toBeGreaterThan(0);
      for (const name of INSPECTED) {
        await userEvent.hover(page.getByRole('button', { name }));
        await expect.poll(() => rectOf(BOX), { message: `${size.width}×${size.height}, ${name}` }).not.toBeNull();
        const box = rectOf(BOX);
        const covered = [...document.querySelectorAll(MAP_MARKS)].filter((mark) => overlap(box, mark.getBoundingClientRect())).map((mark) => mark.textContent);
        expect(covered, `${size.width}×${size.height}, ${name}`).toEqual([]);
        await userEvent.unhover(page.getByRole('button', { name }));
      }
      view.unmount();
    }
  });
});

describe('a card docked in the corner of the 2D map', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it('shows the terminal of tu-laptop in 01-07 whole at 1440×900, before and after a ping, with nothing of its body to scroll', async () => {
    await page.viewport(DOCKED_CARD_WINDOW.width, DOCKED_CARD_WINDOW.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={DOCKED_CARD_INCIDENT} nextId={null} onFinish={() => undefined} />);
    await expect.poll(() => view.container.querySelectorAll('button.map-button').length).toBeGreaterThan(0);
    const hiddenOfTheBody = () => {
      const body = document.querySelector(BODY_OF_A_CARD);
      return body === null ? null : body.scrollHeight - body.clientHeight;
    };

    await userEvent.click(page.getByRole('button', { name: LAPTOP, exact: true }));
    await expect.poll(hiddenOfTheBody).not.toBeNull();
    expect(document.querySelector('.map-card--dock'), 'the terminal docks in the corner of the map').not.toBeNull();
    expect(hiddenOfTheBody(), 'before a ping').toBeLessThanOrEqual(HIDDEN_PX_ALLOWED);

    await userEvent.click(page.getByRole('button', { name: '192.168.2.15', exact: true }));
    await userEvent.click(page.getByRole('button', { name: 'Enviar', exact: true }));
    await expect.poll(() => document.querySelector('.map-card')?.textContent).toMatch(/ping 192\.168\.2\.15/);
    expect(hiddenOfTheBody(), 'after a ping').toBeLessThanOrEqual(HIDDEN_PX_ALLOWED);
  });
});

describe('the inspection box on a phone, under the map', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
    window.scrollTo(0, 0);
  });

  it('comes into view when it is pinned and not when it only previews', async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST_INCIDENT} nextId={null} onFinish={() => undefined} />);
    await expect.poll(() => view.container.querySelectorAll('button.map-button').length).toBeGreaterThan(0);
    const holder = view.container.querySelector(HOLDER) as HTMLElement;
    const label = page.getByRole('button', { name: SOMETHING_TO_INSPECT });
    const below = () => holder.getBoundingClientRect().bottom - window.innerHeight;

    await userEvent.hover(label);
    await expect.poll(() => rectOf(PINNED_BOX), { message: 'the preview shows in the holder under the map' }).not.toBeNull();
    const scrolledByTheHover = window.scrollY;
    expect(below(), 'the holder is under the fold, as the phone lays it out').toBeGreaterThan(0);

    await userEvent.click(label);
    await expect.poll(() => holder.textContent, { message: 'the click pins the box' }).toMatch(/Fijada/);
    await expect.poll(below, { message: 'the pinned box is scrolled into view' }).toBeLessThanOrEqual(EPSILON);
    expect(holder.getBoundingClientRect().top, 'the whole box, from its top').toBeGreaterThanOrEqual(-EPSILON);
    expect(window.scrollY).toBeGreaterThan(scrolledByTheHover);
  });
  it('leaves the page to the card when the same click opens a card', async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={INCIDENT} nextId={null} onFinish={() => undefined} />);
    await expect.poll(() => view.container.querySelectorAll('button.map-button').length).toBeGreaterThan(0);
    const holder = view.container.querySelector(HOLDER) as HTMLElement;

    await userEvent.click(page.getByRole('button', { name: CARD_OF }));
    await expect.poll(() => rectOf(CARD), { message: 'the card opens' }).not.toBeNull();
    await expect.poll(() => holder.textContent, { message: 'the click also pins the box' }).toMatch(/Fijada/);
    expect(holder.getBoundingClientRect().bottom - window.innerHeight, 'the holder stays where the phone lays it out').toBeGreaterThan(0);
  });
});

async function waitForTheHelp(view: RenderResult) {
  await expect.poll(() => view.container.querySelectorAll('button.map-button').length).toBeGreaterThan(0);
  await userEvent.hover(view.getByRole('heading', { level: 1 }));
  await expect.poll(() => view.queryByText(SCREEN_TEXT.inspectHelp), { message: 'the pointer is off the pieces, so the box goes and the help shows' }).not.toBeNull();
}

describe.each(HELP_WINDOWS)('the inspection help of the 2D screen at $width×$height', (size) => {
  beforeAll(() => page.viewport(size.width, size.height));
  afterAll(() => page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height));

  it.each(INCIDENT_IDS)('in %s is a note right under the card of Lucía and meets no mark of the map', async (incidentId) => {
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={() => undefined} />);
    await waitForTheHelp(view);
    const lines = [view.getByText(SCREEN_TEXT.inspectHelp), view.getByText(SCREEN_TEXT.stampLegend)];
    const marks = [...document.querySelectorAll(MAP_MARKS)];
    const map = view.container.querySelector(MAP)?.getBoundingClientRect() ?? null;

    for (const line of lines) {
      const covered = marks.filter((mark) => overlap(line.getBoundingClientRect(), mark.getBoundingClientRect())).map((mark) => mark.textContent);
      expect(covered, `${line.textContent}`).toEqual([]);
      expect(overlap(line.getBoundingClientRect(), map), 'the help leaves the map').toBe(false);
    }
    const side = view.container.querySelector(SIDE_PANEL);
    const note = lines[0].closest(NOTE);
    expect(note, 'the help is a note').not.toBeNull();
    expect(note?.previousElementSibling, 'right under the card of Lucía').toBe(side?.firstElementChild);
    expect(lines[1].closest(NOTE), 'the legend is in the same note').toBe(note);
  });
});

describe('the inspection help of the 2D screen at the 900 px break', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it.each([
    { size: WIDEST_NARROW_WINDOW, inThePanel: false },
    { size: NARROWEST_WIDE_WINDOW, inThePanel: true },
  ])('is in the side panel only when the window is wider than 900 px ($size.width px)', async ({ size, inThePanel }) => {
    await page.viewport(size.width, size.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST_INCIDENT} nextId={null} onFinish={() => undefined} />);
    await waitForTheHelp(view);
    const lines = [view.getByText(SCREEN_TEXT.inspectHelp), view.getByText(SCREEN_TEXT.stampLegend)];

    for (const line of lines) {
      expect(line.closest(SIDE_PANEL) !== null, line.textContent ?? '').toBe(inThePanel);
      expect(line.closest(HOLDER) !== null, line.textContent ?? '').toBe(!inThePanel);
    }
  });

  it('keeps the note, and what is under it, where it is while a box shows, is pinned and goes', async () => {
    await page.viewport(NARROWEST_WIDE_WINDOW.width, NARROWEST_WIDE_WINDOW.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST_INCIDENT} nextId={null} onFinish={() => undefined} />);
    await waitForTheHelp(view);
    const side = view.container.querySelector(SIDE_PANEL) as HTMLElement;
    const lastTop = () => (side.lastElementChild as HTMLElement).getBoundingClientRect().top;
    const before = lastTop();
    const label = page.getByRole('button', { name: SOMETHING_TO_INSPECT });

    await userEvent.hover(label);
    await expect.poll(() => rectOf(BOX), { message: 'the preview shows' }).not.toBeNull();
    expect(view.queryByText(SCREEN_TEXT.inspectHelp)?.closest(NOTE), 'the note stays while the box shows').toBeTruthy();
    expect(lastTop(), 'with the preview').toBe(before);

    await userEvent.click(label);
    await expect.poll(() => rectOf(BOX)?.height, { message: 'the click pins the box' }).toBeGreaterThan(0);
    await userEvent.click(side);
    await expect.poll(() => view.container.querySelector(HOLDER)?.textContent, { message: 'a click outside releases the box' }).not.toMatch(/Fijada/);
    expect(lastTop(), 'with the box released').toBe(before);
  });

  it('keeps the sentence about pinning in the note until a card opens, and the rest of the help after', async () => {
    await page.viewport(NARROWEST_WIDE_WINDOW.width, NARROWEST_WIDE_WINDOW.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={INCIDENT} nextId={null} onFinish={() => undefined} />);
    await waitForTheHelp(view);
    expect(view.getByText(SCREEN_TEXT.inspectPinHelp).closest(NOTE), 'with no card open').not.toBeNull();

    await userEvent.click(page.getByRole('button', { name: CARD_OF }));
    await expect.poll(() => rectOf(CARD), { message: 'the card opens' }).not.toBeNull();

    expect(view.queryByText(SCREEN_TEXT.inspectPinHelp), 'with a card open the note no longer promises the pinned box').toBeNull();
    expect(view.getByText(SCREEN_TEXT.inspectHelp).closest(NOTE)).not.toBeNull();
    expect(view.getByText(SCREEN_TEXT.stampLegend).closest(NOTE)).not.toBeNull();
  });
});
