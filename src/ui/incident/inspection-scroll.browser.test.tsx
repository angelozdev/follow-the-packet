import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
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
