import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { CAMERA_TEXT, REGISTRY_TEXT, SYSTEMS_TEXT, toPlainText } from '@/copy';
import { INCIDENTS } from '@/levels';
import { KEEP_IN_VIEW_PX } from '@/scene/camera/camera-view';
import { drawingOf } from '@/testing/map-boxes';
import { OFFICE_IP, clickAt, dragFromTo, openTerminal, pieceLabel, sendTo, showTheScreen, standStill, type Point } from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const WINDOW = { width: 1280, height: 720 };
const LOW_WINDOW = { width: 1280, height: 600 };
const YOUR_LAPTOP = 'tu-laptop';
const NOT_FITTING_AT_THE_MINIMUM: Record<string, string | null> = {
  '01-08': YOUR_LAPTOP,
  '02-04': YOUR_LAPTOP,
  '02-06': YOUR_LAPTOP,
  '02-07': YOUR_LAPTOP,
  '02-08': YOUR_LAPTOP,
  '02-10': YOUR_LAPTOP,
  '02-11': YOUR_LAPTOP,
  '02-12': YOUR_LAPTOP,
  '02-13': YOUR_LAPTOP,
  '02-14': YOUR_LAPTOP,
  '03-04': YOUR_LAPTOP,
  '03-07': YOUR_LAPTOP,
  '04-01': null,
  '04-02': null,
};
const PIECE_LABELS = 'button.map-button';
const REGISTRY_ROW_BUTTON = '.incident__registry li > button:first-of-type';
const CHOSEN = '.map-stage [data-pinned]';
const GAP = '.incident__map';
const DRAWING = '.map-stage__svg';
const SHEET = '.map-stage__sheet';
const STAGE_BUTTONS = '.map-stage button';
const ROUTING_INCIDENT = '02-06';
const WEB_INCIDENT = '03-03';
const ROUTER = 'router-oficina';
const PRINTER_PING = /^ping de tu-laptop a impresora/;
const ANDRES_PING = /^ping de tu-laptop a laptop-andres/;
const MARGIN_PX = 4;
const STRADDLE_PX = 30;
const STEP_PX = 200;
const EPSILON = 1;

const theScreen = async (incidentId: string) => {
  const view = await showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={() => undefined} />);
  await standStill();
  return view;
};
const rectOf = (selector: string) => (document.querySelector(selector) as Element).getBoundingClientRect();
const zoomOf = () => new DOMMatrix(getComputedStyle(document.querySelector(SHEET) as Element).transform).a;
const centerOf = ({ left, top, width, height }: DOMRect): Point => ({ x: left + width / 2, y: top + height / 2 });
const isInTheGap = (element: Element) => {
  const [gap, own] = [rectOf(GAP), element.getBoundingClientRect()];
  return own.left >= gap.left - EPSILON && own.right <= gap.right + EPSILON && own.top >= gap.top - EPSILON && own.bottom <= gap.bottom + EPSILON;
};
const theButton = (name: string) => page.getByRole('button', { name, exact: true });

async function dragBy(by: Point): Promise<void> {
  const start = centerOf(rectOf(GAP));
  const steps = Math.ceil(Math.max(Math.abs(by.x), Math.abs(by.y)) / STEP_PX);
  for (let step = 0; step < steps; step++) {
    const [dx, dy] = [by.x / steps, by.y / steps];
    await dragFromTo({ x: start.x - dx / 2, y: start.y - dy / 2 }, { x: start.x + dx / 2, y: start.y + dy / 2 });
  }
  await standStill();
}

async function pushOut(element: Element): Promise<void> {
  const [gap, drawing, own] = [rectOf(GAP), rectOf(DRAWING), element.getBoundingClientRect()];
  const toTheLeft = { x: gap.left - MARGIN_PX - own.right, y: 0 };
  const toTheRight = { x: gap.right + MARGIN_PX - own.left, y: 0 };
  const down = { x: 0, y: gap.bottom + MARGIN_PX - own.top };
  const up = { x: 0, y: gap.top - MARGIN_PX - own.bottom };
  const ways = [
    { by: toTheLeft, kept: drawing.right + toTheLeft.x - gap.left },
    { by: toTheRight, kept: gap.right - (drawing.left + toTheRight.x) },
    { by: down, kept: gap.bottom - (drawing.top + down.y) },
    { by: up, kept: drawing.bottom + up.y - gap.top },
  ];
  const way = ways.find(({ kept }) => kept >= KEEP_IN_VIEW_PX + MARGIN_PX);
  if (way === undefined) throw new Error('the camera keeps too much of the drawing to push this element out of the gap');
  await dragBy(way.by);
  expect(isInTheGap(element), 'the element is now out of the free gap').toBe(false);
}

