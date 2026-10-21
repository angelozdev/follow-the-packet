import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent, type Locator } from 'vitest/browser';
import { SCREEN_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { inspectionBoxOverCards } from '@/testing/card-boxes';
import { card, moveTheMouseTo, openCard, openTerminal, showTheScreen, standStill, type Point } from '@/testing/browser-play';
import { overlaps } from '@/testing/map-boxes';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const SLOW_TEST_MS = 60_000;
const FIREWALL = 'firewall tu-laptop';
const PRINTER = 'impresora';
const YOUR_LAPTOP = 'tu-laptop';
const VISITOR_LAPTOP = 'laptop-visita';
const OFFICE_ROUTER = 'router-oficina';
const PINNED_MARK = 'data-pinned';
const DESKTOP_WINDOW = { width: 1440, height: 900 };
const FULL_WINDOWS = [
  { name: '1280×800', size: { width: 1280, height: 800 } },
  { name: '1440×900', size: DESKTOP_WINDOW },
];
const LUCIA = 'laptop-lucia';
const MAP_LABELS = 'button.map-button';
const ROUTES_CARD = 'Tabla de rutas de router-oficina';
const TRANSLATIONS_TAB = 'Tabla de traducciones';
const TRANSLATIONS_CARD = 'Tabla de traducciones de router-oficina';
const TIGHT_WINDOW = { width: 1000, height: 700 };
const HEADING = 'h2';
const CONTAINS = { exact: false };

const CARD_AND_ITS_FREE_SIDE = [
  { name: 'the terminal of 01-08, docked at the left of the map', level: '01-08', open: () => openTerminal(), over: OFFICE_ROUTER, takes: 'right' },
  { name: 'the card of the firewall of 01-13, docked at the left of the map', level: '01-13', open: () => openCard(FIREWALL), over: YOUR_LAPTOP, takes: 'right' },
  { name: 'the card of the printer of 01-01, in the middle of the map', level: '01-01', open: () => openCard(PRINTER), over: VISITOR_LAPTOP, takes: 'left' },
] as const;

function centreOf(element: Element): Point {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x: x + width / 2, y: y + height / 2 };
}

async function openTheTableOfTheRouter(tab?: string): Promise<Locator> {
  await userEvent.click(page.getByRole('button', { name: labelOf(OFFICE_ROUTER) }));
  if (tab !== undefined) await userEvent.click(page.getByRole('tab', { name: tab, exact: true }));
  const opened = card(tab === undefined ? ROUTES_CARD : TRANSLATIONS_CARD);
  await expect.element(opened).toBeVisible();
  return opened;
}

const OPEN_CARDS = [
  { level: '02-07', name: 'the terminal of tu-laptop', open: () => openTerminal() },
  { level: '02-07', name: 'the routes of router-oficina', open: () => openTheTableOfTheRouter() },
  { level: '02-08', name: 'the terminal of tu-laptop', open: () => openTerminal() },
  { level: '02-08', name: 'the terminal of laptop-lucia', open: () => openTerminal(LUCIA) },
  { level: '02-08', name: 'the translations of router-oficina', open: () => openTheTableOfTheRouter(TRANSLATIONS_TAB) },
] as const;

function show(level: string) {
  return showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={level} nextId={null} onFinish={() => undefined} />);
}

function labelOf(piece: string): RegExp {
  return new RegExp(`^${piece}`);
}

function sideOf(box: DOMRect, beside: DOMRect): 'left' | 'right' | 'over it' {
  if (box.x >= beside.x + beside.width) return 'right';
  return box.x + box.width <= beside.x ? 'left' : 'over it';
}

