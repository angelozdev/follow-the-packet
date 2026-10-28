import { expect, type Locator, type Page } from '@playwright/test';
import { card, confirm, openCard, openTerminal, sendMessage, sendTo } from '@e2e/cards';
import { closeCase, submitAndFinish } from '@e2e/closing';
import { IP, type PlayedIncident } from '@e2e/chapter-1/chapter-1-play';

const NC_TO_THE_APP = 'nc · puerto 3000';
const NC_TO_THE_DATABASE = 'nc · puerto 5432';
const NC_TO_THE_CLOSED_PORT = 'nc · puerto 3306';
const NC_TO_THE_WEB_PORT = 'nc · puerto 80';
const NC_TO_THE_UNMAPPED_PORT = 'nc · puerto 40009';
const DIG = 'dig';
const PING = 'ping';
const LUCIA = 'laptop-lucia';
const SERVICES_TAB = 'Ajustes';
const EVERY_IP_CHIP = 'Todas las IPs (0.0.0.0)';
const YOUR_LAPTOP = 'tu-laptop';
const BLOCK = '192.168.1.0/24';
const MASK = '255.255.255.0';
const CLASSIFY_TAB = 'Clasificar';
const INSIDE_THE_BLOCK = `Dentro de ${BLOCK}`;
const OUTSIDE_THE_BLOCK = 'Fuera';
const PRINTER = 'impresora';
const ANDRES = 'laptop-andres';
const LUCIA_FIREWALL = 'firewall laptop-lucia';
const TABLES_TAB = 'Tablas';
const OFFICE_ROUTER = 'router-oficina';
const ANYWHERE = '0.0.0.0/0';
const OTHER_OFFICE_BLOCK = '10.0.0.0/16';
const OTHER_OFFICE_LAPTOP = '10.0.0.20';
const PROVIDER_HOP = '203.0.113.1 router-proveedor';
const BRANCH_HOP = '172.16.0.2 router-sucursal';
const TRANSLATIONS_TAB = 'Tabla de traducciones';
const HOME = 'casa-lucia';
const FIRST_PUBLIC_PORT = '40001';
const SECOND_PUBLIC_PORT = '40002';
const ADD_ROUTE = 'Agregar ruta';
const IN_USE = 'en uso';
const DEFAULT_ROW = /0\.0\.0\.0\/0/;
const AUTHORITATIVE = 'servidor-autoritativo';
const NAME_TRAY = 'Nombre';
const TYPE_TRAY = 'Tipo';
const VALUE_TRAY = 'Valor';
const ADD_RECORD = 'Agregar registro';
const REMOVE_RECORD = 'Quitar';
const WWW = 'www.lucia.example';
const BLOG = 'blog.lucia.example';
const SITE_IP = '198.51.100.50';
const NOBODY_IP = '198.51.100.51';
const CNAME = 'CNAME';
const A_RECORD = 'A';
const REFUSED_ALIAS = 'un nombre con un registro CNAME no puede tener otros';
const SEND = 'Enviar';
const RESOLVER = 'servidor-dns';
const FIVE_MINUTES = 'Esperar 5 min';
const NEW_SITE_IP = '198.51.100.60';
const MISSING_NAME = 'noexiste.lucia.example';
const NEWS_NAME = 'www.noticias.example';
const SHOP_NAME = 'tienda.lucia.example';
const SSH_CHIP = 'TCP · 22';
const YOUR_LAPTOP_CHIP = 'tu-laptop (IP 192.168.1.10)';
const NC_TO_SSH = 'nc · puerto 22';
const TRACEROUTE = 'traceroute';
const PROVIDER = 'router-proveedor';
const REMOVE_THE_DEFAULT_ROUTE = /^Quitar 0\.0\.0\.0\/0/;
const SERVERS_BLOCK = '198.51.100.0/24';
const DESTINATION_HOP = '203.0.113.2 router-destino';
const LOOP_CASE_INDEX = 4;

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
async function sendNc(terminal: Locator, ip: string, message: string) {
  await terminal.getByRole('button', { name: ip, exact: true }).click();
  await sendMessage(terminal, message);
}

async function sendEachNc(terminal: Locator, sends: { ip: string; message: string }[]) {
  for (const { ip, message } of sends) await sendNc(terminal, ip, message);
}

