import { nameTag } from '@/copy';
import { ROUTE_DEFAULT, type Device, type Lan, type Network, type NetworkAction, type PacketSpec, type Route, type Router, type Rule } from '@/engine';
import type { AddressChip, ExpectedOutcome, Flow, FlowKind, FromChip, MessageChip, OriginChip, SendMove, SendTask, ToChip, WhatChip } from '@/levels/contract/incident';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

const OFFICE_RANGE = '192.168.0.0/16';
const ANY_IPV4 = '0.0.0.0/0';
const HOP_MS = 1;
const PROVIDER_MS = 8;
const DESTINATION_MS = 12;
const SERVER_MS = 20;
const SERVER_RANGE = '198.51.100.0/24';
const LOCALHOST = 'localhost';
const SINGLE_ADDRESS = '/32';
const ECHO_REQUEST = 8;

export const IP = {
  you: '192.168.1.10',
  lucia: '192.168.1.11',
  marta: '192.168.1.12',
  printer: '192.168.1.21',
  visitor: '192.168.1.30',
  nobody: '192.168.1.50',
  typo: '192.168.1.22',
  note: '192.168.1.300',
  loopback: '127.0.0.1',
  andres: '192.168.2.15',
  router: '192.168.1.1',
  routerSecondFloor: '192.168.2.1',
  officeUplink: '203.0.113.10',
  provider: '203.0.113.1',
  providerOnward: '203.0.113.3',
  destination: '203.0.113.2',
  destinationServer: '198.51.100.1',
  server: '198.51.100.50',
  otherOfficePrinter: '10.0.0.10',
} as const;

export const FLOOR = {
  first: { id: 'floor-1', name: 'Piso 1', cidr: '192.168.1.0/24', latencyMs: HOP_MS },
  second: { id: 'floor-2', name: 'Piso 2', cidr: '192.168.2.0/24', latencyMs: HOP_MS },
} as const satisfies Record<string, Lan>;

export const DEVICE = {
  you: { id: 'your-laptop', name: 'tu-laptop' },
  lucia: { id: 'lucia-laptop', name: 'laptop-lucia' },
  marta: { id: 'marta-laptop', name: 'laptop-marta' },
  printer: { id: 'printer', name: 'impresora' },
  visitor: { id: 'guest-laptop', name: 'laptop-visita' },
  andres: { id: 'andres-laptop', name: 'laptop-andres' },
} as const;

export const ROUTER = {
  office: { id: 'office-router', name: 'router-oficina' },
  provider: { id: 'provider-router', name: 'router-proveedor' },
  destination: { id: 'destination-router', name: 'router-destino' },
} as const;

export const SERVER = { id: 'internet-server', name: 'servidor-internet' } as const;

export const FIREWALL = { marta: 'marta-firewall', you: 'your-firewall', lucia: 'lucia-firewall' } as const;

export const CARD = {
  network: { tray: 'in-network', yes: 'yes', no: 'no' },
  ip: { tray: 'ip', right: 'right', note: 'note', marta: 'marta' },
} as const;

export const GATEWAY = { setting: 'gateway', none: 'none', router: 'router', printer: 'printer', nobody: 'nobody' } as const;

export const NAME = {
  you: nameTag(DEVICE.you.name),
  lucia: nameTag(DEVICE.lucia.name),
  marta: nameTag(DEVICE.marta.name),
  printer: nameTag(DEVICE.printer.name),
  andres: nameTag(DEVICE.andres.name),
  visitor: nameTag(DEVICE.visitor.name),
  router: nameTag(ROUTER.office.name),
  provider: nameTag(ROUTER.provider.name),
  destination: nameTag(ROUTER.destination.name),
  server: nameTag(SERVER.name),
} as const;

