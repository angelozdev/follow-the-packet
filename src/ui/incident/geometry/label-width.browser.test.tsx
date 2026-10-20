import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { pieceViews, startSession, type Session } from '@/game';
import type { PieceView } from '@/game/view/pieces';
import { INCIDENTS, caseWorld } from '@/levels';
import { layoutMap } from '@/scene/layout/map-layout';
import { CELL, LABEL_PAD } from '@/scene/layout/metrics';
import { MapStage } from '@/scene/map-stage';
import { pieceDomId } from '@/scene/overlay/piece-label';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const WIDE = 1500;
const SUBPIXEL_PX = 0.5;
const MODEL_SLACK_PX = 2;
const LONG_RUN = 100;
const FONT_SIZE_PX = 12;
const ADVANCE_EM = 0.6;
const ADVANCE_TOLERANCE_EM = 0.005;
const SLOW_TEST_MS = 120_000;

interface Wear {
  locked: boolean;
  alert: boolean;
}

const WEARS: readonly Wear[] = [
  { locked: false, alert: false },
  { locked: true, alert: false },
  { locked: false, alert: true },
  { locked: true, alert: true },
];

interface Measured extends Wear {
  incident: string;
  id: string;
  lines: number;
  dom: number;
  model: number;
}

function registeredSessions(): { name: string; session: Session }[] {
  return INCIDENTS.flatMap((incident) => {
    const start = startSession(INCIDENTS, incident.id);
    const cases = incident.mechanic === 'diagnose' ? incident.diagnose.cases.map((spec, caseIndex) => ({ name: `${incident.id} case ${caseIndex + 1}`, session: { ...start, caseIndex, world: caseWorld(start.start, spec) } })) : [];
    return [{ name: incident.id, session: start }, ...cases];
  });
}

function wearing({ locked, alert }: Wear, pieces: PieceView[]): PieceView[] {
  return pieces.map((piece) => ({ ...piece, locked, state: alert ? 'intruded' : 'normal' }));
}

function signatureOf(piece: PieceView): string {
  return `${piece.label}|${piece.locked}|${piece.state}`;
}

async function measure(name: string, session: Session, pieces: PieceView[]): Promise<Measured[]> {
  const view = render(
    <div data-testid="box" style={{ width: WIDE, position: 'relative' }}>
      <MapStage world={session.world} pieces={pieces} known={session.known} blockName={null} activePieceId={null} still flows={[]} sent={[]} inspectTrigger={() => ({})} inspectStampsTrigger={() => ({})} onActivate={() => undefined} />
    </div>,
  );
  const box = view.getByTestId('box');
  await expect.poll(() => box.querySelectorAll('button.map-button').length, { message: name }).toBe(pieces.length);
  const layout = layoutMap(session.world, pieces, { width: WIDE });
  const found = pieces.flatMap((piece) => {
    const model = layout.labels[piece.id];
    const label = box.querySelector(`#${pieceDomId(piece.id)}`);
    if (model === undefined || label === null) return [];
    const lines = Number(label.parentElement?.getAttribute('data-lines'));
    return [{ incident: name, id: piece.id, locked: piece.locked, alert: piece.state === 'intruded', lines, dom: label.getBoundingClientRect().width, model: model.width }];
  });
  view.unmount();
  return found;
}

async function measureEveryLabel(): Promise<Measured[]> {
  const seen = new Set<string>();
  const measured: Measured[] = [];
  for (const { name, session } of registeredSessions()) {
    const played = pieceViews(session);
    for (const pieces of [played, ...WEARS.map((wear) => wearing(wear, played))]) {
      const fresh = pieces.filter((piece) => !seen.has(signatureOf(piece)));
      if (fresh.length === 0) continue;
      pieces.forEach((piece) => seen.add(signatureOf(piece)));
      const freshIds = new Set(fresh.map(({ id }) => id));
      measured.push(...(await measure(name, session, pieces)).filter(({ id }) => freshIds.has(id)));
    }
  }
  return measured;
}

describe('the labels of the map in the browser of the tests', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it(
    'the width of every label of every registered incident, those with a lock or an alert included, is never more than the model says and is at most 2 px under it',
    { timeout: SLOW_TEST_MS },
    async () => {
      await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
      const measured = await measureEveryLabel();
      expect(measured.length).toBeGreaterThan(WEARS.length);
      expect(measured.some(({ locked, lines }) => locked && lines === 2), 'a label of two lines with the lock').toBe(true);
      expect(measured.some(({ alert, lines }) => alert && lines === 2), 'a label of two lines with the alert').toBe(true);
      expect(measured.some(({ locked, alert, lines }) => locked && alert && lines === 1), 'a label of one line with both').toBe(true);
      const outside = measured.filter(({ dom, model }) => dom > model + SUBPIXEL_PX || dom < model - MODEL_SLACK_PX).map(({ incident, id, locked, alert, dom, model }) => `${incident} ${id}${locked ? ' locked' : ''}${alert ? ' alert' : ''}: ${dom.toFixed(2)} px drawn, ${model} px in the model`);
      expect(outside).toEqual([]);
    },
  );

  it('the font of the labels of the map advances 0.6 em in the browser of the tests', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const start = startSession(INCIDENTS, INCIDENTS[0].id);
    const [piece] = pieceViews(start);
    const long = { ...piece, label: `[[${'m'.repeat(LONG_RUN)}]]`, locked: false };
    const [{ dom }] = await measure('font', start, [long]);
    const advance = (dom - LABEL_PAD) / LONG_RUN / FONT_SIZE_PX;
    expect(Math.abs(advance - ADVANCE_EM), `${advance} em against ${ADVANCE_EM} em, at most ${ADVANCE_TOLERANCE_EM} em apart`).toBeLessThanOrEqual(ADVANCE_TOLERANCE_EM);
    expect(CELL / FONT_SIZE_PX).toBe(ADVANCE_EM);
  });
});
