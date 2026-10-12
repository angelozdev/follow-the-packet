import { expect, test } from '@playwright/test';
import { confirm, openTerminal, sendMessage } from '@e2e/cards';
import { FULL_STARS } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';
import { reloadWithProgress, startWithProgress } from '@e2e/saved-progress';
import { standStill } from '@e2e/still-scene';
import { CHAPTER_2, NC_TO_THE_APP, NC_TO_THE_DATABASE } from './chapter-2-play';

const LOCKED = '(bloqueado)';
const [ONE_MACHINE] = CHAPTER_2;
const FIRST_LINK = `1. ${ONE_MACHINE.title}`;
const TAG_OF_THE_APP = 'paquete al puerto 3000';
const TAG_OF_THE_DATABASE = 'paquete al puerto 5432';
const STAMP_OF_THE_APP = /^Paquete: paquete al puerto 3000 de tu-laptop a laptop-lucia\. Llegó\.$/;
const STAMP_OF_THE_DATABASE = /^Paquete: paquete al puerto 5432 de tu-laptop a laptop-lucia\. Llegó\.$/;

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
});