export const TASK = {
  visitor: 'visitor-outside',
  printer: 'printer-ip',
  packet: 'packet-to-printer',
  ping: 'ping-to-printer',
  loopback: 'ping-to-loopback',
  silence: 'silence-seen',
  warning: 'warning-seen',
  andres: 'ping-to-andres',
  server: 'ping-to-server',
  otherOffice: 'ping-to-other-office',
  ttl3: 'ttl-3-warns',
  ttl64: 'ttl-64-warns',
  serverSilence: 'ping-to-server-silent',
  traceroute: 'traceroute-to-server',
  guard: 'firewall-drops-ping',
  lucia: 'ping-to-lucia',
  rule: 'support-ping-only',
  leave: 'ping-leaves',
} as const;

/** Returns a device of the office on floor 1, without a firewall and with the host that answers by default; `patch` changes what the world of an incident needs of it. */
function officeDevice({ id, name }: { id: string; name: string }, kind: Device['kind'], privateIp: string, patch: Partial<Device> = {}): Device {
  return { id, name, kind, privateIp, firewallIds: [], host: { ignoreIcmpEcho: false, listeningTcpPorts: [] }, lanId: FLOOR.first.id, ...patch };
}

/** The world chapter 1 starts from: floor 1 of the office, a local network of its own inside the range of the whole office, with your laptop, Lucía's, Marta's and the printer on it, and the visitor's laptop with no cable. It has no firewall, router, internet or actor yet: each block adds what it needs. */
export const BASE_WORLD: Network = {
  kind: 'office',
  cidr: OFFICE_RANGE,
  lans: [FLOOR.first],
  devices: [
    officeDevice(DEVICE.you, 'laptop', IP.you),
    officeDevice(DEVICE.lucia, 'laptop', IP.lucia),
    officeDevice(DEVICE.marta, 'laptop', IP.marta),
    officeDevice(DEVICE.printer, 'printer', IP.printer),
    officeDevice(DEVICE.visitor, 'laptop', IP.visitor, { connected: false }),
  ],
  firewalls: [],
  edge: 'router',
  actors: [],
};

export const ORIGIN = {
  you: { id: 'you', endpoint: { kind: 'device', id: DEVICE.you.id } },
  andres: { id: 'andres', endpoint: { kind: 'device', id: DEVICE.andres.id } },
} satisfies Record<string, OriginChip>;

export const ADDRESS = {
  printer: { id: 'ip-printer', address: IP.printer },
  marta: { id: 'ip-marta', address: IP.marta },
  lucia: { id: 'ip-lucia', address: IP.lucia },
  andres: { id: 'ip-andres', address: IP.andres },
  nobody: { id: 'ip-nobody', address: IP.nobody },
  loopback: { id: 'ip-loopback', address: IP.loopback },
  localhost: { id: 'ip-localhost', address: LOCALHOST },
  server: { id: 'ip-server', address: IP.server },
  otherOffice: { id: 'ip-other-office', address: IP.otherOfficePrinter },
  you: { id: 'ip-you', address: IP.you },
  gateway: { id: 'ip-gateway', address: IP.router },
  typo: { id: 'ip-typo', address: IP.typo },
  secondFloorRouter: { id: 'ip-second-floor-router', address: IP.routerSecondFloor },
} satisfies Record<string, AddressChip>;

export const MESSAGE = {
  packet: { id: 'packet', label: '{{packet}}', icmpType: 8, command: 'packet' },
  ping: { id: 'ping', label: '{{ping}}', icmpType: 8, command: 'ping' },
  traceroute: { id: 'traceroute', label: '{{traceroute}}', icmpType: 8, command: 'traceroute' },
} satisfies Record<string, MessageChip>;

/** Returns the message of a ping that leaves with this TTL, such as the `ping -t 3 <ip>` the terminal writes for it. */
function pingWithTtl(ttl: number): MessageChip {
  return { id: `ping-ttl-${ttl}`, label: `{{ping}} con {{ttl}} ${ttl}`, icmpType: 8, command: 'ping', ttl };
}

export const PING_WITH_TTL = { 1: pingWithTtl(1), 2: pingWithTtl(2), 3: pingWithTtl(3), 5: pingWithTtl(5), 64: pingWithTtl(64) } as const;

