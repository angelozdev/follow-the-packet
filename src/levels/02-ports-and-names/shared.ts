import { nameTag } from '@/copy';
import { RECORD_TTL, ROUTE_DEFAULT, zoneOf, type AnswerRecord, type DnsStatus, type HostLine, type Lan, type NetworkAction, type RouterInterface, type Service, type ServerActor } from '@/engine';
import type { CaseSpec, ClockStep, ExpectedOutcome, Flow, FlowKind, FromChip, MessageChip, OriginChip, PlaceEntryMove, RemoveEntryMove, SendMove, SendTask, SettingSpec, TableSpec, WaitMove, WhatChip } from '@/levels/contract/incident';
import { recordEntryId, routeEntryId } from '@/levels/contract/tables';
import {
  ADDRESS as CHAPTER_1_ADDRESS,
  DEVICE as CHAPTER_1_DEVICE,
  DESTINATION_INTERFACES,
  FLOOR as CHAPTER_1_FLOOR,
  FLOW as CHAPTER_1_FLOW,
  FROM as CHAPTER_1_FROM,
  HOP_MS,
  IP as CHAPTER_1_IP,
  LOOP_PIECES,
  LUCIA_FIREWALL,
  MESSAGE as CHAPTER_1_MESSAGE,
  NAME as CHAPTER_1_NAME,
  OFFICE_INTERFACES,
  ORIGIN as CHAPTER_1_ORIGIN,
  ROUTER as CHAPTER_1_ROUTER,
  SERVER as CHAPTER_1_SERVER,
  SERVER_MS,
  SERVER_RANGE,
  WHAT as CHAPTER_1_WHAT,
  addressChip,
  backToOffice,
  officeDevice,
} from '@/levels/01-first-day/shared';

export { CONCEPT, FIREWALL, LESSON, LOOP, LOOP_CAUSE, PING_WITH_TTL, SERVER_MS, pingTask, sendMove, sendTask } from '@/levels/01-first-day/shared';

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

/** The titles of the incidents that the text of another incident quotes. */
export const QUOTED_TITLE = { openingAConnection: 'Abrir una conexión', askingForAName: 'Preguntar por un nombre' } as const;

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

/** The terminals chapter 2 sends from: those of chapter 1, the one of laptop-lucia, which 02-03 uses to test her own app from her own laptop, and the one of casa-lucia, the client of the internet that 02-09 sends from. */
export const ORIGIN = {
  ...CHAPTER_1_ORIGIN,
  lucia: { id: 'lucia', endpoint: { kind: 'device', id: DEVICE.lucia.id } },
  home: { id: 'home', endpoint: { kind: 'actor', id: CLIENT.home.id } },
} satisfies Record<string, OriginChip>;

/** The address chips chapter 2 sends to: those of chapter 1, one id and one address each, the laptop of the other office (the printer of the other office is `otherOffice`, from chapter 1), the public IP of router-oficina, which is where a client outside the office writes to (02-09), the name of the site, which is the first address that is not an IP (02-10), the name of the blog, the second (02-11), and, in 02-13, a name that does not exist, the name of a site whose server fails and the name of the shop, which only the hosts file of your laptop knows. In 02-14 it also has the name of the site with one letter too many. */
export const ADDRESS = {
  ...CHAPTER_1_ADDRESS,
  otherLaptop: { id: 'ip-other-office-laptop', address: IP.otherOfficeLaptop },
  officePublic: { id: 'ip-office-public', address: IP.officeUplink },
  www: { id: 'name-www', address: HOSTNAME.www },
  blog: { id: 'name-blog', address: HOSTNAME.blog },
  missing: { id: 'name-missing', address: HOSTNAME.missing },
  news: { id: 'name-news', address: HOSTNAME.newsWww },
  shop: { id: 'name-shop', address: HOSTNAME.shop },
  mistyped: { id: 'name-mistyped', address: HOSTNAME.typo },
} as const;

/** Returns the message of an `nc -vz -w 3` to this port, such as `nc · puerto 3000`: the port is part of the chip and not a tray of its own, so the terminal keeps its three trays. */
function ncMessage(port: number): MessageChip {
  return { id: `nc-${port}`, label: `{{nc}} · {{port|puerto}} ${port}`, command: 'nc', port };
}

