import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { ALMANAC_TEXT, CAMERA_TEXT, SCREEN_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { dragFromTo, holdDrag, moveFingers, pieceLabel, showTheScreen, standStill, tapAt, wheelAt, type Point } from '@/testing/browser-play';
import { isReachable } from '@/testing/card-boxes';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const WINDOWS = [{ width: 1280, height: 800 }, { width: 1000, height: 700 }];
const PHONE = { width: 390, height: 844 };
const INCIDENT = '01-07';
const LAPTOP = 'tu-laptop';
const MAP = '.incident__map';
const SHEET = '.map-stage__sheet';
const PREVIEW = '.incident__inspection > .card';
const CORNER_PX = 24;
const TAB_STOPS = 60;
const DRAG_PX = 60;
const WHEEL_PX = -150;
const ONE_PIXEL = 1;
const FINGER_PX = { x: 60, y: 30 };
const HALF_SPAN_PX = { near: 40, far: 80 };
const SWIPE_PX = 150;
const ARROWS = [
  { key: 'ArrowRight', axis: 'x', sign: -1 },
  { key: 'ArrowLeft', axis: 'x', sign: 1 },
  { key: 'ArrowDown', axis: 'y', sign: -1 },
  { key: 'ArrowUp', axis: 'y', sign: 1 },
] as const;
const CAMERA_KEYS = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', '+', '-'];

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

const STAGE = '.map-stage';
const BAR = '.incident__status';
const apart = (middle: Point, half: number): Point[] => [{ x: middle.x - half, y: middle.y }, { x: middle.x + half, y: middle.y }];
const offsetFrom = (point: Point, element: Element): Point => ({ x: centerOf(element).x - point.x, y: centerOf(element).y - point.y });

function expectScaledAround(point: Point, element: Element, before: Point, ratio: number, where: string) {
  const after = offsetFrom(point, element);
  expect(Math.abs(after.x - ratio * before.x), `${where}: sideways`).toBeLessThanOrEqual(ONE_PIXEL);
  expect(Math.abs(after.y - ratio * before.y), `${where}: up and down`).toBeLessThanOrEqual(ONE_PIXEL);
}

afterEach(async () => {
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  window.scrollTo(0, 0);
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

  it('with the focus on a piece the arrows pan the map and + and - zoom it around the center of the free gap, and Tab leaves the map', async () => {
    await page.viewport(WINDOWS[0].width, WINDOWS[0].height);
    await theScreen();
    await standStill();
    const label = pieceLabel(LAPTOP).element();
    label.focus();
    await standStill();
    for (const { key, axis, sign } of ARROWS) {
      const before = centerOf(label);
      await userEvent.keyboard(`{${key}}`);
      await standStill();
      const after = centerOf(label);
      const across = axis === 'x' ? 'y' : 'x';
      expect((after[axis] - before[axis]) * sign, `${key}: the map pans along its axis`).toBeGreaterThan(ONE_PIXEL);
      expect(Math.abs(after[across] - before[across]), `${key}: and not across it`).toBeLessThanOrEqual(ONE_PIXEL);
    }
    const middle = centerOf(document.querySelector(MAP) as Element);
    for (const key of ['+', '-']) {
      const [before, zoom] = [offsetFrom(middle, label), scale()];
      await userEvent.keyboard(key);
      await expect.poll(scale, { message: `${key} zooms` }).not.toBeCloseTo(zoom, 4);
      await standStill();
      expect(key === '+' ? scale() > zoom : scale() < zoom, `${key} zooms the right way`).toBe(true);
      expectScaledAround(middle, label, before, scale() / zoom, `${key}: the center of the gap stays`);
    }
    const stage = document.querySelector(STAGE) as Element;
    for (let stop = 0; stop < TAB_STOPS && stage.contains(document.activeElement); stop++) await userEvent.tab();
    expect(stage.contains(document.activeElement), 'Tab leaves the map').toBe(false);
    expect(document.activeElement, 'and lands on something').not.toBe(document.body);
  });

  it('the keys of the camera do nothing with the focus outside the map', async () => {
    await page.viewport(WINDOWS[0].width, WINDOWS[0].height);
    await theScreen();
    await standStill();
    const fit = view();
    const outside = [theButton(CAMERA_TEXT.fit).element(), page.getByLabelText(SCREEN_TEXT.motion).element(), document.body];
    for (const element of outside) {
      element.focus();
      for (const key of CAMERA_KEYS) {
        await userEvent.keyboard(key.length > 1 ? `{${key}}` : key);
        await standStill();
        expect(view(), `${key} with the focus on ${element.tagName.toLowerCase()}`).toBe(fit);
      }
    }
  });

  it('with touch above 900 px one finger pans the map and two fingers zoom it', async () => {
    await page.viewport(WINDOWS[0].width, WINDOWS[0].height);
    await theScreen();
    await standStill();
    const label = pieceLabel(LAPTOP).element();
    const [spot, start] = [aSpotOfTheMap(), centerOf(label)];
    await moveFingers([spot], [{ x: spot.x + FINGER_PX.x, y: spot.y + FINGER_PX.y }]);
    await expect.poll(() => centerOf(label).x - start.x, { message: 'one finger pans sideways as far as it moves' }).toBeCloseTo(FINGER_PX.x, 0);
    expect(centerOf(label).y - start.y, 'and up and down').toBeCloseTo(FINGER_PX.y, 0);
    await standStill();
    const middle = centerOf(document.querySelector(MAP) as Element);
    for (const [from, to] of [[HALF_SPAN_PX.near, HALF_SPAN_PX.far], [HALF_SPAN_PX.far, HALF_SPAN_PX.near]]) {
      const [before, zoom] = [offsetFrom(middle, label), scale()];
      await moveFingers(apart(middle, from), apart(middle, to));
      await expect.poll(scale, { message: 'two fingers zoom' }).not.toBeCloseTo(zoom, 4);
      await standStill();
      expect(to > from ? scale() > zoom : scale() < zoom, 'spreading zooms in and pinching zooms out').toBe(true);
      expectScaledAround(middle, label, before, scale() / zoom, 'the point between the fingers stays under them');
    }
    expect(window.visualViewport?.scale ?? 1, 'the page itself is not zoomed').toBe(1);
  });

  it('at 390×844 one finger on the map scrolls the page and two fingers pan and zoom the map', async () => {
    await page.viewport(PHONE.width, PHONE.height);
    await theScreen();
    await standStill();
    const map = document.querySelector(MAP) as Element;
    map.scrollIntoView({ block: 'start' });
    await standStill();
    const label = pieceLabel(LAPTOP).element();
    const [fit, scrolled] = [view(), window.scrollY];
    const spot = () => {
      const { left, top, bottom, width } = rectOf(MAP);
      const [seenTop, seenBottom] = [Math.max(top, 0), Math.min(bottom, rectOf(BAR).top)];
      return { x: left + width / 2, y: (seenTop + seenBottom) / 2 };
    };
    await moveFingers([spot()], [{ x: spot().x, y: spot().y - SWIPE_PX }]);
    await expect.poll(() => window.scrollY, { message: 'one finger scrolls the page' }).toBeGreaterThan(scrolled);
    await standStill();
    expect(view(), 'and the map stays where it was').toBe(fit);
    const [higher, before] = [window.scrollY, centerOf(label)];
    const middle = spot();
    await moveFingers(apart(middle, HALF_SPAN_PX.near), apart({ x: middle.x - FINGER_PX.x, y: middle.y + FINGER_PX.y }, HALF_SPAN_PX.near));
    await expect.poll(() => centerOf(label).x - before.x, { message: 'two fingers pan the map sideways as far as they move' }).toBeCloseTo(-FINGER_PX.x, 0);
    expect(centerOf(label).y - before.y, 'and up and down').toBeCloseTo(FINGER_PX.y, 0);
    await standStill();
    const [apartBefore, zoom] = [offsetFrom(middle, label), scale()];
    await moveFingers(apart(middle, HALF_SPAN_PX.near), apart(middle, HALF_SPAN_PX.far));
    await expect.poll(scale, { message: 'two fingers zoom the map' }).toBeGreaterThan(zoom);
    await standStill();
    expectScaledAround(middle, label, apartBefore, scale() / zoom, 'the point between the fingers stays under them');
    expect(window.scrollY, 'the page did not scroll').toBe(higher);
    expect(window.visualViewport?.scale ?? 1, 'nor zoom').toBe(1);
  });
});
