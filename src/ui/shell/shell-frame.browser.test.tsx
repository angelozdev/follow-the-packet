import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { CAMERA_TEXT, LUCIA_TEXT, PIECE_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { MIN_ZOOM } from '@/scene/camera/camera-view';
import { clickAt, dragFromTo, openByKeyboard, openCard, pieceLabel, reachWithWheel, standStill, type Point } from '@/testing/browser-play';
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
const ACCEPTANCE_WINDOWS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1100, height: 700 },
  { width: 390, height: 844 },
];
const DOES_NOT_FIT_AT_THE_MINIMUM: Record<string, string[]> = {
  '1280×720': ['01-08', '02-04', '02-07', '02-12', '02-13', '04-01', '04-02'],
  '1440×900': ['02-13'],
  '1100×700': ['01-06', '01-07', '01-08', '02-04', '02-05', '02-06', '02-07', '02-11', '02-12', '02-13', '03-07', '04-01', '04-02'],
};
const DRAWING = '.map-stage__svg';
const STAGE = '.map-stage';
const UNDER_WINDOW = { width: 1280, height: 800 };
const INSIDE_PX = 4;
const COVERS = [
  { name: 'the card of Lucía', selector: `${LUCIA_ZONE} .card`, label: (box: DOMRect) => box.left, spot: (box: DOMRect): Point => centerOf(box) },
  { name: 'the panel', selector: PANEL, label: (box: DOMRect) => -box.left, spot: (box: DOMRect): Point => centerOf(box) },
  { name: 'the bottom strip', selector: BAR, label: (box: DOMRect) => -box.top, spot: (box: DOMRect): Point => ({ x: box.left + box.width / 2, y: box.top + INSIDE_PX * 2 }) },
];
const SHEET = '.map-stage__sheet';
const STACKED_UP_TO_PX = 900;
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

async function setLuciaExpanded(expanded: boolean) {
  const arrow = page.getByRole('button', { name: LUCIA_TEXT.foldLabel });
  await userEvent.click(arrow);
  await expect.element(arrow).toHaveAttribute('aria-expanded', String(expanded));
  return arrow;
}

function centerOf({ left, top, width, height }: DOMRect): Point {
  return { x: left + width / 2, y: top + height / 2 };
}