export const MESSAGE = {
  ...CHAPTER_1_MESSAGE,
  ncSsh: ncMessage(PORT.ssh),
  ncApp: ncMessage(PORT.app),
  ncDatabase: ncMessage(PORT.database),
  ncMysql: ncMessage(PORT.mysql),
  ncWeb: ncMessage(PORT.web),
  ncUnmapped: ncMessage(PORT.unmapped),
  dig: { id: 'dig', label: '{{dig}}', command: 'dig' },
} as const satisfies Record<string, MessageChip>;

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
  block: 'block-of-your-laptop',
  mask: 'mask-of-your-block',
  printerInside: 'printer-inside-the-block',
  andresOutside: 'laptop-andres-outside-the-block',
  sshOnlyYou: 'ssh-only-from-your-laptop',
  printerPing: 'ping-to-printer',
  andresPing: 'ping-to-andres',
  serverPing: 'ping-to-server',
  branchPrinterPing: 'ping-to-branch-printer',
  branchLaptopPing: 'ping-to-branch-laptop',
  webFromYou: 'nc-to-port-80-from-your-laptop',
  webFromLucia: 'nc-to-port-80-from-laptop-lucia',
  unsolicited: 'nc-from-outside-to-a-port-with-no-row',
  forwarded: 'nc-from-outside-to-the-forwarded-port',
  digWww: 'dig-of-the-site-name',
  pingWww: 'ping-to-the-site-name',
  webWww: 'nc-to-port-80-of-the-site-name',
  digBlog: 'dig-of-the-blog-name',
  digNewIp: 'dig-of-the-site-name-after-the-move',
  digMissing: 'dig-of-a-name-that-does-not-exist',
  digNews: 'dig-of-a-name-whose-server-fails',
  digShop: 'dig-of-the-shop-name',
  pingShop: 'ping-to-the-shop-name',
  digFromAndres: 'dig-from-laptop-andres',
} as const;

/** The block of the local network of your laptop, the first floor of the office, and its subnet mask: the /24 written as an IP (24 bits in 1 and 8 in 0). */
export const BLOCK = { cidr: CHAPTER_1_FLOOR.first.cidr, mask: '255.255.255.0' } as const;

/** The ids of the card of your laptop in 02-04: the tray of the block and the tray of the mask, each with its chips, and the tray and the two bins of the items it classifies. The first bin is the one of what fits in the block (a convention of the card that classifies). */
export const BLOCK_CARD = {
  block: { tray: 'block', right: 'block-24', small: 'block-28', single: 'block-32' },
  mask: { tray: 'mask', right: 'mask-24', wide: 'mask-16', single: 'mask-32' },
  bin: { tray: 'bin', inside: 'inside', outside: 'outside' },
} as const;

const LOW_PORTS = { first: 1, last: 1023 } as const;
const EVERY_PORT = { first: 0, last: 65535 } as const;

/** Returns the Type chip of a TCP rule for a range of ports, written as the console writes it: `TCP · 22` for one port and `TCP · 1-1023` for a range. The chips of 02-05 all contain a port the probe battery tries (22, 80, 443, 3306 or 5432), so any of them that opens more than the 22 is found; none is UDP, which is presented in 02-10. */
export function tcpChip(fromPort: number, toPort: number): WhatChip {
  const range = fromPort === toPort ? `${fromPort}` : `${fromPort}-${toPort}`;
  return { id: `tcp-${range}`, label: `{{tcp}} · ${range}`, what: { kind: 'tcp', fromPort, toPort } };
}

export const SSH_WHAT = {
  ssh: tcpChip(PORT.ssh, PORT.ssh),
  web: tcpChip(PORT.web, PORT.web),
  wellKnown: tcpChip(LOW_PORTS.first, LOW_PORTS.last),
  everything: tcpChip(EVERY_PORT.first, EVERY_PORT.last),
  echoRequest: CHAPTER_1_WHAT.echoRequest,
} satisfies Record<string, WhatChip>;

/** The Source chips of 02-05: only your laptop (a /32), anybody, the whole block of the first floor, which holds the visitor's laptop too, and laptop-lucia, which the card needs to name the rule of 01-12 that laptop-marta keeps (every rule of a firewall of the world must be nameable by the chips of the incident). */
export const SSH_FROM = {
  you: addressChip('from', 'you', DEVICE.you.name, IP.you),
  anyone: CHAPTER_1_FROM.anyone,
  floor: { id: 'from-floor-1', label: `{{cidr}} ${CHAPTER_1_FLOOR.first.cidr} (el bloque del piso 1)`, peer: { kind: 'cidr', cidr: CHAPTER_1_FLOOR.first.cidr } },
  lucia: CHAPTER_1_FROM.lucia,
} satisfies Record<string, FromChip>;

/** Returns a flow of 02-05: a TCP packet from a device of the office to the SSH port of laptop-lucia, which the incident requires to get in or forbids. */
function sshFlow(id: string, kind: FlowKind, fromId: string): Flow {
  return { id, kind, packet: { from: { kind: 'device', id: fromId }, to: IP.lucia, protocol: 'tcp', port: PORT.ssh } };
}

