import { expect, type Locator, type Page } from '@playwright/test';
import { confirm, openCard, openTerminal, sendMessage, sendTo } from '@e2e/cards';
import { closeCase, submitAndFinish } from '@e2e/closing';

export const IP = {
  you: '192.168.1.10',
  lucia: '192.168.1.11',
  marta: '192.168.1.12',
  printer: '192.168.1.21',
  typo: '192.168.1.22',
  nobody: '192.168.1.50',
  note: '192.168.1.300',
  router: '192.168.1.1',
  andres: '192.168.2.15',
  secondFloorRouter: '192.168.2.1',
  loopback: '127.0.0.1',
  server: '198.51.100.50',
  otherOffice: '10.0.0.10',
} as const;

export const SETTINGS_TAB = 'Ajustes de red';
export const SETTINGS_CARD = 'Ajustes de red de tu-laptop';

const NOTE_FEEDBACK = 'cada uno de los cuatro números va de 0 a 255';
const NOTE_RULE = 'La nota de Lucía estaba mal';
const ECHO_REQUEST = 'ICMP · Echo Request';
const LUCIA_CHIP = 'laptop-lucia (IP 192.168.1.11)';
const OUTBOUND_TAB = /^salida$/i;
const PING_TTLS = [1, 2, 3, 64];
const PING_MESSAGE = 'ping';
const TRACEROUTE_MESSAGES = [PING_MESSAGE, 'traceroute'];
const ARRIVED_AT_ANDRES = /^Paquete: ping de tu-laptop a laptop-andres\. Llegó\.$/;
const LOST_TO_ANDRES = /^Paquete: ping de tu-laptop a 192\.168\.2\.15\. Perdido\.$/;
const ARRIVED_AT_SERVER = /^Paquete: ping de tu-laptop a servidor-internet\. Llegó\.$/;
const LOST_TO_OTHER_OFFICE = /^Paquete: ping de tu-laptop a 10\.0\.0\.10\. Perdido\.$/;
export const LOST_TO_SERVER = /^Paquete: ping de tu-laptop a 198\.51\.100\.50\. Perdido\.$/;
const WARNED_BY_ROUTER = /^Paquete: ping de tu-laptop a 198\.51\.100\.50\. Apareció un aviso\.$/;

export interface PlayedIncident {
  id: string;
  title: string;
  play: (page: Page) => Promise<void>;
}

export interface WatchCase {
  laptop?: string;
  sends: string[];
  messages?: string[];
  cause: RegExp;
}

export const WATCH_CASES: WatchCase[] = [
  { sends: [IP.loopback, IP.you, IP.router, IP.server], cause: /Porque tu-laptop no tiene puerta de enlace predeterminada/ },
  { sends: [IP.typo, IP.printer], cause: /la IP está mal escrita y nadie la tiene/ },
  { laptop: 'laptop-andres', sends: [IP.loopback, IP.andres, IP.secondFloorRouter, IP.printer], cause: /Porque laptop-andres no tiene puerta de enlace predeterminada/ },
  { sends: [IP.server, IP.otherOffice], cause: /es una IP privada y internet no la entrega/ },
  { sends: [], messages: [...TRACEROUTE_MESSAGES, 'ping con TTL 1', 'ping con TTL 2', 'ping con TTL 3'], cause: /da vueltas entre los mismos dos routers/ },
  { sends: [IP.lucia, IP.printer, IP.router, IP.server], cause: /el firewall de laptop-lucia no deja entrar los pings/ },
  { sends: [IP.loopback, IP.you, IP.router, IP.server], cause: /el firewall de tu-laptop no deja salir ningún ping/ },
];

/** Sends a list of messages from the open terminal, one after the other. */
async function sendEach(terminal: Locator, messages: string[]) {
  for (const message of messages) await sendMessage(terminal, message);
}

/** Sends the pings that leave your laptop with each TTL the incident offers. */
export async function sendThePingsWithTtl(terminal: Locator) {
  await sendEach(terminal, PING_TTLS.map((ttl) => `ping con TTL ${ttl}`));
}

/** Sends only the ping of 01-10 from the open terminal: the player has not run a traceroute yet. */
export async function sendOnlyThePing(terminal: Locator) {
  await sendMessage(terminal, PING_MESSAGE);
}