/** Returns the rule that lets everything out, whatever the destination. */
export function letEverythingOut(id: string): Rule {
  return { id, what: { kind: 'all' }, peer: { kind: 'cidr', cidr: ANY_IPV4 } };
}

/** Returns the action that gives a laptop a firewall that lets nothing in and everything out. */
function firewallThatLetsNothingIn({ id, name }: { id: string; name: string }, firewallId: string): NetworkAction {
  return { type: 'addFirewall', deviceId: id, firewall: { id: firewallId, name, kind: 'host-firewall', inbound: [], outbound: [letEverythingOut(`${firewallId}-out`)] } };
}

/** The firewall laptop-marta gets in 01-05: nothing may come in and everything may go out. The player does not know the term firewall until 01-11, so no piece, stamp or text shows it before. */
export const HIDDEN_FIREWALL: NetworkAction = firewallThatLetsNothingIn(DEVICE.marta, FIREWALL.marta);

/** The firewall laptop-lucia gets in case 6 of 01-14, made as the one laptop-marta has: nothing may come in and everything may go out. */
export const LUCIA_FIREWALL: NetworkAction = firewallThatLetsNothingIn(DEVICE.lucia, FIREWALL.lucia);

/** The ids of the pieces 01-06 and 01-07 draw: the three devices of floor 1 they use, the one on floor 2 and the router between them. Laptop-marta and laptop-visita stay in the world and are not drawn, and neither is anything outside the office. */
export const OFFICE_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id, DEVICE.printer.id, DEVICE.andres.id, ROUTER.office.id];

/** The ids of the pieces 01-08 draws: the office of 01-06 and the server of the internet. The routers of the provider stay in the world, because the ping to a private IP of another office dies at one of them, and are not drawn yet. */
export const INTERNET_PIECES: string[] = [...OFFICE_PIECES, SERVER.id];

/** The ids of the pieces 01-09 draws: your laptop, the two routers the packet goes back and forth between and the server it never reaches. The router in front of the server is crossed by no packet, and the rest of the office is not used. */
export const LOOP_PIECES: string[] = [DEVICE.you.id, ROUTER.office.id, ROUTER.provider.id, SERVER.id];

/** The ids of the pieces 01-10 draws: your laptop, the two routers a traceroute to the server crosses, the router behind the broken stretch, which none crosses, and the server. The rest of the office is not used. */
export const PATH_PIECES: string[] = [...LOOP_PIECES, ROUTER.destination.id];

/** The ids of the pieces 01-11 and 01-13 draw: the sender, the laptop that answers and laptop-marta, whose firewall is drawn with it (in 01-13 because the rule of 01-12 goes on working in the background). The printer and the routers stay in the world and are not used, so they are not drawn. */
export const GUARD_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id, DEVICE.marta.id];

/** The ids of the pieces 01-12 draws: the laptop that must get in, the visitor's laptop that must not, and laptop-marta, whose firewall is drawn with it. Your laptop, the printer and the routers stay in the world and are not used, so they are not drawn. */
export const RULE_PIECES: string[] = [DEVICE.lucia.id, DEVICE.visitor.id, DEVICE.marta.id];

/** The ids of the pieces 01-14 draws, the widest map of the chapter: what the seven cases use. The two floors keep the devices that send or answer (your laptop, laptop-lucia and the printer on floor 1, laptop-andres on floor 2), the office router and the two routers of the provider are the road to the server, which a ping crosses when it reaches the server, and the server closes it. The visitor's laptop and laptop-marta are in the world and no case uses them, so they are not drawn. */
export const WATCH_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id, DEVICE.printer.id, DEVICE.andres.id, ROUTER.office.id, ROUTER.provider.id, ROUTER.destination.id, SERVER.id];

const OFFICE_FACES: Router['interfaces'] = [
  { ip: IP.router, faces: FLOOR.first.id },
  { ip: IP.routerSecondFloor, faces: FLOOR.second.id },
];

