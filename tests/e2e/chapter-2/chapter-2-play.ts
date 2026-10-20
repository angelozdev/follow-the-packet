import { expect, type Locator, type Page } from '@playwright/test';
import { card, confirm, openCard, openTerminal, sendMessage, sendTo } from '@e2e/cards';
import { submitAndFinish } from '@e2e/closing';
import { IP, type PlayedIncident } from '@e2e/chapter-1/chapter-1-play';

export const NC_TO_THE_APP = 'nc · puerto 3000';
export const NC_TO_THE_DATABASE = 'nc · puerto 5432';
export const NC_TO_THE_CLOSED_PORT = 'nc · puerto 3306';
export const NC_TO_THE_WEB_PORT = 'nc · puerto 80';
export const NC_TO_THE_UNMAPPED_PORT = 'nc · puerto 40009';
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
export const ROUTES_TAB = 'Tabla de rutas';
export const YOUR_ROUTES_CARD = 'Tabla de rutas de tu-laptop';
export const OFFICE_ROUTER = 'router-oficina';
export const OFFICE_ROUTES_CARD = 'Tabla de rutas de router-oficina';
export const ANYWHERE = '0.0.0.0/0';
export const OTHER_OFFICE_BLOCK = '10.0.0.0/16';
export const OTHER_OFFICE_LAPTOP = '10.0.0.20';
export const PROVIDER_HOP = '203.0.113.1 router-proveedor';
export const BRANCH_HOP = '172.16.0.2 router-sucursal';
export const TRANSLATIONS_TAB = 'Tabla de traducciones';
export const TRANSLATIONS_CARD = 'Tabla de traducciones de router-oficina';
export const HOME = 'casa-lucia';
export const OFFICE_PUBLIC_IP = '203.0.113.10';
const FIRST_PUBLIC_PORT = '40001';
const SECOND_PUBLIC_PORT = '40002';
const ADD_ROUTE = 'Agregar ruta';
const IN_USE = 'en uso';
const DEFAULT_ROW = /0\.0\.0\.0\/0/;
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
  await submitAndFinish(page, /y tu paquete iba a otra IP/);
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

async function playYourRoutingTable(page: Page) {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.printer);
  await sendTo(terminal, IP.andres);
  await page.getByRole('tab', { name: ROUTES_TAB, exact: true }).click();
  const routes = card(page, YOUR_ROUTES_CARD);
  await expect(routes.getByRole('row', { name: DEFAULT_ROW })).toContainText(IN_USE);
  await confirm(routes);
  await expect(routes).toBeHidden();
  await submitAndFinish(page, /Porque ninguna otra fila cubre 192\.168\.2\.15/);
}

/** Picks a destination and a next hop in the table of routes that is open, and presses «Agregar ruta». */
export async function addRoute(routes: Locator, destination: string, nextHop: string) {
  await routes.getByRole('button', { name: destination, exact: true }).click();
  await routes.getByRole('button', { name: nextHop, exact: true }).click();
  await routes.getByRole('button', { name: ADD_ROUTE, exact: true }).click();
}

/** Writes the two routes that give router-oficina a way out and a way to the other office, in the table of its card. */
export async function giveRouterOficinaItsWays(page: Page) {
  const routes = await openCard(page, OFFICE_ROUTER);
  await addRoute(routes, ANYWHERE, PROVIDER_HOP);
  await addRoute(routes, OTHER_OFFICE_BLOCK, BRANCH_HOP);
  await confirm(routes);
  await expect(routes).toBeHidden();
}

async function playAWayToTheOtherOffice(page: Page) {
  const first = await openTerminal(page);
  await sendTo(first, IP.server);
  await confirm(first);
  await expect(first).toBeHidden();
  await giveRouterOficinaItsWays(page);
  const terminal = await openTerminal(page);
  for (const ip of [IP.server, IP.otherOffice, OTHER_OFFICE_LAPTOP]) await sendTo(terminal, ip);
  await confirm(terminal);
  await expect(terminal).toBeHidden();
  await submitAndFinish(page, /tiene el prefijo más largo/);
}

/** Sends the nc to port 80 of the server from the terminal of the laptop and closes the terminal. */
async function sendTheWebNc(page: Page, laptop: string) {
  const terminal = await openTerminal(page, laptop);
  await sendMessage(terminal, NC_TO_THE_WEB_PORT);
  await confirm(terminal);
  await expect(terminal).toBeHidden();
}

async function playOneAddressForTheWholeOffice(page: Page) {
  await sendTheWebNc(page, YOUR_LAPTOP);
  await sendTheWebNc(page, LUCIA);
  await openCard(page, OFFICE_ROUTER);
  await page.getByRole('tab', { name: TRANSLATIONS_TAB, exact: true }).click();
  const translations = card(page, TRANSLATIONS_CARD);
  await expect(translations.getByRole('row', { name: new RegExp(FIRST_PUBLIC_PORT) })).toBeVisible();
  await expect(translations.getByRole('row', { name: new RegExp(SECOND_PUBLIC_PORT) })).toBeVisible();
  await confirm(translations);
  await expect(translations).toBeHidden();
  await submitAndFinish(page, /Por el puerto: cada conexión tiene su fila con su puerto público/);
}

async function playFromOutside(page: Page) {
  const terminal = await openTerminal(page, HOME);
  await sendMessage(terminal, NC_TO_THE_UNMAPPED_PORT);
  await sendMessage(terminal, NC_TO_THE_APP);
  await confirm(terminal);
  await expect(terminal).toBeHidden();
  await submitAndFinish(page, /no había ninguna fila para ese puerto/);
}

/** How each incident of chapter 2 is played with the mouse, in game order. Each content task adds the incident it builds: its title as the roadmap shows it and the moves that earn the stars. */
export const CHAPTER_2: PlayedIncident[] = [
  { id: '02-01', title: 'Un equipo, muchos servicios', play: playOneMachineManyServices },
  { id: '02-02', title: 'Abrir una conexión', play: playOpeningAConnection },
  { id: '02-03', title: 'Rechazo o silencio', play: playRefusedOrSilent },
  { id: '02-04', title: '¿Está en mi bloque?', play: playIsItInMyBlock },
  { id: '02-05', title: 'La regla completa', play: playTheWholeRule },
  { id: '02-06', title: 'Tu tabla de rutas', play: playYourRoutingTable },
  { id: '02-07', title: 'Un camino a la otra oficina', play: playAWayToTheOtherOffice },
  { id: '02-08', title: 'Una IP para toda la oficina', play: playOneAddressForTheWholeOffice },
  { id: '02-09', title: 'Desde afuera', play: playFromOutside },
];