/** Sends a ping and then a traceroute from the open terminal. */
export async function sendThePingAndTheTraceroute(terminal: Locator) {
  await sendEach(terminal, TRACEROUTE_MESSAGES);
}

/** Sends the packet of 01-02 to the printer: the terminal writes the line it will send before it goes. */
export async function sendThePacket(page: Page) {
  const terminal = await openTerminal(page);
  await terminal.getByRole('button', { name: IP.printer, exact: true }).click();
  await expect(terminal).toContainText(`paquete de tu-laptop a ${IP.printer}`);
  await terminal.getByRole('button', { name: 'Enviar', exact: true }).click();
}

async function playTheOffice(page: Page) {
  const visitor = await openCard(page, 'laptop-visita');
  await visitor.getByRole('button', { name: 'No', exact: true }).click();
  await confirm(visitor);
  await expect(visitor).toBeHidden();
  const printer = await openCard(page, 'impresora');
  await expect(printer.getByRole('button', { name: IP.note, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await confirm(printer);
  await expect(printer.getByRole('status')).toContainText(NOTE_FEEDBACK);
  await expect(printer.getByRole('status')).not.toContainText(NOTE_RULE);
  await printer.getByRole('button', { name: IP.printer, exact: true }).click();
  await confirm(printer);
  await expect(printer.getByRole('status')).toContainText(NOTE_RULE);
  await confirm(printer);
  await expect(printer).toBeHidden();
  await submitAndFinish(page, /en IPv4 los cuatro números van de 0 a 255/);
}

async function playTheEnvelope(page: Page) {
  await sendThePacket(page);
  await submitAndFinish(page, /su IP de destino era la de laptop-marta/);
}

async function playAreYouThere(page: Page) {
  await sendTo(await openTerminal(page), IP.printer);
  await submitAndFinish(page, /origen es la de la impresora y la IP de destino es la de tu-laptop/);
}

async function playPingYourself(page: Page) {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.loopback);
  await sendTo(terminal, IP.printer);
  await submitAndFinish(page, /no sale de tu-laptop: 127\.0\.0\.1 siempre es tu propio dispositivo/);
}

async function playWhenItDoesNotComeBack(page: Page) {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.marta);
  await sendTo(terminal, IP.nobody);
  await submitAndFinish(page, /Con el aviso alguien te dice que falló la entrega/);
}

async function playTheRouter(page: Page) {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.printer);
  await sendTo(terminal, IP.andres);
  await expect(page.getByRole('button', { name: ARRIVED_AT_ANDRES })).toBeVisible();
  await submitAndFinish(page, /está en otra red local y a esa solo se llega por el router/);
}

/** Opens the card of tu-laptop from its only button and goes to its tab «Ajustes de red», which is not the one it opens on, and returns the card. */
export async function openTheSettings(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'tu-laptop', exact: true }).click();
  await page.getByRole('tab', { name: SETTINGS_TAB, exact: true }).click();
  const settings = page.getByRole('dialog', { name: SETTINGS_CARD });
  await expect(settings).toBeVisible();
  return settings;
}

/** Sends the ping to laptop-andres, which is lost, picks the router as the default gateway in the tab «Ajustes de red» of the card of the laptop, which is open on its terminal, and sends it again, which now arrives: the pick clears the stamps of the old world. */
export async function fixTheGateway(page: Page) {
  await sendTo(await openTerminal(page), IP.andres);
  await expect(page.getByRole('button', { name: LOST_TO_ANDRES })).toBeVisible();
  await page.getByRole('tab', { name: SETTINGS_TAB, exact: true }).click();
  const settings = page.getByRole('dialog', { name: SETTINGS_CARD });
  await settings.getByRole('button', { name: IP.router, exact: true }).click();
  await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(0);
  await confirm(settings);
  await expect(settings).toBeHidden();
  await sendTo(await openTerminal(page), IP.andres);
  await expect(page.getByRole('button', { name: ARRIVED_AT_ANDRES })).toBeVisible();
}

async function playWhoGetsWhatsOutside(page: Page) {
  await fixTheGateway(page);
  await submitAndFinish(page, /no tenía puerta de enlace predeterminada/);
}

async function playTheNetworkOfNetworks(page: Page) {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.server);
  await expect(page.getByRole('button', { name: ARRIVED_AT_SERVER })).toBeVisible();
  await sendTo(terminal, IP.otherOffice);
  await expect(page.getByRole('button', { name: LOST_TO_OTHER_OFFICE })).toBeVisible();
  await submitAndFinish(page, /10\.0\.0\.10 es una IP privada y internet no la entrega/);
}

