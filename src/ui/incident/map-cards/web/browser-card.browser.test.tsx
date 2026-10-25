import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent, type Locator } from 'vitest/browser';
import { BROWSER_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { card, openTerminal, reachWithWheel, showTheScreen, standStill } from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const PHONE = { width: 360, height: 2600 };
const BROWSER_CARD = 'Navegador de tu-laptop';
const ADMIN_URL = 'http://192.168.1.11:3000/admin';
const CONTROL_WHEEL_PX = 20;
const SLOW_TEST_MS = 60_000;

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

const press = (opened: Locator, name: string) => userEvent.click(opened.getByRole('button', { name, exact: true }));

async function signInAndOpenAt360(): Promise<{ browser: Locator; body: HTMLElement }> {
  await page.viewport(PHONE.width, PHONE.height);
  await showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId="03-06" nextId={null} onFinish={() => undefined} />);
  await openTerminal();
  await userEvent.click(page.getByRole('tab', { name: 'Navegador', exact: true }));
  const browser = card(BROWSER_CARD);
  for (const name of [ADMIN_URL, 'Lucía', BROWSER_TEXT.signIn, BROWSER_TEXT.open]) await press(browser, name);
  await expect.element(browser.getByRole('group', { name: BROWSER_TEXT.memory.title })).toBeVisible();
  const body = browser.element().querySelector('.chip-card__body') as HTMLElement;
  body.scrollTop = 0;
  await standStill();
  return { browser, body };
}

describe('the tab of the browser', () => {
  it('at 360 px the browser tab with the sign-in and the memory table does not scroll sideways and every control is within reach', { timeout: SLOW_TEST_MS }, async () => {
    const { browser, body } = await signInAndOpenAt360();
    expect(document.documentElement.scrollWidth, 'the page does not scroll sideways').toBeLessThanOrEqual(PHONE.width);
    expect(body.scrollWidth, 'the body of the card does not scroll sideways').toBeLessThanOrEqual(body.clientWidth);
    const table = browser.element().querySelector('.table') as HTMLElement;
    expect(table.scrollWidth, 'the memory table does not scroll sideways').toBeLessThanOrEqual(table.clientWidth);
    expect(table.querySelectorAll('tbody tr'), 'the table lists the cookie of the sign-in').toHaveLength(1);
    const within = page.elementLocator(body);
    const strip = page.elementLocator(body.querySelector('[role="tablist"]') as HTMLElement);
    const tabs = [...body.querySelectorAll('[role="tab"]')].map((tab) => page.elementLocator(tab));
    const controls = [...body.querySelectorAll('button:not([role="tab"])')].map((control) => page.elementLocator(control));
    expect(tabs.length, 'the four tabs of the laptop').toBe(4);
    expect(controls.length, 'the address, the users and the sign-in').toBeGreaterThan(2);
    for (const tab of tabs) expect(await reachWithWheel(tab, { within: strip, wheelPx: CONTROL_WHEEL_PX, sideways: true }), `${tab.element().textContent} is within reach`).toBe(true);
    for (const control of controls) expect(await reachWithWheel(control, { within, wheelPx: CONTROL_WHEEL_PX }), `${control.element().textContent} is within reach`).toBe(true);
    const lastCell = page.elementLocator(table.querySelector('tbody tr td:last-child') as HTMLElement);
    expect(await reachWithWheel(lastCell, { within, wheelPx: CONTROL_WHEEL_PX }), 'the last column of the table is within reach').toBe(true);
    expect(await reachWithWheel(browser.getByRole('button', { name: BROWSER_TEXT.open, exact: true })), 'the foot with «Abrir» stays in reach').toBe(true);
  });
});
