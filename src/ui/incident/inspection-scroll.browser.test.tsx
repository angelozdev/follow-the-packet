import { render, type RenderResult } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { SCREEN_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { MAP_MARKS } from '@/scene';
import { IncidentScreen } from './incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const DESKTOP_WINDOWS = [{ width: 1280, height: 800 }, { width: 1440, height: 900 }];
const FIRST_INCIDENT = '04-01';
const INSPECTED = [/^servidor1/, /^servidor2/, /^Security Group servidor1/, /^Atacante/, /^internet$/, /^Internet gateway/];
const INCIDENT = '04-02';
const CARD_OF = /^Security Group servidor2/;
const BOX = '.incident__inspection > .card';
const EPSILON = 0.5;
const DOCKED_CARD_INCIDENT = '01-07';
const DOCKED_CARD_WINDOW = { width: 1440, height: 900 };
const LAPTOP = 'tu-laptop';
const BODY_OF_THE_PANEL = '.incident__side .chip-card__body';
const HIDDEN_PX_ALLOWED = 1;
const PHONE = { width: 390, height: 844 };
const HOLDER = '.incident__inspection';
const PREVIEW = '.incident__inspection > .card';
const PANEL_CARD = '.incident__side > .card';
const SOMETHING_TO_INSPECT = /^internet$/;
const HELP_WINDOWS = [{ width: 1280, height: 800 }, { width: 1440, height: 900 }, { width: 1280, height: 720 }];
const WIDEST_NARROW_WINDOW = { width: 900, height: 800 };
const NARROWEST_WIDE_WINDOW = { width: 901, height: 800 };
const INCIDENT_IDS = INCIDENTS.map((incident) => incident.id);
const SIDE_PANEL = '.incident__side';
const LUCIA_REGION = '.incident__lucia';
const MAP = '.incident__map';
const NOTE = '.message--note';
const LUCIA_SHARE_KEPT = 0.35;

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
      const body = document.querySelector(BODY_OF_THE_PANEL);
      return body === null ? null : body.scrollHeight - body.clientHeight;
    };

    await userEvent.click(page.getByRole('button', { name: LAPTOP, exact: true }));
    await expect.poll(hiddenOfTheBody).not.toBeNull();
    expect(hiddenOfTheBody(), 'before a ping').toBeLessThanOrEqual(HIDDEN_PX_ALLOWED);

    await userEvent.click(page.getByRole('button', { name: '192.168.2.15', exact: true }));
    await userEvent.click(page.getByRole('button', { name: 'Enviar', exact: true }));
    await expect.poll(() => document.querySelector(PANEL_CARD)?.textContent).toMatch(/ping 192\.168\.2\.15/);
    expect(hiddenOfTheBody(), 'after a ping').toBeLessThanOrEqual(HIDDEN_PX_ALLOWED);
  });
});

