import { expect, test, type Locator, type Page } from '@playwright/test';
import { CHAPTER_2_DONE, startWithProgress } from './saved-progress';

const PHONE = { width: 390, height: 844 };
const LEVELS = ['01-01', '01-08', '02-04', '04-01'];
const DRAWING = '.incident__map canvas, .incident__map .map-stage__svg';

async function widthOf(element: Locator): Promise<number> {
  const box = await element.boundingBox();
  if (box === null) throw new Error('The element has no box');
  return box.width;
}

async function overflowOf(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

test('at 390 px the map is as wide as its container and the page does not scroll sideways', async ({ page }) => {
  await startWithProgress(page, CHAPTER_2_DONE);
  await page.setViewportSize(PHONE);
  for (const level of LEVELS) {
    await page.goto(`/#/level/${level}`);
    const drawing = page.locator(DRAWING);
    await expect(drawing).toHaveCount(1);
    await expect(drawing).toBeVisible();
    const container = await widthOf(page.locator('.incident__map'));
    expect(container).toBe(PHONE.width);
    await expect.poll(() => widthOf(drawing)).toBe(container);
    expect(await widthOf(page.locator('.html-layer'))).toBe(container);
    expect(await overflowOf(page)).toBe(0);
  }
});
