import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { MAP_TEXT } from '@/copy';
import { pieceViews, startSession } from '@/game';
import { layoutMap } from '@/scene/layout/map-layout';
import { MapStage } from '@/scene/map-stage';
import { pieceDomId } from '@/scene/overlay/piece-label';
import { showTheScreen } from '@/testing/browser-play';
import { namesSendIncident } from '@/testing/incidents';
import { NAME_SERVERS } from '@/testing/fixtures';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const PHONE = { width: 360, height: 800 };
const WIDER_PHONE = { width: 390, height: 844 };
const SLOW_TEST_MS = 120_000;
const SUBPIXEL_PX = 0.5;
const MODEL_SLACK_PX = 2;
const NEWS_SERVER = NAME_SERVERS.down.id;
const NEWS_PIECE = `actor:${NEWS_SERVER}`;
const FULL_NAME = `${NEWS_SERVER} ${MAP_TEXT.locked}`;
const CUT_NAME = 'servidor-autoritativo-not…';

const incident = namesSendIncident();
const session = startSession([incident], incident.id);
const pieces = pieceViews(session);
const STILL_STAGE = { blockName: null, activePieceId: null, still: true, flows: [], sent: [], inspectTrigger: () => ({}), inspectStampsTrigger: () => ({}), onActivate: () => undefined };

async function drawTheMapIn(width: number) {
  render(
    <div style={{ width, position: 'relative' }}>
      <MapStage world={session.world} pieces={pieces} known={session.known} {...STILL_STAGE} />
    </div>,
  );
  await expect.poll(() => document.querySelectorAll('button.map-button').length).toBe(pieces.length);
  const label = document.querySelector(`#${pieceDomId(NEWS_PIECE)}`) as HTMLElement;
  const drawing = (document.querySelector('.map-stage__svg') as Element).getBoundingClientRect();
  const model = layoutMap(session.world, pieces, { width }).labels[NEWS_PIECE].width;
  return { label, drawing, model };
}

async function showTheCutLabelOnThePhone() {
  await page.viewport(PHONE.width, PHONE.height);
  await showTheScreen(<IncidentScreen incidents={[incident]} incidentId={incident.id} nextId={null} onFinish={() => undefined} />);
  const label = page.getByRole('button', { name: FULL_NAME, exact: true });
  await expect.element(label).toBeVisible();
  return label;
}

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the long name of a locked server on the narrowest map', () => {
  it('at 360 px is drawn cut, with its lock, inside a map as wide as its screen, and its button is as wide as the model says', { timeout: SLOW_TEST_MS }, async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const { label, drawing, model } = await drawTheMapIn(PHONE.width);
    expect(drawing.width, 'the drawing is as wide as the screen').toBe(PHONE.width);
    expect(label.querySelector('[aria-hidden="true"] .name-tag')?.textContent).toBe(CUT_NAME);
    expect(label.querySelector('.map-button__lock svg'), 'the lock stays').not.toBeNull();
    expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(model + SUBPIXEL_PX);
    expect(label.getBoundingClientRect().width).toBeGreaterThanOrEqual(model - MODEL_SLACK_PX);
    const stage = document.querySelector('.map-stage') as HTMLElement;
    expect(stage.scrollWidth, 'the stage has nothing to scroll sideways').toBeLessThanOrEqual(stage.clientWidth);
    for (const button of document.querySelectorAll('button.map-button')) {
      const { left, right } = button.getBoundingClientRect();
      expect(left, button.id).toBeGreaterThanOrEqual(drawing.left);
      expect(right, button.id).toBeLessThanOrEqual(drawing.right);
    }
  });

  it('at 390 px is drawn whole, in a map as wide as its screen', { timeout: SLOW_TEST_MS }, async () => {
    await page.viewport(WIDER_PHONE.width, WIDER_PHONE.height);
    const { label, drawing } = await drawTheMapIn(WIDER_PHONE.width);
    expect(drawing.width).toBe(WIDER_PHONE.width);
    expect(label.querySelector('[aria-hidden="true"] .name-tag')).toBeNull();
    expect(label.querySelector('.name-tag')?.textContent).toBe(NEWS_SERVER);
  });
});

describe('the incident screen at 360 px', () => {
  it('reads the cut label by its whole name and shows the whole name in the inspection box on hover', { timeout: SLOW_TEST_MS }, async () => {
    const label = await showTheCutLabelOnThePhone();
    expect(label.element().querySelector('[aria-hidden="true"] .name-tag')?.textContent).toBe(CUT_NAME);
    await userEvent.hover(label);
    await expect.element(page.getByRole('region', { name: NEWS_SERVER, exact: true })).toBeVisible();
  });

  it('shows the whole name in the inspection box on focus', { timeout: SLOW_TEST_MS }, async () => {
    const label = await showTheCutLabelOnThePhone();
    label.element().focus();
    await expect.element(page.getByRole('region', { name: NEWS_SERVER, exact: true })).toBeVisible();
  });
});