function contains(outer: DOMRect, inner: DOMRect): boolean {
  return inner.left >= outer.left - EPSILON && inner.right <= outer.right + EPSILON && inner.top >= outer.top - EPSILON && inner.bottom <= outer.bottom + EPSILON;
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

  it('at the fit in 1280×720, 1440×900, 1100×700 and 390×844 no label of a piece in any registered incident lies under a panel or outside the free gap', { timeout: 300_000 }, async () => {
    const misplaced: string[] = [];
    for (const size of ACCEPTANCE_WINDOWS) {
      await page.viewport(size.width, size.height);
      const named = DOES_NOT_FIT_AT_THE_MINIMUM[`${size.width}×${size.height}`] ?? [];
      for (const { id } of INCIDENTS) {
        const view = await theScreen(id);
        await standStill();
        const gap = rectOf(MAP);
        const where = `${size.width}×${size.height}, ${id}`;
        const fits = contains(gap, rectOf(DRAWING));
        const zoom = new DOMMatrix(getComputedStyle(elementOf(SHEET)).transform).a;
        if (fits === named.includes(id)) misplaced.push(`${where}: ${fits ? 'it fits and is named as one that does not' : 'it does not fit and is not named'}`);
        if (!fits && Math.abs(zoom - MIN_ZOOM) > EPSILON / 100) misplaced.push(`${where}: it does not fit but the zoom is ${zoom}, not the minimum`);
        for (const label of fits ? view.container.querySelectorAll<HTMLElement>(MAP_LABEL) : []) {
          const box = label.getBoundingClientRect();
          const above = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          const covered = window.innerWidth > STACKED_UP_TO_PX && !(above !== null && label.contains(above));
          if (!contains(gap, box) || covered) misplaced.push(`${where}, ${label.textContent?.trim()}: ${above?.className || above?.tagName}`);
        }
        view.unmount();
      }
    }
    expect(misplaced).toEqual([]);
  });

  it('the map is drawn under the card of Lucía, the panel and the bottom strip, and a click there reaches them, not the map', async () => {
    await page.viewport(UNDER_WINDOW.width, UNDER_WINDOW.height);
    await theScreen(LONG_BOX_INCIDENT);
    await standStill();
    const [strip, stage] = [STRIP, STAGE].map(rectOf);
    expect([stage.left, stage.top, stage.right, stage.bottom], 'the stage fills the window under the strip of the top').toEqual([0, strip.bottom, window.innerWidth, window.innerHeight]);

    for (const { name, selector, label, spot } of COVERS) {
      await userEvent.click(page.getByRole('button', { name: CAMERA_TEXT.fit }));
      await standStill();
      const cover = rectOf(selector);
      const target = spot(cover);
      const labels = [...document.querySelectorAll<HTMLElement>(MAP_LABEL)];
      const piece = labels.reduce((best, each) => (label(each.getBoundingClientRect()) < label(best.getBoundingClientRect()) ? each : best));
      const from = centerOf(piece.getBoundingClientRect());
      const start = centerOf(rectOf(MAP));
      await dragFromTo(start, { x: start.x + target.x - from.x, y: start.y + target.y - from.y });
      await standStill();

      const there = centerOf(piece.getBoundingClientRect());
      expect(Math.hypot(there.x - target.x, there.y - target.y), `${name}: the drawing is brought under it`).toBeLessThanOrEqual(EPSILON);
      const stack = document.elementsFromPoint(target.x, target.y);
      expect(elementOf(selector).contains(stack[0]), `${name}: what lies on top at that point is it`).toBe(true);
      expect(stack.includes(piece), `${name}: and the piece of the map lies under it`).toBe(true);

      await clickAt(target);
      expect(document.querySelector(PANEL_CARD), `${name}: a click there chooses no piece`).toBeNull();
      expect(piece.hasAttribute('data-pinned'), `${name}: nor rings the one under it`).toBe(false);
    }
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

  it('folding and unfolding Lucía does not move the box of the map', async () => {
    await page.viewport(LABEL_ACCEPTANCE_WINDOW.width, LABEL_ACCEPTANCE_WINDOW.height);
    await theScreen(LONG_BOX_INCIDENT);
    const before = rectOf(MAP).toJSON();
    const unfoldedHeight = rectOf(LUCIA_ZONE).height;

    await setLuciaExpanded(false);
    expect(rectOf(LUCIA_ZONE).height, 'her zone shrinks to her band').toBeLessThan(unfoldedHeight);
    expect(rectOf(MAP).toJSON(), 'folded').toEqual(before);

    await setLuciaExpanded(true);
    expect(rectOf(LUCIA_ZONE).height, 'her zone is as tall as before').toBeCloseTo(unfoldedHeight, 0);
    expect(rectOf(MAP).toJSON(), 'unfolded again').toEqual(before);
  });

  it('folded, Tab goes from the arrow of Lucía to the map and never into her zone', async () => {
    await page.viewport(LABEL_ACCEPTANCE_WINDOW.width, LABEL_ACCEPTANCE_WINDOW.height);
    await theScreen(LONG_BOX_INCIDENT);
    const arrow = await setLuciaExpanded(false);
    arrow.element().focus();

    await userEvent.tab();

    expect(elementOf(LUCIA_ZONE).contains(document.activeElement), 'the focus left her zone').toBe(false);
    expect(elementOf(MAP).contains(document.activeElement), 'and went to the map').toBe(true);
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

  it('between 901 px and the width the zones need the drawing keeps 360 px, the fit or the camera shows its right edge and no panel covers the map', async () => {
    for (const size of NARROW_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen(LONG_BOX_INCIDENT);
      const where = `${size.width}×${size.height}`;
      const [lucia, map, panel] = [LUCIA_ZONE, MAP, PANEL].map(rectOf);
      const drawing = elementOf(`${MAP} .map-stage__svg`);

      expect(window.innerWidth - lucia.width - panel.width, `${where}: the zones leave the map less than its floor`).toBeLessThan(MAP_FLOOR_PX);
      expect(drawing.getAttribute('width'), `${where}: the drawing keeps its 360 px`).toBe(`${MAP_FLOOR_PX}`);
      await expect.poll(() => drawing.getBoundingClientRect().right, { message: `${where}: the camera shows the right edge of the drawing` }).toBeLessThanOrEqual(map.right + EPSILON);
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

  it('at 390 px Lucía folds too and the page does not scroll sideways', async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    await theScreen(TALL_LUCIA_INCIDENT);
    const unfoldedHeight = rectOf(LUCIA_ZONE).height;

    const arrow = await setLuciaExpanded(false);

    expect(rectOf(LUCIA_ZONE).height, 'her zone shrinks to her band').toBeLessThan(unfoldedHeight);
    expect(rectOf(LUCIA_ZONE).bottom, 'the map box comes up under her band').toBeLessThanOrEqual(rectOf(MAP).top + EPSILON);
    expect(arrow.element().getBoundingClientRect().right, 'the arrow is inside the window').toBeLessThanOrEqual(window.innerWidth);
    expect(document.documentElement.scrollWidth - window.innerWidth, 'the page does not scroll sideways').toBeLessThanOrEqual(0);
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
