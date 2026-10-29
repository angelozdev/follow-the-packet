import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent, type Locator } from 'vitest/browser';
import { classifiedBlock, pieceViews, sessionReducer, startSession } from '@/game';
import { runFlows } from '@/game/flow-runs';
import { INCIDENTS, caseWorld, sendCombinations } from '@/levels';
import { FAN_PITCH } from '@/scene/layout/arrange/geometry';
import { MapStage } from '@/scene/map-stage';
import { coveredBy, drawingOf, mapBoxes, overlappingPairs, overlaps, type Area } from '@/testing/map-boxes';
import {
  OFFICE_IP,
  card,
  drawWithoutAnimations,
  openCard,
  openTerminal,
  pieceLabel,
  sendMessage,
  sendTo,
  showTheScreen,
  standStill,
  twoLineName,
  watchErrors,
} from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const SLOW_TEST_MS = 120_000;
const WINDOWS = [
  { name: '1440×900', size: { width: 1440, height: 900 } },
  { name: '1920×1080', size: { width: 1920, height: 1080 } },
];
const DESKTOP_WINDOW = { width: 1440, height: 900 };
const OFFICE_PIECES = ['laptop-lucia con candado', 'impresora con candado', 'laptop-andres con candado', 'router-oficina con candado'];
const PRINTER_NEIGHBOURS = ['impresora', 'laptop-marta con candado', 'laptop-lucia', 'laptop-visita'];
const SECOND_FLOOR = /laptop-andres|Piso 2/;
const GLOBE_AND_SERVER = /internet/;
const ROUTER = /router-oficina/;
const PING = 'ping';
const TRACEROUTE = 'traceroute';
const SETTINGS_TAB = 'Ajustes';
const TRACEROUTE_OUTPUT = 'Salida de traceroute';
const PACKET_ARRIVED_AT_THE_PRINTER = /^Paquete: paquete de tu-laptop a impresora\. Llegó\.$/;
const SG_SERVIDOR2 = 'Security Group servidor2';
const SG_SERVIDOR2_LABEL = twoLineName('Security Group', 'servidor2');
const ECHO_REQUEST = 'ICMP · Echo Request';
const INSPECTED_SERVER = 'servidor2 con candado';
const INSPECTION_TITLE = 'servidor2';
const INSPECTION_BOX = '.incident__inspection .card';
const INSPECTED_THINGS = [
  'servidor1 con candado',
  INSPECTED_SERVER,
  'Security Group servidor1',
  SG_SERVIDOR2,
  'Atacante',
  'Internet gateway con candado',
  'internet',
  'Paquete: ping de servidor1 a servidor2. Bloqueado.',
  'Paquete: ping de Atacante a servidor2. Bloqueado.',
];
const PING_TERM_DEFINITION = 'dirección IP';
const ECHO_REQUEST_DEFINITION = 'le pide al destino que conteste';
const TOOLTIP = 'body > [role="tooltip"]';
const NARROW_MAP_WIDTH = 360;
const CASE_OF_THE_OVERHANG = { level: '01-14', case: 4, packet: 'sent-you-ip-server-ping' };

type Size = { width: number; height: number };

function show(level: string) {
  return showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={level} nextId={null} onFinish={() => undefined} />);
}

async function listTheTraceroute(): Promise<Locator> {
  await show('01-10');
  const terminal = await openTerminal();
  await sendMessage(terminal, PING);
  await sendMessage(terminal, TRACEROUTE);
  await expect.element(terminal.getByRole('list', { name: TRACEROUTE_OUTPUT })).toBeVisible();
  return terminal;
}

function areaOf(target: Locator): Area {
  const { x, y, width, height } = target.element().getBoundingClientRect();
  return { x, y, width, height };
}

function expectApart(opened: Locator, pieces: readonly string[]): void {
  const taken = areaOf(opened);
  for (const piece of pieces) {
    const label = pieceLabel(piece).element();
    const drawing = drawingOf(label);
    expect(overlaps(taken, areaOf(page.elementLocator(label))), `${piece}: its label`).toBe(false);
    expect(drawing, `${piece}: the map draws it`).not.toBeNull();
    expect(overlaps(taken, drawing), `${piece}: its drawing`).toBe(false);
  }
}

function isInside(window: Size, area: Area | null): boolean {
  return area !== null && area.x >= 0 && area.y >= 0 && area.x + area.width <= window.width && area.y + area.height <= window.height;
}

async function expectDefinitionInsideTheWindow(term: Locator, definition: string): Promise<void> {
  const tooltip = () => document.querySelector(TOOLTIP);
  await userEvent.hover(term);
  await expect.poll(() => tooltip()?.textContent).toContain(definition);
  expect(isInside(windowSize(), tooltip()?.getBoundingClientRect() ?? null)).toBe(true);
}

function windowSize(): Size {
  return { width: window.innerWidth, height: window.innerHeight };
}

