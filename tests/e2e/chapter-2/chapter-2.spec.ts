import { expect, test, type Locator, type Page } from '@playwright/test';
import { confirm, openTerminal, sendMessage } from '@e2e/cards';
import { FULL_STARS } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';
import { isInside, mapArea, packetBoxes, pairsThatOverlap } from '@e2e/map-boxes';
import { reloadWithProgress, startWithProgress } from '@e2e/saved-progress';
import { standStill } from '@e2e/still-scene';
import { IP } from '@e2e/chapter-1/chapter-1-play';
import { ANDRES, BLOCK, CHAPTER_2, INSIDE_THE_BLOCK, LUCIA, NC_TO_THE_APP, NC_TO_THE_CLOSED_PORT, NC_TO_THE_DATABASE, OUTSIDE_THE_BLOCK, PRINTER, YOUR_LAPTOP, classify, sendNc } from './chapter-2-play';

const LOCKED = '(bloqueado)';
const [ONE_MACHINE] = CHAPTER_2;
const FIRST_LINK = `1. ${ONE_MACHINE.title}`;
const OPENING = CHAPTER_2[1];
const SECOND_LINK = `2. ${OPENING.title}`;
const REFUSED_OR_SILENT = CHAPTER_2[2];
const THIRD_LINK = `3. ${REFUSED_OR_SILENT.title}`;
const IN_MY_BLOCK = CHAPTER_2[3];
const FOURTH_LINK = `4. ${IN_MY_BLOCK.title}`;
const WHOLE_RULE = CHAPTER_2[4];
const FIFTH_LINK = `5. ${WHOLE_RULE.title}`;
const NAME_OF_THE_BLOCK = '.packet-tag';
const HALF_A_PIXEL = 0;
const TAG_OF_THE_APP = 'paquete al puerto 3000';
const TAG_OF_THE_DATABASE = 'paquete al puerto 5432';
const STAMP_OF_THE_APP = /^Paquete: paquete al puerto 3000 de tu-laptop a laptop-lucia\. Llegó\.$/;
const WINDOWS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];
const STAMP_OF_THE_DATABASE = /^Paquete: paquete al puerto 5432 de tu-laptop a laptop-lucia\. Llegó\.$/;
const TAG_OF_THE_FIRST_CONNECTION = 'TCP 51514 → 3000';
const TAG_OF_THE_SECOND_CONNECTION = 'TCP 51515 → 5432';
const STAMP_OF_THE_FIRST_CONNECTION = /^Paquete: TCP 51514 → 3000 de tu-laptop a laptop-lucia\. Llegó\.$/;
const STAMP_OF_THE_SECOND_CONNECTION = /^Paquete: TCP 51515 → 5432 de tu-laptop a laptop-lucia\. Llegó\.$/;
const STAMP_OF_THE_REFUSAL = /^Paquete: TCP 51514 → 3306 de tu-laptop a laptop-lucia\. Llegó\.$/;
const STAMP_OF_THE_SILENCE = /^Paquete: TCP 51515 → 3000 de tu-laptop a laptop-marta\. Bloqueado\.$/;
const STAMP_OF_THE_WRONG_ADDRESS = /^Paquete: TCP 51516 → 3000 de tu-laptop a laptop-lucia\. Llegó\.$/;
const STAMP_OF_HER_OWN_APP = /^Paquete: TCP 51514 → 3000 de laptop-lucia a 127\.0\.0\.1\. Llegó\.$/;
const TAGS_OF_THE_FOUR_TESTS = ['TCP 51514 → 3306', 'TCP 51515 → 3000', 'TCP 51516 → 3000', 'TCP 51514 → 3000'];
const PROGRESS_BEFORE_03 = { '01-14': 1, [ONE_MACHINE.id]: 1, [OPENING.id]: 1 };
const PROGRESS_BEFORE_04 = { ...PROGRESS_BEFORE_03, [REFUSED_OR_SILENT.id]: 1 };
const PROGRESS_BEFORE_05 = { ...PROGRESS_BEFORE_04, [IN_MY_BLOCK.id]: 1 };

/** Expects no box of the still map (piece labels, floor names, stamps and packet labels) to overlap another, and every one to lie inside the area of the map. */
async function expectClear(page: Page): Promise<void> {
  const boxes = await packetBoxes(page);
  const area = await mapArea(page);
  expect(pairsThatOverlap(boxes)).toEqual([]);
  expect(boxes.filter((box) => !isInside(area, box)).map((box) => box.name)).toEqual([]);
}

test('chapter 2 opens at 02-01 once 01-14 has a star and 04-01 stays closed', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, { '01-13': 3 });
  await page.goto('/');
  await expect(page.locator(`li[data-level-id="${ONE_MACHINE.id}"]`)).toContainText(LOCKED);
  await reloadWithProgress(page, { '01-14': 1 });
  await expect(page.getByRole('link', { name: FIRST_LINK })).toHaveAttribute('href', `#/level/${ONE_MACHINE.id}`);
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(LOCKED);
  expect(errors).toEqual([]);
});

