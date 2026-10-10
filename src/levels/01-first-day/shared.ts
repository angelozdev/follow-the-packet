import { nameTag } from '@/copy';
import type { Device, Network, NetworkAction } from '@/engine';
import type { AddressChip, ExpectedOutcome, MessageChip, OriginChip, SendTask } from '@/levels/contract/incident';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

const OFFICE_RANGE = '192.168.1.0/24';
const ANY_IPV4 = '0.0.0.0/0';
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
} as const;

export const DEVICE = {
  you: { id: 'your-laptop', name: 'tu-laptop' },
  lucia: { id: 'lucia-laptop', name: 'laptop-lucia' },
  marta: { id: 'marta-laptop', name: 'laptop-marta' },
  printer: { id: 'printer', name: 'impresora' },
  visitor: { id: 'guest-laptop', name: 'laptop-visita' },
} as const;

export const CARD = {
  network: { tray: 'in-network', yes: 'yes', no: 'no' },
  ip: { tray: 'ip', right: 'right', note: 'note', marta: 'marta' },
} as const;

export const NAME = {
  you: nameTag(DEVICE.you.name),
  lucia: nameTag(DEVICE.lucia.name),
  marta: nameTag(DEVICE.marta.name),
  printer: nameTag(DEVICE.printer.name),
} as const;

export const TASK = {
  visitor: 'visitor-outside',
  printer: 'printer-ip',
  packet: 'packet-to-printer',
  ping: 'ping-to-printer',
  loopback: 'ping-to-loopback',
  silence: 'silence-seen',
  warning: 'warning-seen',
} as const;

/** Returns a device of the office, without a firewall and with the host that answers by default; `patch` changes what the world of an incident needs of it. */
function officeDevice({ id, name }: { id: string; name: string }, kind: Device['kind'], privateIp: string, patch: Partial<Device> = {}): Device {
  return { id, name, kind, privateIp, firewallIds: [], host: { ignoreIcmpEcho: false, listeningTcpPorts: [] }, ...patch };
}

/** The world chapter 1 starts from: floor 1 of the office, with your laptop, Lucía's, Marta's and the printer on its network, and the visitor's laptop with no cable. It has no firewall, router, internet or actor yet: each block adds what it needs. */
export const BASE_WORLD: Network = {
  kind: 'office',
  cidr: OFFICE_RANGE,
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

/** Returns the task of a send incident that expects what a ping from your laptop to an address ends in, and, when `by` is given, who answered, warned or dropped it. */
export function pingTask(id: string, text: string, toId: string, outcome: ExpectedOutcome, by?: string): SendTask {
  return { id, text, expect: { fromId: ORIGIN.you.id, toId, messageId: MESSAGE.ping.id, outcome, by } };
}
