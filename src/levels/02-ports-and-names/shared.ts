import { nameTag } from '@/copy';
import type { NetworkAction, Service } from '@/engine';
import type { ExpectedOutcome, MessageChip, OriginChip, SendMove, SendTask, SettingSpec } from '@/levels/contract/incident';
import {
  ADDRESS as CHAPTER_1_ADDRESS,
  DEVICE as CHAPTER_1_DEVICE,
  IP as CHAPTER_1_IP,
  LUCIA_FIREWALL,
  MESSAGE as CHAPTER_1_MESSAGE,
  NAME as CHAPTER_1_NAME,
  ORIGIN as CHAPTER_1_ORIGIN,
  ROUTER as CHAPTER_1_ROUTER,
  SERVER as CHAPTER_1_SERVER,
} from '@/levels/01-first-day/shared';

export { CONCEPT, FIREWALL, LESSON, pingTask, sendMove, sendTask } from '@/levels/01-first-day/shared';

export const PORT = {
  ssh: 22,
  dns: 53,
  web: 80,
  secureWeb: 443,
  app: 3000,
  mysql: 3306,
  database: 5432,
  unmapped: 40009,
} as const;

/** The addresses of the world chapter 2 starts from and grows. The first group is the office of 01-14 as chapter 1 leaves it; the rest arrives block by block. Every address that is public is one of the three blocks RFC 5737 reserves for documentation (192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24), used as if it were public. */
export const IP = {
  you: CHAPTER_1_IP.you,
  lucia: CHAPTER_1_IP.lucia,
  marta: CHAPTER_1_IP.marta,
  printer: CHAPTER_1_IP.printer,
  visitor: CHAPTER_1_IP.visitor,
  andres: CHAPTER_1_IP.andres,
  loopback: CHAPTER_1_IP.loopback,
  router: CHAPTER_1_IP.router,
  routerSecondFloor: CHAPTER_1_IP.routerSecondFloor,
  officeUplink: CHAPTER_1_IP.officeUplink,
  provider: CHAPTER_1_IP.provider,
  providerOnward: CHAPTER_1_IP.providerOnward,
  destination: CHAPTER_1_IP.destination,
  destinationServer: CHAPTER_1_IP.destinationServer,
  server: CHAPTER_1_IP.server,
  otherOfficePrinter: CHAPTER_1_IP.otherOfficePrinter,
  otherOfficeLaptop: '10.0.0.20',
  branchRouter: '10.0.0.1',
  officeLink: '172.16.0.1',
  branchLink: '172.16.0.2',
  home: '192.0.2.77',
  resolver: '198.51.100.8',
  authoritative: '198.51.100.53',
  newsAuthoritative: '198.51.100.54',
  freshServer: '198.51.100.60',
  nobodyOutside: '198.51.100.51',
  staleHost: '198.51.100.70',
  destinationResolver: '198.51.100.2',
  destinationAuthoritative: '198.51.100.3',
  destinationNewsAuthoritative: '198.51.100.4',
  destinationFreshServer: '198.51.100.5',
} as const;

/** The zones of the game. RFC 2606 §2 reserves `.example` for documentation, so every name of the game is under it. */
export const DOMAIN = { site: 'lucia.example', news: 'noticias.example' } as const;

export const HOSTNAME = {
  www: `www.${DOMAIN.site}`,
  blog: `blog.${DOMAIN.site}`,
  shop: `tienda.${DOMAIN.site}`,
  missing: `noexiste.${DOMAIN.site}`,
  typo: `wwww.${DOMAIN.site}`,
  newsWww: `www.${DOMAIN.news}`,
} as const;

export const DEVICE = {
  ...CHAPTER_1_DEVICE,
  branchPrinter: { id: 'branch-printer', name: 'impresora-sucursal' },
  branchLaptop: { id: 'branch-laptop', name: 'laptop-sucursal' },
} as const;

export const ROUTER = { ...CHAPTER_1_ROUTER, branch: { id: 'branch-router', name: 'router-sucursal' } } as const;

/** The servers of the internet. The first is the server of chapter 1; the servers of names and the one the site moves to arrive in block 5. */
export const SERVER = {
  internet: CHAPTER_1_SERVER,
  resolver: { id: 'dns-server', name: 'servidor-dns' },
  authoritative: { id: 'authoritative-server', name: 'servidor-autoritativo' },
  news: { id: 'news-authoritative-server', name: 'servidor-autoritativo-noticias' },
  fresh: { id: 'new-server', name: 'servidor-nuevo' },
} as const;