/** The flows of 02-05: your laptop must get into SSH and the visitor's must not, and the ping of laptop-lucia to laptop-marta goes on as it did in 01-13 because the rule that lets it in is still in the firewall of laptop-marta (an ambient flow is expected, so it is no extra opening for the middle star). */
export const SSH_FLOW = {
  you: sshFlow('ssh-from-your-laptop', 'required', DEVICE.you.id),
  visitor: sshFlow('ssh-from-the-visitor', 'forbidden', DEVICE.visitor.id),
  background: CHAPTER_1_FLOW.background,
} satisfies Record<string, Flow>;

/** Returns the task of a send incident that expects what a message sent from this terminal to an address ends in, and, when `by` is given, who answered, warned or dropped it. `sendTask` of chapter 1 is this one for your laptop. */
export function sendTaskFrom(origin: OriginChip, id: string, text: string, messageId: string, toId: string, outcome: ExpectedOutcome, by?: string): SendTask {
  return { id, text, expect: { fromId: origin.id, toId, messageId, outcome, by } };
}

/** Returns the move that sends a message from this terminal to an address, for the reference solution of a send incident. `sendMove` of chapter 1 is this one for your laptop. */
export function sendMoveFrom(origin: OriginChip, toId: string, messageId: string): SendMove {
  return { type: 'sendPacket', fromId: origin.id, toId, messageId };
}

/** Returns the task of a send incident that expects what a message sent from this terminal to a name ends in: it comes back, and the answer of the DNS holds this IP. With `alias` it also says whether the answer came through a CNAME (`true`) or with none (`false`). */
export function answerTaskFrom(origin: OriginChip, id: string, text: string, messageId: string, toId: string, ip: string, alias?: boolean): SendTask {
  const { expect } = sendTaskFrom(origin, id, text, messageId, toId, 'replied');
  return { id, text, expect: { ...expect, answer: alias === undefined ? { ip } : { ip, alias } } };
}

/** The status a dig prints when the resolver could not give an address: the name does not exist (`NXDOMAIN`) or the server that holds its zone failed (`SERVFAIL`). It is the literal output of the tool, the declared exception of D-5. */
export const DNS_STATUS = { nonexistent: 'NXDOMAIN', failed: 'SERVFAIL' } as const satisfies Record<string, DnsStatus>;

/** Returns the task of a send incident that expects what a message sent from this terminal to a name ends in: the resolver answered, and the status of its answer is this one, with no address. */
export function statusTaskFrom(origin: OriginChip, id: string, text: string, messageId: string, toId: string, status: (typeof DNS_STATUS)[keyof typeof DNS_STATUS]): SendTask {
  const { expect } = sendTaskFrom(origin, id, text, messageId, toId, 'replied');
  return { id, text, expect: { ...expect, status } };
}