/** Sends the nc to the app of laptop-lucia, which the app on 127.0.0.1 refuses, opens the tab «Ajustes» of the panel of laptop-lucia, picks «Todas las IPs», which clears the stamps, and sends the four tests again: the closed port, the silence of laptop-marta, the app from your laptop and the app from laptop-lucia herself. */
async function playRefusedOrSilent(page: Page) {
  await sendEachNc(await openTerminal(page), [{ ip: IP.lucia, message: NC_TO_THE_APP }]);
  const services = await openCard(page, LUCIA, SERVICES_TAB);
  await services.getByRole('button', { name: EVERY_IP_CHIP, exact: true }).click();
  await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(0);
  await sendEachNc(await openTerminal(page), [
    { ip: IP.lucia, message: NC_TO_THE_CLOSED_PORT },
    { ip: IP.marta, message: NC_TO_THE_APP },
    { ip: IP.lucia, message: NC_TO_THE_APP },
  ]);
  await sendEachNc(await openTerminal(page, LUCIA), [{ ip: IP.loopback, message: NC_TO_THE_APP }]);
  await submitAndFinish(page, /y tu paquete iba a otra IP/);
}

/** Opens the panel of your laptop from its label, on the ficha «Clasificar» of its tab «Preguntas», and returns it. */
async function openTheClassifyCard(page: Page): Promise<Locator> {
  const opened = await openCard(page, YOUR_LAPTOP);
  await opened.getByRole('tab', { name: CLASSIFY_TAB, exact: true }).click();
  return opened;
}

/** Picks the item up in the card that classifies and presses the button that puts it in the bin, which can be the bin it is already in or the other one. */
async function placeInBin(card: Locator, item: string, bin: string) {
  await card.getByRole('button', { name: new RegExp(`^${item}`) }).click();
  await card.getByRole('button', { name: `Poner ${item} en ${bin}`, exact: true }).click();
}

/** Opens the card that classifies and puts the item in the bin. */
async function classify(page: Page, item: string, bin: string) {
  await placeInBin(await openTheClassifyCard(page), item, bin);
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
  await submitAndFinish(page, /Porque 0\.0\.0\.0\/0 quiere decir cualquier origen/);
}

async function playYourRoutingTable(page: Page) {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.printer);
  await sendTo(terminal, IP.andres);
  await page.getByRole('tab', { name: TABLES_TAB, exact: true }).click();
  const routes = card(page, YOUR_LAPTOP);
  await expect(routes.getByRole('row', { name: DEFAULT_ROW })).toContainText(IN_USE);
  await submitAndFinish(page, /Porque ninguna otra fila cubre 192\.168\.2\.15/);
}

/** Picks a destination and a next hop in the table of routes that is open, and presses «Agregar ruta». */
async function addRoute(routes: Locator, destination: string, nextHop: string) {
  await routes.getByRole('button', { name: destination, exact: true }).click();
  await routes.getByRole('button', { name: nextHop, exact: true }).click();
  await routes.getByRole('button', { name: ADD_ROUTE, exact: true }).click();
}

/** Writes the two routes that give router-oficina a way out and a way to the other office, in the table of its card. */
async function giveRouterOficinaItsWays(page: Page) {
  const routes = await openCard(page, OFFICE_ROUTER);
  await addRoute(routes, ANYWHERE, PROVIDER_HOP);
  await addRoute(routes, OTHER_OFFICE_BLOCK, BRANCH_HOP);
}

async function playAWayToTheOtherOffice(page: Page) {
  const first = await openTerminal(page);
  await sendTo(first, IP.server);
  await giveRouterOficinaItsWays(page);
  const terminal = await openTerminal(page);
  for (const ip of [IP.server, IP.otherOffice, OTHER_OFFICE_LAPTOP]) await sendTo(terminal, ip);
  await submitAndFinish(page, /tiene el prefijo más largo/);
}

/** Sends the nc to port 80 of the server from the terminal of the laptop. */
async function sendTheWebNc(page: Page, laptop: string) {
  await sendMessage(await openTerminal(page, laptop), NC_TO_THE_WEB_PORT);
}

