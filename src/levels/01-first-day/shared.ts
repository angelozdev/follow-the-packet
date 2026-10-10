import { nameTag } from '@/copy';
import type { Device, Lan, Network, NetworkAction } from '@/engine';
import type { AddressChip, ExpectedOutcome, MessageChip, OriginChip, SendTask } from '@/levels/contract/incident';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

const OFFICE_RANGE = '192.168.0.0/16';
const ANY_IPV4 = '0.0.0.0/0';
const HOP_MS = 1;
const LOCALHOST = 'localhost';

export const IP = {
  you: '192.168.1.10',
  lucia: '192.168.1.11',
  marta: '192.168.1.12',
  printer: '192.168.1.21',
  visitor: '192.168.1.30',
  nobody: '192.168.1.50',
  note: '192.168.1.300',
  loopback: '127.0.0.1',
  andres: '192.168.2.15',
  router: '192.168.1.1',
  routerSecondFloor: '192.168.2.1',
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

export const ROUTER = { office: { id: 'office-router', name: 'router-oficina' } } as const;

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
  router: nameTag(ROUTER.office.name),
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
} satisfies Record<string, OriginChip>;

export const ADDRESS = {
  printer: { id: 'ip-printer', address: IP.printer },
  marta: { id: 'ip-marta', address: IP.marta },
  lucia: { id: 'ip-lucia', address: IP.lucia },
  andres: { id: 'ip-andres', address: IP.andres },
  nobody: { id: 'ip-nobody', address: IP.nobody },
  loopback: { id: 'ip-loopback', address: IP.loopback },
  localhost: { id: 'ip-localhost', address: LOCALHOST },
} satisfies Record<string, AddressChip>;

export const MESSAGE = {
  packet: { id: 'packet', label: '{{packet}}', icmpType: 8, command: 'packet' },
  ping: { id: 'ping', label: '{{ping}}', icmpType: 8, command: 'ping' },
} satisfies Record<string, MessageChip>;

/** The firewall laptop-marta gets in 01-05: nothing may come in and everything may go out. The player does not know the term firewall until 01-11, so no piece, stamp or text shows it before. */
export const HIDDEN_FIREWALL: NetworkAction = {
  type: 'addFirewall',
  deviceId: DEVICE.marta.id,
  firewall: {
    id: 'marta-firewall',
    name: DEVICE.marta.name,
    kind: 'host-firewall',
    inbound: [],
    outbound: [{ id: 'marta-firewall-out', what: { kind: 'all' }, peer: { kind: 'cidr', cidr: ANY_IPV4 } }],
  },
};

/** The ids of the pieces 01-06 and 01-07 draw: the three devices of floor 1 they use, the one on floor 2 and the router between them. Laptop-marta and laptop-visita stay in the world and are not drawn, and neither is anything outside the office. */
export const OFFICE_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id, DEVICE.printer.id, DEVICE.andres.id, ROUTER.office.id];

/** What 01-06 adds to the world: the second floor with laptop-andres on it, the office router between the two floors, and the default gateway of every device (the router's interface on its own floor). */
export const TWO_FLOORS: NetworkAction[] = [
  { type: 'addLan', lan: FLOOR.second },
  { type: 'addDevice', device: officeDevice(DEVICE.andres, 'laptop', IP.andres, { lanId: FLOOR.second.id, gateway: IP.routerSecondFloor }) },
  {
    type: 'addRouter',
    router: {
      id: ROUTER.office.id,
      name: ROUTER.office.name,
      interfaces: [
        { ip: IP.router, faces: FLOOR.first.id },
        { ip: IP.routerSecondFloor, faces: FLOOR.second.id },
      ],
      routes: [],
      latencyMs: HOP_MS,
      sendsUnreachable: true,
    },
  },
  ...[DEVICE.you, DEVICE.lucia, DEVICE.marta, DEVICE.printer, DEVICE.visitor].map((device): NetworkAction => ({ type: 'setGateway', deviceId: device.id, gateway: IP.router })),
];

/** Returns the task of a send incident that expects what a ping from your laptop to an address ends in, and, when `by` is given, who answered, warned or dropped it. */
export function pingTask(id: string, text: string, toId: string, outcome: ExpectedOutcome, by?: string): SendTask {
  return { id, text, expect: { fromId: ORIGIN.you.id, toId, messageId: MESSAGE.ping.id, outcome, by } };
}