/** Returns the TCP service of a program that listens on a port, on every IP of its device unless it says otherwise. */
export function tcpService(port: number, listen: Service['listen'] = 'all'): Service {
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

/** The setting of 02-03 in the section «Servicios» of the tab «Ajustes» of laptop-lucia: the listen address of her app (TCP, port 3000). It sits on the device that listens and not on the one that tests. Each chip says its address in words and carries the value the engine takes. */
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

/** The local network of the other office: a block of its own, outside the 192.168.0.0/16 of the office, behind router-sucursal. Its name is the one the map writes on its floor. */
export const BRANCH_LAN = { id: 'branch-lan', name: 'Sucursal', cidr: '10.0.0.0/16', latencyMs: HOP_MS } as const satisfies Lan;

/** What 02-07 adds to the world: the other office, with its local network, its printer and its laptop, and router-sucursal, which is the gateway of both and faces router-oficina by a private link (172.16.0.2). Its only route sends what is for the office (192.168.0.0/16) back to router-oficina, so the replies have a way home and anything else has no route there. The pieces are new, so the text does not have to name them. */
export const OTHER_OFFICE: NetworkAction[] = [
  { type: 'addLan', lan: BRANCH_LAN },
  { type: 'addDevice', device: officeDevice(DEVICE.branchPrinter, 'printer', IP.otherOfficePrinter, { lanId: BRANCH_LAN.id, gateway: IP.branchRouter }) },
  { type: 'addDevice', device: officeDevice(DEVICE.branchLaptop, 'laptop', IP.otherOfficeLaptop, { lanId: BRANCH_LAN.id, gateway: IP.branchRouter }) },
  {
    type: 'addRouter',
    router: {
      id: ROUTER.branch.id,
      name: ROUTER.branch.name,
      interfaces: [
        { ip: IP.branchRouter, faces: BRANCH_LAN.id },
        { ip: IP.branchLink, faces: ROUTER.office.id },
      ],
      routes: [backToOffice(ROUTER.office.id)],
      latencyMs: HOP_MS,
      sendsUnreachable: true,
    },
  },
];

/** What 02-07 changes on a router that already existed: router-oficina lost every route, so it no longer knows where to send what is not for the office, and gained the interface of the private link to router-sucursal (172.16.0.1). An update replaces the list of interfaces, so the update restates the two floors and the way out to the provider. It keeps `sendsUnreachable`: with no route that covers a destination it warns Destination Net Unreachable. */
export const ROUTES_LOST: NetworkAction = { type: 'updateRouter', routerId: ROUTER.office.id, interfaces: [...OFFICE_INTERFACES, { ip: IP.officeLink, faces: ROUTER.branch.id }], routes: [] };

/** What 02-08 changes: servidor-internet puts a service on port 80 and another on 443, listening on every IP, so a connection to either gets an answer. They are only numbers here: what a program does behind them is not this chapter's. The NAT of router-oficina is no change: it has translated what leaves the office since the office reached the internet, and the map did not show it before. */
export const WEB_PORTS: NetworkAction = { type: 'setServices', ownerId: SERVER.internet.id, services: [tcpService(PORT.web), tcpService(PORT.secureWeb)] };

/** What 02-09 changes: casa-lucia, a client of the internet, appears at 192.0.2.77; laptop-andres puts her app on port 3000, listening on every IP, and router-oficina gets one fixed forward, which hands what arrives at its public IP on TCP port 3000 to port 3000 of laptop-andres. The port the 02-09 probe asks for, 40009, has no forward and no row. */
export const FORWARDED_APP: NetworkAction[] = [
  { type: 'addActor', actor: { id: CLIENT.home.id, name: CLIENT.home.name, ip: IP.home, kind: 'home' } },
  { type: 'setServices', ownerId: DEVICE.andres.id, services: [APP] },
  { type: 'setForwards', routerId: ROUTER.office.id, forwards: [{ protocol: 'tcp', publicPort: PORT.app, toDeviceId: DEVICE.andres.id, toPort: PORT.app }] },
];

export const RECORD_TYPE = { a: 'A', cname: 'CNAME' } as const satisfies Record<string, AnswerRecord['type']>;

/** Returns the address record of a name in the zone of the game, with the time to live of the game. */
function addressRecord(name: string, ip: string): AnswerRecord {
  return { name, type: RECORD_TYPE.a, value: ip, ttl: RECORD_TTL };
}

/** Returns the alias record that makes a name another name for `target`, with the time to live of the game. */
function aliasRecord(name: string, target: string): AnswerRecord {
  return { name, type: RECORD_TYPE.cname, value: target, ttl: RECORD_TTL };
}

const DNS_SERVICES: Service[] = [
  { protocol: 'udp', port: PORT.dns, listen: 'all' },
  { protocol: 'tcp', port: PORT.dns, listen: 'all' },
];

type Upstreams = NonNullable<NonNullable<ServerActor['dns']>['upstreams']>;

/** The authoritative server a resolver asks for the zone of the site (02-10), and the one it asks for the zone of the news site (02-13). */
const SITE_UPSTREAM: Upstreams[number] = { zone: DOMAIN.site, serverId: SERVER.authoritative.id };
const NEWS_UPSTREAM: Upstreams[number] = { zone: DOMAIN.news, serverId: SERVER.news.id };

/** Returns the `dns` of a resolver that asks these authoritative servers and stores nothing yet. */
function resolverDns(upstreams: Upstreams): NonNullable<ServerActor['dns']> {
  return { role: 'resolver', upstreams };
}

/** The `dns` of the resolver before it stores anything: its role and the server it asks for the zone of the game. */
const RESOLVER_DNS = resolverDns([SITE_UPSTREAM]);

/** The interfaces of router-destino once servidor-dns and servidor-autoritativo hang from it. */
const NAME_SERVER_INTERFACES: RouterInterface[] = [
  ...DESTINATION_INTERFACES,
  { ip: IP.destinationResolver, faces: SERVER.resolver.id },
  { ip: IP.destinationAuthoritative, faces: SERVER.authoritative.id },
];

/** What 02-10 changes: servidor-dns, the resolver, and servidor-autoritativo, which holds the zone lucia.example, appear in the internet; both listen on UDP and TCP port 53 and the resolver knows which server to ask for the zone. The zone has one address, `www.lucia.example` A 198.51.100.50 (the server of the internet), with the time to live of the game. router-destino gets one interface for each, and tu-laptop gets the resolver as its DNS server, the one DHCP lent it. */
export const NAME_SERVERS: NetworkAction[] = [
  {
    type: 'addActor',
    actor: { id: SERVER.resolver.id, name: SERVER.resolver.name, ip: IP.resolver, kind: 'server', latencyMs: SERVER_MS, services: DNS_SERVICES, dns: RESOLVER_DNS },
  },
  {
    type: 'addActor',
    actor: {
      id: SERVER.authoritative.id,
      name: SERVER.authoritative.name,
      ip: IP.authoritative,
      kind: 'server',
      latencyMs: SERVER_MS,
      services: DNS_SERVICES,
      dns: { role: 'authoritative', zones: [zoneOf(DOMAIN.site, [addressRecord(HOSTNAME.www, IP.server)])] },
    },
  },
  { type: 'updateRouter', routerId: ROUTER.destination.id, interfaces: NAME_SERVER_INTERFACES },
  { type: 'setDnsServer', deviceId: DEVICE.you.id, server: IP.resolver },
];

/** What 02-11 changes: servidor-autoritativo points www.lucia.example and blog.lucia.example to 198.51.100.51, an IP nobody has. */
export const WRONG_RECORDS: NetworkAction = {
  type: 'setDns',
  ownerId: SERVER.authoritative.id,
  dns: { role: 'authoritative', zones: [zoneOf(DOMAIN.site, [addressRecord(HOSTNAME.www, IP.nobodyOutside), addressRecord(HOSTNAME.blog, IP.nobodyOutside)])] },
};

/** The second of the game clock at which the old answer of www.lucia.example expires in the cache of servidor-dns. */
export const OLD_ANSWER_SECONDS = 240;

/** The interfaces of router-destino once servidor-nuevo hangs from it too (02-12). */
const MOVED_SITE_INTERFACES: RouterInterface[] = [...NAME_SERVER_INTERFACES, { ip: IP.destinationFreshServer, faces: SERVER.fresh.id }];

/** What 02-12 changes: the site moves to servidor-nuevo, servidor-autoritativo answers its IP for www.lucia.example, and servidor-dns still holds the old answer until second 240 of the game clock. */
export const MOVED_SITE: NetworkAction[] = [
  {
    type: 'addActor',
    actor: { id: SERVER.fresh.id, name: SERVER.fresh.name, ip: IP.freshServer, kind: 'server', latencyMs: SERVER_MS, services: [tcpService(PORT.web), tcpService(PORT.secureWeb)] },
  },
  { type: 'updateRouter', routerId: ROUTER.destination.id, interfaces: MOVED_SITE_INTERFACES },
  {
    type: 'setDns',
    ownerId: SERVER.authoritative.id,
    dns: { role: 'authoritative', zones: [zoneOf(DOMAIN.site, [addressRecord(HOSTNAME.www, IP.freshServer), aliasRecord(HOSTNAME.blog, HOSTNAME.www)])] },
  },
  { type: 'setDns', ownerId: SERVER.resolver.id, dns: { ...RESOLVER_DNS, cache: [{ name: HOSTNAME.www, type: RECORD_TYPE.a, value: IP.server, expiresAt: OLD_ANSWER_SECONDS }] } },
];

/** The steps of the clock of 02-12: wait one minute or five. */
export const WAIT = {
  oneMinute: { id: 'one-minute', label: 'Esperar 1 min', seconds: 60 },
  fiveMinutes: { id: 'five-minutes', label: 'Esperar 5 min', seconds: 300 },
} as const satisfies Record<string, ClockStep>;

/** The hosts file of tu-laptop in 02-13: one line, which sends the name of the shop to the server of the internet. servidor-internet still has that IP after 02-12, which moved only www. */
const SHOP_HOSTS: HostLine[] = [{ name: HOSTNAME.shop, ip: IP.server }];

/** The interfaces of router-destino once servidor-autoritativo-noticias hangs from it too (02-13). */
export const NEWS_INTERFACES: RouterInterface[] = [...MOVED_SITE_INTERFACES, { ip: IP.destinationNewsAuthoritative, faces: SERVER.news.id }];

/** What 02-13 changes: servidor-autoritativo-noticias, which holds the zone noticias.example, appears in the internet and fails, so it answers nothing; servidor-dns learns that it is the server to ask for that zone (an update replaces the `dns`, so it restates the zone of the site and holds no cache: the answer 02-12 left in it is not carried over); tu-laptop gets a hosts file with one line, tienda.lucia.example to 198.51.100.50; and laptop-andres uses the printer as its DNS server, which has no program on port 53. router-destino gets the interface of the new server (an update replaces the list, so it restates those it had). The new server is a piece, so the text does not have to name it, but the report does, because it is the cause of a SERVFAIL. */
export const NAME_FAILURES: NetworkAction[] = [
  {
    type: 'addActor',
    actor: {
      id: SERVER.news.id,
      name: SERVER.news.name,
      ip: IP.newsAuthoritative,
      kind: 'server',
      latencyMs: SERVER_MS,
      services: DNS_SERVICES,
      dns: { role: 'authoritative', zones: [zoneOf(DOMAIN.news, [])], failing: true },
    },
  },
  { type: 'updateRouter', routerId: ROUTER.destination.id, interfaces: NEWS_INTERFACES },
  { type: 'setDns', ownerId: SERVER.resolver.id, dns: resolverDns([SITE_UPSTREAM, NEWS_UPSTREAM]) },
  { type: 'setHosts', deviceId: DEVICE.you.id, hosts: SHOP_HOSTS },
  { type: 'setDnsServer', deviceId: DEVICE.andres.id, server: IP.printer },
];

/** What case 1 of 02-14 changes: the program of servidor-nuevo that answers on TCP port 80 now listens only on 127.0.0.1, the address of the server itself. www.lucia.example points to that server since 02-12. */
export const SITE_ON_LOOPBACK: NetworkAction = { type: 'setListenAddress', ownerId: SERVER.fresh.id, protocol: 'tcp', port: PORT.web, listen: 'loopback' };

/** What case 3 of 02-14 changes: the hosts file of tu-laptop has an old line for tienda.lucia.example, 198.51.100.70, an IP nobody has, and servidor-autoritativo gets an A record for that name that points to 198.51.100.50, the server of the internet. */
export const STALE_SHOP: NetworkAction[] = [
  { type: 'setHosts', deviceId: DEVICE.you.id, hosts: [{ name: HOSTNAME.shop, ip: IP.staleHost }] },
  { type: 'addRecord', serverId: SERVER.authoritative.id, record: addressRecord(HOSTNAME.shop, IP.server) },
];

/** What case 4 of 02-14 changes: router-oficina loses its default route and keeps the others, so it has a route to the other office and none to the rest of the world. */
export const DEFAULT_ROUTE_LOST: NetworkAction = { type: 'removeRoute', routerId: ROUTER.office.id, to: ROUTE_DEFAULT };

/** The ids of the table of routes of router-oficina in 02-07 and of its chips: the destinations the player may write (everything, the other office or only its printer) and the routers each may be handed to (the provider or router-sucursal). */
export const OFFICE_ROUTES = {
  table: 'office-routes',
  to: { anywhere: 'to-anywhere', otherOffice: 'to-other-office', printer: 'to-branch-printer' },
  via: { provider: 'via-provider', branch: 'via-branch' },
} as const;

/** The table of routes of router-oficina that 02-07 lets the player edit. A destination is written as the table shows it (`0.0.0.0/0` for the default route, which the engine calls `default`) and a next hop as the IP of the router it is handed to, with its name. */
export const OFFICE_ROUTES_TABLE: TableSpec = {
  id: OFFICE_ROUTES.table,
  kind: 'routes',
  ownerId: ROUTER.office.id,
  trays: {
    destination: [
      { id: OFFICE_ROUTES.to.anywhere, label: '0.0.0.0/0', value: ROUTE_DEFAULT },
      { id: OFFICE_ROUTES.to.otherOffice, label: BRANCH_LAN.cidr, value: BRANCH_LAN.cidr },
      { id: OFFICE_ROUTES.to.printer, label: `${IP.otherOfficePrinter}/32`, value: `${IP.otherOfficePrinter}/32` },
    ],
    nextHop: [
      { id: OFFICE_ROUTES.via.provider, label: `${IP.provider} ${nameTag(ROUTER.provider.name)}`, value: ROUTER.provider.id },
      { id: OFFICE_ROUTES.via.branch, label: `${IP.branchLink} ${nameTag(ROUTER.branch.name)}`, value: ROUTER.branch.id },
    ],
  },
};

/** The ids of the table of routes of router-proveedor that case 5 of 02-14 lets the player edit and of its chips: the destinations (everything, or the block of the servers of the internet) and the routers each may be handed to (router-oficina or router-destino). */
export const PROVIDER_ROUTES_FIX = {
  table: 'provider-routes',
  to: { anywhere: 'to-anywhere', servers: 'to-servers' },
  via: { office: 'via-office', destination: 'via-destination' },
} as const;

/** The table of routes of router-proveedor that the fix of case 5 of 02-14 lets the player edit. A destination is written as the table shows it and a next hop as the IP of the router it is handed to, with its name. */
export const PROVIDER_ROUTES_TABLE: TableSpec = {
  id: PROVIDER_ROUTES_FIX.table,
  kind: 'routes',
  ownerId: ROUTER.provider.id,
  trays: {
    destination: [
      { id: PROVIDER_ROUTES_FIX.to.anywhere, label: '0.0.0.0/0', value: ROUTE_DEFAULT },
      { id: PROVIDER_ROUTES_FIX.to.servers, label: SERVER_RANGE, value: SERVER_RANGE },
    ],
    nextHop: [
      { id: PROVIDER_ROUTES_FIX.via.office, label: `${IP.officeUplink} ${nameTag(ROUTER.office.name)}`, value: ROUTER.office.id },
      { id: PROVIDER_ROUTES_FIX.via.destination, label: `${IP.destination} ${nameTag(ROUTER.destination.name)}`, value: ROUTER.destination.id },
    ],
  },
};

/** The ids of the table of records of servidor-autoritativo in 02-11 and of its chips. */
export const SITE_RECORDS = {
  table: 'site-records',
  name: { www: 'record-name-www', blog: 'record-name-blog', zone: 'record-name-zone' },
  type: { a: 'record-type-a', cname: 'record-type-cname' },
  value: { server: 'record-value-server', nobody: 'record-value-nobody', www: 'record-value-www' },
} as const;

/** The table of records of servidor-autoritativo that 02-11 lets the player edit. */
export const SITE_RECORDS_TABLE: TableSpec = {
  id: SITE_RECORDS.table,
  kind: 'records',
  ownerId: SERVER.authoritative.id,
  trays: {
    name: [
      { id: SITE_RECORDS.name.www, label: HOSTNAME.www, value: HOSTNAME.www },
      { id: SITE_RECORDS.name.blog, label: HOSTNAME.blog, value: HOSTNAME.blog },
      { id: SITE_RECORDS.name.zone, label: DOMAIN.site, value: DOMAIN.site },
    ],
    type: [
      { id: SITE_RECORDS.type.a, label: '{{a-record|A}}', value: RECORD_TYPE.a },
      { id: SITE_RECORDS.type.cname, label: '{{cname-record|CNAME}}', value: RECORD_TYPE.cname },
    ],
    value: [
      { id: SITE_RECORDS.value.server, label: IP.server, value: IP.server },
      { id: SITE_RECORDS.value.nobody, label: IP.nobodyOutside, value: IP.nobodyOutside },
      { id: SITE_RECORDS.value.www, label: HOSTNAME.www, value: HOSTNAME.www },
    ],
  },
};

/** The ids of the pieces 02-01 and 02-02 draw: your laptop and the laptop that has the services. The rest of the office stays in the world and is not used. */
export const SERVICES_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id];