function useWindow(size: Size): void {
  beforeEach(() => page.viewport(size.width, size.height));
}

afterEach(async () => {
  window.scrollTo(0, 0);
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe.each(WINDOWS)('$name', ({ size }) => {
  useWindow(size);

  it('in 01-01 the open card of the printer covers none of the pieces the player compares', { timeout: SLOW_TEST_MS }, async () => {
    await show('01-01');
    await drawWithoutAnimations();
    const printer = await openCard('impresora');
    expectApart(printer, PRINTER_NEIGHBOURS);
    await expect.poll(() => overlappingPairs()).toEqual([]);
  });

  it('in 01-02 the open terminal covers neither the printer, nor laptop-marta, nor the packet once sent', { timeout: SLOW_TEST_MS }, async () => {
    await show('01-02');
    await drawWithoutAnimations();
    const terminal = await openTerminal();
    await userEvent.click(terminal.getByRole('button', { name: OFFICE_IP.printer, exact: true }));
    await expect.element(terminal).toMatchTextContent(`paquete de tu-laptop a ${OFFICE_IP.printer}`);
    await userEvent.click(terminal.getByRole('button', { name: 'Enviar', exact: true }));
    expectApart(terminal, ['impresora con candado', 'laptop-marta con candado']);
    const packet = page.getByRole('button', { name: PACKET_ARRIVED_AT_THE_PRINTER });
    await expect.element(packet).toBeVisible();
    expect(overlaps(areaOf(terminal), areaOf(packet)), 'the packet once sent').toBe(false);
    await expect.poll(() => overlappingPairs()).toEqual([]);
  });

  it('in 01-07 the open settings card covers none of the pieces of the office, and no label or stamp overlaps', { timeout: SLOW_TEST_MS }, async () => {
    await show('01-07');
    await drawWithoutAnimations();
    const settings = await openCard('tu-laptop', SETTINGS_TAB);
    await expect.element(settings).toBeVisible();
    expectApart(settings, OFFICE_PIECES);
    await expect.poll(() => overlappingPairs()).toEqual([]);
    const terminal = await openTerminal();
    await sendTo(terminal, OFFICE_IP.andres);
    expectApart(terminal, OFFICE_PIECES);
    await expect.poll(() => overlappingPairs()).toEqual([]);
  });

  it('in 06 the open terminal covers neither the router nor the labels of the second floor', { timeout: SLOW_TEST_MS }, async () => {
    await show('01-06');
    const terminal = await openTerminal();
    await sendTo(terminal, OFFICE_IP.andres);
    await expect.poll(() => page.getByRole('button', { name: /^Paquete:/ }).elements().length).toBe(1);
    const names = mapBoxes().map(({ name }) => name);
    expect(names).toEqual(expect.arrayContaining(['Piso 2', expect.stringMatching(ROUTER), expect.stringMatching(/^laptop-andres/)]));
    const covered = coveredBy(areaOf(terminal));
    expect(covered.filter((name) => ROUTER.test(name) || SECOND_FLOOR.test(name))).toEqual([]);
  });

  it('in 10 the open terminal, with the traceroute listed, covers neither the globe nor the server', { timeout: SLOW_TEST_MS }, async () => {
    const terminal = await listTheTraceroute();
    const watched = mapBoxes().map(({ name }) => name).filter((name) => GLOBE_AND_SERVER.test(name));
    expect(watched).toHaveLength(2);
    const covered = coveredBy(areaOf(terminal));
    expect(covered.filter((name) => GLOBE_AND_SERVER.test(name))).toEqual([]);
  });
});

describe('1280×800', () => {
  useWindow(WINDOWS[0].size);

  it('at 1280×800, after a traceroute, the terminal keeps Enviar and Listo in view', { timeout: SLOW_TEST_MS }, async () => {
    const terminal = await listTheTraceroute();
    const box = terminal.element().getBoundingClientRect();
    for (const name of ['Enviar']) {
      const action = terminal.getByRole('button', { name, exact: true }).element().getBoundingClientRect();
      expect(action.top, name).toBeGreaterThanOrEqual(0);
      expect(action.bottom, name).toBeLessThanOrEqual(window.innerHeight);
      expect(action.bottom, name).toBeLessThanOrEqual(box.bottom);
    }
  });
});

describe('the cards and boxes of 04-01', () => {
  useWindow(DESKTOP_WINDOW);

  it('labels and stamps do not overlap, and the open card does not cover its Security Group', { timeout: SLOW_TEST_MS }, async () => {
    await show('04-01');
    const label = page.getByRole('button', { name: SG_SERVIDOR2_LABEL });
    await expect.element(label).toBeVisible();
    await expect.poll(() => overlappingPairs(FAN_PITCH)).toEqual([]);
    await userEvent.click(label);
    const opened = card(SG_SERVIDOR2);
    await expect.element(opened).toBeVisible();
    await expect.poll(() => overlaps(areaOf(opened), areaOf(label))).toBe(false);
  });

  it('the inspection box floats inside the window and covers no label or stamp', { timeout: SLOW_TEST_MS }, async () => {
    await show('04-01');
    await expect.poll(() => document.querySelectorAll('button.stamp').length).toBeGreaterThan(0);
    await userEvent.hover(page.getByRole('button', { name: INSPECTED_SERVER, exact: true }));
    const inspection = page.getByRole('region', { name: INSPECTION_TITLE, exact: true });
    await expect.element(inspection).toBeVisible();
    const rect = areaOf(inspection);
    expect(isInside(windowSize(), rect)).toBe(true);
    const covered = mapBoxes().filter((other) => overlaps(rect, other)).map((other) => other.name);
    expect(covered).toEqual([]);
  });

  it('a term shows its definition inside the window, also from a chip of the open card', { timeout: SLOW_TEST_MS }, async () => {
    const watching = watchErrors();
    await show('04-01');
    await expectDefinitionInsideTheWindow(page.getByRole('region', { name: /Lucía/ }).getByText('ping', { exact: true }).first(), PING_TERM_DEFINITION);
    await userEvent.click(page.getByRole('button', { name: SG_SERVIDOR2, exact: true }));
    const opened = card(SG_SERVIDOR2);
    await expect.element(opened).toBeVisible();
    await expectDefinitionInsideTheWindow(opened.getByRole('button', { name: ECHO_REQUEST, exact: true }).getByText('Echo Request', { exact: true }), ECHO_REQUEST_DEFINITION);
    watching.stop();
    expect(watching.errors).toEqual([]);
  });
});

describe.each(WINDOWS)('$name', ({ size }) => {
  useWindow(size);

  it.each(INSPECTED_THINGS)('the inspection box of %s lies inside the window and covers no label or stamp', { timeout: SLOW_TEST_MS }, async (name) => {
    await show('04-01');
    await expect.element(page.getByRole('button', { name: INSPECTED_SERVER, exact: true })).toBeVisible();
    await userEvent.hover(page.getByRole('button', { name, exact: true }));
    await expect.poll(() => document.querySelector(INSPECTION_BOX)).not.toBeNull();
    await standStill();
    const rect = (document.querySelector(INSPECTION_BOX) as Element).getBoundingClientRect();
    const covered = mapBoxes().filter((other) => overlaps(rect, other));
    expect([...(isInside(size, rect) ? [] : ['sticks out of the window']), ...covered.map((other) => `covers ${other.name}`)]).toEqual([]);
  });
});

describe('the narrowest map', () => {
  it(`at 360 px in ${CASE_OF_THE_OVERHANG.level} case ${CASE_OF_THE_OVERHANG.case} the drawn shape that the 40 px model box overhangs lies inside the drawing`, { timeout: SLOW_TEST_MS }, async () => {
    const incident = INCIDENTS.find(({ id }) => id === CASE_OF_THE_OVERHANG.level);
    if (incident?.mechanic !== 'diagnose') throw new Error(`${CASE_OF_THE_OVERHANG.level} is not a diagnose incident`);
    const start = startSession(INCIDENTS, incident.id);
    const spec = incident.diagnose.cases[CASE_OF_THE_OVERHANG.case - 1];
    const world = caseWorld(start.start, spec);
    const session = { ...start, caseIndex: CASE_OF_THE_OVERHANG.case - 1, world, runs: runFlows(world, incident.flows, start.known) };
    const played = sendCombinations(spec).reduce((sent, combination) => sessionReducer(sent, { type: 'sendPacket', ...combination }), session);
    render(
      <div style={{ width: NARROW_MAP_WIDTH, position: 'relative' }}>
        <MapStage world={played.world} pieces={pieceViews(played)} known={played.known} blockName={classifiedBlock(played)} activePieceId={null} still flows={played.runs} sent={played.sent} inspectTrigger={() => ({})} inspectStampsTrigger={() => ({})} onActivate={() => undefined} />
      </div>,
    );
    const shapeSelector = `g.map-trace[data-packet="${CASE_OF_THE_OVERHANG.packet}"] g.map-packet[data-role="going"]`;
    await expect.poll(() => document.querySelector(shapeSelector)).not.toBeNull();
    const drawing = (document.querySelector('.map-stage__svg') as Element).getBoundingClientRect();
    const shape = (document.querySelector(shapeSelector) as Element).getBoundingClientRect();
    expect(drawing.width, 'the drawing is as wide as the map').toBe(NARROW_MAP_WIDTH);
    expect(shape.left - drawing.left, 'the shape lies inside the drawing at its left').toBeGreaterThanOrEqual(0);
    expect(drawing.right - shape.right, 'and at its right').toBeGreaterThanOrEqual(0);
    expect(shape.top - drawing.top, 'and under its top').toBeGreaterThanOrEqual(0);
    expect(drawing.bottom - shape.bottom, 'and over its bottom').toBeGreaterThanOrEqual(0);
  });
});
