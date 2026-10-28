import { expect, type Locator, type Page } from '@playwright/test';

const DONE = 'Listo';
const SEND = 'Enviar';
const YOUR_LAPTOP = 'tu-laptop';
const MAP = '.incident__map';

/** Returns the panel of a piece, found by the name of the piece as a screen reader hears it. */
export function card(page: Page, piece: string): Locator {
  return page.getByRole('region', { name: piece, exact: true });
}

/** Clicks the label of a piece on the map, as a player does, and returns its panel; with a `tab` it also clicks that tab of the panel. */
export async function openCard(page: Page, piece: string, tab?: string): Promise<Locator> {
  await page.locator(MAP).getByRole('button', { name: piece, exact: true }).click();
  const opened = card(page, piece);
  await expect(opened).toBeVisible();
  if (tab !== undefined) await opened.getByRole('tab', { name: tab, exact: true }).click();
  return opened;
}

/** Presses «Listo» on a panel that has it. */
export async function confirm(opened: Locator) {
  await opened.getByRole('button', { name: DONE, exact: true }).click();
}

/** Opens the terminal of a laptop that sends, your own unless another is given: the panel of the laptop on its «Terminal» tab. */
export function openTerminal(page: Page, laptop = YOUR_LAPTOP): Promise<Locator> {
  return openCard(page, laptop, 'Terminal');
}

/** Picks an address in the open terminal and sends the packet. */
export async function sendTo(terminal: Locator, ip: string) {
  await terminal.getByRole('button', { name: ip, exact: true }).click();
  await terminal.getByRole('button', { name: SEND, exact: true }).click();
}

/** Picks a message in the open terminal and sends it. */
export async function sendMessage(terminal: Locator, message: string) {
  await terminal.getByRole('button', { name: message, exact: true }).click();
  await terminal.getByRole('button', { name: SEND, exact: true }).click();
}