/** The ids of the pieces 02-03 draws: the two laptops of the services and laptop-marta, whose firewall is drawn with it and is what keeps the silence. */
export const REFUSAL_PIECES: string[] = [...SERVICES_PIECES, DEVICE.marta.id];

/** The ids of the pieces 02-04 and 02-06 draw: your laptop, the printer and laptop-andres, which are on the two floors, and the router between them. */
export const FLOORS_PIECES: string[] = [DEVICE.you.id, DEVICE.printer.id, DEVICE.andres.id, ROUTER.office.id];

/** The ids of the pieces 02-05 draws: your laptop, which must get into SSH, laptop-lucia, which has it, the visitor's laptop, which must not, and laptop-marta, whose firewall still holds the rule 01-12 wrote for the ping of laptop-lucia: that rule goes on working in the background, as in 01-13, and the probe battery would count it as an opening if the incident did not expect its ping. */
export const SSH_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id, DEVICE.marta.id, DEVICE.visitor.id];

/** The ids of the pieces 02-07 draws: your laptop, the two routers of the way out and the one of the other office, its printer and laptop, and the server of the internet. The router in front of the server is in the world and is not drawn. */
export const ROUTES_PIECES: string[] = [DEVICE.you.id, ROUTER.office.id, ROUTER.provider.id, ROUTER.branch.id, DEVICE.branchPrinter.id, DEVICE.branchLaptop.id, SERVER.internet.id];

