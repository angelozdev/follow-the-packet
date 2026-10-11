import { expect, type Locator, type Page } from '@playwright/test';

const DONE = 'Listo';
const SEND = 'Enviar';
const YOUR_LAPTOP = 'tu-laptop';

/** Returns the card of a piece, found by its name as a screen reader hears it. */
export function card(page: Page, name: string): Locator {
  return page.getByRole('dialog', { name });
}

/** Clicks the label of a piece, as a player does, and returns the card that opens. */
export async function openCard(page: Page, device: string): Promise<Locator> {
  await page.getByRole('button', { name: device, exact: true }).click();
  const opened = card(page, device);
  await expect(opened).toBeVisible();
  return opened;
}

/** Presses «Listo» on a card. */
export async function confirm(opened: Locator) {
  await opened.getByRole('button', { name: DONE, exact: true }).click();
}

/** Opens the terminal of a laptop that sends, your own unless another is given. */
export async function openTerminal(page: Page, laptop = YOUR_LAPTOP): Promise<Locator> {
  await page.getByRole('button', { name: laptop, exact: true }).click();
  const terminal = card(page, `Terminal de ${laptop}`);
  await expect(terminal).toBeVisible();
  return terminal;
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
