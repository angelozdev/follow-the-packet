import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent, type Locator } from 'vitest/browser';
import { URL_STRIP_TEXT } from '@/copy';
import { openTerminal, reachWithWheel, showTheScreen, standStill } from '@/testing/browser-play';
import { addressByPartsIncident } from '@/testing/web/web-incident';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const PHONE = { width: 360, height: 800 };
const LUCIA = 'laptop-lucia';
const CHIP_WHEEL_PX = 20;
const PARTS = Object.values(URL_STRIP_TEXT.parts);
const incident = addressByPartsIncident();

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

async function openTheStripAt360(): Promise<{ terminal: Locator; strip: Locator; body: Locator }> {
  await page.viewport(PHONE.width, PHONE.height);
  await showTheScreen(<IncidentScreen incidents={[incident]} incidentId={incident.id} nextId={null} onFinish={() => undefined} />);
  const terminal = await openTerminal(LUCIA);
  await standStill();
  const strip = terminal.getByRole('group', { name: URL_STRIP_TEXT.name, exact: true });
  const body = page.elementLocator(terminal.element().querySelector('.chip-card__body') as HTMLElement);
  return { terminal, strip, body };
}

const boxOf = (element: Element) => element.getBoundingClientRect();
const separatorBox = (strip: Locator, text: string) => boxOf([...strip.element().querySelectorAll('.strip__sep')].find((separator) => separator.textContent === text)!);

describe('the strip of the url', () => {
  it('the url chips lay out as the prototype V28 chose', async () => {
    const { strip } = await openTheStripAt360();
    const trays = [...strip.element().querySelectorAll('[role="group"]')];
    expect(trays.map((tray) => tray.getAttribute('aria-label')), 'the trays follow the url').toEqual(PARTS);
    const [scheme, host, port, path, query] = trays.map(boxOf);
    const [afterScheme, afterHost] = [separatorBox(strip, URL_STRIP_TEXT.separators.host), separatorBox(strip, URL_STRIP_TEXT.separators.port)];
    expect(scheme.top, 'the scheme and the name share the first row').toBeCloseTo(host.top, 0);
    expect(port.top, 'the port and the path share the second row').toBeCloseTo(path.top, 0);
    expect(port.top, 'the second row is under the first').toBeGreaterThanOrEqual(host.bottom);
    expect(query.top, 'the query string is alone in the third row').toBeGreaterThanOrEqual(path.bottom);
    expect(scheme.right, 'the :// comes right after the scheme').toBeLessThanOrEqual(afterScheme.left);
    expect(afterScheme.right, 'and before the name').toBeLessThanOrEqual(host.left);
    expect(host.right, 'the : comes right after the name, ending its row').toBeLessThanOrEqual(afterHost.left);
    expect(afterHost.top, 'and it is not on the second row').toBeLessThan(port.top);
    expect(port.right, 'the port comes before the path').toBeLessThanOrEqual(path.left);
    const frame = boxOf(strip.element());
    for (const box of [scheme, host, port, path, query, afterScheme, afterHost]) expect(box.right, 'nothing leaves the strip').toBeLessThanOrEqual(frame.right);
    for (const value of ['http', 'localhost']) expect(strip.getByRole('button', { name: value, exact: true }).element()).toHaveAttribute('aria-pressed', 'true');
    expect(strip.element().querySelectorAll('[aria-pressed="true"]'), 'the part with a single value is the only one picked').toHaveLength(2);
  });

  it('at 360 px the strip of the url does not scroll sideways and every chip is within reach', async () => {
    const { terminal, strip, body } = await openTheStripAt360();
    expect(document.documentElement.scrollWidth, 'the page does not scroll sideways').toBeLessThanOrEqual(PHONE.width);
    expect(body.element().scrollWidth, 'the body of the card does not scroll sideways').toBeLessThanOrEqual(body.element().clientWidth);
    const chips = [...strip.element().querySelectorAll('button')].map((chip) => page.elementLocator(chip));
    expect(chips).toHaveLength(8);
    for (const chip of chips) expect(await reachWithWheel(chip, { within: body, wheelPx: CHIP_WHEEL_PX }), `${chip.element().textContent} is within reach`).toBe(true);
    for (const port of ['3000', '80']) {
      for (const path of ['/pedidos', '/pedido']) {
        for (const query of ['?id=7', '?id=8']) {
          for (const value of [port, path, query]) await userEvent.click(strip.getByRole('button', { name: value, exact: true }));
          await expect.element(terminal.element().querySelector('code') as HTMLElement).toHaveTextContent(`curl http://localhost:${port}${path}${query}`);
        }
      }
    }
  });
});
