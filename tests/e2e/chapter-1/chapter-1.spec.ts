import { expect, test } from '@playwright/test';
import { openTerminal, sendTo } from '@e2e/cards';
import { CHAPTER_1, IP } from './chapter-1-play';
import { FULL_STARS } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';
import { mapBoxes, recordLabels, recordedLabels } from '@e2e/map-boxes';
import type { Box } from '@/testing/map-boxes';
import { CHAPTER_1_DONE, startWithProgress } from '@e2e/saved-progress';
import { CHAPTER_2 } from '@e2e/chapter-2/chapter-2-play';
import { freezeTime, standStill } from '@e2e/still-scene';

const LOCKED = '(bloqueado)';
const FULL_SIZE_LAPTOP_DISTANCE_PX = 99.3;
const SAME_PING_SENDS = 3;
const FLIGHT = 'g.map-flight';
const MAP_SVG = '.map-stage__svg';
const LONGER_THAN_A_TRIP_MS = 20_000;
const WINDOWS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];
function distanceBetweenLaptops(boxes: Box[]): number | undefined {
  const [yours, lucia] = [/^tu-laptop$/, /^laptop-lucia/].map((name) => boxes.find((box) => name.test(box.name.trim())));
  if (yours === undefined || lucia === undefined) return undefined;
  return Math.hypot(lucia.x + lucia.width / 2 - (yours.x + yours.width / 2), lucia.y + lucia.height / 2 - (yours.y + yours.height / 2));
}

function inEachWindow(define: () => void) {
  for (const size of WINDOWS) {
    test.describe(`${size.width}×${size.height}`, () => {
      test.use({ viewport: size });
      define();
    });
  }
}

test('chapter 1 is played from 01-01 to 01-14, each incident opening the next, with 3 stars each', async ({ page }) => {
  test.slow();
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: '1. La oficina' }).click();
  for (const [index, { id, title, play }] of CHAPTER_1.entries()) {
    await expect(page.getByRole('heading', { level: 1, name: title }), id).toBeVisible();
    await play(page);
    const last = index === CHAPTER_1.length - 1;
    await page.getByRole('link', { name: last ? 'Volver al roadmap' : 'Siguiente incidente' }).click();
  }
  for (const { id } of CHAPTER_1) await expect(page.locator(`li[data-level-id="${id}"]`)).toContainText(FULL_STARS);
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(LOCKED);
  await expect(page.getByRole('link', { name: `1. ${CHAPTER_2[0].title}` })).toHaveAttribute('href', `#/level/${CHAPTER_2[0].id}`);
  expect(errors).toEqual([]);
});

test('in 03 the same ping sent three times is one stamp and, on the 2D map, three packets in the air at once, and the first two go when their own trips end', async ({ page }) => {
  await page.clock.install();
  await startWithProgress(page, { '01-02': 1 });
  await page.goto('/#/level/01-03');
  const terminal = await openTerminal(page);
  await standStill(page);
  await freezeTime(page);
  const drawsFlights = (await page.locator(MAP_SVG).count()) > 0;
  for (let send = 1; send <= SAME_PING_SENDS; send += 1) {
    await sendTo(terminal, IP.printer);
    await expect(page.locator(FLIGHT), `after send ${send}`).toHaveCount(drawsFlights ? send : 0);
  }
  await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(1);
  await page.clock.runFor(LONGER_THAN_A_TRIP_MS);
  await expect(page.locator(FLIGHT), 'once every trip is over, only the last send stays').toHaveCount(drawsFlights ? 1 : 0);
  await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(1);
});

inEachWindow(() => {
  test('in 06 and 08 the map is at full size: two laptops of a floor stand as far apart as at any window', async ({ page }) => {
    await startWithProgress(page, CHAPTER_1_DONE);
    for (const id of ['01-06', '01-08']) {
      await page.goto(`/#/level/${id}`);
      await expect(page.getByRole('button', { name: 'tu-laptop', exact: true })).toBeVisible();
      const boxes = await mapBoxes(page);
      const [yours, lucia] = [/^tu-laptop$/, /^laptop-lucia/].map((name) => boxes.find((box) => name.test(box.name.trim())));
      if (yours === undefined || lucia === undefined) throw new Error(`the two laptops are not on the map of ${id}`);
      const apart = Math.hypot(lucia.x + lucia.width / 2 - (yours.x + yours.width / 2), lucia.y + lucia.height / 2 - (yours.y + yours.height / 2));
      expect(apart, id).toBeCloseTo(FULL_SIZE_LAPTOP_DISTANCE_PX, 0);
    }
  });

  test('the labels of the map stand where they belong from the first moment they show', async ({ page }) => {
    await startWithProgress(page, CHAPTER_1_DONE);
    await page.goto('/');
    await recordLabels(page);
    await page.goto('/#/level/01-08');
    await expect.poll(async () => distanceBetweenLaptops(await mapBoxes(page)), 'the labels settle').toBeCloseTo(FULL_SIZE_LAPTOP_DISTANCE_PX, 0);
    const distances = (await recordedLabels(page)).map(distanceBetweenLaptops).filter((distance) => distance !== undefined);
    expect(new Set(distances.map((distance) => distance.toFixed(2))).size, `the distances the laptops stood at: ${distances.map((distance) => distance.toFixed(2)).join(', ')}`).toBe(1);
  });
});
