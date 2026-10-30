import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { CAMERA_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { clickAt, dragFromTo, drawWithoutAnimations, emulateReducedMotion, holdDrag, moveTheMouseAway, moveTheMouseTo, pieceLabel, showTheScreen, standStill, type Point } from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const WINDOW = { width: 1280, height: 720 };
const INCIDENT = '02-06';
const ROUTER = 'router-oficina';
const LAPTOP = 'tu-laptop';
const GAP = '.incident__map';
const SHEET = '.map-stage__sheet';
const PREVIEW = '.incident__inspection > .card';
const STRADDLE_PX = 30;
const CORNER_PX = 24;
const DRAG_PX = 60;
const EPSILON = 1;
const SIN_ANIMACIONES = 'Sin animaciones';
const REDUCED_MOTION = 'prefers-reduced-motion: reduce';

const theScreen = async () => {
  const shown = await showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={INCIDENT} nextId={null} onFinish={() => undefined} />);
  await standStill();
  return shown;
};
const theButton = (name: string) => page.getByRole('button', { name, exact: true });
const sheet = () => document.querySelector(SHEET) as HTMLElement;
const view = () => getComputedStyle(sheet()).transform;
const rectOf = (selector: string) => (document.querySelector(selector) as Element).getBoundingClientRect();
const centerOf = (rect: DOMRect): Point => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
const isInTheGap = (element: Element) => {
  const [gap, own] = [rectOf(GAP), element.getBoundingClientRect()];
  return [own.left - gap.left, gap.right - own.right, own.top - gap.top, gap.bottom - own.bottom].every((room) => room >= -EPSILON);
};
const hasNoTransition = () => getComputedStyle(sheet()).transitionDuration.split(',').every((duration) => parseFloat(duration) === 0);

function watchTransitions(): Animation[] {
  const [own, runs] = [sheet(), [] as Animation[]];
  own.addEventListener('transitionrun', (event) => {
    if (event.target === own) runs.push(...own.getAnimations());
  });
  return runs;
}

async function zoomInThenFit(): Promise<{ zoomed: string; fit: string }> {
  const fit = view();
  await userEvent.click(theButton(CAMERA_TEXT.zoomIn));
  await standStill();
  const zoomed = view();
  expect(zoomed, 'Acercar changed the view').not.toBe(fit);
  return { zoomed, fit };
}

async function followTheGlide(runs: Animation[], count: number, before: string, what: string): Promise<void> {
  await expect.poll(() => runs.length, { message: `${what}: the sheet starts a transition` }).toBe(count);
  const glide = runs[count - 1];
  glide.pause();
  glide.currentTime = Number(glide.effect?.getComputedTiming().duration) / 2;
  const halfway = view();
  glide.finish();
  await standStill();
  expect(halfway, `${what}: halfway the view is not where it was`).not.toBe(before);
  expect(halfway, `${what}: and not where it ends`).not.toBe(view());
}

async function slideUnderThePanel(label: Element): Promise<DOMRect> {
  const gap = rectOf(GAP);
  const [middle, by] = [centerOf(gap), gap.right - STRADDLE_PX - label.getBoundingClientRect().left];
  await dragFromTo({ x: middle.x - by / 2, y: middle.y }, { x: middle.x + by / 2, y: middle.y });
  await standStill();
  expect(isInTheGap(label), 'the label stands half under the panel').toBe(false);
  return label.getBoundingClientRect();
}

const clickTheVisiblePart = ({ left, top, height }: DOMRect) => clickAt({ x: left + STRADDLE_PX / 2, y: top + height / 2 });

