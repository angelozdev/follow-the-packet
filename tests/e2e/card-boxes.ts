import type { Locator, Page } from '@playwright/test';
import { cardsOutsideTheMap as cardsOutsideTheMapInPage, inspectionBoxOverCards as inspectionBoxOverCardsInPage, isReachable as isReachableInPage } from '@/testing/card-boxes';

const WHEEL_PX = 300;
const MAX_TURNS = 40;
const SIDE_PANEL = '.incident__side';

/** Returns one line per card of the map that sticks out of it above or below, which cuts its band or its foot off, and per card beside its piece that rises under the title bar that floats over the top of the map. */
export async function cardsOutsideTheMap(page: Page): Promise<string[]> {
  return page.evaluate(cardsOutsideTheMapInPage);
}

/** Returns whether the inspection box is on show (drawn, not held back) and one line per card of the map that it covers. */
export async function inspectionBoxOverCards(page: Page): Promise<{ shown: boolean; covered: string[] }> {
  return page.evaluate(inspectionBoxOverCardsInPage);
}

/** True when the element lies wholly in the window and is what a click lands on at its middle and at a quarter of its width from each side, so nothing covers it and no ancestor cuts it off. */
export async function isReachable(page: Page, target: Locator): Promise<boolean> {
  if ((await target.boundingBox()) === null) return false;
  return target.evaluate(isReachableInPage);
}

async function isInside(target: Locator, scroller: Locator): Promise<boolean> {
  const [box, frame] = await Promise.all([target.boundingBox(), scroller.boundingBox()]);
  if (box === null || frame === null) return false;
  const endsInside = box.y + box.height <= frame.y + frame.height + 1;
  return endsInside && (box.y >= frame.y - 1 || box.height > frame.height);
}

interface WheelOptions {
  within?: Locator;
  wheelPx?: number;
}

/** Turns the mouse wheel over the side panel, or over the scroller `within` when one is given, until the element can be reached, and, with a scroller, lies wholly inside it (an element taller than the scroller, such as the last field of an inspection box that the marks of the map cap, never can: its end in view is what counts); and returns whether it can. The wheel alone does it: nothing scrolls the element into view for the player. Each turn moves `wheelPx` pixels: a scroller that the page itself carries away needs turns short enough for the mouse to stay over it. */
export async function reachWithWheel(page: Page, target: Locator, { within, wheelPx = WHEEL_PX }: WheelOptions = {}): Promise<boolean> {
  const [panel, viewport] = await Promise.all([(within ?? page.locator(SIDE_PANEL)).boundingBox(), page.viewportSize()]);
  if (panel === null || viewport === null) throw new Error('the scroller is not on the page');
  const readable = async () => (await isReachable(page, target)) && (within === undefined || (await isInside(target, within)));
  const shownTop = Math.max(panel.y, 0);
  const shownBottom = Math.min(panel.y + panel.height, viewport.height);
  await page.mouse.move(panel.x + panel.width / 2, (shownTop + shownBottom) / 2);
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    if (await readable()) return true;
    await page.mouse.wheel(0, wheelPx);
    await page.evaluate(() => new Promise<void>((settled) => requestAnimationFrame(() => requestAnimationFrame(() => settled()))));
  }
  return readable();
}
