import { expect, test, type Locator, type Page } from '@playwright/test';
import { PROGRESS_KEY } from '@/storage/progress';
import { FULL_STARS, submitAndFinish } from './closing';
import { collectErrors } from './console-errors';
import { overlappingPairs, overlaps } from './map-boxes';
import { startWithProgress } from './saved-progress';

const DONE = 'Listo';
const SEND = 'Enviar';
const LOCKED = '(bloqueado)';
const NOTE_IP = '192.168.1.300';
const PRINTER_IP = '192.168.1.21';
const NOTE_FEEDBACK = 'cada uno de los cuatro números va de 0 a 255';
const NOTE_RULE = 'La nota de Lucía estaba mal';
const ABOUT_THE_OFFICE = /en IPv4 cada uno de los cuatro números va de 0 a 255/;
const ABOUT_THE_ENVELOPE = /su IP de destino era la de laptop-marta/;
const FIRST_PING_LINK = '1. El primer ping';

function card(page: Page, name: string): Locator {
  return page.getByRole('dialog', { name });
}

async function openCard(page: Page, device: string): Promise<Locator> {
  await page.getByRole('button', { name: device, exact: true }).click();
  const opened = card(page, device);
  await expect(opened).toBeVisible();
  return opened;
}

async function confirm(opened: Locator) {
  await opened.getByRole('button', { name: DONE, exact: true }).click();
}

async function markVisitorOutside(page: Page) {
  const visitor = await openCard(page, 'laptop-visita');
  await visitor.getByRole('button', { name: 'No', exact: true }).click();
  await confirm(visitor);
  await expect(visitor).toBeHidden();
}

async function chooseThePrinterIp(page: Page) {
  const printer = await openCard(page, 'impresora');
  await expect(printer.getByRole('button', { name: NOTE_IP, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await confirm(printer);
  await expect(printer.getByRole('status')).toContainText(NOTE_FEEDBACK);
  await expect(printer.getByRole('status')).not.toContainText(NOTE_RULE);
  await printer.getByRole('button', { name: PRINTER_IP, exact: true }).click();
  await confirm(printer);
  await expect(printer.getByRole('status')).toContainText(NOTE_RULE);
  await confirm(printer);
  await expect(printer).toBeHidden();
}

async function sendThePacket(page: Page) {
  await page.getByRole('button', { name: 'tu-laptop', exact: true }).click();
  const terminal = page.getByRole('dialog', { name: 'Terminal de tu-laptop' });
  await terminal.getByRole('button', { name: PRINTER_IP, exact: true }).click();
  await expect(terminal).toContainText('paquete de tu-laptop a 192.168.1.21');
  await terminal.getByRole('button', { name: SEND, exact: true }).click();
}

async function expectApart(opened: Locator, target: Locator) {
  await expect(opened).toBeVisible();
  await expect(target).toBeVisible();
  expect(overlaps(await opened.boundingBox(), await target.boundingBox())).toBe(false);
}

test('chapter 1 opens at 01-01 and 04-01 opens once the incident before it has a star', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: '1. La oficina' })).toHaveAttribute('href', '#/level/01-01');
  await expect(page.locator('li[data-level-id="01-02"]')).toContainText(LOCKED);
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(LOCKED);
  await page.evaluate(([key, saved]) => localStorage.setItem(key, saved), [PROGRESS_KEY, JSON.stringify({ '01-02': 1 })]);
  await page.reload();
  await expect(page.getByRole('link', { name: FIRST_PING_LINK })).toHaveAttribute('href', '#/level/04-01');
  await expect(page.locator('li[data-level-id="04-01"]')).not.toContainText(LOCKED);
  expect(errors).toEqual([]);
});

test('01-01 and 01-02 are played with the mouse alone and each reaches 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: '1. La oficina' }).click();
  await markVisitorOutside(page);
  await chooseThePrinterIp(page);
  await submitAndFinish(page, ABOUT_THE_OFFICE);

  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'El sobre' })).toBeVisible();
  await sendThePacket(page);
  await submitAndFinish(page, ABOUT_THE_ENVELOPE);

  await page.getByRole('link', { name: 'Volver al roadmap' }).click();
  for (const id of ['01-01', '01-02']) await expect(page.locator(`li[data-level-id="${id}"]`)).toContainText(FULL_STARS);
  await expect(page.getByRole('link', { name: FIRST_PING_LINK })).toBeVisible();
  expect(errors).toEqual([]);
});

test('04-01 stays open with its stored stars although chapter 1 has none, and 04-02 opens after it', async ({ page }) => {
  await startWithProgress(page, { '04-01': 2 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: FIRST_PING_LINK })).toHaveAttribute('href', '#/level/04-01');
  await expect(page.getByRole('link', { name: '2. Abre lo justo' })).toBeVisible();
  await expect(page.locator('li[data-level-id="01-02"]')).toContainText(LOCKED);
  await page.getByRole('link', { name: FIRST_PING_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'El primer ping' })).toBeVisible();
});

test.describe('Sin animaciones', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('in 01-01 the open card of the printer covers none of the pieces the player compares', async ({ page }) => {
    await page.goto('/#/level/01-01');
    const printer = await openCard(page, 'impresora');
    for (const piece of ['impresora', 'laptop-marta con candado', 'laptop-lucia', 'laptop-visita']) {
      await expectApart(printer, page.getByRole('button', { name: piece, exact: true }));
    }
    await expect.poll(() => overlappingPairs(page)).toEqual([]);
  });

  test('in 01-02 the open terminal covers neither the printer, nor laptop-marta, nor the packet once sent', async ({ page }) => {
    await startWithProgress(page, { '01-01': 3 });
    await page.goto('/#/level/01-02');
    await sendThePacket(page);
    const terminal = page.getByRole('dialog', { name: 'Terminal de tu-laptop' });
    await expectApart(terminal, page.getByRole('button', { name: 'impresora con candado', exact: true }));
    await expectApart(terminal, page.getByRole('button', { name: 'laptop-marta con candado', exact: true }));
    await expect(page.getByRole('button', { name: /^Paquete: paquete de tu-laptop a impresora\. Llegó\.$/ })).toBeVisible();
    await expect.poll(() => overlappingPairs(page)).toEqual([]);
  });
});