/** The ids of the pieces 02-08 draws: the two laptops that send, the router that translates and the server they reach. */
export const TRANSLATION_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id, ROUTER.office.id, SERVER.internet.id];

/** The ids of the pieces 02-09 draws: the client outside, the router that receives it and the laptop its forward reaches. */
export const OUTSIDE_PIECES: string[] = [CLIENT.home.id, ROUTER.office.id, DEVICE.andres.id];

/** The ids of the pieces 02-10 draws: your laptop, its router, the resolver and the server of the internet. The authoritative server waits for 02-11, where its term is introduced. */
export const NAMES_PIECES: string[] = [DEVICE.you.id, ROUTER.office.id, SERVER.resolver.id, SERVER.internet.id];

/** The ids of the pieces 02-11 draws: your laptop, its router, the resolver, the authoritative server and the server of the internet. */
export const RECORDS_PIECES: string[] = [DEVICE.you.id, ROUTER.office.id, SERVER.resolver.id, SERVER.authoritative.id, SERVER.internet.id];

/** The ids of the pieces 02-12 draws: those of 02-11 and the server the site moved to. */
export const CACHE_PIECES: string[] = [...RECORDS_PIECES, SERVER.fresh.id];

/** The ids of the pieces 02-13 draws: your laptop, laptop-andres and the printer that is its resolver, the router between the floors, which also translates the questions that leave the office, the resolver, both authoritative servers and the server of the internet. */
export const FAILURES_PIECES: string[] = [DEVICE.you.id, DEVICE.andres.id, DEVICE.printer.id, ROUTER.office.id, SERVER.resolver.id, SERVER.authoritative.id, SERVER.news.id, SERVER.internet.id];