async function playCountingHops(page: Page) {
  const terminal = await openTerminal(page);
  await sendMessage(terminal, 'ping con TTL 3');
  await expect(page.getByRole('button', { name: WARNED_BY_ROUTER })).toHaveCount(1);
  await sendMessage(terminal, 'ping con TTL 64');
  await expect(page.getByRole('button', { name: WARNED_BY_ROUTER })).toHaveCount(2);
  await submitAndFinish(page, /daba vueltas entre dos routers y su TTL llegó a 0/);
}

async function playSeeingThePath(page: Page) {
  const terminal = await openTerminal(page);
  await sendOnlyThePing(terminal);
  await expect(page.getByRole('button', { name: LOST_TO_SERVER })).toBeVisible();
  await sendMessage(terminal, 'traceroute');
  const route = terminal.getByRole('list', { name: 'Salida de traceroute' });
  await expect(route).toContainText(IP.router);
  await expect(route).toContainText('203.0.113.1');
  await expect(route.getByRole('listitem')).toHaveCount(8);
  await submitAndFinish(page, /En el tramo que sigue a router-proveedor, el último router que contestó/);
}

async function playTheGuard(page: Page) {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.marta);
  await sendTo(terminal, IP.lucia);
  await submitAndFinish(page, /descartó el paquete y no avisó/);
}

async function playYourFirstRule(page: Page) {
  const firewall = await openCard(page, 'firewall laptop-marta');
  await firewall.getByRole('button', { name: ECHO_REQUEST, exact: true }).click();
  await firewall.getByRole('button', { name: LUCIA_CHIP, exact: true }).click();
  await confirm(firewall);
  await submitAndFinish(page, /lo que ninguna regla permite queda denegado/);
}

async function playInAndOut(page: Page) {
  const firewall = await openCard(page, 'firewall tu-laptop');
  await firewall.getByRole('tab', { name: OUTBOUND_TAB }).click();
  await firewall.getByRole('button', { name: ECHO_REQUEST, exact: true }).click();
  await firewall.getByRole('button', { name: LUCIA_CHIP, exact: true }).click();
  await confirm(firewall);
  await submitAndFinish(page, /controlan lo que llega, y las de la salida, lo que sale/);
}

/** Opens the terminal of the origin of a case of 01-14 and sends the tests the player runs in it. */
export async function sendTheTestsOfTheCase(page: Page, { laptop, sends, messages = [] }: WatchCase): Promise<Locator> {
  const terminal = await openTerminal(page, laptop);
  for (const ip of sends) await sendTo(terminal, ip);
  await sendEach(terminal, messages);
  return terminal;
}

async function playTheFinalWatch(page: Page) {
  for (const [index, watchCase] of WATCH_CASES.entries()) {
    await sendTheTestsOfTheCase(page, watchCase);
    await closeCase(page, watchCase.cause, index === WATCH_CASES.length - 1);
  }
}

export const CHAPTER_1: PlayedIncident[] = [
  { id: '01-01', title: 'La oficina', play: playTheOffice },
  { id: '01-02', title: 'El sobre', play: playTheEnvelope },
  { id: '01-03', title: '¿Estás ahí?', play: playAreYouThere },
  { id: '01-04', title: 'Ping a ti mismo', play: playPingYourself },
  { id: '01-05', title: 'Cuando no vuelve', play: playWhenItDoesNotComeBack },
  { id: '01-06', title: 'Tu red y el router', play: playTheRouter },
  { id: '01-07', title: 'A quién mandas lo de afuera', play: playWhoGetsWhatsOutside },
  { id: '01-08', title: 'La red de redes', play: playTheNetworkOfNetworks },
  { id: '01-09', title: 'Contar saltos', play: playCountingHops },
  { id: '01-10', title: 'Ver el camino', play: playSeeingThePath },
  { id: '01-11', title: 'El guardia', play: playTheGuard },
  { id: '01-12', title: 'Tu primera regla', play: playYourFirstRule },
  { id: '01-13', title: 'Entrar y salir', play: playInAndOut },
  { id: '01-14', title: 'Guardia final', play: playTheFinalWatch },
];