/** The client of the internet that sends from outside the office (02-09). */
export const CLIENT = { home: { id: 'lucia-home', name: 'casa-lucia' } } as const;

export const NAME = {
  ...CHAPTER_1_NAME,
  destination: nameTag(ROUTER.destination.name),
  branchRouter: nameTag(ROUTER.branch.name),
  branchPrinter: nameTag(DEVICE.branchPrinter.name),
  branchLaptop: nameTag(DEVICE.branchLaptop.name),
  home: nameTag(CLIENT.home.name),
  resolver: nameTag(SERVER.resolver.name),
  authoritative: nameTag(SERVER.authoritative.name),
  newsAuthoritative: nameTag(SERVER.news.name),
  freshServer: nameTag(SERVER.fresh.name),
} as const;

/** The terminals chapter 2 sends from: those of chapter 1 and the one of laptop-lucia, which 02-03 uses to test her own app from her own laptop. */
export const ORIGIN = { ...CHAPTER_1_ORIGIN, lucia: { id: 'lucia', endpoint: { kind: 'device', id: DEVICE.lucia.id } } } satisfies Record<string, OriginChip>;

/** The address chips chapter 2 sends to: those of chapter 1, one id and one address each. */
export const ADDRESS = { ...CHAPTER_1_ADDRESS } as const;

/** Returns the message of an `nc -vz -w 3` to this port, such as `nc · puerto 3000`: the port is part of the chip and not a tray of its own, so the terminal keeps its three trays. */
function ncMessage(port: number): MessageChip {
  return { id: `nc-${port}`, label: `{{nc}} · {{port|puerto}} ${port}`, command: 'nc', port };
}

export const MESSAGE = {
  ...CHAPTER_1_MESSAGE,
  ncApp: ncMessage(PORT.app),
  ncDatabase: ncMessage(PORT.database),
  ncMysql: ncMessage(PORT.mysql),
} as const;

export const TASK = {
  ping: 'ping-to-lucia',
  app: 'nc-to-app',
  database: 'nc-to-database',
  openApp: 'open-connection-to-app',
  openDatabase: 'open-connection-to-database',
  closedPort: 'nc-to-closed-port',
  filteredPort: 'nc-to-filtered-port',
  ownMachine: 'nc-to-own-machine',
  fromTheNetwork: 'nc-to-app-from-the-network',
} as const;

/** Returns the task of a send incident that expects what a message sent from this terminal to an address ends in, and, when `by` is given, who answered, warned or dropped it. `sendTask` of chapter 1 is this one for your laptop. */
export function sendTaskFrom(origin: OriginChip, id: string, text: string, messageId: string, toId: string, outcome: ExpectedOutcome, by?: string): SendTask {
  return { id, text, expect: { fromId: origin.id, toId, messageId, outcome, by } };
}

/** Returns the move that sends a message from this terminal to an address, for the reference solution of a send incident. `sendMove` of chapter 1 is this one for your laptop. */
export function sendMoveFrom(origin: OriginChip, toId: string, messageId: string): SendMove {
  return { type: 'sendPacket', fromId: origin.id, toId, messageId };
}

/** Returns the TCP service of a program that listens on a port, on every IP of its device unless it says otherwise. */
function tcpService(port: number, listen: Service['listen'] = 'all'): Service {
  return { protocol: 'tcp', port, listen };
}

const APP = tcpService(PORT.app);
const DATABASE = tcpService(PORT.database);
const SSH = tcpService(PORT.ssh);

/** What 02-01 changes: Lucía put her app (port 3000) and her test database (port 5432) to work on laptop-lucia, each listening on every IP of the laptop. Nothing else about the office changes. */
export const LUCIA_SERVICES: NetworkAction = { type: 'setServices', ownerId: DEVICE.lucia.id, services: [APP, DATABASE] };

/** What 02-03 changes: Lucía restarted her app and it listens only on 127.0.0.1, the address of the laptop itself. Her database keeps listening on every IP. */
export const APP_ON_LOOPBACK: NetworkAction = { type: 'setListenAddress', ownerId: DEVICE.lucia.id, protocol: 'tcp', port: PORT.app, listen: 'loopback' };

