import { expect, test, type Locator, type Page } from '@playwright/test';
import { confirm, openTerminal, sendMessage } from '@e2e/cards';
import { FULL_STARS } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';
import { reloadWithProgress, startWithProgress } from '@e2e/saved-progress';
import { freezeTime, standStill, stepFrame } from '@e2e/still-scene';
import { IP } from '@e2e/chapter-1/chapter-1-play';
import { CHAPTER_2, LUCIA, NC_TO_THE_APP, NC_TO_THE_CLOSED_PORT, NC_TO_THE_DATABASE, NC_TO_THE_WEB_PORT, OFFICE_ROUTER, sendNc } from './chapter-2-play';

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
const YOUR_TABLE = CHAPTER_2[5];
const SIXTH_LINK = `6. ${YOUR_TABLE.title}`;
const OTHER_OFFICE_WAY = CHAPTER_2[6];
const SEVENTH_LINK = `7. ${OTHER_OFFICE_WAY.title}`;
const ONE_ADDRESS = CHAPTER_2[7];
const EIGHTH_LINK = `8. ${ONE_ADDRESS.title}`;
const FROM_OUTSIDE = CHAPTER_2[8];
const NINTH_LINK = `9. ${FROM_OUTSIDE.title}`;
const PACKET_LABEL = '.packet-tag';
const FLIGHT_FRAME_BUDGET = 1200;
const PIXELS_A_FRAME_MOVES = 2;
const LABEL_BEFORE_THE_ROUTER = 'TCP 51514 → 80';
const LABEL_AFTER_THE_ROUTER = 'TCP 40001 → 80';
const REPLY_BEFORE_THE_ROUTER = 'TCP 80 → 40001';
const REPLY_AFTER_THE_ROUTER = 'TCP 80 → 51514';
const TAG_OF_THE_APP = 'paquete al puerto 3000';
const TAG_OF_THE_DATABASE = 'paquete al puerto 5432';
const STAMP_OF_THE_APP = /^Paquete: paquete al puerto 3000 de tu-laptop a laptop-lucia\. Llegó\.$/;
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
const PROGRESS_BEFORE_06 = { ...PROGRESS_BEFORE_05, [WHOLE_RULE.id]: 1 };
const PROGRESS_BEFORE_07 = { ...PROGRESS_BEFORE_06, [YOUR_TABLE.id]: 1 };
const PROGRESS_BEFORE_08 = { ...PROGRESS_BEFORE_07, [OTHER_OFFICE_WAY.id]: 1 };
const PROGRESS_BEFORE_09 = { ...PROGRESS_BEFORE_08, [ONE_ADDRESS.id]: 1 };

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

test('02-06 is played with the mouse after 02-05 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_06);
  await page.goto('/');
  await page.getByRole('link', { name: SIXTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: YOUR_TABLE.title })).toBeVisible();
  await YOUR_TABLE.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${YOUR_TABLE.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-07 is played with the mouse after 02-06 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_07);
  await page.goto('/');
  await page.getByRole('link', { name: SEVENTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: OTHER_OFFICE_WAY.title })).toBeVisible();
  await OTHER_OFFICE_WAY.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${OTHER_OFFICE_WAY.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-08 is played with the mouse after 02-07 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_08);
  await page.goto('/');
  await page.getByRole('link', { name: EIGHTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: ONE_ADDRESS.title })).toBeVisible();
  await ONE_ADDRESS.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${ONE_ADDRESS.id}"]`)).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test('02-09 is played with the mouse after 02-08 and earns 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, PROGRESS_BEFORE_09);
  await page.goto('/');
  await page.getByRole('link', { name: NINTH_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: FROM_OUTSIDE.title })).toBeVisible();
  await FROM_OUTSIDE.play(page);
  await page.goto('/#/');
  await expect(page.locator(`li[data-level-id="${FROM_OUTSIDE.id}"]`)).toContainText(FULL_STARS);
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

interface FlyingLabel {
  text: string;
  x: number;
}

/** Steps the paused clock one frame at a time while the packet flies and returns the label it wears in each frame, with the x of its middle. It ends when the label is gone, and throws when the packet is still flying after the frame budget or when two labels are drawn at once. */
async function labelsAlongTheFlight(page: Page): Promise<FlyingLabel[]> {
  const seen: FlyingLabel[] = [];
  for (let frame = 0; frame < FLIGHT_FRAME_BUDGET; frame++) {
    await stepFrame(page);
    const labels = await page.evaluate((selector) => [...document.querySelectorAll(selector)].map((label) => ({ text: label.textContent ?? '', x: label.getBoundingClientRect().x + label.getBoundingClientRect().width / 2 })), PACKET_LABEL);
    if (labels.length > 1) throw new Error(`${labels.length} packet labels at frame ${frame}`);
    if (labels.length === 1) seen.push(labels[0]);
    else if (seen.length > 0) return seen;
  }
  throw new Error(`the packet was still flying after ${FLIGHT_FRAME_BUDGET} frames`);
}

/** Returns the labels in the order they changed, one entry for each run of frames with the same text, each with the first frame of its run. */
function changesOf(seen: FlyingLabel[]): FlyingLabel[] {
  return seen.filter((label, index) => index === 0 || label.text !== seen[index - 1].text);
}

test('a translated packet changes its label at the router, from the private source port to the public one', async ({ page }) => {
  test.slow();
  await page.clock.install();
  await startWithProgress(page, PROGRESS_BEFORE_08);
  await page.goto(`/#/level/${ONE_ADDRESS.id}`);
  await page.locator('.map-button').first().waitFor();
  await standStill(page);
  await freezeTime(page);
  const router = await middleOf(page.getByRole('button', { name: OFFICE_ROUTER, exact: true }));
  const terminal = await openTerminal(page);
  await sendMessage(terminal, NC_TO_THE_WEB_PORT);
  await confirm(terminal);
  const changes = changesOf(await labelsAlongTheFlight(page));
  expect(changes.map(({ text }) => text)).toEqual([LABEL_BEFORE_THE_ROUTER, LABEL_AFTER_THE_ROUTER, REPLY_BEFORE_THE_ROUTER, REPLY_AFTER_THE_ROUTER]);
  const [, afterTheRouter, , backAtTheRouter] = changes;
  expect(Math.abs(afterTheRouter.x - router.x), 'the request changes where its path crosses the router').toBeLessThanOrEqual(PIXELS_A_FRAME_MOVES);
  expect(Math.abs(backAtTheRouter.x - router.x), 'the reply changes back where its path crosses the router').toBeLessThanOrEqual(PIXELS_A_FRAME_MOVES);
});

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

  test('the still drawing of a translated packet shows the label of the leg where the packet stands', async ({ page }) => {
    await startWithProgress(page, PROGRESS_BEFORE_08);
    await page.goto(`/#/level/${ONE_ADDRESS.id}`);
    const terminal = await openTerminal(page);
    await sendMessage(terminal, NC_TO_THE_WEB_PORT);
    await confirm(terminal);
    await expect(terminal).toBeHidden();
    await standStill(page);
    const label = page.locator(PACKET_LABEL);
    await expect(label).toHaveText([LABEL_AFTER_THE_ROUTER]);
    const [packet, router] = await Promise.all([middleOf(label), middleOf(page.getByRole('button', { name: OFFICE_ROUTER, exact: true }))]);
    expect(packet.x, 'it stands past the router, on the side the request goes to').toBeLessThan(router.x - PIXELS_A_FRAME_MOVES);
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
});
