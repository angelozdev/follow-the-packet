import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { INCIDENTS } from '@/levels';
import { openCard } from '@/testing/browser-play';
import { isReachable } from '@/testing/card-boxes';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const STRIP = '.incident__status';
const SYSTEMS = '.incident__systems';
const WEB_INCIDENT = '03-03';
const YOUR_LAPTOP = 'tu-laptop';
const PAGE_ADDRESS = 'http://192.168.1.11:3000/pedidos?id=7';
const PHONE_WINDOW = { width: 390, height: 844 };
const EPSILON = 1;

async function theScreen(incidentId: string) {
  const view = render(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={() => undefined} />);
  await expect.poll(() => view.container.querySelector('button.map-button')).not.toBeNull();
  return view;
}

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the bar of systems in the real window', () => {
  it('at 390×844 the bar does not scroll sideways and every button is within reach', async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    await theScreen(WEB_INCIDENT);
    const terminal = await openCard(YOUR_LAPTOP, 'Terminal');
    await userEvent.click(terminal.getByRole('button', { name: PAGE_ADDRESS, exact: true }));
    await userEvent.click(terminal.getByRole('button', { name: 'curl', exact: true }));
    await userEvent.click(terminal.getByRole('button', { name: 'Enviar', exact: true }));
    const bar = document.querySelector<HTMLElement>(SYSTEMS);
    const strip = document.querySelector<HTMLElement>(STRIP);
    if (bar === null || strip === null) throw new Error('the strip has no bar');
    const buttons = [...strip.querySelectorAll<HTMLElement>('button')].filter((button) => button.closest('[role="log"]') === null);
    const inTheBar = [...bar.querySelectorAll('button')].map((button) => button.textContent?.trim());

    expect(inTheBar, 'the three systems are in the bar, in order').toEqual(['Terminal', 'Navegador', 'Historial (1)']);
    expect(document.documentElement.scrollWidth, 'the page does not scroll sideways').toBeLessThanOrEqual(window.innerWidth);
    expect(bar.scrollWidth, 'the bar does not scroll sideways').toBeLessThanOrEqual(bar.clientWidth + EPSILON);
    for (const button of buttons) expect(isReachable(button), `${button.textContent?.trim()} is within reach`).toBe(true);
  });
});
