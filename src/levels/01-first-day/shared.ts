import { nameTag } from '@/copy';
import type { Actor, Device, Firewall, Network, PacketSpec } from '@/engine';
import type { AddressChip, Flow, FromChip, MessageChip, OriginChip, SendMove, SendTask, WhatChip } from '@/levels/incident';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

const OFFICE_RANGE = '192.168.1.0/24';
const ANYWHERE = '0.0.0.0/0';
const ECHO_REQUEST = '{{icmp}} · {{echo-request}}';
const ECHO_REPLY = '{{icmp}} · {{echo-reply}}';

export const IP = { you: '192.168.1.10', lucia: '192.168.1.11', printer: '192.168.1.20', nobody: '192.168.1.30' } as const;
export const DEVICE = {
  you: { id: 'your-laptop', name: 'tu-laptop' },
  lucia: { id: 'lucia-laptop', name: 'laptop-lucia' },
  printer: { id: 'printer', name: 'impresora' },
} as const;

function officeDevice({ id, name }: { id: string; name: string }, kind: Device['kind'], privateIp: string): Device {
  return { id, name, kind, privateIp, firewallIds: [], host: { ignoreIcmpEcho: false, listeningTcpPorts: [] } };
}

export const BASE_WORLD: Network = {
  kind: 'office',
  cidr: OFFICE_RANGE,
  devices: [officeDevice(DEVICE.you, 'laptop', IP.you), officeDevice(DEVICE.lucia, 'laptop', IP.lucia), officeDevice(DEVICE.printer, 'printer', IP.printer)],
  firewalls: [],
  edge: 'router',
  actors: [],
};

export const HOME: Actor = { id: 'lucia-home', name: 'Casa de Lucía', ip: '198.51.100.24', kind: 'home' };

export const LUCIA_FIREWALL: Firewall = {
  id: 'fw-lucia',
  name: DEVICE.lucia.name,
  kind: 'host-firewall',
  inbound: [],
  outbound: [{ id: 'all-out-lucia', what: { kind: 'all' }, peer: { kind: 'cidr', cidr: ANYWHERE } }],
};

export const ORIGIN = {
  you: { id: 'you', endpoint: { kind: 'device', id: DEVICE.you.id } },
  home: { id: 'home', endpoint: { kind: 'actor', id: HOME.id } },
} satisfies Record<string, OriginChip>;

export const ADDRESS = {
  you: { id: 'ip-you', address: IP.you },
  lucia: { id: 'ip-lucia', address: IP.lucia },
  printer: { id: 'ip-printer', address: IP.printer },
  nobody: { id: 'ip-nobody', address: IP.nobody },
} satisfies Record<string, AddressChip>;

export const MESSAGE = {
  ping: { id: 'ping', label: '{{ping}}', icmpType: 8 },
  echoRequest: { id: 'echo-request', label: ECHO_REQUEST, icmpType: 8 },
  echoReply: { id: 'echo-reply', label: ECHO_REPLY, icmpType: 0 },
} satisfies Record<string, MessageChip>;

const YOUR_PING_TO_LUCIA = { fromId: ORIGIN.you.id, toId: ADDRESS.lucia.id, messageId: MESSAGE.echoRequest.id };

export const PING_TO_LUCIA: { send: SendMove; expect: SendTask['expect'] } = {
  send: { type: 'sendPacket', ...YOUR_PING_TO_LUCIA },
  expect: { ...YOUR_PING_TO_LUCIA, outcome: 'replied' },
};

const pingFromYou: PacketSpec = { from: ORIGIN.you.endpoint, to: IP.lucia, protocol: 'icmp', icmpType: 8 };

export const PING_LUCIA = { id: 'ping-you-lucia', kind: 'required', packet: pingFromYou } satisfies Flow;

export const WHAT = {
  echoRequest: { id: 'echo-request', label: ECHO_REQUEST, what: { kind: 'icmp', icmpType: 8 } },
  echoReply: { id: 'echo-reply', label: ECHO_REPLY, what: { kind: 'icmp', icmpType: 0 } },
} satisfies Record<string, WhatChip>;

function fromDevice(device: { name: string }, ip: string): FromChip {
  return { id: `from-${ip}`, label: `${nameTag(device.name)} ({{ip-address|IP}} ${ip})`, peer: { kind: 'cidr', cidr: `${ip}/32` } };
}

export const FROM = { you: fromDevice(DEVICE.you, IP.you), printer: fromDevice(DEVICE.printer, IP.printer) };