describe('the inspection box on a phone, under the map', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
    window.scrollTo(0, 0);
  });

  it('the panel comes into view when a piece is chosen and not when it only previews', async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST_INCIDENT} nextId={null} onFinish={() => undefined} />);
    await expect.poll(() => view.container.querySelectorAll('button.map-button').length).toBeGreaterThan(0);
    const label = page.getByRole('button', { name: SOMETHING_TO_INSPECT });
    const note = view.container.querySelector(SIDE_PANEL)?.lastElementChild as HTMLElement;
    const below = (element: Element) => element.getBoundingClientRect().bottom - window.innerHeight;

    await userEvent.hover(label);
    await expect.poll(() => rectOf(PREVIEW), { message: 'the preview shows in the holder under the map' }).not.toBeNull();
    const scrolledByTheHover = window.scrollY;
    expect(below(note), 'the panel is under the fold, as the phone lays it out').toBeGreaterThan(0);

    await userEvent.click(label);
    await expect.poll(() => document.querySelector(PANEL_CARD), { message: 'the click chooses the piece, and the panel shows it' }).not.toBeNull();
    const panel = document.querySelector(PANEL_CARD) as HTMLElement;
    await expect.poll(() => below(panel), { message: 'the panel is scrolled into view' }).toBeLessThanOrEqual(EPSILON);
    expect(panel.getBoundingClientRect().top, 'the whole panel, from its top').toBeGreaterThanOrEqual(-EPSILON);
    expect(window.scrollY).toBeGreaterThan(scrolledByTheHover);
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

  it.each([{ size: WIDEST_NARROW_WINDOW }, { size: NARROWEST_WIDE_WINDOW }])('is the panel of the column, under the region of Lucía, at 900 px and at 901 px ($size.width px)', async ({ size }) => {
    await page.viewport(size.width, size.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST_INCIDENT} nextId={null} onFinish={() => undefined} />);
    await waitForTheHelp(view);
    const lines = [view.getByText(SCREEN_TEXT.inspectHelp), view.getByText(SCREEN_TEXT.stampLegend)];

    for (const line of lines) {
      expect(line.closest(SIDE_PANEL) !== null, line.textContent ?? '').toBe(true);
      expect(line.closest(HOLDER) !== null, line.textContent ?? '').toBe(false);
    }
    expect(lines[0].closest(NOTE)?.previousElementSibling, 'right under the region of Lucía').toBe(view.container.querySelector(LUCIA_REGION));
  });

  it('keeps the region of Lucía where it is while a box previews and only yields room to the panel while a piece is chosen', async () => {
    await page.viewport(NARROWEST_WIDE_WINDOW.width, NARROWEST_WIDE_WINDOW.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={FIRST_INCIDENT} nextId={null} onFinish={() => undefined} />);
    await waitForTheHelp(view);
    const lucia = view.container.querySelector(LUCIA_REGION) as HTMLElement;
    const luciaBottom = () => lucia.getBoundingClientRect().bottom;
    const before = luciaBottom();
    const label = page.getByRole('button', { name: SOMETHING_TO_INSPECT });

    await userEvent.hover(label);
    await expect.poll(() => rectOf(BOX), { message: 'the preview shows' }).not.toBeNull();
    expect(view.queryByText(SCREEN_TEXT.inspectHelp)?.closest(NOTE), 'the note stays while the box previews').toBeTruthy();
    expect(luciaBottom(), 'with the preview').toBe(before);

    await userEvent.click(label);
    await expect.poll(() => document.querySelector(PANEL_CARD), { message: 'the click chooses the piece' }).not.toBeNull();
    expect(luciaBottom(), 'with the piece chosen she gives room to the panel and takes none').toBeLessThanOrEqual(before);
    const column = view.container.querySelector(SIDE_PANEL) as HTMLElement;
    expect(lucia.clientHeight, 'and keeps what her cards need, up to a share of the column').toBeGreaterThanOrEqual(Math.min(lucia.scrollHeight, LUCIA_SHARE_KEPT * column.clientHeight) - EPSILON);
    expect(view.queryByText(SCREEN_TEXT.inspectHelp), 'the panel is the piece, not the note').toBeNull();
  });

  it('tells in the note what a click does until a piece is chosen, and gives the panel to the piece after', async () => {
    await page.viewport(NARROWEST_WIDE_WINDOW.width, NARROWEST_WIDE_WINDOW.height);
    const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={INCIDENT} nextId={null} onFinish={() => undefined} />);
    await waitForTheHelp(view);
    expect(view.getByText(SCREEN_TEXT.inspectClickHelp).closest(NOTE), 'with nothing chosen').not.toBeNull();

    await userEvent.click(page.getByRole('button', { name: CARD_OF }));
    await expect.poll(() => rectOf(PANEL_CARD), { message: 'the panel opens' }).not.toBeNull();

    expect(view.queryByText(SCREEN_TEXT.inspectClickHelp), 'with a piece chosen the note is gone').toBeNull();
    expect(view.queryByText(SCREEN_TEXT.stampLegend), 'and so is its legend').toBeNull();
    expect(rectOf(PANEL_CARD), 'the panel is the piece').not.toBeNull();
  });
});
