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
const LAST_BUILT_OF_CHAPTER_1 = '01-13';
const ARE_YOU_THERE_LINK = '3. ¿Estás ahí?';
const ANDRES_IP = '192.168.2.15';
const ROUTER_IP = '192.168.1.1';
const ABOUT_THE_ROUTER = /está en otra red local, y lo que sale de tu red local pasa por el router/;
const ABOUT_THE_GATEWAY = /no tenía puerta de enlace predeterminada/;
const SETTINGS_BUTTON = 'Ajustes de red de tu-laptop';
const SETTINGS_CARD = 'Ajustes de red de tu-laptop';
const SERVER_IP = '198.51.100.50';
const OTHER_OFFICE_IP = '10.0.0.10';
const ABOUT_THE_PRIVATE_IP = /10\.0\.0\.10 es una IP privada y internet no la entrega/;
const ABOUT_THE_LOOP = /daba vueltas entre los mismos dos routers/;
const ABOUT_THE_BROKEN_STRETCH = /En router-proveedor, el último router que contestó, o justo después/;
const WARNED_STAMP = /^Paquete: ping de tu-laptop a 198\.51\.100\.50\. Apareció un aviso\.$/;
const OFFICE_PIECES = ['laptop-lucia con candado', 'impresora con candado', 'laptop-andres con candado', 'router-oficina con candado'];

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

async function openTerminal(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'tu-laptop', exact: true }).click();
  const terminal = page.getByRole('dialog', { name: 'Terminal de tu-laptop' });
  await expect(terminal).toBeVisible();
  return terminal;
}

async function sendTo(terminal: Locator, ip: string) {
  await terminal.getByRole('button', { name: ip, exact: true }).click();
  await terminal.getByRole('button', { name: SEND, exact: true }).click();
}

async function sendMessage(terminal: Locator, message: string) {
  await terminal.getByRole('button', { name: message, exact: true }).click();
  await terminal.getByRole('button', { name: SEND, exact: true }).click();
}

async function sendThePingsWithTtl(terminal: Locator) {
  for (const ttl of [1, 2, 3, 64]) await sendMessage(terminal, `ping con TTL ${ttl}`);
}

async function sendThePingAndTheTraceroute(terminal: Locator) {
  await sendMessage(terminal, 'ping');
  await sendMessage(terminal, 'traceroute');
}

async function sendThePacket(page: Page) {
  const terminal = await openTerminal(page);
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
  await page.evaluate(([key, saved]) => localStorage.setItem(key, saved), [PROGRESS_KEY, JSON.stringify({ [LAST_BUILT_OF_CHAPTER_1]: 1 })]);
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
  await expect(page.getByRole('link', { name: ARE_YOU_THERE_LINK })).toHaveAttribute('href', '#/level/01-03');
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(LOCKED);
  expect(errors).toEqual([]);
});

test('01-06 and 01-07 are played with the mouse alone and each reaches 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, { '01-05': 1 });
  await page.goto('/#/level/01-06');
  const terminal = await openTerminal(page);
  await sendTo(terminal, PRINTER_IP);
  await sendTo(terminal, ANDRES_IP);
  await expect(page.getByRole('button', { name: /^Paquete: ping de tu-laptop a laptop-andres\. Llegó\.$/ })).toBeVisible();
  await submitAndFinish(page, ABOUT_THE_ROUTER);

  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'A quién mandas lo de afuera' })).toBeVisible();
  await sendTo(await openTerminal(page), ANDRES_IP);
  await expect(page.getByRole('button', { name: /^Paquete: ping de tu-laptop a 192\.168\.2\.15\. Perdido\.$/ })).toBeVisible();
  await page.getByRole('button', { name: SETTINGS_BUTTON, exact: true }).click();
  const settings = card(page, SETTINGS_CARD);
  await settings.getByRole('button', { name: ROUTER_IP, exact: true }).click();
  await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(0);
  await confirm(settings);
  await expect(settings).toBeHidden();
  await sendTo(await openTerminal(page), ANDRES_IP);
  await expect(page.getByRole('button', { name: /^Paquete: ping de tu-laptop a laptop-andres\. Llegó\.$/ })).toBeVisible();
  await submitAndFinish(page, ABOUT_THE_GATEWAY);
  expect(errors).toEqual([]);
});

test('01-08, 01-09 and 01-10 are played with the mouse alone and each reaches 3 stars', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, { '01-07': 1 });
  await page.goto('/#/level/01-08');
  const toTheInternet = await openTerminal(page);
  await sendTo(toTheInternet, SERVER_IP);
  await expect(page.getByRole('button', { name: /^Paquete: ping de tu-laptop a servidor-internet\. Llegó\.$/ })).toBeVisible();
  await sendTo(toTheInternet, OTHER_OFFICE_IP);
  await expect(page.getByRole('button', { name: /^Paquete: ping de tu-laptop a 10\.0\.0\.10\. Perdido\.$/ })).toBeVisible();
  await submitAndFinish(page, ABOUT_THE_PRIVATE_IP);

  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Contar saltos' })).toBeVisible();
  const counting = await openTerminal(page);
  await sendMessage(counting, 'ping con TTL 3');
  await expect(page.getByRole('button', { name: WARNED_STAMP })).toHaveCount(1);
  await sendMessage(counting, 'ping con TTL 64');
  await expect(page.getByRole('button', { name: WARNED_STAMP })).toHaveCount(2);
  await submitAndFinish(page, ABOUT_THE_LOOP);

  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ver el camino' })).toBeVisible();
  const seeing = await openTerminal(page);
  await sendMessage(seeing, 'ping');
  await expect(page.getByRole('button', { name: /^Paquete: ping de tu-laptop a 198\.51\.100\.50\. Perdido\.$/ })).toBeVisible();
  await sendMessage(seeing, 'traceroute');
  const route = seeing.getByRole('list', { name: 'Salida de traceroute' });
  await expect(route).toContainText('192.168.1.1');
  await expect(route).toContainText('203.0.113.1');
  await expect(route.getByRole('listitem')).toHaveCount(8);
  await submitAndFinish(page, ABOUT_THE_BROKEN_STRETCH);
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

  test('in 01-09 and 01-10 no label or stamp of the map overlaps once the player has sent its messages', async ({ page }) => {
    await startWithProgress(page, { '01-08': 1, '01-09': 1 });
    const sending = [
      ['01-09', sendThePingsWithTtl],
      ['01-10', sendThePingAndTheTraceroute],
    ] as const;
    for (const [id, send] of sending) {
      await page.goto(`/#/level/${id}`);
      const terminal = await openTerminal(page);
      await send(terminal);
      await confirm(terminal);
      await expect(terminal).toBeHidden();
      await expect.poll(() => overlappingPairs(page), id).toEqual([]);
    }
  });

  test('in 01-07 the open settings card covers none of the pieces of the office, and no label or stamp overlaps', async ({ page }) => {
    await startWithProgress(page, { '01-06': 1 });
    await page.goto('/#/level/01-07');
    await page.getByRole('button', { name: SETTINGS_BUTTON, exact: true }).click();
    const settings = card(page, SETTINGS_CARD);
    for (const piece of OFFICE_PIECES) await expectApart(settings, page.getByRole('button', { name: piece, exact: true }));
    await expect.poll(() => overlappingPairs(page)).toEqual([]);
    await confirm(settings);
    const terminal = await openTerminal(page);
    await sendTo(terminal, ANDRES_IP);
    for (const piece of OFFICE_PIECES) await expectApart(terminal, page.getByRole('button', { name: piece, exact: true }));
    await expect.poll(() => overlappingPairs(page)).toEqual([]);
  });
});
