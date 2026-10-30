import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { ALMANAC_TEXT, CAMERA_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { dragFromTo, holdDrag, pieceLabel, showTheScreen, standStill, tapAt, wheelAt, type Point } from '@/testing/browser-play';
import { isReachable } from '@/testing/card-boxes';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const WINDOWS = [{ width: 1280, height: 800 }, { width: 1000, height: 700 }];
const INCIDENT = '01-07';
const LAPTOP = 'tu-laptop';
const MAP = '.incident__map';
const SHEET = '.map-stage__sheet';
const PREVIEW = '.incident__inspection > .card';
const CORNER_PX = 24;
const TAB_STOPS = 60;
const DRAG_PX = 60;
const WHEEL_PX = -150;

const theScreen = () => showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={INCIDENT} nextId={null} onFinish={() => undefined} />);
const theButton = (name: string) => page.getByRole('button', { name, exact: true });
const rectOf = (selector: string) => (document.querySelector(selector) as Element).getBoundingClientRect();
const scale = () => new DOMMatrix(getComputedStyle(document.querySelector(SHEET) as Element).transform).a;
const view = () => getComputedStyle(document.querySelector(SHEET) as Element).transform;
const centerOf = (element: Element): Point => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
};
const aSpotOfTheMap = (): Point => {
  const { left, top } = rectOf(MAP);
  return { x: left + CORNER_PX, y: top + CORNER_PX * 3 };
};

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the camera on the screen of an incident', () => {
  it('Acercar, Alejar and Ajustar stay in the top-right corner of the free gap, Tab and a tap reach them and no panel covers them', async () => {
    for (const size of WINDOWS) {
      await page.viewport(size.width, size.height);
      const shown = await theScreen();
      const where = `${size.width}×${size.height}`;
      const gap = rectOf(MAP);
      const names = [CAMERA_TEXT.zoomIn, CAMERA_TEXT.zoomOut, CAMERA_TEXT.fit];
      const boxes = names.map((name) => theButton(name).element().getBoundingClientRect());
      expect(gap.right - boxes[2].right, `${where}: the last button is at the right edge of the gap`).toBeLessThanOrEqual(CORNER_PX);
      expect(boxes[0].left, `${where}: the three are in the right half of the gap`).toBeGreaterThan(gap.left + gap.width / 2);
      boxes.forEach((box, at) => {
        expect(box.top - gap.top, `${where}, ${names[at]}: at the top edge of the gap`).toBeLessThanOrEqual(CORNER_PX);
        expect(Math.abs(box.top - boxes[0].top), `${where}, ${names[at]}: in one row`).toBeLessThanOrEqual(1);
        if (at > 0) expect(box.left, `${where}, ${names[at]}: after ${names[at - 1]}`).toBeGreaterThanOrEqual(boxes[at - 1].right);
      });
      for (const name of names) expect(isReachable(theButton(name).element()), `${where}, ${name}: in view, with nothing over it`).toBe(true);
      await userEvent.click(pieceLabel(LAPTOP));
      await standStill();
      for (const name of names) expect(isReachable(theButton(name).element()), `${where}, ${name}, with the panel of a piece open`).toBe(true);
      document.body.focus();
      for (let stop = 0; stop < TAB_STOPS && document.activeElement !== theButton(CAMERA_TEXT.zoomIn).element(); stop++) await userEvent.tab();
      expect(document.activeElement, `${where}: Tab reaches Acercar`).toBe(theButton(CAMERA_TEXT.zoomIn).element());
      const before = scale();
      await tapAt(centerOf(theButton(CAMERA_TEXT.zoomIn).element()));
      await expect.poll(scale, { message: `${where}: a tap on Acercar zooms` }).toBeGreaterThan(before);
      shown.unmount();
    }
  });

  it('with the stage under the panels the wheel still zooms around the pointer', async () => {
    await page.viewport(WINDOWS[0].width, WINDOWS[0].height);
    await theScreen();
    await standStill();
    const label = pieceLabel(LAPTOP).element();
    const before = centerOf(label);
    const zoom = scale();
    await wheelAt(before, WHEEL_PX);
    await expect.poll(scale, { message: 'the wheel zooms in' }).toBeGreaterThan(zoom);
    await standStill();
    const after = centerOf(label);
    expect(Math.hypot(after.x - before.x, after.y - before.y), 'the point under the pointer stays where it was').toBeLessThanOrEqual(1);
  });

  it('with a system window open a drag or the wheel does not move the camera', async () => {
    await page.viewport(WINDOWS[0].width, WINDOWS[0].height);
    await theScreen();
    await standStill();
    const fit = view();
    const spot = aSpotOfTheMap();
    await dragFromTo(spot, { x: spot.x + DRAG_PX, y: spot.y });
    await wheelAt(spot, WHEEL_PX);
    await expect.poll(view, { message: 'a drag and the wheel move the camera when no window is open' }).not.toBe(fit);
    await userEvent.click(theButton(CAMERA_TEXT.fit));
    await expect.poll(view).toBe(fit);
    await userEvent.click(page.getByRole('button', { name: ALMANAC_TEXT.open }));
    await expect.element(page.getByRole('dialog')).toBeVisible();
    await standStill();
    await dragFromTo(spot, { x: spot.x + DRAG_PX, y: spot.y });
    await wheelAt(spot, WHEEL_PX);
    await standStill();
    expect(view(), 'with the window open the camera stays where it was').toBe(fit);
  });

  it('the preview of the inspection box does not open during a drag and closes when the camera moves', async () => {
    await page.viewport(WINDOWS[0].width, WINDOWS[0].height);
    await theScreen();
    await standStill();
    const label = pieceLabel(LAPTOP);
    await userEvent.hover(label);
    await expect.poll(() => document.querySelector(PREVIEW), { message: 'hovering a piece previews it' }).not.toBeNull();
    await wheelAt(centerOf(label.element()), WHEEL_PX);
    await expect.poll(() => document.querySelector(PREVIEW), { message: 'the wheel moves the camera and the preview goes' }).toBeNull();

    await userEvent.click(theButton(CAMERA_TEXT.fit));
    await standStill();
    const spot = aSpotOfTheMap();
    const release = await holdDrag(spot, centerOf(label.element()));
    await standStill();
    expect(document.querySelector(PREVIEW), 'no preview opens while the mouse drags the map').toBeNull();
    await release();
    await standStill();
    await userEvent.hover(label);
    await expect.poll(() => document.querySelector(PREVIEW), { message: 'once the mouse lets go, hovering previews again' }).not.toBeNull();
  });
});