/** The ids of the pieces case 2 of 02-14 draws, and the base of the lists of cases 1 and 3, which send by name too: your laptop, the router that translates its questions, and the resolver, where every question goes. */
export const NAME_TEST_PIECES: string[] = [DEVICE.you.id, ROUTER.office.id, SERVER.resolver.id];

/** The ids of the pieces case 1 of 02-14 draws: those of the name tests and servidor-nuevo, which is where www.lucia.example points and which refuses the `nc` on port 80. */
export const LOOPBACK_SITE_PIECES: string[] = [...NAME_TEST_PIECES, SERVER.fresh.id];

/** The ids of the pieces case 3 of 02-14 draws: the name tests, the authoritative server whose record the report names, and the server of the internet whose IP the `dig` gives. */
export const STALE_SHOP_PIECES: string[] = [...NAME_TEST_PIECES, SERVER.authoritative.id, SERVER.internet.id];

/** The ids of the pieces case 4 of 02-14 draws: your laptop, the router that lost its default route, the router and the printer of the other office that the pings still reach, and the server they no longer reach. */
export const LOST_WAY_PIECES: string[] = [DEVICE.you.id, ROUTER.office.id, ROUTER.branch.id, DEVICE.branchPrinter.id, SERVER.internet.id];

/** The ids of the pieces case 5 of 02-14 draws: those of the loop of 01-09 and router-destino, which the chips of the fix name as the next hop of the block of the servers. */
export const LOOP_FIX_PIECES: string[] = [...LOOP_PIECES, ROUTER.destination.id];

