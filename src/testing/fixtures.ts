import { ROUTE_DEFAULT, type Device, type Endpoint, type Network, type PacketSpec, type Router, type Rule } from '@/engine';

export const YOU_IP = '198.51.100.7';
export const ATTACKER_IP = '203.0.113.66';

export const sshFromYou = (id: string): Rule => ({
  id,
  what: { kind: 'tcp', fromPort: 22, toPort: 22 },
  peer: { kind: 'cidr', cidr: `${YOU_IP}/32` },
});
export const allOut = (id: string): Rule => ({ id, what: { kind: 'all' }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });
export const echoFrom = (id: string, sgId: string, icmpType: 0 | 8 = 8): Rule => ({
  id,
  what: { kind: 'icmp', icmpType },
  peer: { kind: 'sg', sgId },
});

export const device = (id: string): Endpoint => ({ kind: 'device', id });
export const actor = (id: string): Endpoint => ({ kind: 'actor', id });
export const ping = (from: Endpoint, to: string): PacketSpec => ({ from, to, protocol: 'icmp', icmpType: 8 });
export const tcp = (from: Endpoint, to: string, port: number): PacketSpec => ({ from, to, protocol: 'tcp', port });

/** Returns the lab 03 network: two EC2 instances in different availability zones, SSH only from your Mac. */
export function lab03Net(): Network {
  return {
    kind: 'vpc',
    region: 'eu-west-1',
    cidr: '172.31.0.0/16',
    subnets: [
      { id: 'subnet-a', az: 'eu-west-1a', cidr: '172.31.16.0/20' },
      { id: 'subnet-b', az: 'eu-west-1b', cidr: '172.31.32.0/20' },
    ],
    devices: [
      {
        id: 'servidor1',
        name: 'servidor1',
        kind: 'ec2-instance',
        subnetId: 'subnet-a',
        privateIp: '172.31.16.131',
        publicIp: '54.78.154.66',
        firewallIds: ['sg-servidor1'],
        host: { ignoreIcmpEcho: false, listeningTcpPorts: [22] },
      },
      {
        id: 'servidor2',
        name: 'servidor2',
        kind: 'ec2-instance',
        subnetId: 'subnet-b',
        privateIp: '172.31.38.97',
        publicIp: '34.244.254.100',
        firewallIds: ['sg-servidor2'],
        host: { ignoreIcmpEcho: false, listeningTcpPorts: [22] },
      },
    ],
    firewalls: [
      { id: 'sg-servidor1', name: 'servidor1', kind: 'security-group', inbound: [sshFromYou('ssh-1')], outbound: [allOut('out-1')] },
      { id: 'sg-servidor2', name: 'servidor2', kind: 'security-group', inbound: [sshFromYou('ssh-2')], outbound: [allOut('out-2')] },
      {
        id: 'sg-default',
        name: 'default',
        kind: 'security-group',
        inbound: [{ id: 'default-self', what: { kind: 'all' }, peer: { kind: 'sg', sgId: 'sg-default' } }],
        outbound: [allOut('out-default')],
      },
    ],
    edge: 'internet-gateway',
    actors: [
      { id: 'you', name: 'Tu Mac', ip: YOU_IP, kind: 'you' },
      { id: 'attacker', name: 'Atacante', ip: ATTACKER_IP, kind: 'attacker' },
    ],
  };
}

export const OFFICE = { cidr: '192.168.1.0/24', you: '192.168.1.10', lucia: '192.168.1.11', printer: '192.168.1.20', nobody: '192.168.1.30' } as const;

function officeDevice(id: string, kind: Device['kind'], privateIp: string): Device {
  return { id, name: id, kind, privateIp, firewallIds: [], host: { ignoreIcmpEcho: false, listeningTcpPorts: [] } };
}

/** Returns the chapter 1 office: your laptop, Lucía's laptop and a printer behind a router, none with a firewall yet; Lucía's host firewall exists but guards nothing. */
export function officeNet(): Network {
  return {
    kind: 'office',
    cidr: OFFICE.cidr,
    devices: [officeDevice('your-laptop', 'laptop', OFFICE.you), officeDevice('lucia-laptop', 'laptop', OFFICE.lucia), officeDevice('printer', 'printer', OFFICE.printer)],
    firewalls: [{ id: 'fw-lucia', name: 'lucia-laptop', kind: 'host-firewall', inbound: [], outbound: [allOut('fw-lucia-out')] }],
    edge: 'router',
    actors: [{ id: 'attacker', name: 'Atacante', ip: ATTACKER_IP, kind: 'attacker' }],
  };
}

