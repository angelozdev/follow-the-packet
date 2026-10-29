import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { INCIDENTS, type Incident } from '@/levels';
import { openCard, sendTo } from '@/testing/browser-play';
import { OFFICE_FLOORS } from '@/testing/fixtures';
import { gatewayIncident } from '@/testing/incidents';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const STRIP = '.incident__status';
const MAP = '.incident__map';
const LOG = '[role="log"]';
const MAP_LABEL = 'button.map-button';
const YOUR_LAPTOP = 'tu-laptop';
const ANDRES = OFFICE_FLOORS.floor2.andres;
const GATEWAY = OFFICE_FLOORS.floor1.gateway;
const EMPTY_INCIDENT = '01-01';
const NOTICE = /Cambiaste la puerta de enlace/;
const REGISTRY_BUTTON = /^Registro \(\d+\)$/;
const REGISTRY = '.incident__registry';
const TOP_STRIP = '.incident__strip';
const BAR = '.incident__systems';
const LINE_ROW = '.incident__newest';
const SEE_ROW = 'Ver fila en la tabla de rutas';
const LOW_WINDOW = { width: 1280, height: 600 };
const WIDE_WINDOW = { width: 1440, height: 900 };
const EPSILON = 1;
const DESKTOP_WINDOW = { width: 1280, height: 720 };
const PHONE_WINDOW = { width: 390, height: 844 };
const WINDOWS = [DESKTOP_WINDOW, PHONE_WINDOW];
const BOX_WINDOWS = [...WINDOWS, LOW_WINDOW, WIDE_WINDOW];

async function theScreen(incident: Incident = gatewayIncident()) {
  const view = render(<IncidentScreen incidents={[incident]} incidentId={incident.id} nextId={null} onFinish={() => undefined} />);
  await expect.poll(() => document.querySelectorAll(MAP_LABEL).length).toBeGreaterThan(0);
  return view;
}

function elementOf(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`${selector} is not on the page`);
  return found;
}

const heightOfTheStrip = () => elementOf(STRIP).getBoundingClientRect().height;
const rectOfTheMap = () => elementOf(MAP).getBoundingClientRect().toJSON();

async function pingAndres() {
  await sendTo(await openCard(YOUR_LAPTOP, 'Terminal'), ANDRES);
}