/** The ids of the pieces case 7 of 02-14 draws: laptop-andres, the router between the floors and the printer that is its DNS server. */
export const PRINTER_DNS_PIECES: string[] = [DEVICE.andres.id, ROUTER.office.id, DEVICE.printer.id];

/** Returns the move that writes a route in a table of routes, by default the one of router-oficina of 02-07: the chip picked in the tray of the destination and the one picked in the tray of the next hop. */
export function routeMove(destinationId: string, nextHopId: string, tableId: string = OFFICE_ROUTES.table): PlaceEntryMove {
  return { type: 'placeEntry', tableId, picks: { destination: destinationId, nextHop: nextHopId } };
}

/** Returns the move that moves the clock of the game on by this many seconds, one of the steps the incident offers. */
export function waitMove(seconds: number): WaitMove {
  return { type: 'wait', seconds };
}

/** Returns the move that writes a record in the table of servidor-autoritativo of 02-11: the chip picked in the tray of the name, the one picked in the tray of the type and the one picked in the tray of the value. */
export function recordMove(nameId: string, typeId: string, valueId: string): PlaceEntryMove {
  return { type: 'placeEntry', tableId: SITE_RECORDS.table, picks: { name: nameId, type: typeId, value: valueId } };
}

/** Returns the move that takes away the record of the table of 02-11 that has this name, type and value. */
export function recordRemoval(name: string, type: AnswerRecord['type'], value: string): RemoveEntryMove {
  return { type: 'removeEntry', tableId: SITE_RECORDS.table, entryId: recordEntryId({ name, type, value }) };
}

/** The fix of case 5 of 02-14: the table of routes of router-proveedor, and the task that the ping to servidor-internet comes back. Its reference solution takes the default route away, writes the block of the servers towards router-destino and sends the ping again. */
export const LOOP_FIX: NonNullable<CaseSpec['fix']> = {
  tables: [PROVIDER_ROUTES_TABLE],
  tasks: [sendTaskFrom(ORIGIN.you, TASK.serverPing, `Que el {{ping}} a ${NAME.server} vuelva.`, MESSAGE.ping.id, ADDRESS.server.id, 'replied', SERVER.internet.id)],
  solution: [
    { type: 'removeEntry', tableId: PROVIDER_ROUTES_FIX.table, entryId: routeEntryId({ to: ROUTE_DEFAULT }) },
    routeMove(PROVIDER_ROUTES_FIX.to.servers, PROVIDER_ROUTES_FIX.via.destination, PROVIDER_ROUTES_FIX.table),
    sendMoveFrom(ORIGIN.you, ADDRESS.server.id, MESSAGE.ping.id),
  ],
};