/** What 01-06 adds to the world: the second floor with laptop-andres on it, the office router between the two floors, and the default gateway of every device (the router's interface on its own floor). */
export const TWO_FLOORS: NetworkAction[] = [
  { type: 'addLan', lan: FLOOR.second },
  { type: 'addDevice', device: officeDevice(DEVICE.andres, 'laptop', IP.andres, { lanId: FLOOR.second.id, gateway: IP.routerSecondFloor }) },
  { type: 'addRouter', router: { id: ROUTER.office.id, name: ROUTER.office.name, interfaces: OFFICE_FACES, routes: [], latencyMs: HOP_MS, sendsUnreachable: true } },
  ...[DEVICE.you, DEVICE.lucia, DEVICE.marta, DEVICE.printer, DEVICE.visitor].map((device): NetworkAction => ({ type: 'setGateway', deviceId: device.id, gateway: IP.router })),
];

/** Returns the route that sends what is for the office, whatever floor it is on, to this router. */
function backToOffice(next: string): Route {
  return { to: OFFICE_RANGE, next };
}

/** The routes of the router of the provider while its stretch works: the server range goes on to the router in front of the server, and what is for the office goes back to the office router. */
const PROVIDER_ROUTES: Route[] = [{ to: SERVER_RANGE, next: ROUTER.destination.id }, backToOffice(ROUTER.office.id)];

/** What 01-08 adds to the world: the way out of the office and the internet beyond it, a router of the provider after the office router and one in front of the server, and the server that answers a ping. The office router gets an interface towards the provider, and its only route sends everything outside the office there. The way a packet leaves the office is a black box: nothing here says how its source changes. */
export const INTERNET: NetworkAction[] = [
  { type: 'addActor', actor: { id: SERVER.id, name: SERVER.name, ip: IP.server, kind: 'server', latencyMs: SERVER_MS } },
  {
    type: 'addRouter',
    router: {
      id: ROUTER.provider.id,
      name: ROUTER.provider.name,
      interfaces: [
        { ip: IP.provider, faces: ROUTER.office.id },
        { ip: IP.providerOnward, faces: ROUTER.destination.id },
      ],
      routes: PROVIDER_ROUTES,
      latencyMs: PROVIDER_MS,
      sendsUnreachable: true,
    },
  },
  {
    type: 'addRouter',
    router: {
      id: ROUTER.destination.id,
      name: ROUTER.destination.name,
      interfaces: [
        { ip: IP.destination, faces: ROUTER.provider.id },
        { ip: IP.destinationServer, faces: SERVER.id },
      ],
      routes: [backToOffice(ROUTER.provider.id)],
      latencyMs: DESTINATION_MS,
      sendsUnreachable: true,
    },
  },
  { type: 'updateRouter', routerId: ROUTER.office.id, interfaces: [...OFFICE_FACES, { ip: IP.officeUplink, faces: ROUTER.provider.id }], routes: [{ to: ROUTE_DEFAULT, next: ROUTER.provider.id }] },
];

/** What 01-09 changes: the router of the provider sends everything it does not know back to the office router, and the office router sends it to the provider again, so a packet to the server goes back and forth between the two. The player does not configure routes: the loop is given. */
export const LOOP: NetworkAction[] = [{ type: 'updateRouter', routerId: ROUTER.provider.id, routes: [{ to: ROUTE_DEFAULT, next: ROUTER.office.id }] }];

/** What 01-10 changes: no loop, but a broken stretch behind the router of the provider, which no longer has a way to the server and, being set up so, does not warn. */
export const BROKEN_STRETCH: NetworkAction[] = [{ type: 'updateRouter', routerId: ROUTER.provider.id, routes: [backToOffice(ROUTER.office.id)], sendsUnreachable: false }];

/** What 01-11 changes: the provider fixed the broken stretch, so its router has its way to the server again and warns when it has none, as it did in 01-08. */
export const REPAIRED_STRETCH: NetworkAction[] = [{ type: 'updateRouter', routerId: ROUTER.provider.id, routes: PROVIDER_ROUTES, sendsUnreachable: true }];

