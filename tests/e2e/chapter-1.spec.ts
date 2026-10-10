import { expect, test, type Locator, type Page } from '@playwright/test';
import { FULL_STARS, submitAndFinish } from './closing';
import { collectErrors } from './console-errors';
import { overlappingPairs, overlaps } from './map-boxes';
import { startWithProgress } from './saved-progress';

const SEND = 'Enviar';
const ECHO_REQUEST = 'ICMP · Echo Request';
const PRINTER_LABEL = 'impresora con candado';
const PRINTER_STAMP = 'Paquete: ping de tu-laptop a impresora. Llegó.';
const LUCIA_LAPTOP_LABEL = 'laptop-lucia con candado';
const LOST_PING_STAMP = /^Paquete: ping de Casa de Lucía/;
const YOUR_PING_STAMP = /^Paquete: ping de tu-laptop a /;

function terminal(page: Page): Locator {
  return page.getByRole('dialog', { name: /^Terminal de/ });
}

async function openTerminal(page: Page) {
  await page.getByRole('button', { name: 'tu-laptop', exact: true }).click();
  await expect(terminal(page)).toHaveAccessibleName('Terminal de tu-laptop');
}

async function pick(page: Page, ...chips: string[]) {
  for (const chip of chips) await terminal(page).getByRole('button', { name: chip, exact: true }).click();
}

async function next(page: Page, title: string) {
  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}

async function sendFromHomeAndYours(page: Page) {
  await openTerminal(page);
  await pick(page, 'Casa de Lucía');
  await expect(terminal(page)).toHaveAccessibleName('Terminal de Casa de Lucía');
  await pick(page, '192.168.1.10', ECHO_REQUEST, SEND, 'tu-laptop', '192.168.1.11', SEND);
}

async function pingFromOutside(page: Page) {
  await startWithProgress(page, { '01-02': 3 });
  await page.goto('/#/level/01-03');
  await sendFromHomeAndYours(page);
  await terminal(page).getByRole('button', { name: 'Listo' }).click();
}

async function expectApart(card: Locator, target: Locator) {
  await expect(target).toBeVisible();
  expect(overlaps(await card.boundingBox(), await target.boundingBox())).toBe(false);
}

test('chapter 1 is played from 01-01 to 01-04, each incident opening the next, with 3 stars each', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: '1. La dirección' }).click();
  await openTerminal(page);
  await pick(page, '192.168.1.20', SEND);
  await submitAndFinish(page, /Por la dirección IP de destino/);

  await next(page, 'Ida y vuelta');
  await openTerminal(page);
  await pick(page, '192.168.1.11', ECHO_REQUEST, SEND);
  await submitAndFinish(page, /Solo un Echo Request pide respuesta/);

  await next(page, 'Desde afuera');
  await sendFromHomeAndYours(page);
  await submitAndFinish(page, /es una IP privada/);

  await next(page, 'El firewall');
  await page.getByRole('button', { name: 'firewall laptop-lucia', exact: true }).click();
  const card = page.getByRole('dialog', { name: 'firewall laptop-lucia' });
  await card.getByRole('button', { name: ECHO_REQUEST, exact: true }).click();
  await card.getByRole('button', { name: 'tu-laptop (IP 192.168.1.10)', exact: true }).click();
  await card.getByRole('button', { name: 'Listo' }).click();
  await submitAndFinish(page, /Lo bloqueó/);

  await page.getByRole('link', { name: 'Volver al roadmap' }).click();
  for (const id of ['01-01', '01-02', '01-03', '01-04']) await expect(page.locator(`li[data-level-id="${id}"]`)).toContainText(FULL_STARS);
  await expect(page.getByRole('link', { name: '1. El primer ping' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('04-01 stays open with its stored stars although chapter 1 has none, and 04-02 opens after it', async ({ page }) => {
  await startWithProgress(page, { '04-01': 2 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: '1. El primer ping' })).toHaveAttribute('href', '#/level/04-01');
  await expect(page.getByRole('link', { name: '2. Abre lo justo' })).toBeVisible();
  await expect(page.locator('li[data-level-id="01-02"]')).toContainText('(bloqueado)');
  await page.getByRole('link', { name: '1. El primer ping' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'El primer ping' })).toBeVisible();
});

test.describe('Sin animaciones', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('after the pings of 01-03, no label or stamp overlaps, and the lost ping says why', async ({ page }) => {
    await pingFromOutside(page);
    await expect.poll(() => overlappingPairs(page)).toEqual([]);
    await page.getByRole('button', { name: LOST_PING_STAMP }).hover();
    await expect(page.getByRole('region', { name: 'ping de Casa de Lucía a 192.168.1.10' })).toContainText('Internet no entrega paquetes a una IP privada');
  });

  test('in 01-01 the open terminal covers neither the printer, nor its stamp, nor the laptop of Lucía', async ({ page }) => {
    await page.goto('/#/level/01-01');
    await openTerminal(page);
    await pick(page, '192.168.1.20', SEND);
    const card = terminal(page);
    await expectApart(card, page.getByRole('button', { name: PRINTER_LABEL, exact: true }));
    await expectApart(card, page.getByRole('button', { name: PRINTER_STAMP, exact: true }));
    await expectApart(card, page.getByRole('button', { name: LUCIA_LAPTOP_LABEL, exact: true }));
  });

  test('in 01-03 the stamp of the ping from outside tells a screen reader that it was lost', async ({ page }) => {
    await pingFromOutside(page);
    await expect(page.getByRole('button', { name: LOST_PING_STAMP })).toHaveAccessibleName(/ Perdido\.$/);
  });

  test('in 01-04 the stamp of your first ping tells a screen reader that the firewall blocked it', async ({ page }) => {
    await startWithProgress(page, { '01-03': 3 });
    await page.goto('/#/level/01-04');
    await expect(page.getByRole('button', { name: YOUR_PING_STAMP })).toHaveAccessibleName(/ Bloqueado\.$/);
  });
});