test('02-01 is played with the mouse from the roadmap and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, { '01-14': 1 });
  await page.goto('/');
  await page.getByRole('link', { name: FIRST_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: ONE_MACHINE.title })).toBeVisible();
  await ONE_MACHINE.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${ONE_MACHINE.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-02 is played with the mouse after 02-01 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, { '01-14': 1, [ONE_MACHINE.id]: 1 });
  await page.goto('/');
  await page.getByRole('link', { name: SECOND_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: OPENING.title })).toBeVisible();
  await OPENING.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${OPENING.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-03 is played with the mouse after 02-02 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_03);
  await page.goto('/');
  await page.getByRole('link', { name: THIRD_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: REFUSED_OR_SILENT.title })).toBeVisible();
  await REFUSED_OR_SILENT.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${REFUSED_OR_SILENT.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-04 is played with the mouse after 02-03 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_04);
  await page.goto('/');
  await page.getByRole('link', { name: FOURTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: IN_MY_BLOCK.title })).toBeVisible();
  await IN_MY_BLOCK.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${IN_MY_BLOCK.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-05 is played with the mouse after 02-04 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_05);
  await page.goto('/');
  await page.getByRole('link', { name: FIFTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: WHOLE_RULE.title })).toBeVisible();
  await WHOLE_RULE.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${WHOLE_RULE.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

/** Returns the middle of the box of a locator on the screen. */
async function middleOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error('the element is not on the page');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Sends the four tests of 02-03 after the app listens on every IP, closing each terminal: from your laptop the closed port, the silence of laptop-marta and the app of laptop-lucia, and from laptop-lucia herself the app on 127.0.0.1. */
async function sendTheFourTests(page: Page) {
  const yours = await openTerminal(page);
  await sendNc(yours, IP.lucia, NC_TO_THE_CLOSED_PORT);
  await sendNc(yours, IP.marta, NC_TO_THE_APP);
  await sendNc(yours, IP.lucia, NC_TO_THE_APP);
  await confirm(yours);
  await expect(yours).toBeHidden();
  const hers = await openTerminal(page, LUCIA);
  await sendNc(hers, IP.loopback, NC_TO_THE_APP);
  await confirm(hers);
  await expect(hers).toBeHidden();
  await expect(page.getByRole('button', { name: STAMP_OF_HER_OWN_APP })).toBeVisible();
}

test.describe('Sin animaciones', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('in 02-01 the packet of an nc wears the port it goes to on the map, and the ping wears no label', async ({ page }) => {
    await startWithProgress(page, { '01-14': 1 });
    await page.goto(`/#/level/${ONE_MACHINE.id}`);
    const terminal = await openTerminal(page);
    await sendMessage(terminal, 'ping');
    await sendMessage(terminal, NC_TO_THE_APP);
    await confirm(terminal);
    await expect(terminal).toBeHidden();
    await expect(page.getByRole('button', { name: STAMP_OF_THE_APP })).toBeVisible();
    await standStill(page);
    await expect(page.locator('.packet-tag')).toHaveText([TAG_OF_THE_APP]);
    await sendMessage(await openTerminal(page), NC_TO_THE_DATABASE);
    await expect(page.getByRole('button', { name: STAMP_OF_THE_DATABASE })).toBeVisible();
    await standStill(page);
    await expect(page.locator('.packet-tag')).toHaveText([TAG_OF_THE_APP, TAG_OF_THE_DATABASE]);
  });

  test('in 02-02 the packet of an nc wears TCP and both ports on the map, and the second connection leaves from the next port', async ({ page }) => {
    await startWithProgress(page, { '01-14': 1, [ONE_MACHINE.id]: 1 });
    await page.goto(`/#/level/${OPENING.id}`);
    const first = await openTerminal(page);
    await sendMessage(first, NC_TO_THE_APP);
    await confirm(first);
    await expect(first).toBeHidden();
    await expect(page.getByRole('button', { name: STAMP_OF_THE_FIRST_CONNECTION })).toBeVisible();
    await standStill(page);
    await expect(page.locator('.packet-tag')).toHaveText([TAG_OF_THE_FIRST_CONNECTION]);
    await sendMessage(await openTerminal(page), NC_TO_THE_DATABASE);
    await expect(page.getByRole('button', { name: STAMP_OF_THE_SECOND_CONNECTION })).toBeVisible();
    await standStill(page);
    await expect(page.locator('.packet-tag')).toHaveText([TAG_OF_THE_FIRST_CONNECTION, TAG_OF_THE_SECOND_CONNECTION]);
  });

  test('in 02-04 placing a device inside the block draws it inside the outline and moving it out takes it out', async ({ page }) => {
    await startWithProgress(page, PROGRESS_BEFORE_04);
    await page.goto(`/#/level/${IN_MY_BLOCK.id}`);
    await standStill(page);
    const piece = (name: string) => page.getByRole('button', { name: new RegExp(`^${name}(?:\\s+con candado)?$`) });
    const [you, printer, andres] = await Promise.all([YOUR_LAPTOP, PRINTER, ANDRES].map((name) => middleOf(piece(name))));
    const name = page.locator(NAME_OF_THE_BLOCK);
    await expect(name).toHaveText(BLOCK);
    const home = await middleOf(name);
    const expectNameMovedBy = async (to: { x: number; y: number }) => {
      await standStill(page);
      const now = await middleOf(name);
      expect(now.x - home.x).toBeCloseTo(to.x - you.x, HALF_A_PIXEL);
      expect(now.y - home.y).toBeCloseTo(to.y - you.y, HALF_A_PIXEL);
    };
    await expectNameMovedBy(you);
    await classify(page, PRINTER, INSIDE_THE_BLOCK);
    await expectNameMovedBy(printer);
    await classify(page, ANDRES, INSIDE_THE_BLOCK);
    await expectNameMovedBy(andres);
    await classify(page, ANDRES, OUTSIDE_THE_BLOCK);
    await expectNameMovedBy(printer);
    await classify(page, PRINTER, OUTSIDE_THE_BLOCK);
    await expectNameMovedBy(you);
    await expect(name).toHaveCount(1);
  });

  test('in 02-03 a refusal leaves the stamp Llegó and a silence leaves Bloqueado, and the four tests wear TCP and both ports on the map', async ({ page }) => {
    await startWithProgress(page, PROGRESS_BEFORE_03);
    await page.goto(`/#/level/${REFUSED_OR_SILENT.id}`);
    await sendTheFourTests(page);
    await expect(page.getByRole('button', { name: STAMP_OF_THE_REFUSAL })).toBeVisible();
    await expect(page.getByRole('button', { name: STAMP_OF_THE_SILENCE })).toBeVisible();
    await expect(page.getByRole('button', { name: STAMP_OF_THE_WRONG_ADDRESS })).toBeVisible();
    await standStill(page);
    await expect(page.locator('.packet-tag')).toHaveText(TAGS_OF_THE_FOUR_TESTS);
  });

  for (const size of WINDOWS) {
    test.describe(`${size.width}x${size.height}`, () => {
      test.use({ viewport: size });

      test('in 02-01 no piece label, floor name, stamp or packet label of the still map overlaps another', async ({ page }) => {
        await startWithProgress(page, { '01-14': 1 });
        await page.goto(`/#/level/${ONE_MACHINE.id}`);
        const first = await openTerminal(page);
        await sendMessage(first, 'ping');
        await sendMessage(first, NC_TO_THE_APP);
        await confirm(first);
        await expect(first).toBeHidden();
        await expect(page.getByRole('button', { name: STAMP_OF_THE_APP })).toBeVisible();
        await standStill(page);
        await expect(page.locator('.packet-tag')).toHaveCount(1);
        await expectClear(page);
        const second = await openTerminal(page);
        await sendMessage(second, NC_TO_THE_DATABASE);
        await confirm(second);
        await expect(second).toBeHidden();
        await expect(page.getByRole('button', { name: STAMP_OF_THE_DATABASE })).toBeVisible();
        await standStill(page);
        await expect(page.locator('.packet-tag')).toHaveCount(2);
        await expectClear(page);
      });

      test('in 02-04 no piece label, floor name or name of the outline of the still map overlaps another, with only your laptop inside, with the printer too and with laptop-andres too', async ({ page }) => {
        await startWithProgress(page, PROGRESS_BEFORE_04);
        await page.goto(`/#/level/${IN_MY_BLOCK.id}`);
        await standStill(page);
        await expect(page.locator(NAME_OF_THE_BLOCK)).toHaveText(BLOCK);
        await expectClear(page);
        await classify(page, PRINTER, INSIDE_THE_BLOCK);
        await standStill(page);
        await expectClear(page);
        await classify(page, ANDRES, INSIDE_THE_BLOCK);
        await standStill(page);
        await expectClear(page);
      });

      test('in 02-02 no piece label, floor name, stamp or packet label of the still map overlaps another once the labels say TCP and both ports', async ({ page }) => {
        await startWithProgress(page, { '01-14': 1, [ONE_MACHINE.id]: 1 });
        await page.goto(`/#/level/${OPENING.id}`);
        const terminal = await openTerminal(page);
        await sendMessage(terminal, NC_TO_THE_APP);
        await sendMessage(terminal, NC_TO_THE_DATABASE);
        await confirm(terminal);
        await expect(terminal).toBeHidden();
        await expect(page.getByRole('button', { name: STAMP_OF_THE_SECOND_CONNECTION })).toBeVisible();
        await standStill(page);
        await expect(page.locator('.packet-tag')).toHaveText([TAG_OF_THE_FIRST_CONNECTION, TAG_OF_THE_SECOND_CONNECTION]);
        await expectClear(page);
      });
    });
  }
});
