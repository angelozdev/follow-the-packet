import { expect, test, type Locator, type Page } from '@playwright/test';
import { isReachable } from '@/testing/card-boxes';
import { IP } from '@e2e/chapter-1/chapter-1-play';
import { FULL_STARS } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';

const PHONE = { width: 390, height: 844 };
const FIRST_INCIDENT = '01-01';
const PIECE_LABEL = '.map-button';
const DONE = 'Listo';
const NOTE_FEEDBACK = 'cada uno de los cuatro números va de 0 a 255';
const NOTE_RULE = 'La nota de Lucía estaba mal';
const RIGHT_ANSWER = /en IPv4 los cuatro números van de 0 a 255/;

test.use({ viewport: PHONE, hasTouch: true });

async function sidewaysOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

async function tapPiece(page: Page, name: string): Promise<Locator> {
  await page.locator('.incident__map').getByRole('button', { name, exact: true }).tap();
  const opened = page.getByRole('region', { name, exact: true });
  await expect(opened).toBeVisible();
  return opened;
}

async function tapDone(opened: Locator) {
  await opened.getByRole('button', { name: DONE, exact: true }).tap();
}

test('the first incident is played with a touch at 390×844: no horizontal scroll and every piece within reach', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`/#/level/${FIRST_INCIDENT}`);
  await expect(page.locator(PIECE_LABEL).first()).toBeVisible();
  expect(await sidewaysOverflow(page), 'the page does not scroll sideways').toBe(0);
  for (const label of await page.locator(PIECE_LABEL).all()) {
    await label.scrollIntoViewIfNeeded();
    expect(await label.evaluate(isReachable), `${await label.textContent()} is within reach`).toBe(true);
  }

  const visitor = await tapPiece(page, 'laptop-visita');
  await visitor.getByRole('button', { name: 'No', exact: true }).tap();
  await tapDone(visitor);
  await expect(visitor).toBeHidden();
  const printer = await tapPiece(page, 'impresora');
  await expect(printer.getByRole('button', { name: IP.note, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await tapDone(printer);
  await expect(printer.getByRole('status')).toContainText(NOTE_FEEDBACK);
  await printer.getByRole('button', { name: IP.printer, exact: true }).tap();
  await tapDone(printer);
  await expect(printer.getByRole('status')).toContainText(NOTE_RULE);
  await tapDone(printer);
  await expect(printer).toBeHidden();
  expect(await sidewaysOverflow(page), 'nor with the panels of the incident open').toBe(0);

  await page.getByRole('button', { name: 'Enviar solución' }).tap();
  await page.getByRole('button', { name: RIGHT_ANSWER }).tap();
  await page.getByRole('button', { name: 'Ver resultado' }).tap();
  await expect(page.getByText(FULL_STARS)).toBeVisible();
  expect(await sidewaysOverflow(page), 'nor on the result').toBe(0);
  expect(errors).toEqual([]);
});
