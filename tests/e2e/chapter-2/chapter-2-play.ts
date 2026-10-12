import { expect, type Locator, type Page } from '@playwright/test';
import { confirm, openCard, openTerminal, sendMessage } from '@e2e/cards';
import { submitAndFinish } from '@e2e/closing';
import { IP, type PlayedIncident } from '@e2e/chapter-1/chapter-1-play';

export const NC_TO_THE_APP = 'nc · puerto 3000';
export const NC_TO_THE_DATABASE = 'nc · puerto 5432';
export const NC_TO_THE_CLOSED_PORT = 'nc · puerto 3306';
export const LUCIA = 'laptop-lucia';
export const SERVICES_TAB = 'Servicios';
export const SERVICES_CARD = 'Servicios de laptop-lucia';
const EVERY_IP_CHIP = 'Todas las IPs (0.0.0.0)';
export const YOUR_LAPTOP = 'tu-laptop';
export const BLOCK = '192.168.1.0/24';
const MASK = '255.255.255.0';
export const CLASSIFY_TAB = 'Clasificar';
export const INSIDE_THE_BLOCK = `Dentro de ${BLOCK}`;
export const OUTSIDE_THE_BLOCK = 'Fuera';
export const PRINTER = 'impresora';
export const ANDRES = 'laptop-andres';
const LUCIA_FIREWALL = 'firewall laptop-lucia';
const SSH_CHIP = 'TCP · 22';
const YOUR_LAPTOP_CHIP = 'tu-laptop (IP 192.168.1.10)';

async function playOneMachineManyServices(page: Page) {
  const terminal = await openTerminal(page);
  await sendMessage(terminal, 'ping');
  await sendMessage(terminal, NC_TO_THE_APP);
  await sendMessage(terminal, NC_TO_THE_DATABASE);
  await submitAndFinish(page, /no al servicio: la app escucha en un puerto/);
}

async function playOpeningAConnection(page: Page) {
  const terminal = await openTerminal(page);
  await sendMessage(terminal, NC_TO_THE_APP);
  await sendMessage(terminal, NC_TO_THE_DATABASE);
  await submitAndFinish(page, /Al puerto de origen que eligió tu-laptop/);
}

/** Picks the address and the message in the open terminal and sends the packet. */
export async function sendNc(terminal: Locator, ip: string, message: string) {
  await terminal.getByRole('button', { name: ip, exact: true }).click();
  await sendMessage(terminal, message);
}

async function sendNcAndClose(terminal: Locator, sends: { ip: string; message: string }[]) {
  for (const { ip, message } of sends) await sendNc(terminal, ip, message);
  await confirm(terminal);
  await expect(terminal).toBeHidden();
}

/** Sends the nc to the app of laptop-lucia, which the app on 127.0.0.1 refuses, opens the tab «Servicios» of the card of laptop-lucia, picks «Todas las IPs», which clears the stamps, and sends the four tests again: the closed port, the silence of laptop-marta, the app from your laptop and the app from laptop-lucia herself. */
async function playRefusedOrSilent(page: Page) {
  await sendNcAndClose(await openTerminal(page), [{ ip: IP.lucia, message: NC_TO_THE_APP }]);
  await openTerminal(page, LUCIA);
  await page.getByRole('tab', { name: SERVICES_TAB, exact: true }).click();
  const services = page.getByRole('dialog', { name: SERVICES_CARD });
  await services.getByRole('button', { name: EVERY_IP_CHIP, exact: true }).click();
  await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(0);
  await confirm(services);
  await sendNcAndClose(await openTerminal(page), [
    { ip: IP.lucia, message: NC_TO_THE_CLOSED_PORT },
    { ip: IP.marta, message: NC_TO_THE_APP },
    { ip: IP.lucia, message: NC_TO_THE_APP },
  ]);
  await sendNcAndClose(await openTerminal(page, LUCIA), [{ ip: IP.loopback, message: NC_TO_THE_APP }]);
  await submitAndFinish(page, /rechaza lo que llega a otra IP de laptop-lucia/);
}

/** Opens the card of your laptop from its label, on the tab «Clasificar», and returns it. */
export async function openTheClassifyCard(page: Page): Promise<Locator> {
  const card = await openCard(page, YOUR_LAPTOP);
  await page.getByRole('tab', { name: CLASSIFY_TAB, exact: true }).click();
  return card;
}

/** Picks the item up in the card that classifies and presses the button that puts it in the bin, which can be the bin it is already in or the other one. */
export async function placeInBin(card: Locator, item: string, bin: string) {
  await card.getByRole('button', { name: new RegExp(`^${item}`) }).click();
  await card.getByRole('button', { name: `Poner ${item} en ${bin}`, exact: true }).click();
}

/** Opens the card that classifies, puts the item in the bin and closes the card with «Listo». */
export async function classify(page: Page, item: string, bin: string) {
  const card = await openTheClassifyCard(page);
  await placeInBin(card, item, bin);
  await confirm(card);
  await expect(card).toBeHidden();
}

async function playIsItInMyBlock(page: Page) {
  const questions = await openCard(page, YOUR_LAPTOP);
  await questions.getByRole('button', { name: BLOCK, exact: true }).click();
  await questions.getByRole('button', { name: MASK, exact: true }).click();
  await confirm(questions);
  await expect(questions).toContainText('Los 24 primeros bits de tu IP');
  await confirm(questions);
  await expect(questions).toBeHidden();
  await classify(page, PRINTER, INSIDE_THE_BLOCK);
  await classify(page, ANDRES, OUTSIDE_THE_BLOCK);
  await submitAndFinish(page, /Porque los 24 primeros bits de esa IP no son los del bloque/);
}

async function playTheWholeRule(page: Page) {
  const firewall = await openCard(page, LUCIA_FIREWALL);
  await firewall.getByRole('button', { name: SSH_CHIP, exact: true }).click();
  await firewall.getByRole('button', { name: YOUR_LAPTOP_CHIP, exact: true }).click();
  await confirm(firewall);
  await submitAndFinish(page, /Porque 0\.0\.0\.0\/0 quiere decir cualquier origen/);
}

/** How each incident of chapter 2 is played with the mouse, in game order. Each content task adds the incident it builds: its title as the roadmap shows it and the moves that earn the stars. */
export const CHAPTER_2: PlayedIncident[] = [
  { id: '02-01', title: 'Un equipo, muchos servicios', play: playOneMachineManyServices },
  { id: '02-02', title: 'Abrir una conexión', play: playOpeningAConnection },
  { id: '02-03', title: 'Rechazo o silencio', play: playRefusedOrSilent },
  { id: '02-04', title: '¿Está en mi bloque?', play: playIsItInMyBlock },
  { id: '02-05', title: 'La regla completa', play: playTheWholeRule },
];

/** The id of the last incident of chapter 2 that is built: while chapter 2 is incomplete it is the one right before 04-01 in game order, so the one whose star opens 04-01. */
export const LAST_BUILT_OF_CHAPTER_2: string = CHAPTER_2[CHAPTER_2.length - 1].id;