async function playOneAddressForTheWholeOffice(page: Page) {
  await sendTheWebNc(page, YOUR_LAPTOP);
  await sendTheWebNc(page, LUCIA);
  const translations = await openCard(page, OFFICE_ROUTER, TRANSLATIONS_TAB);
  await expect(translations.getByRole('row', { name: new RegExp(FIRST_PUBLIC_PORT) })).toBeVisible();
  await expect(translations.getByRole('row', { name: new RegExp(SECOND_PUBLIC_PORT) })).toBeVisible();
  await submitAndFinish(page, /Por el puerto: cada conexión tiene su fila con su puerto público/);
}

async function playFromOutside(page: Page) {
  const terminal = await openTerminal(page, HOME);
  await sendMessage(terminal, NC_TO_THE_UNMAPPED_PORT);
  await sendMessage(terminal, NC_TO_THE_APP);
  await submitAndFinish(page, /no había ninguna fila para ese puerto/);
}

/** Takes the page of the open incident 02-10; sends the dig and the ping to the name of the site from the terminal of your laptop and answers the question of Lucía until the result shows 3 stars. */
export async function playAskingForAName(page: Page) {
  const terminal = await openTerminal(page);
  await sendMessage(terminal, DIG);
  await sendMessage(terminal, PING);
  await submitAndFinish(page, /Porque usa UDP, que manda cada mensaje suelto/);
}

/** Picks the name, the type and the value in the three trays of the table of records that is open and presses «Agregar registro». */
async function addRecord(records: Locator, name: string, type: string, value: string) {
  for (const [tray, chip] of [[NAME_TRAY, name], [TYPE_TRAY, type], [VALUE_TRAY, value]]) await records.getByRole('group', { name: tray }).getByRole('button', { name: chip, exact: true }).click();
  await records.getByRole('button', { name: ADD_RECORD, exact: true }).click();
}

/** Takes away the row of the table of records that is open and has this name, type and value. */
async function removeRecord(records: Locator, name: string, type: string, value: string) {
  await records.getByRole('button', { name: `${REMOVE_RECORD} ${name} ${type} ${value}` }).click();
}

/** Takes the page of the open incident 02-11; opens the panel of servidor-autoritativo, which has the records as its only table; tries the alias of blog while it has its address record, which the table refuses with its reason, takes away the wrong address records and writes the right ones, sends the nc to www and the dig to blog from the terminal of your laptop and answers the question of Lucía until the result shows 3 stars. */
export async function playTheRecords(page: Page) {
  const records = await openCard(page, AUTHORITATIVE);
  await addRecord(records, BLOG, CNAME, WWW);
  await expect(records.getByRole('status')).toContainText(REFUSED_ALIAS);
  await removeRecord(records, BLOG, A_RECORD, NOBODY_IP);
  await addRecord(records, BLOG, CNAME, WWW);
  await removeRecord(records, WWW, A_RECORD, NOBODY_IP);
  await addRecord(records, WWW, A_RECORD, SITE_IP);
  const terminal = await openTerminal(page);
  await sendNc(terminal, WWW, NC_TO_THE_WEB_PORT);
  await sendNc(terminal, BLOG, DIG);
  await submitAndFinish(page, /Porque un nombre con un CNAME no puede tener otros registros/);
}

/** Sends the dig for the site from the terminal of your laptop, which has one message and one address and so draws no tray for either. */
async function digTheSite(page: Page) {
  const terminal = await openTerminal(page);
  await terminal.getByRole('button', { name: SEND, exact: true }).click();
}

/** Takes the page of the open incident 02-12; sends the dig, which the cache of servidor-dns answers with the old IP, waits five minutes with the chip of the card «Reloj del juego», sends the dig again, reads the new IP in the panel of servidor-dns, which has the cache as its only table, and answers the question of Lucía until the result shows 3 stars. */
export async function playStillTheOldIp(page: Page) {
  await digTheSite(page);
  await page.getByRole('button', { name: FIVE_MINUTES, exact: true }).click();
  await digTheSite(page);
  const cache = await openCard(page, RESOLVER);
  await expect(cache.getByRole('row', { name: new RegExp(NEW_SITE_IP) })).toBeVisible();
  await submitAndFinish(page, /guarda la respuesta en caché hasta que vence su TTL/);
}