async function letGoOfItsBox(opened: Locator): Promise<void> {
  await userEvent.click(page.elementLocator(opened.element().querySelector(HEADING) as Element));
  await standStill();
}

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('at the desktop window', () => {
  beforeEach(() => page.viewport(DESKTOP_WINDOW.width, DESKTOP_WINDOW.height));

  it('with a card open and room beside it, the box of another piece takes the side the card leaves free', { timeout: SLOW_TEST_MS }, async () => {
    for (const { name, level, open, over, takes } of CARD_AND_ITS_FREE_SIDE) {
      const view = await show(level);
      await standStill();
      const opened = await open();
      await letGoOfItsBox(opened);

      await userEvent.hover(page.getByRole('button', { name: labelOf(over) }));

      const box = page.getByRole('region', { name: over, exact: true });
      await expect.element(box, { message: `${name}: hovering ${over} shows its box` }).toBeVisible();
      await standStill();
      expect(sideOf(box.element().getBoundingClientRect(), opened.element().getBoundingClientRect()), `${name}: the box takes the side the card leaves free`).toBe(takes);
      view.unmount();
    }
  });
});

describe('at a tight window', () => {
  beforeEach(() => page.viewport(TIGHT_WINDOW.width, TIGHT_WINDOW.height));

  it('with a card open and no room beside it, a hover shows no box and a pinned box is released', { timeout: SLOW_TEST_MS }, async () => {
    await show('01-08');
    await standStill();
    const pinHelp = page.getByText(SCREEN_TEXT.inspectPinHelp, CONTAINS);
    expect(pinHelp.query(), 'with no card open, the grey help promises the pinned box').not.toBeNull();
    const terminal = await openTerminal();
    await letGoOfItsBox(terminal);
    const piece = page.getByRole('button', { name: labelOf(OFFICE_ROUTER) });
    const box = page.getByRole('region', { name: OFFICE_ROUTER, exact: true });

    await userEvent.hover(piece);
    await standStill();

    expect(box.query(), 'the terminal takes both places, so a hover shows no box').toBeNull();
    const reason = page.getByText(SCREEN_TEXT.noRoomForTheBox, CONTAINS);
    await expect.element(reason, { message: 'the reason is written in the side panel' }).toBeVisible();
    expect(overlaps(reason.element().getBoundingClientRect(), terminal.element().getBoundingClientRect()), 'and no card of the map covers it').toBe(false);
    expect(pinHelp.query(), 'the grey help no longer promises the pinned box').toBeNull();

    await userEvent.click(piece);
    await standStill();

    expect(box.query(), 'a click shows no box either: the pin is released').toBeNull();
    await expect.element(piece, { message: 'and the piece wears no pin' }).not.toHaveAttribute(PINNED_MARK);
    await expect.element(terminal, { message: 'the terminal stays open' }).toBeVisible();
    await expect.element(reason, { message: 'and the reason stays while the card does' }).toBeVisible();
  });
});

describe('the inspection box in the incidents of the routes and the translations', () => {
  it('in 02-07 and 02-08 the inspection box of a piece covers no open card, at 1280×800 and at 1440×900', { timeout: SLOW_TEST_MS }, async () => {
    const covered: string[] = [];
    const hoversWithABox = new Map<string, number>();
    for (const { name: windowName, size } of FULL_WINDOWS) {
      await page.viewport(size.width, size.height);
      for (const { level, name, open } of OPEN_CARDS) {
        const scene = `${windowName}, ${level}, ${name}`;
        hoversWithABox.set(scene, 0);
        const view = await show(level);
        await standStill();
        const opened = await open();
        await letGoOfItsBox(opened);
        for (const piece of document.querySelectorAll(MAP_LABELS)) {
          await moveTheMouseTo(centreOf(piece));
          await standStill();
          const seen = inspectionBoxOverCards();
          if (seen.shown) hoversWithABox.set(scene, (hoversWithABox.get(scene) ?? 0) + 1);
          covered.push(...seen.covered.map((problem) => `${scene}, ${piece.getAttribute('aria-label') ?? piece.textContent}: ${problem}`));
        }
        view.unmount();
      }
    }
    expect(covered).toEqual([]);
    expect([...hoversWithABox].filter(([, hovers]) => hovers === 0).map(([scene]) => scene), 'every open card leaves the box a place, so each scene shows it for some piece').toEqual([]);
  });
});
