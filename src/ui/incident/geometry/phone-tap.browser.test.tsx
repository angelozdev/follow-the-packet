import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { INCIDENTS } from '@/levels';
import { card, pieceLabel, showTheScreen, standStill, tapAt, type Point } from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const PHONE = { width: 390, height: 844 };
const INCIDENT = '01-01';
const VISITOR_LAPTOP = 'laptop-visita';
const NOT_ON_THE_NETWORK = 'No';
const PREVIEW = '.incident__inspection > .card';
const SCROLLED_UP_PX = 90;
const EPSILON = 0.5;

function centerOf(target: Element): Point {
  const { x, y, width, height } = target.getBoundingClientRect();
  return { x: x + width / 2, y: y + height / 2 };
}

describe('the panel on a phone, right after a piece is tapped', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
    window.scrollTo(0, 0);
  });

  it('at 390×844 the first tap on a control of the panel lands on it after the page was scrolled', async () => {
    await page.viewport(PHONE.width, PHONE.height);
    await showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={INCIDENT} nextId={null} onFinish={() => undefined} />);

    const label = pieceLabel(VISITOR_LAPTOP).element();
    label.scrollIntoView({ block: 'center' });
    await standStill();

    await tapAt(centerOf(label));
    const panel = card(VISITOR_LAPTOP);
    await expect.element(panel, { message: 'the tap chooses the piece, and the panel shows it' }).toBeVisible();
    await expect.poll(() => document.querySelector(PREVIEW), { message: 'the focus of the tap leaves the preview open' }).not.toBeNull();
    await standStill();
    window.scrollBy(0, -SCROLLED_UP_PX);
    await standStill();
    const no = () => panel.getByRole('button', { name: NOT_ON_THE_NETWORK, exact: true }).element();
    const topBefore = no().getBoundingClientRect().top;

    await tapAt(centerOf(no()));

    await expect.element(panel.getByRole('button', { name: NOT_ON_THE_NETWORK, exact: true }), { message: 'the tap lands on «No»' }).toHaveAttribute('aria-pressed', 'true');
    expect(Math.abs(no().getBoundingClientRect().top - topBefore), 'the panel did not move under the finger').toBeLessThanOrEqual(EPSILON);
  });
});