/** Takes the page of the open incident 02-13; sends from the terminal of your laptop the dig to the name that does not exist, to the one whose server failed and to the shop, and the ping to the shop, and from the terminal of laptop-andres the dig to the site, whose resolver is the printer; each terminal has a tray of addresses and a tray of messages; then answers the question of Lucía until the result shows 3 stars. */
export async function playItDoesNotResolve(page: Page) {
  const yours = await openTerminal(page);
  await sendNc(yours, MISSING_NAME, DIG);
  await sendNc(yours, NEWS_NAME, DIG);
  await sendNc(yours, SHOP_NAME, DIG);
  await sendNc(yours, SHOP_NAME, PING);
  const andres = await openTerminal(page, ANDRES);
  await sendNc(andres, WWW, DIG);
  await submitAndFinish(page, /Porque el ping usa el archivo hosts y el dig no/);
}

/** Sends each message, one after the other, from the open terminal, which has a single address and so draws no tray for it. */
async function sendMessages(terminal: Locator, messages: string[]) {
  for (const message of messages) await sendMessage(terminal, message);
}

/** Sends a ping to each address, one after the other, from the open terminal, which has a single message and so draws no tray for it. */
async function sendPingsTo(terminal: Locator, addresses: string[]) {
  for (const address of addresses) await sendTo(terminal, address);
}

/** Opens the panel of router-proveedor, whose only table in this case is its routes, takes away the default route that sends everything back to router-oficina and writes the block of the servers towards router-destino. */
async function repairTheLoop(page: Page) {
  const routes = await openCard(page, PROVIDER);
  await routes.getByRole('button', { name: REMOVE_THE_DEFAULT_ROUTE }).click();
  await addRoute(routes, SERVERS_BLOCK, DESTINATION_HOP);
}

interface OnCallCase {
  from: string;
  send: (terminal: Locator) => Promise<void>;
  cause: RegExp;
}

const ON_CALL_CASES: OnCallCase[] = [
  { from: YOUR_LAPTOP, send: (terminal) => sendMessages(terminal, [DIG, PING, NC_TO_THE_WEB_PORT]), cause: /Porque el servicio escucha solo en 127\.0\.0\.1/ },
  { from: YOUR_LAPTOP, send: (terminal) => sendMessages(terminal, [DIG, NC_TO_THE_WEB_PORT]), cause: /Porque el nombre está mal escrito y no existe/ },
  { from: YOUR_LAPTOP, send: (terminal) => sendMessages(terminal, [DIG, PING]), cause: /Porque el archivo hosts de tu-laptop tiene una línea vieja/ },
  { from: YOUR_LAPTOP, send: (terminal) => sendPingsTo(terminal, [IP.server, IP.otherOffice]), cause: /Porque router-oficina no tiene ruta por defecto/ },
  { from: YOUR_LAPTOP, send: (terminal) => sendMessages(terminal, [PING, TRACEROUTE]), cause: /Porque el paquete da vueltas entre dos routers/ },
  { from: YOUR_LAPTOP, send: (terminal) => sendMessages(terminal, [NC_TO_SSH, NC_TO_THE_APP]), cause: /Porque el firewall de laptop-lucia no deja entrar el 3000/ },
  { from: ANDRES, send: (terminal) => terminal.getByRole('button', { name: SEND, exact: true }).click(), cause: /Porque la impresora es su servidor DNS y no atiende DNS/ },
];

/** Takes the page of the open incident 02-14; in each of its seven cases sends the tests from the terminal of the origin and names the cause; in the fifth, the loop, it also repairs the routes of router-proveedor from its panel and pings again; after the seventh it opens the result, which must show 3 stars. */
export async function playOnCallItDoesNotConnect(page: Page) {
  for (const [index, { from, send, cause }] of ON_CALL_CASES.entries()) {
    const terminal = await openTerminal(page, from);
    await send(terminal);
    if (index === LOOP_CASE_INDEX) {
      await repairTheLoop(page);
      const again = await openTerminal(page, from);
      await sendMessages(again, [PING]);
    }
    await closeCase(page, cause, index === ON_CALL_CASES.length - 1);
  }
}

/** The incidents of chapter 2 in game order, each with its id, its title as the roadmap shows it and the function that plays it. */
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
  { id: '02-10', title: 'Preguntar por un nombre', play: playAskingForAName },
  { id: '02-11', title: 'Los registros', play: playTheRecords },
  { id: '02-12', title: 'Todavía la vieja IP', play: playStillTheOldIp },
  { id: '02-13', title: 'No resuelve', play: playItDoesNotResolve },
  { id: '02-14', title: 'Guardia: no conecta', play: playOnCallItDoesNotConnect },
];