async function setTheGateway() {
  const settings = await openCard(YOUR_LAPTOP, 'Ajustes');
  await userEvent.click(settings.getByRole('button', { name: GATEWAY, exact: true }));
}

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the bottom strip of the incident screen', () => {
  it('the bottom strip keeps its height with no line, with a long line, with the notice Cambiaste and when the first button of the bar appears', async () => {
    for (const size of WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen();
      const where = `${size.width}×${size.height}`;
      const empty = heightOfTheStrip();

      await pingAndres();
      expect(elementOf(LOG).textContent, `${where}: the line is long`).toContain('no tiene puerta de enlace');
      expect(page.getByRole('button', { name: REGISTRY_BUTTON }).query(), `${where}: the first button of the bar is there`).not.toBeNull();
      expect(heightOfTheStrip(), `${where}: with a long line and its first button`).toBeCloseTo(empty, 0);

      await setTheGateway();
      expect(elementOf(LOG).textContent, `${where}: the notice shows`).toMatch(NOTICE);
      expect(heightOfTheStrip(), `${where}: with the notice`).toBeCloseTo(empty, 0);

      await pingAndres();
      expect(heightOfTheStrip(), `${where}: with the line that found its way`).toBeCloseTo(empty, 0);
      view.unmount();
    }
  });

  it('a line that does not fit its box scrolls inside it, the keyboard reaches the box and it stays a log', async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    await theScreen();
    await pingAndres();
    const log = page.getByRole('log').element() as HTMLElement;
    const strip = heightOfTheStrip();

    expect(log.scrollHeight, 'the line is taller than its box').toBeGreaterThan(log.clientHeight + EPSILON);
    expect(getComputedStyle(log).overflowY, 'so the box scrolls').toBe('auto');
    log.scrollTop = log.scrollHeight;
    expect(log.scrollTop, 'and it does scroll').toBeGreaterThan(0);
    expect(heightOfTheStrip(), 'the strip did not grow').toBeCloseTo(strip, 0);

    elementOf(`${BAR} button`).focus();
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    expect(document.activeElement, 'Shift+Tab from the bar reaches the box').toBe(log);
    expect(log.getAttribute('role'), 'it stays a log').toBe('log');
  });

  it('the notice Cambiaste can be read whole at 1280×720 and at 390 px its box can be scrolled to the end', async () => {
    await page.viewport(DESKTOP_WINDOW.width, DESKTOP_WINDOW.height);
    const desktop = await theScreen();
    await pingAndres();
    await setTheGateway();
    const whole = elementOf(`${LOG} .message`);
    const room = elementOf(LOG).getBoundingClientRect();
    expect(elementOf(LOG).scrollHeight, 'at 1280×720 the notice needs no scrolling').toBeLessThanOrEqual(elementOf(LOG).clientHeight + EPSILON);
    expect(whole.getBoundingClientRect().top, 'its tab is inside the box').toBeGreaterThanOrEqual(room.top - EPSILON);
    expect(whole.getBoundingClientRect().bottom, 'and so is its end').toBeLessThanOrEqual(room.bottom + EPSILON);
    desktop.unmount();

    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    await theScreen();
    await pingAndres();
    await setTheGateway();
    const log = elementOf(LOG);
    expect(log.scrollHeight, 'at 390 px the notice is taller than its box').toBeGreaterThan(log.clientHeight + EPSILON);
    log.scrollTop = log.scrollHeight;
    expect(log.scrollTop + log.clientHeight, 'the box scrolls to its end').toBeGreaterThanOrEqual(log.scrollHeight - EPSILON);
    expect(elementOf(`${LOG} .message`).getBoundingClientRect().bottom, 'where the end of the notice is in view').toBeLessThanOrEqual(log.getBoundingClientRect().bottom + EPSILON);
  });

  it('the box of the map keeps its rectangle when a line arrives, the notice shows, the first button appears and the registry opens', async () => {
    await page.viewport(DESKTOP_WINDOW.width, DESKTOP_WINDOW.height);
    await theScreen();
    const before = rectOfTheMap();
    expect(page.getByRole('button', { name: REGISTRY_BUTTON }).query(), 'no Registro button yet').toBeNull();

    await pingAndres();
    expect(page.getByRole('button', { name: REGISTRY_BUTTON }).query(), 'the first button appeared with the first line').not.toBeNull();
    expect(rectOfTheMap(), 'when a line arrives and its first button appears').toEqual(before);

    await setTheGateway();
    expect(elementOf(LOG).textContent, 'the notice shows').toMatch(NOTICE);
    expect(rectOfTheMap(), 'when the notice shows').toEqual(before);

    await userEvent.click(page.getByRole('button', { name: REGISTRY_BUTTON }));
    expect(elementOf('.incident__registry'), 'the registry is open').toBeTruthy();
    expect(rectOfTheMap(), 'when the registry opens').toEqual(before);
  });

  it('the row of the bar is reserved when it has no button', async () => {
    await page.viewport(DESKTOP_WINDOW.width, DESKTOP_WINDOW.height);
    const office = INCIDENTS.find(({ id }) => id === EMPTY_INCIDENT);
    if (office === undefined) throw new Error(`${EMPTY_INCIDENT} is not registered`);
    const bare = await theScreen(office);
    expect(elementOf(STRIP).querySelectorAll('button'), 'the bar has no button').toHaveLength(0);
    const [stripWithoutButtons, mapWithoutButtons] = [heightOfTheStrip(), rectOfTheMap()];
    bare.unmount();

    await theScreen();
    await pingAndres();
    expect(elementOf(STRIP).querySelectorAll('button').length, 'the bar has a button').toBeGreaterThan(0);
    expect(heightOfTheStrip(), 'the strip is as tall with buttons').toBeCloseTo(stripWithoutButtons, 0);
    expect(rectOfTheMap(), 'and the box of the map is the same').toEqual(mapWithoutButtons);
  });

  it('the box of the open registry covers no control of the strip, the line or the bar', async () => {
    for (const size of BOX_WINDOWS) {
      await page.viewport(size.width, size.height);
      const view = await theScreen();
      const where = `${size.width}×${size.height}`;
      await pingAndres();
      await setTheGateway();
      await pingAndres();
      await userEvent.click(page.getByRole('button', { name: REGISTRY_BUTTON }));
      const box = elementOf(REGISTRY).getBoundingClientRect();
      const controls = [...document.querySelectorAll<HTMLElement>(`${TOP_STRIP} a, ${TOP_STRIP} input, ${LINE_ROW} button, ${LINE_ROW} [role="log"], ${BAR} button`)];
      const names = controls.map((control) => control.getAttribute('role') ?? control.textContent?.trim() ?? control.tagName);

      expect(names, `${where}: the bar holds the three systems and the line holds its row`).toEqual(expect.arrayContaining(['Terminal', 'Registro (2)', SEE_ROW, 'log']));
      expect(box.height, `${where}: the box is on the page`).toBeGreaterThan(0);
      for (const control of controls) {
        const { left, right, top, bottom } = control.getBoundingClientRect();
        const apart = right <= box.left + EPSILON || left >= box.right - EPSILON || bottom <= box.top + EPSILON || top >= box.bottom - EPSILON;
        expect(apart, `${where}: the box does not cover ${control.getAttribute('role') ?? control.textContent?.trim()}`).toBe(true);
      }
      view.unmount();
    }
  });
});