afterEach(async () => {
  await emulateReducedMotion(false);
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the camera glides only while animations are on', () => {
  it('with animations on, Ajustar and bringing a piece into view glide', async () => {
    await page.viewport(WINDOW.width, WINDOW.height);
    await theScreen();
    const runs = watchTransitions();
    const { zoomed, fit } = await zoomInThenFit();
    await userEvent.click(theButton(CAMERA_TEXT.fit));
    await followTheGlide(runs, 1, zoomed, 'Ajustar');
    expect(view(), 'Ajustar ends on the fit').toBe(fit);

    const label = pieceLabel(ROUTER).element();
    const box = await slideUnderThePanel(label);
    const slid = view();
    await clickTheVisiblePart(box);
    await followTheGlide(runs, 2, slid, 'choosing a piece under the panel');
    expect(isInTheGap(label), 'and the piece ends in the free gap').toBe(true);
  });

  it('with Sin animaciones and with prefers-reduced-motion: reduce the camera jumps, with no transition in the computed style', async () => {
    await page.viewport(WINDOW.width, WINDOW.height);
    for (const mode of [SIN_ANIMACIONES, REDUCED_MOTION]) {
      await emulateReducedMotion(mode === REDUCED_MOTION);
      const shown = await theScreen();
      if (mode === SIN_ANIMACIONES) await drawWithoutAnimations();
      const runs = watchTransitions();
      const { fit } = await zoomInThenFit();
      await userEvent.click(theButton(CAMERA_TEXT.fit));
      expect(view(), `${mode}: Ajustar jumps at once`).toBe(fit);

      const label = pieceLabel(ROUTER).element();
      await clickTheVisiblePart(await slideUnderThePanel(label));
      await expect.poll(() => isInTheGap(label), { message: `${mode}: the chosen piece is brought into the free gap` }).toBe(true);
      await standStill();
      expect(runs, `${mode}: no transition started`).toHaveLength(0);
      expect(hasNoTransition(), `${mode}: the computed style has no transition`).toBe(true);
      shown.unmount();
    }
  });

  it('a drag follows the pointer with no transition even with animations on', async () => {
    await page.viewport(WINDOW.width, WINDOW.height);
    await theScreen();
    const runs = watchTransitions();
    const { zoomed } = await zoomInThenFit();
    await userEvent.click(theButton(CAMERA_TEXT.fit));
    await followTheGlide(runs, 1, zoomed, 'Ajustar');

    const label = pieceLabel(LAPTOP).element();
    const [gap, start] = [rectOf(GAP), centerOf(label.getBoundingClientRect())];
    const spot = { x: gap.left + CORNER_PX, y: gap.top + CORNER_PX * 3 };
    const release = await holdDrag(spot, { x: spot.x + DRAG_PX, y: spot.y });
    await expect.poll(() => centerOf(label.getBoundingClientRect()).x - start.x, { message: 'the drawing follows the pointer' }).toBeCloseTo(DRAG_PX, 0);
    expect(hasNoTransition(), 'the computed style has no transition while the mouse drags').toBe(true);
    expect(sheet().getAnimations(), 'and nothing glides').toHaveLength(0);
    expect(runs, 'and the drag started no transition').toHaveLength(1);
    await release();
  });

  it('the preview does not open while the camera glides', async () => {
    await page.viewport(WINDOW.width, WINDOW.height);
    await theScreen();
    const runs = watchTransitions();
    const label = pieceLabel(LAPTOP).element();
    const gap = rectOf(GAP);
    const spot = { x: gap.left + CORNER_PX, y: gap.top + CORNER_PX * 3 };
    await dragFromTo(spot, { x: spot.x + DRAG_PX, y: spot.y });
    await standStill();
    await userEvent.click(theButton(CAMERA_TEXT.fit));
    await expect.poll(() => runs.length, { message: 'Ajustar starts a transition' }).toBe(1);
    runs[0].pause();
    expect(isInTheGap(label), 'the piece is in the free gap while the camera glides').toBe(true);

    await moveTheMouseTo(centerOf(label.getBoundingClientRect()));
    await standStill();
    expect(document.querySelector(PREVIEW), 'hovering a piece while the camera glides opens no preview').toBeNull();

    runs[0].finish();
    await standStill();
    await moveTheMouseAway();
    await moveTheMouseTo(centerOf(label.getBoundingClientRect()));
    await expect.poll(() => document.querySelector(PREVIEW), { message: 'once the glide is over, hovering previews again' }).not.toBeNull();
  });
});