async function expectBroughtIn(element: Element, zoom: number, where: string): Promise<void> {
  await expect.poll(() => isInTheGap(element), { message: `${where}: the piece is brought into the free gap` }).toBe(true);
  await standStill();
  expect(zoomOf(), `${where}: and the zoom is the one it had`).toBeCloseTo(zoom, 5);
}

type Span = [number, number];

function startProblems(id: string, piece: string | null | undefined, axis: string, drawing: Span, gap: Span, center: number): string[] {
  const [blankBefore, blankAfter] = [drawing[0] > gap[0] + EPSILON, drawing[1] < gap[1] - EPSILON];
  const [flushBefore, flushAfter] = [Math.abs(drawing[0] - gap[0]) <= EPSILON, Math.abs(drawing[1] - gap[1]) <= EPSILON];
  const middle = (gap[0] + gap[1]) / 2;
  const centered = Math.abs(center - middle) <= EPSILON;
  const stoppedAtTheEdge = (flushBefore && center < middle) || (flushAfter && center > middle);
  if (blankBefore || blankAfter) return [`${id}: it starts with blank beyond the drawing in ${axis}`];
  return centered || stoppedAtTheEdge ? [] : [`${id}: it is neither centered on ${piece} nor stopped at the edge of the drawing in ${axis}`];
}

