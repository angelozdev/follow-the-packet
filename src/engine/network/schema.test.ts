import { describe, expect, it } from 'vitest';
import { OFFICE_FLOORS, echoFrom, lab03Net, officeNet, officeTwoFloorsNet, withDevice, withInbound } from '@/testing';
import { networkSchema, packetSchema } from './schema';
import type { Firewall, Network, Router } from './types';

const OS_FIREWALL: Firewall = { id: 'fw-os', name: 'os', kind: 'host-firewall', inbound: [], outbound: [] };
const SECURITY_GROUP: Firewall = { id: 'sg-x', name: 'x', kind: 'security-group', inbound: [], outbound: [] };

function problems(net: unknown): string[] {
  const result = networkSchema.safeParse(net);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

function withFirewall(net: Network, firewall: Firewall): Network {
  return { ...net, firewalls: [...net.firewalls, firewall] };
}

const BROKEN: [string, Network, string][] = [
  ['a VPC without a region', { ...lab03Net(), region: undefined }, 'a VPC needs a region'],
  ['a VPC without subnets', { ...lab03Net(), subnets: [] }, 'a VPC needs at least one subnet'],
  ['a VPC whose edge is a router', { ...lab03Net(), edge: 'router' }, 'a VPC reaches the internet through an Internet gateway'],
  ['a private IP outside its subnet', withDevice(lab03Net(), 'servidor1', { privateIp: '172.31.38.5' }), 'servidor1: 172.31.38.5 is not in 172.31.16.0/20'],
  ['an EC2 instance without a Security Group', withDevice(lab03Net(), 'servidor1', { firewallIds: [] }), 'servidor1: a device in a VPC needs at least one Security Group'],
  ['a firewall that does not exist', withDevice(lab03Net(), 'servidor1', { firewallIds: ['sg-fantasma'] }), 'servidor1: firewall sg-fantasma does not exist'],
  ['an office with a region', { ...officeNet(), region: 'eu-west-1' }, 'an office network has no region'],
  ['an office whose edge is an Internet gateway', { ...officeNet(), edge: 'internet-gateway' }, 'an office reaches the internet through a router'],
  ['an office with subnets', { ...officeNet(), subnets: [{ id: 'subnet-a', az: 'eu-west-1a', cidr: '192.168.1.0/25' }] }, 'an office network has no subnets'],
  ['an office device with a public IP', withDevice(officeNet(), 'printer', { publicIp: '54.78.154.66' }), 'printer: an office device has no public IP'],
  ['an office device in a subnet', withDevice(officeNet(), 'printer', { subnetId: 'subnet-a' }), 'printer: an office device has no subnet'],
  ['an office device outside the office range', withDevice(officeNet(), 'printer', { privateIp: '192.168.2.20' }), 'printer: 192.168.2.20 is not in 192.168.1.0/24'],
  ['an office with a public range', { ...officeNet(), cidr: '8.8.8.0/24' }, '8.8.8.0/24 is not a private range (RFC 1918)'],
  ['an office range wider than a private range', { ...officeNet(), cidr: '192.168.0.0/15' }, '192.168.0.0/15 is not a private range (RFC 1918)'],
  ['a VPC with a range that is not private', { ...lab03Net(), cidr: '100.64.0.0/16' }, '100.64.0.0/16 is not a private range (RFC 1918)'],
  ['two devices with the same IP', withDevice(officeNet(), 'printer', { privateIp: '192.168.1.11' }), 'printer: 192.168.1.11 is already the IP of lucia-laptop'],
  ['two EC2 instances with the same private IP', withDevice(lab03Net(), 'servidor2', { subnetId: 'subnet-a', privateIp: '172.31.16.131' }), 'servidor2: 172.31.16.131 is already the IP of servidor1'],
  ['a Security Group in an office', withFirewall(officeNet(), SECURITY_GROUP), 'sg-x: an office firewall is a host firewall'],
  [
    'a host firewall with a Security Group as Source',
    withFirewall(lab03Net(), { ...OS_FIREWALL, inbound: [echoFrom('echo', 'sg-servidor1')] }),
    'fw-os/echo: only a Security Group takes a Security Group as source',
  ],
  [
    'a Security Group whose Source is a host firewall',
    withInbound(withFirewall(lab03Net(), OS_FIREWALL), 'sg-servidor2', echoFrom('echo', 'fw-os')),
    'sg-servidor2/echo: fw-os is not a Security Group of this network',
  ],
  [
    'a device whose firewalls mix kinds',
    withDevice(withFirewall(officeNet(), SECURITY_GROUP), 'your-laptop', { firewallIds: ['fw-lucia', 'sg-x'] }),
    'your-laptop: its firewalls mix kinds',
  ],
];

describe('networkSchema', () => {
  it('accepts the lab 03 VPC and the chapter 1 office', () => {
    expect(problems(lab03Net())).toEqual([]);
    expect(problems(officeNet())).toEqual([]);
  });

  it('accepts a home on the internet as an actor', () => {
    expect(problems({ ...officeNet(), actors: [{ id: 'home', name: 'Casa', ip: '198.51.100.24', kind: 'home' }] })).toEqual([]);
  });

  it('accepts an office whose laptop has its host firewall', () => {
    expect(problems(withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] }))).toEqual([]);
  });

  it.each(BROKEN)('rejects %s', (_name, net, message) => {
    expect(problems(net)).toContain(message);
  });

  it('reports a malformed office range as an issue instead of throwing', () => {
    for (const cidr of ['garbage', '192.168.1.0', '10.0.0.0/33']) {
      const issues = problems({ ...officeNet(), cidr });
      expect(issues, cidr).toContain('invalid CIDR');
      expect(issues, cidr).not.toContain(`${cidr} is not a private range (RFC 1918)`);
    }
  });
});

const { floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;

function withRouter(net: Network, id: string, patch: Partial<Router>): Network {
  return { ...net, routers: net.routers?.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
}

function withInterface(net: Network, routerId: string, ip: string, faces: string): Network {
  const router = net.routers?.find((r) => r.id === routerId);
  return withRouter(net, routerId, { interfaces: [...(router?.interfaces ?? []), { ip, faces }] });
}

describe('networkSchema with floors, routers and servers of the internet', () => {
  it('accepts an office with two LANs, a router between them and a server of the internet', () => {
    const net = officeTwoFloorsNet();
    expect(problems(net)).toEqual([]);
    expect(net.lans?.map((lan) => lan.id)).toEqual([floor1.id, floor2.id]);
    expect(net.routers?.map((router) => router.id)).toEqual([officeRouter.id, provider.id, backbone.id]);
    expect(net.actors.map((actor) => actor.kind)).toEqual(['server']);
  });

  it('rejects a device whose IP is outside its LAN', () => {
    const net = withDevice(officeTwoFloorsNet(), 'andres-laptop', { privateIp: '192.168.1.15' });
    expect(problems(net)).toContain(`andres-laptop: 192.168.1.15 is not in ${floor2.cidr}`);
  });

  it('rejects a gateway that is not an IPv4 address', () => {
    for (const gateway of ['192.168.1', '192.168.1.256', 'router']) {
      const result = networkSchema.safeParse(withDevice(officeTwoFloorsNet(), 'your-laptop', { gateway }));
      expect(result.success, gateway).toBe(false);
      const issue = result.error?.issues.find((found) => found.path.join('.') === 'devices.0.gateway');
      expect(issue?.message, gateway).toBe('invalid IPv4');
    }
  });

  it('rejects two interfaces or devices with the same IP, even on different routers', () => {
    const interfaceTwice = withInterface(officeTwoFloorsNet(), backbone.id, officeRouter.uplink, provider.id);
    expect(problems(interfaceTwice)).toContain(`${backbone.id}: ${officeRouter.uplink} is already the IP of ${officeRouter.id}`);
    const interfaceAsDevice = withInterface(officeTwoFloorsNet(), provider.id, floor1.lucia, officeRouter.id);
    expect(problems(interfaceAsDevice)).toContain(`${provider.id}: ${floor1.lucia} is already the IP of lucia-laptop`);
    const serverAsInterface = withInterface(officeTwoFloorsNet(), provider.id, server.ip, backbone.id);
    expect(problems(serverAsInterface)).toContain(`${server.id}: ${server.ip} is already the IP of ${provider.id}`);
    const deviceAsInterface = withDevice(officeTwoFloorsNet(), 'andres-laptop', { privateIp: floor2.gateway });
    expect(problems(deviceAsInterface)).toContain(`${officeRouter.id}: ${floor2.gateway} is already the IP of andres-laptop`);
  });

  it('rejects a router interface that faces an unknown LAN, router or server', () => {
    const facing = (faces: string) => problems(withInterface(officeTwoFloorsNet(), officeRouter.id, '192.168.3.1', faces));
    const message = (faces: string) => `${officeRouter.id}: 192.168.3.1 faces ${faces}, which is not a LAN, a router or a server`;
    for (const faces of ['floor-9', 'router-ghost', 'server-ghost', 'your-laptop']) expect(facing(faces)).toContain(message(faces));
    expect(facing(floor2.id)).not.toContain(message(floor2.id));
  });

  it('rejects an interface that faces an actor that is not a server', () => {
    const net = { ...officeTwoFloorsNet(), actors: [...officeTwoFloorsNet().actors, { id: 'attacker', name: 'Atacante', ip: '203.0.113.66', kind: 'attacker' as const }] };
    expect(problems(withInterface(net, backbone.id, '198.51.100.2', 'attacker'))).toContain(
      `${backbone.id}: 198.51.100.2 faces attacker, which is not a LAN, a router or a server`,
    );
  });

  it('rejects a route through an unknown router', () => {
    const net = withRouter(officeTwoFloorsNet(), officeRouter.id, { routes: [{ to: 'default', next: 'router-ghost' }] });
    expect(problems(net)).toContain(`${officeRouter.id}: the route to default goes through router-ghost, which is not a router`);
    const toDevice = withRouter(officeTwoFloorsNet(), officeRouter.id, { routes: [{ to: '10.0.0.0/8', next: 'printer' }] });
    expect(problems(toDevice)).toContain(`${officeRouter.id}: the route to 10.0.0.0/8 goes through printer, which is not a router`);
  });

  it('rejects a route whose range is neither default nor a CIDR', () => {
    const net = withRouter(officeTwoFloorsNet(), officeRouter.id, { routes: [{ to: 'everywhere', next: provider.id }] });
    expect(problems(net)).toContain('invalid CIDR');
  });

  it('keeps accepting the chapter 1 office of today, with one range and no routers', () => {
    const net = officeNet();
    expect(net.lans).toBeUndefined();
    expect(net.routers).toBeUndefined();
    expect(problems(net)).toEqual([]);
    expect(problems({ ...net, routers: [] })).toEqual([]);
  });

  it('rejects a VPC that declares LANs or routers', () => {
    const lans = [{ id: 'lan-a', name: 'LAN A', cidr: '192.168.1.0/24', latencyMs: 1 }];
    expect(problems({ ...lab03Net(), lans })).toContain('a VPC has no LANs');
    expect(problems({ ...lab03Net(), routers: [] })).toContain('a VPC has no routers');
    expect(problems({ ...lab03Net(), routers: officeTwoFloorsNet().routers })).toContain('a VPC has no routers');
  });

  it('rejects a device that names a LAN that does not exist', () => {
    expect(problems(withDevice(officeTwoFloorsNet(), 'printer', { lanId: 'floor-9' }))).toContain('printer: LAN floor-9 does not exist');
  });

  it('asks each device for its LAN once the office has several', () => {
    expect(problems(withDevice(officeTwoFloorsNet(), 'printer', { lanId: undefined }))).toContain('printer: an office with several LANs needs the LAN of each device');
  });

  it('puts a device without a LAN on the only one an office has', () => {
    const single = { ...officeNet(), lans: [{ id: 'floor-1', name: 'Piso 1', cidr: officeNet().cidr, latencyMs: 1 }] };
    expect(problems(single)).toEqual([]);
    expect(problems(withDevice(single, 'printer', { lanId: 'floor-1' }))).toEqual([]);
  });

  it('rejects a LAN with a public range', () => {
    const [floorOne, ...others] = officeTwoFloorsNet().lans ?? [];
    const net = { ...officeTwoFloorsNet(), lans: [{ ...floorOne, cidr: '8.8.8.0/24' }, ...others] };
    expect(problems(net)).toContain('8.8.8.0/24 is not a private range (RFC 1918)');
  });

  it('rejects an empty list of LANs and an id shared by a LAN and a router', () => {
    expect(problems({ ...officeTwoFloorsNet(), lans: [] })).not.toEqual([]);
    expect(problems(withRouter(officeTwoFloorsNet(), officeRouter.id, { id: floor1.id }))).toContain(`duplicate id: ${floor1.id}`);
  });

  it('rejects a server without a latency', () => {
    const noLatency = { id: server.id, name: 'servidor-internet', ip: server.ip, kind: 'server' };
    expect(problems({ ...officeTwoFloorsNet(), actors: [noLatency] })).not.toEqual([]);
  });
});

describe('packetSchema', () => {
  it('requires icmpType for ICMP and port for TCP', () => {
    const from = { kind: 'device', id: 'servidor1' } as const;
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'tcp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp', icmpType: 8 }).success).toBe(true);
  });

  it('takes an optional TTL that is an integer from 1 to 255', () => {
    const ping = { from: { kind: 'device', id: 'your-laptop' }, to: '192.168.1.21', protocol: 'icmp', icmpType: 8 } as const;
    expect(packetSchema.safeParse(ping).success).toBe(true);
    for (const ttl of [1, 64, 255]) expect(packetSchema.safeParse({ ...ping, ttl }).success, String(ttl)).toBe(true);
    for (const ttl of [0, 256, 1.5, -1]) expect(packetSchema.safeParse({ ...ping, ttl }).success, String(ttl)).toBe(false);
  });
});
