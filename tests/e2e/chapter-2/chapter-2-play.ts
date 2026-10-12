import { expect, type Locator, type Page } from '@playwright/test';
import { confirm, openTerminal, sendMessage } from '@e2e/cards';
import { submitAndFinish } from '@e2e/closing';
import { IP, type PlayedIncident } from '@e2e/chapter-1/chapter-1-play';

export const NC_TO_THE_APP = 'nc · puerto 3000';
export const NC_TO_THE_DATABASE = 'nc · puerto 5432';
export const NC_TO_THE_CLOSED_PORT = 'nc · puerto 3306';
export const LUCIA = 'laptop-lucia';
export const SERVICES_TAB = 'Servicios';
export const SERVICES_CARD = 'Servicios de laptop-lucia';
const EVERY_IP_CHIP = 'Todas las IPs (0.0.0.0)';

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

/** How each incident of chapter 2 is played with the mouse, in game order. Each content task adds the incident it builds: its title as the roadmap shows it and the moves that earn the stars. */
export const CHAPTER_2: PlayedIncident[] = [
  { id: '02-01', title: 'Un equipo, muchos servicios', play: playOneMachineManyServices },
  { id: '02-02', title: 'Abrir una conexión', play: playOpeningAConnection },
  { id: '02-03', title: 'Rechazo o silencio', play: playRefusedOrSilent },
];

/** The id of the last incident of chapter 2 that is built: while chapter 2 is incomplete it is the one right before 04-01 in game order, so the one whose star opens 04-01. */
export const LAST_BUILT_OF_CHAPTER_2: string = CHAPTER_2[CHAPTER_2.length - 1].id;