async function openRegistry(): Promise<HTMLElement[]> {
  const opener = page.getByRole('button', { name: new RegExp(`^${SYSTEMS_TEXT.registry}`) });
  if (opener.query() === null) return [];
  await userEvent.click(opener);
  await expect.element(page.getByRole('dialog')).toBeVisible();
  return [...document.querySelectorAll<HTMLElement>(REGISTRY_ROW_BUTTON)];
}

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('bringing the piece that is chosen or focused into the free gap', () => {
  it('choosing a piece whose label lies under the panel brings it into the free gap without changing the zoom', async () => {
    await page.viewport(WINDOW.width, WINDOW.height);
    await theScreen(ROUTING_INCIDENT);
    const label = pieceLabel(ROUTER).element();
    await dragBy({ x: rectOf(GAP).right - STRADDLE_PX - label.getBoundingClientRect().left, y: 0 });
    const zoom = zoomOf();
    expect(isInTheGap(label), 'the label stands half under the panel').toBe(false);

    const box = label.getBoundingClientRect();
    await clickAt({ x: box.left + STRADDLE_PX / 2, y: box.top + box.height / 2 });

    expect(label.hasAttribute('data-pinned'), 'the click chose the piece').toBe(true);
    await expectBroughtIn(label, zoom, 'a click');
  });

  it('a row of the registry, Ver fila, Terminal and Navegador bring the piece they choose into the free gap', async () => {
    await page.viewport(WINDOW.width, WINDOW.height);
    const routing = await theScreen(ROUTING_INCIDENT);
    const terminal = await openTerminal();
    await sendTo(terminal, OFFICE_IP.printer);
    await sendTo(terminal, OFFICE_IP.andres);
    await standStill();
    const stamp = (ping: RegExp) => page.getByRole('button', { name: new RegExp(`^Paquete: ${ping.source.slice(1)}`) }).element();
    const zoom = zoomOf();

    const router = pieceLabel(ROUTER).element();
    await pushOut(router);
    await userEvent.click(theButton(REGISTRY_TEXT.seeRow));
    await expectBroughtIn(router, zoom, 'Ver fila');

    const printer = stamp(PRINTER_PING);
    await pushOut(printer);
    await userEvent.click(page.getByRole('button', { name: REGISTRY_TEXT.open(2) }));
    await userEvent.click(page.getByRole('dialog').getByRole('button', { name: PRINTER_PING }));
    await expectBroughtIn(printer, zoom, 'a row of the registry');

    const andres = stamp(ANDRES_PING);
    await pushOut(andres);
    await userEvent.click(page.getByRole('log').getByRole('button', { name: ANDRES_PING }));
    await expectBroughtIn(andres, zoom, 'the newest line');
    routing.unmount();

    await theScreen(WEB_INCIDENT);
    for (const system of [`${SYSTEMS_TEXT.terminal} · ${YOUR_LAPTOP}`, SYSTEMS_TEXT.browser]) {
      await userEvent.click(theButton(CAMERA_TEXT.fit));
      await standStill();
      const laptop = pieceLabel(YOUR_LAPTOP).element();
      const zoomHere = zoomOf();
      await pushOut(laptop);
      await userEvent.click(theButton(toPlainText(system)));
      await expectBroughtIn(laptop, zoomHere, toPlainText(system));
    }
  });

  it('Tab to a piece under a panel or outside the free gap brings its label into the gap and no element scrolls natively', async () => {
    await page.viewport(WINDOW.width, WINDOW.height);
    await theScreen(ROUTING_INCIDENT);
    const last = [...document.querySelectorAll<HTMLElement>(STAGE_BUTTONS)].at(-1) as HTMLElement;
    await pushOut(last);
    const zoom = zoomOf();

    theButton(CAMERA_TEXT.zoomIn).element().focus();
    await userEvent.tab({ shift: true });

    expect(document.activeElement, 'Shift+Tab from Acercar lands on the last piece of the map').toBe(last);
    await expectBroughtIn(last, zoom, 'Tab');
    for (let element: Element | null = last; element !== null; element = element.parentElement) {
      expect(element.scrollTop + element.scrollLeft, `${element.className || element.tagName} was not scrolled`).toBe(0);
    }
  });

  it('at 1280×600 each incident that does not fit at the minimum zoom is named and starts centered, clamped at the edge of the drawing, on the first origin of send.from, or on the first piece a task of Lucía names, or at the top-left corner, and every piece of it is brought into the free gap when chosen from the registry, from Ver fila or with the keyboard', { timeout: 300_000 }, async () => {
    await page.viewport(LOW_WINDOW.width, LOW_WINDOW.height);
    const problems: string[] = [];
    for (const { id } of INCIDENTS) {
      const view = await theScreen(id);
      const [gap, drawing] = [rectOf(GAP), rectOf(DRAWING)];
      const fits = drawing.left >= gap.left - EPSILON && drawing.right <= gap.right + EPSILON && drawing.top >= gap.top - EPSILON && drawing.bottom <= gap.bottom + EPSILON;
      const named = id in NOT_FITTING_AT_THE_MINIMUM;
      if (fits === named) problems.push(`${id}: ${fits ? 'it fits and is named as one that does not' : 'it does not fit and is not named'}`);
      if (!fits) {
        const starts = NOT_FITTING_AT_THE_MINIMUM[id];
        const label = starts === null || starts === undefined ? null : pieceLabel(starts).element();
        const piece = label === null ? null : drawingOf(label);
        if (piece === null && Math.abs(drawing.top - gap.top) > EPSILON) problems.push(`${id}: it starts at ${drawing.top}, not at the top of the gap`);
        if (label !== null && !isInTheGap(label)) problems.push(`${id}: ${starts} is not in the gap at the start`);
        if (id === ROUTING_INCIDENT && Math.abs(drawing.top - gap.top) > EPSILON) problems.push(`${id}: the drawing starts at ${drawing.top}, not flush with the top of the gap`);
        if (piece !== null && drawing.height > gap.height + EPSILON) problems.push(...startProblems(id, starts, 'height', [drawing.top, drawing.bottom], [gap.top, gap.bottom], piece.y + piece.height / 2));
        if (piece !== null && drawing.width > gap.width + EPSILON) problems.push(...startProblems(id, starts, 'width', [drawing.left, drawing.right], [gap.left, gap.right], piece.x + piece.width / 2));
        for (const label of document.querySelectorAll<HTMLElement>(PIECE_LABELS)) {
          label.focus();
          await standStill();
          if (!isInTheGap(label)) problems.push(`${id}: Tab to ${label.textContent?.trim()} leaves it out of the gap`);
        }
        const rows = (await openRegistry()).length;
        if (rows > 0) await userEvent.keyboard('{Escape}');
        for (let row = 0; row < rows; row++) {
          const buttons = await openRegistry();
          await userEvent.click(page.elementLocator(buttons[row]));
          await standStill();
          const chosen = document.querySelector(CHOSEN);
          if (chosen !== null && !isInTheGap(chosen)) problems.push(`${id}: row ${row} of the registry leaves ${chosen.getAttribute('aria-label') ?? chosen.textContent} out of the gap`);
        }
      }
      view.unmount();
    }
    expect(problems).toEqual([]);
  });
});