export const WHAT = {
  echoRequest: { id: 'echo-request', label: '{{icmp}} · {{echo-request}}', what: { kind: 'icmp', icmpType: ECHO_REQUEST } },
} satisfies Record<string, WhatChip>;

/** Returns the chip that names the one address of a device in a rule, such as `laptop-lucia (IP 192.168.1.11)`: the Source of an inbound rule (`from`) or the Destination of an outbound one (`to`). The chip is named after the device and its IP, so a Source chip and a Destination chip of one device never share an id. */
function addressChip(side: 'from' | 'to', key: string, name: string, ip: string): FromChip & ToChip {
  return { id: `${side}-${key}`, label: `${nameTag(name)} ({{ip-address|IP}} ${ip})`, peer: { kind: 'cidr', cidr: `${ip}${SINGLE_ADDRESS}` } };
}

export const FROM = {
  anyone: { id: 'any-source', label: 'Cualquier {{source-ip}}', peer: { kind: 'cidr', cidr: ANY_IPV4 } },
  lucia: addressChip('from', 'lucia', DEVICE.lucia.name, IP.lucia),
  printer: addressChip('from', 'printer', DEVICE.printer.name, IP.printer),
} satisfies Record<string, FromChip>;

export const TO = {
  lucia: addressChip('to', 'lucia', DEVICE.lucia.name, IP.lucia),
  printer: addressChip('to', 'printer', DEVICE.printer.name, IP.printer),
} satisfies Record<string, ToChip>;

/** Returns a flow: an Echo Request that a device of the office sends to an address, which the incident expects to come back (`required`), to be kept out (`forbidden`) or to go on as it is while the player works (`ambient`). */
function pingFlow(id: string, kind: FlowKind, fromId: string, to: string): Flow {
  const packet: PacketSpec = { from: { kind: 'device', id: fromId }, to, protocol: 'icmp', icmpType: ECHO_REQUEST };
  return { id, kind, packet };
}

const SUPPORT_PING = pingFlow('support-ping', 'required', DEVICE.lucia.id, IP.marta);

export const FLOW = {
  support: SUPPORT_PING,
  visitor: pingFlow('visitor-ping', 'forbidden', DEVICE.visitor.id, IP.marta),
  leave: pingFlow('ping-leaves', 'required', DEVICE.you.id, IP.lucia),
  background: { ...SUPPORT_PING, kind: 'ambient' },
} satisfies Record<string, Flow>;

/** What 01-13 adds to the world: a firewall on your laptop with no rule in either direction. Someone set your laptop up so: no rule allows anything, in or out, until the player writes one. */
export const YOUR_FIREWALL: NetworkAction = {
  type: 'addFirewall',
  deviceId: DEVICE.you.id,
  firewall: { id: FIREWALL.you, name: DEVICE.you.name, kind: 'host-firewall', inbound: [], outbound: [] },
};

/** Returns the task of a send incident that expects what a message sent from your laptop to an address ends in, and, when `by` is given, who answered, warned or dropped it. */
export function sendTask(id: string, text: string, messageId: string, toId: string, outcome: ExpectedOutcome, by?: string): SendTask {
  return { id, text, expect: { fromId: ORIGIN.you.id, toId, messageId, outcome, by } };
}

/** Returns the task of a send incident that expects what a ping from your laptop to an address ends in, and, when `by` is given, who answered, warned or dropped it. */
export function pingTask(id: string, text: string, toId: string, outcome: ExpectedOutcome, by?: string): SendTask {
  return sendTask(id, text, MESSAGE.ping.id, toId, outcome, by);
}

/** Returns the move that sends a message from your laptop to an address, for the reference solution of a send incident. */
export function sendMove(toId: string, messageId: string): SendMove {
  return { type: 'sendPacket', fromId: ORIGIN.you.id, toId, messageId };
}
