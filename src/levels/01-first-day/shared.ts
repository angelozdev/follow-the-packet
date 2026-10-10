import type { Device, Network } from '@/engine';
import type { AddressChip, MessageChip, OriginChip } from '@/levels/incident';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

const OFFICE_RANGE = '192.168.1.0/24';

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

export const ORIGIN = {
  you: { id: 'you', endpoint: { kind: 'device', id: DEVICE.you.id } },
} satisfies Record<string, OriginChip>;

export const ADDRESS = {
  you: { id: 'ip-you', address: IP.you },
  lucia: { id: 'ip-lucia', address: IP.lucia },
  printer: { id: 'ip-printer', address: IP.printer },
  nobody: { id: 'ip-nobody', address: IP.nobody },
} satisfies Record<string, AddressChip>;

export const MESSAGE = {
  ping: { id: 'ping', label: '{{ping}}', icmpType: 8 },
  echoRequest: { id: 'echo-request', label: '{{icmp}} · {{echo-request}}', icmpType: 8 },
  echoReply: { id: 'echo-reply', label: '{{icmp}} · {{echo-reply}}', icmpType: 0 },
} satisfies Record<string, MessageChip>;