export const APP_LISTEN = { setting: 'app-listen-address', loopback: 'loopback', all: 'all' } as const;

/** The setting of 02-03 on the «Servicios» tab of laptop-lucia: the listen address of her app (TCP, port 3000). It sits on the device that listens and not on the one that tests. Each chip says its address in words and carries the value the engine takes. */
export const APP_LISTEN_ADDRESS: SettingSpec = {
  id: APP_LISTEN.setting,
  deviceId: DEVICE.lucia.id,
  kind: 'listen-address',
  service: { protocol: 'tcp', port: PORT.app },
  name: '{{listen-address}}',
  chips: [
    { id: APP_LISTEN.loopback, label: 'Solo este {{device|dispositivo}} (127.0.0.1)', value: 'loopback' },
    { id: APP_LISTEN.all, label: 'Todas las {{ip-address|IPs}} (0.0.0.0)', value: 'all' },
  ],
};

/** What 02-05 changes on laptop-lucia: SSH (port 22) is on, beside her app and her database, and a firewall of the laptop lets nothing in and everything out. `setServices` replaces the list, so it holds all three. */
export const SSH_AND_FIREWALL: NetworkAction[] = [{ type: 'setServices', ownerId: DEVICE.lucia.id, services: [APP, DATABASE, SSH] }, LUCIA_FIREWALL];

/** The ids of the pieces 02-01 and 02-02 draw: your laptop and the laptop that has the services. The rest of the office stays in the world and is not used. */
export const SERVICES_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id];

/** The ids of the pieces 02-03 draws: the two laptops of the services and laptop-marta, whose firewall is drawn with it and is what keeps the silence. */
export const REFUSAL_PIECES: string[] = [...SERVICES_PIECES, DEVICE.marta.id];

/** The ids of the pieces 02-04 and 02-06 draw: your laptop, the printer and laptop-andres, which are on the two floors, and the router between them. */
export const FLOORS_PIECES: string[] = [DEVICE.you.id, DEVICE.printer.id, DEVICE.andres.id, ROUTER.office.id];

/** The ids of the pieces 02-05 draws: your laptop, which must get into SSH, laptop-lucia, which has it, and the visitor's laptop, which must not. */
export const SSH_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id, DEVICE.visitor.id];

/** The ids of the pieces 02-07 draws: your laptop, the two routers of the way out and the one of the other office, its printer and laptop, and the server of the internet. The router in front of the server is in the world and is not drawn. */
export const ROUTES_PIECES: string[] = [DEVICE.you.id, ROUTER.office.id, ROUTER.provider.id, ROUTER.branch.id, DEVICE.branchPrinter.id, DEVICE.branchLaptop.id, SERVER.internet.id];

/** The ids of the pieces 02-08 draws: the two laptops that send, the router that translates and the server they reach. */
export const TRANSLATION_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id, ROUTER.office.id, SERVER.internet.id];

/** The ids of the pieces 02-09 draws: the client outside, the router that receives it and the laptop its forward reaches. */
export const OUTSIDE_PIECES: string[] = [CLIENT.home.id, ROUTER.office.id, DEVICE.andres.id];

/** The ids of the pieces 02-10 draws: your laptop, its router, the resolver and the server of the internet. The authoritative server waits for 02-11, where its term is introduced. */
export const NAMES_PIECES: string[] = [DEVICE.you.id, ROUTER.office.id, SERVER.resolver.id, SERVER.internet.id];

/** The ids of the pieces 02-11 draws: your laptop, the resolver, the authoritative server and the server of the internet. */
export const RECORDS_PIECES: string[] = [DEVICE.you.id, SERVER.resolver.id, SERVER.authoritative.id, SERVER.internet.id];

/** The ids of the pieces 02-12 draws: those of 02-11 and the server the site moved to. */
export const CACHE_PIECES: string[] = [...RECORDS_PIECES, SERVER.fresh.id];

/** The ids of the pieces 02-13 draws: your laptop, laptop-andres and the printer that is its resolver, the resolver, both authoritative servers and the server of the internet. */
export const FAILURES_PIECES: string[] = [DEVICE.you.id, DEVICE.andres.id, DEVICE.printer.id, SERVER.resolver.id, SERVER.authoritative.id, SERVER.news.id, SERVER.internet.id];