export const OFFICE_FLOORS = {
  range: '192.168.0.0/16',
  floor1: { id: 'floor-1', name: 'Piso 1', cidr: '192.168.1.0/24', gateway: '192.168.1.1', you: '192.168.1.10', lucia: '192.168.1.11', marta: '192.168.1.12', printer: '192.168.1.21', guest: '192.168.1.30' },
  floor2: { id: 'floor-2', name: 'Piso 2', cidr: '192.168.2.0/24', gateway: '192.168.2.1', andres: '192.168.2.15' },
  officeRouter: { id: 'router-office', uplink: '203.0.113.10' },
  provider: { id: 'router-provider', towardOffice: '203.0.113.1', towardInternet: '203.0.113.3' },
  backbone: { id: 'router-backbone', towardProvider: '203.0.113.2', towardServer: '198.51.100.1' },
  server: { id: 'internet-server', ip: '198.51.100.50', range: '198.51.100.0/24' },
} as const;

type Floor = typeof OFFICE_FLOORS.floor1 | typeof OFFICE_FLOORS.floor2;

function floorDevice(floor: Floor, id: string, name: string, kind: Device['kind'], privateIp: string, patch: Partial<Device> = {}): Device {
  return { ...officeDevice(id, kind, privateIp), name, lanId: floor.id, gateway: floor.gateway, ...patch };
}

function routerOf(id: string, interfaces: [ip: string, faces: string][], routes: Router['routes'], latencyMs: number): Router {
  return { id, name: id, interfaces: interfaces.map(([ip, faces]) => ({ ip, faces })), routes, latencyMs, sendsUnreachable: true };
}

/** Returns the office of the map that grows: two floors, each a LAN, with a router between them that reaches the internet through two routers of a provider and a server that answers Echo Request. laptop-visita starts without a cable. */
export function officeTwoFloorsNet(): Network {
  const { range, floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
  return {
    kind: 'office',
    cidr: range,
    lans: [floor1, floor2].map(({ id, name, cidr }) => ({ id, name, cidr, latencyMs: 1 })),
    devices: [
      floorDevice(floor1, 'your-laptop', 'tu-laptop', 'laptop', floor1.you),
      floorDevice(floor1, 'lucia-laptop', 'laptop-lucia', 'laptop', floor1.lucia),
      floorDevice(floor1, 'marta-laptop', 'laptop-marta', 'laptop', floor1.marta),
      floorDevice(floor1, 'printer', 'impresora', 'printer', floor1.printer),
      floorDevice(floor1, 'guest-laptop', 'laptop-visita', 'laptop', floor1.guest, { connected: false }),
      floorDevice(floor2, 'andres-laptop', 'laptop-andres', 'laptop', floor2.andres),
    ],
    firewalls: [],
    edge: 'router',
    actors: [{ id: server.id, name: 'servidor-internet', ip: server.ip, kind: 'server', latencyMs: 20 }],
    routers: [
      routerOf(officeRouter.id, [[floor1.gateway, floor1.id], [floor2.gateway, floor2.id], [officeRouter.uplink, provider.id]], [{ to: ROUTE_DEFAULT, next: provider.id }], 1),
      routerOf(provider.id, [[provider.towardOffice, officeRouter.id], [provider.towardInternet, backbone.id]], [{ to: server.range, next: backbone.id }, { to: range, next: officeRouter.id }], 8),
      routerOf(backbone.id, [[backbone.towardProvider, provider.id], [backbone.towardServer, server.id]], [{ to: range, next: provider.id }], 12),
    ],
  };
}

export function withInbound(net: Network, firewallId: string, ...rules: Rule[]): Network {
  return {
    ...net,
    firewalls: net.firewalls.map((f) => (f.id === firewallId ? { ...f, inbound: [...f.inbound, ...rules] } : f)),
  };
}

export function withDevice(net: Network, id: string, patch: Partial<Device>): Network {
  return { ...net, devices: net.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)) };
}
