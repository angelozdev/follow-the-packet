import { describe, expect, it } from 'vitest';
import { ATTACKER_IP, NAME_SERVER_PIECES, OFFICE_FLOORS, allOut, echoFrom, lab03Net, officeNet, officeTwoFloorsNet, officeWithNames, tcpService, withDevice } from '@/testing';
import { ROUTE_PROBLEMS, SITE_PROBLEMS, applyAction, networkActionSchema, routeProblem, siteProblem, type NetworkAction, type RouteProblem, type SiteProblem } from './actions';
import { ROUTE_DEFAULT, networkSchema } from './schema';
import { IMPLICIT_LAN_ID } from '@/engine/network/addressing/topology';
import type { Site } from '@/engine/web/schema';
import type { Actor, Device, Firewall, Forward, Lan, Network, Process, Route, Router, ServerActor, ServerDns, Service } from './types';

const { floor1, floor2, officeRouter, provider, backbone } = OFFICE_FLOORS;
const FLOOR_3 = { id: 'floor-3', cidr: '192.168.3.0/24', gateway: '192.168.3.1', uplink: '192.168.2.2', ana: '192.168.3.15' } as const;
const OFFICE_ACTIONS = new Set<NetworkAction['type']>(['updateRouter', 'connectDevice', 'setGateway']);
const APP: Service = tcpService(3000);
const DATABASE: Service = tcpService(5432);
const NAME_SERVER: Service = { protocol: 'udp', port: 53, listen: 'all' };

const inboundIds = (net: Network, firewallId: string) => net.firewalls.find((f) => f.id === firewallId)?.inbound.map((r) => r.id);
const outboundIds = (net: Network, firewallId: string) => net.firewalls.find((f) => f.id === firewallId)?.outbound.map((r) => r.id);
const deviceOf = (net: Network, id: string) => net.devices.find((d) => d.id === id);
const routerOf = (net: Network, id: string) => net.routers?.find((r) => r.id === id);
const serverOf = (net: Network, id: string) => net.actors.find((a): a is ServerActor => a.kind === 'server' && a.id === id);
const validate = (net: Network) => networkSchema.safeParse(net).error?.issues.map((issue) => issue.message) ?? [];

const GHOST = 'ghost';
const UNKNOWN_IDS: [string, NetworkAction][] = [
  ['addRule on a firewall', { type: 'addRule', firewallId: GHOST, rule: echoFrom('echo', 'sg-servidor1') }],
  ['addRule of an outbound rule on a firewall', { type: 'addRule', firewallId: GHOST, rule: allOut('out'), direction: 'outbound' }],
  ['removeRule on a firewall', { type: 'removeRule', firewallId: GHOST, ruleId: 'ssh-1' }],
  ['removeRule of a rule', { type: 'removeRule', firewallId: 'sg-servidor1', ruleId: GHOST }],
  ['removeRule of an inbound rule from the outbound list', { type: 'removeRule', firewallId: 'sg-servidor1', ruleId: 'ssh-1', direction: 'outbound' }],
  ['removeRule of an outbound rule from the inbound list', { type: 'removeRule', firewallId: 'sg-servidor1', ruleId: 'out-1' }],
  ['setAppTarget on a device', { type: 'setAppTarget', deviceId: GHOST, target: '172.31.38.97' }],
  ['setIgnoreIcmpEcho on a device', { type: 'setIgnoreIcmpEcho', deviceId: GHOST, value: true }],
  ['addFirewall on a device', { type: 'addFirewall', deviceId: GHOST, firewall: { id: 'fw', name: 'fw', kind: 'security-group', inbound: [], outbound: [] } }],
  ['connectDevice on a device', { type: 'connectDevice', deviceId: GHOST }],
  ['setGateway on a device', { type: 'setGateway', deviceId: GHOST, gateway: floor1.gateway }],
  ['updateRouter on a router', { type: 'updateRouter', routerId: GHOST, routes: [], sendsUnreachable: false }],
  ['setServices on a device or server', { type: 'setServices', ownerId: GHOST, services: [APP] }],
  ['setServices on an actor that is not a server', { type: 'setServices', ownerId: 'you', services: [APP] }],
  ['setListenAddress on a device or server', { type: 'setListenAddress', ownerId: GHOST, protocol: 'tcp', port: 22, listen: 'loopback' }],
  ['setListenAddress on a port the owner does not serve', { type: 'setListenAddress', ownerId: 'servidor1', protocol: 'tcp', port: 80, listen: 'loopback' }],
  ['setHosts on a device', { type: 'setHosts', deviceId: GHOST, hosts: [{ name: 'tienda.lucia.example', ip: floor1.printer }] }],
  ['setListenAddress on a protocol the owner does not serve', { type: 'setListenAddress', ownerId: 'servidor1', protocol: 'udp', port: 22, listen: 'loopback' }],
];

describe('applyAction', () => {
  it('adds and removes inbound rules', () => {
    const added = applyAction(lab03Net(), { type: 'addRule', firewallId: 'sg-servidor2', rule: echoFrom('echo', 'sg-servidor1') });
    expect(inboundIds(added, 'sg-servidor2')).toEqual(['ssh-2', 'echo']);
    const removed = applyAction(added, { type: 'removeRule', firewallId: 'sg-servidor2', ruleId: 'ssh-2' });
    expect(inboundIds(removed, 'sg-servidor2')).toEqual(['echo']);
  });

  it('changes an app target and the host echo setting', () => {
    const targeted = applyAction(lab03Net(), { type: 'setAppTarget', deviceId: 'servidor1', target: '172.31.38.97' });
    expect(targeted.devices.find((d) => d.id === 'servidor1')?.appTarget).toBe('172.31.38.97');
    const ignoring = applyAction(lab03Net(), { type: 'setIgnoreIcmpEcho', deviceId: 'servidor2', value: true });
    expect(ignoring.devices.find((d) => d.id === 'servidor2')?.host.ignoreIcmpEcho).toBe(true);
  });

  it('adds an actor on the internet', () => {
    const visitor: Actor = { id: 'visitor', name: 'Visita', ip: ATTACKER_IP, kind: 'attacker' };
    expect(applyAction(officeNet(), { type: 'addActor', actor: visitor }).actors.at(-1)).toEqual(visitor);
  });

  it('adds a firewall and puts it on its device', () => {
    const firewall: Firewall = { id: 'fw-printer', name: 'printer', kind: 'host-firewall', inbound: [], outbound: [] };
    const guarded = applyAction(officeNet(), { type: 'addFirewall', deviceId: 'printer', firewall });
    expect(guarded.firewalls.at(-1)).toEqual(firewall);
    expect(guarded.devices.find((d) => d.id === 'printer')?.firewallIds).toEqual(['fw-printer']);
    expect(guarded.devices.find((d) => d.id === 'your-laptop')?.firewallIds).toEqual([]);
  });

  it('addRule with direction outbound adds the rule to the outbound list', () => {
    const added = applyAction(lab03Net(), { type: 'addRule', firewallId: 'sg-servidor2', rule: allOut('out-extra'), direction: 'outbound' });
    expect(outboundIds(added, 'sg-servidor2')).toEqual(['out-2', 'out-extra']);
    expect(inboundIds(added, 'sg-servidor2')).toEqual(['ssh-2']);
    expect(outboundIds(added, 'sg-servidor1')).toEqual(['out-1']);
  });

  it('addRule without direction adds an inbound rule, as before', () => {
    const added = applyAction(lab03Net(), { type: 'addRule', firewallId: 'sg-servidor2', rule: echoFrom('echo', 'sg-servidor1') });
    expect(inboundIds(added, 'sg-servidor2')).toEqual(['ssh-2', 'echo']);
    expect(outboundIds(added, 'sg-servidor2')).toEqual(['out-2']);
    expect(applyAction(lab03Net(), { type: 'addRule', firewallId: 'sg-servidor2', rule: echoFrom('echo', 'sg-servidor1'), direction: 'inbound' })).toEqual(added);
  });

  it('removeRule with direction outbound removes it', () => {
    const added = applyAction(lab03Net(), { type: 'addRule', firewallId: 'sg-servidor2', rule: allOut('out-extra'), direction: 'outbound' });
    const removed = applyAction(added, { type: 'removeRule', firewallId: 'sg-servidor2', ruleId: 'out-2', direction: 'outbound' });
    expect(outboundIds(removed, 'sg-servidor2')).toEqual(['out-extra']);
    expect(inboundIds(removed, 'sg-servidor2')).toEqual(['ssh-2']);
  });

  it('the action schema takes a direction on both rule actions and refuses any other', () => {
    const rule = allOut('out');
    for (const type of ['addRule', 'removeRule'] as const) {
      const base = type === 'addRule' ? { type, firewallId: 'sg-servidor2', rule } : { type, firewallId: 'sg-servidor2', ruleId: 'out-2' };
      expect(networkActionSchema.safeParse(base).success).toBe(true);
      expect(networkActionSchema.safeParse({ ...base, direction: 'outbound' }).success).toBe(true);
      expect(networkActionSchema.safeParse({ ...base, direction: 'sideways' }).success).toBe(false);
    }
  });
});

describe('applyAction on an office with floors', () => {
  it('connectDevice plugs a device into the network', () => {
    const plugged = applyAction(officeTwoFloorsNet(), { type: 'connectDevice', deviceId: 'guest-laptop' });
    expect(deviceOf(officeTwoFloorsNet(), 'guest-laptop')?.connected).toBe(false);
    expect(deviceOf(plugged, 'guest-laptop')?.connected).toBe(true);
    expect(deviceOf(plugged, 'printer')).toEqual(deviceOf(officeTwoFloorsNet(), 'printer'));
  });

  it('setGateway sets and clears the gateway of a device', () => {
    const set = applyAction(withDevice(officeTwoFloorsNet(), 'printer', { gateway: undefined }), { type: 'setGateway', deviceId: 'printer', gateway: floor1.gateway });
    expect(deviceOf(set, 'printer')?.gateway).toBe(floor1.gateway);
    const cleared = applyAction(set, { type: 'setGateway', deviceId: 'printer' });
    expect(deviceOf(cleared, 'printer')).not.toHaveProperty('gateway');
    expect(deviceOf(cleared, 'your-laptop')?.gateway).toBe(floor1.gateway);
  });

  it('addLan, addDevice and addRouter grow an office and keep it valid', () => {
    const lan: Lan = { id: FLOOR_3.id, name: 'Piso 3', cidr: FLOOR_3.cidr, latencyMs: 1 };
    const laptop: Device = {
      id: 'ana-laptop',
      name: 'laptop-ana',
      kind: 'laptop',
      privateIp: FLOOR_3.ana,
      firewallIds: [],
      host: { ignoreIcmpEcho: false, services: [] },
      lanId: lan.id,
      gateway: FLOOR_3.gateway,
    };
    const router: Router = {
      id: 'router-floor-3',
      name: 'router-floor-3',
      interfaces: [{ ip: FLOOR_3.gateway, faces: lan.id }, { ip: FLOOR_3.uplink, faces: floor2.id }],
      routes: [],
      latencyMs: 1,
      sendsUnreachable: true,
    };
    const actions: NetworkAction[] = [{ type: 'addLan', lan }, { type: 'addDevice', device: laptop }, { type: 'addRouter', router }];
    const grown = actions.reduce(applyAction, officeTwoFloorsNet());
    expect(grown.lans?.map((l) => l.id)).toEqual([floor1.id, floor2.id, lan.id]);
    expect(deviceOf(grown, 'ana-laptop')).toEqual(laptop);
    expect(grown.routers?.map((r) => r.id)).toEqual([officeRouter.id, provider.id, backbone.id, router.id]);
    expect(validate(grown)).toEqual([]);
  });

  it('addLan on an office that declared no LANs keeps its range as the first LAN and asks its devices to name it', () => {
    const lan: Lan = { id: floor2.id, name: 'Piso 2', cidr: floor2.cidr, latencyMs: 1 };
    const grown = applyAction(officeNet(), { type: 'addLan', lan });
    expect(grown.lans?.map((l) => [l.id, l.cidr])).toEqual([[IMPLICIT_LAN_ID, officeNet().cidr], [floor2.id, floor2.cidr]]);
    expect(validate(grown)).toHaveLength(officeNet().devices.length);
    const named = officeNet().devices.reduce((net, { id }) => withDevice(net, id, { lanId: IMPLICIT_LAN_ID }), grown);
    expect(validate(named)).toEqual([]);
  });

  it('addRouter starts the list of routers of an office that had none', () => {
    const router: Router = { id: officeRouter.id, name: officeRouter.id, interfaces: [], routes: [], latencyMs: 1, sendsUnreachable: true };
    expect(applyAction(officeNet(), { type: 'addRouter', router }).routers).toEqual([router]);
  });

  it('updateRouter replaces the routes and the unreachable behavior of a router', () => {
    const routes = [{ to: floor2.cidr, next: provider.id }];
    const updated = applyAction(officeTwoFloorsNet(), { type: 'updateRouter', routerId: officeRouter.id, routes, sendsUnreachable: false });
    expect(routerOf(updated, officeRouter.id)).toEqual({ ...routerOf(officeTwoFloorsNet(), officeRouter.id), routes, sendsUnreachable: false });
    expect(routerOf(updated, provider.id)).toEqual(routerOf(officeTwoFloorsNet(), provider.id));
    const onlyRoutes = applyAction(officeTwoFloorsNet(), { type: 'updateRouter', routerId: provider.id, routes: [] });
    expect(routerOf(onlyRoutes, provider.id)?.routes).toEqual([]);
    expect(routerOf(onlyRoutes, provider.id)?.sendsUnreachable).toBe(true);
  });

  it('updateRouter replaces the interfaces of a router, so it can face a router that was added after it', () => {
    const net = officeTwoFloorsNet();
    const office = routerOf(net, officeRouter.id);
    const interfaces = [...(office?.interfaces ?? []), { ip: '203.0.113.20', faces: backbone.id }];
    const updated = applyAction(net, { type: 'updateRouter', routerId: officeRouter.id, interfaces });
    expect(routerOf(updated, officeRouter.id)).toEqual({ ...office, interfaces });
    expect(validate(updated)).toEqual([]);
    expect(validate(applyAction(net, { type: 'updateRouter', routerId: officeRouter.id, interfaces: [{ ip: '203.0.113.20', faces: GHOST }] }))).toHaveLength(1);
    expect(routerOf(applyAction(net, { type: 'updateRouter', routerId: officeRouter.id, routes: [] }), officeRouter.id)?.interfaces).toEqual(office?.interfaces);
  });

  it('addRoute adds a route and keeps the others', () => {
    const net = officeTwoFloorsNet();
    const office = routerOf(net, officeRouter.id);
    const toServer = { to: OFFICE_FLOORS.server.range, next: provider.id };
    const toFloor = { to: floor2.cidr, next: backbone.id };
    const added = applyAction(applyAction(net, { type: 'addRoute', routerId: officeRouter.id, route: toServer }), { type: 'addRoute', routerId: officeRouter.id, route: toFloor });
    expect(routerOf(added, officeRouter.id)).toEqual({ ...office, routes: [...(office?.routes ?? []), toServer, toFloor] });
    expect(routerOf(added, provider.id)).toEqual(routerOf(net, provider.id));
    expect(routerOf(added, backbone.id)).toEqual(routerOf(net, backbone.id));
    const sharedWithTheProvider = applyAction(net, { type: 'addRoute', routerId: officeRouter.id, route: { to: OFFICE_FLOORS.range, next: provider.id } });
    expect(routerOf(sharedWithTheProvider, officeRouter.id)?.routes).toHaveLength(2);
    expect(validate(added)).toEqual([]);
    expect(validate(sharedWithTheProvider)).toEqual([]);
  });

  it('addRoute for a destination that already has a route returns the same network', () => {
    const net = officeTwoFloorsNet();
    const sameDefault: NetworkAction = { type: 'addRoute', routerId: officeRouter.id, route: { to: ROUTE_DEFAULT, next: provider.id } };
    const otherNextHop: NetworkAction = { type: 'addRoute', routerId: officeRouter.id, route: { to: ROUTE_DEFAULT, next: backbone.id } };
    const defaultWrittenAsARange: NetworkAction = { type: 'addRoute', routerId: officeRouter.id, route: { to: '0.0.0.0/0', next: provider.id } };
    for (const action of [sameDefault, otherNextHop, defaultWrittenAsARange]) expect(applyAction(net, action)).toBe(net);
    const withRange = applyAction(net, { type: 'addRoute', routerId: officeRouter.id, route: { to: OFFICE_FLOORS.server.range, next: provider.id } });
    expect(withRange).not.toBe(net);
    const sameRange: NetworkAction = { type: 'addRoute', routerId: officeRouter.id, route: { to: OFFICE_FLOORS.server.range, next: backbone.id } };
    const sameRangeWithHostBits: NetworkAction = { type: 'addRoute', routerId: officeRouter.id, route: { to: '198.51.100.7/24', next: provider.id } };
    expect(applyAction(withRange, sameRange)).toBe(withRange);
    expect(applyAction(withRange, sameRangeWithHostBits)).toBe(withRange);
    const otherLength: NetworkAction = { type: 'addRoute', routerId: officeRouter.id, route: { to: '198.51.100.0/25', next: provider.id } };
    expect(routerOf(applyAction(withRange, otherLength), officeRouter.id)?.routes).toHaveLength(3);
  });

  it('routeProblem says why addRoute returns the same network, and nothing when it adds the route', () => {
    const net = officeTwoFloorsNet();
    const addRoute = (routerId: string, route: Route): NetworkAction => ({ type: 'addRoute', routerId, route });
    const refused: [string, string, Route, RouteProblem][] = [
      ['a destination the router already has a route to', officeRouter.id, { to: ROUTE_DEFAULT, next: backbone.id }, 'destination-has-route'],
      ['the same destination written as a range', officeRouter.id, { to: '0.0.0.0/0', next: provider.id }, 'destination-has-route'],
      ['a router that does not exist', GHOST, { to: ROUTE_DEFAULT, next: provider.id }, 'no-router'],
    ];
    for (const [name, routerId, route, why] of refused) {
      expect(routeProblem(net, routerId, route), name).toBe(why);
      expect(applyAction(net, addRoute(routerId, route)), name).toBe(net);
    }
    expect(new Set(refused.map(([, , , why]) => why))).toEqual(new Set(ROUTE_PROBLEMS));
    const fresh: Route = { to: OFFICE_FLOORS.server.range, next: provider.id };
    expect(routeProblem(net, officeRouter.id, fresh)).toBeUndefined();
    expect(applyAction(net, addRoute(officeRouter.id, fresh))).not.toBe(net);
  });

  it('removeRoute removes the route of one destination', () => {
    const net = officeTwoFloorsNet();
    const providerBefore = routerOf(net, provider.id);
    const removed = applyAction(net, { type: 'removeRoute', routerId: provider.id, to: OFFICE_FLOORS.server.range });
    expect(routerOf(removed, provider.id)).toEqual({ ...providerBefore, routes: [{ to: OFFICE_FLOORS.range, next: officeRouter.id }] });
    expect(routerOf(removed, officeRouter.id)).toEqual(routerOf(net, officeRouter.id));
    expect(routerOf(removed, backbone.id)).toEqual(routerOf(net, backbone.id));
    const emptied = applyAction(net, { type: 'removeRoute', routerId: officeRouter.id, to: ROUTE_DEFAULT });
    expect(routerOf(emptied, officeRouter.id)).toEqual({ ...routerOf(net, officeRouter.id), routes: [] });
    const asARange = applyAction(net, { type: 'removeRoute', routerId: officeRouter.id, to: '0.0.0.0/0' });
    const withHostBits = applyAction(net, { type: 'removeRoute', routerId: provider.id, to: '198.51.100.9/24' });
    expect(routerOf(asARange, officeRouter.id)?.routes).toEqual([]);
    expect(routerOf(withHostBits, provider.id)).toEqual(routerOf(removed, provider.id));
    expect(validate(emptied)).toEqual([]);
    expect(routerOf(applyAction(emptied, { type: 'addRoute', routerId: officeRouter.id, route: { to: ROUTE_DEFAULT, next: provider.id } }), officeRouter.id)).toEqual(routerOf(net, officeRouter.id));
  });

  it('actions on unknown routers return the same network', () => {
    const net = officeTwoFloorsNet();
    const unknown: NetworkAction[] = [
      { type: 'addRoute', routerId: GHOST, route: { to: ROUTE_DEFAULT, next: provider.id } },
      { type: 'removeRoute', routerId: GHOST, to: ROUTE_DEFAULT },
      { type: 'removeRoute', routerId: officeRouter.id, to: OFFICE_FLOORS.server.range },
      { type: 'removeRoute', routerId: provider.id, to: ROUTE_DEFAULT },
    ];
    for (const action of unknown) expect(applyAction(net, action), JSON.stringify(action)).toBe(net);
    const routerless = officeNet();
    expect(applyAction(routerless, unknown[0])).toBe(routerless);
    expect(applyAction(routerless, unknown[1])).toBe(routerless);
  });

  it('a route is a destination that is default or a CIDR, and a router that exists', () => {
    const parses = (action: unknown) => networkActionSchema.safeParse(action).success;
    expect(parses({ type: 'addRoute', routerId: officeRouter.id, route: { to: '10.0.0.0/16', next: provider.id } })).toBe(true);
    expect(parses({ type: 'addRoute', routerId: officeRouter.id, route: { to: ROUTE_DEFAULT, next: provider.id } })).toBe(true);
    expect(parses({ type: 'addRoute', routerId: officeRouter.id, route: { to: 'everywhere', next: provider.id } })).toBe(false);
    expect(parses({ type: 'addRoute', routerId: officeRouter.id, route: { to: ROUTE_DEFAULT } })).toBe(false);
    expect(parses({ type: 'removeRoute', routerId: officeRouter.id, to: '10.0.0.0/16' })).toBe(true);
    expect(parses({ type: 'removeRoute', routerId: officeRouter.id, to: 'everywhere' })).toBe(false);
    expect(parses({ type: 'removeRoute', routerId: '', to: ROUTE_DEFAULT })).toBe(false);
  });

  it('setServices replaces the services of a device or server', () => {
    const net = officeTwoFloorsNet();
    const device = applyAction(applyAction(net, { type: 'setServices', ownerId: 'lucia-laptop', services: [APP, DATABASE] }), { type: 'setServices', ownerId: 'lucia-laptop', services: [NAME_SERVER] });
    expect(deviceOf(device, 'lucia-laptop')?.host.services).toEqual([NAME_SERVER]);
    expect(deviceOf(device, 'lucia-laptop')?.host.ignoreIcmpEcho).toBe(false);
    expect(deviceOf(device, 'marta-laptop')).toEqual(deviceOf(net, 'marta-laptop'));
    const server = applyAction(net, { type: 'setServices', ownerId: OFFICE_FLOORS.server.id, services: [APP, DATABASE] });
    expect(serverOf(server, OFFICE_FLOORS.server.id)?.services).toEqual([APP, DATABASE]);
    expect(applyAction(server, { type: 'setServices', ownerId: OFFICE_FLOORS.server.id, services: [] }).actors).toEqual(net.actors.map((a) => (a.kind === 'server' ? { ...a, services: [] } : a)));
    expect(deviceOf(server, 'lucia-laptop')).toEqual(deviceOf(net, 'lucia-laptop'));
    expect(validate(device)).toEqual([]);
    expect(validate(server)).toEqual([]);
  });

  it('setListenAddress changes the address of one service and keeps the rest', () => {
    const net = applyAction(officeTwoFloorsNet(), { type: 'setServices', ownerId: 'lucia-laptop', services: [APP, DATABASE, { ...APP, protocol: 'udp' }] });
    const moved = applyAction(net, { type: 'setListenAddress', ownerId: 'lucia-laptop', protocol: 'tcp', port: 3000, listen: 'loopback' });
    expect(deviceOf(moved, 'lucia-laptop')?.host.services).toEqual([tcpService(3000, 'loopback'), DATABASE, { ...APP, protocol: 'udp' }]);
    const back = applyAction(moved, { type: 'setListenAddress', ownerId: 'lucia-laptop', protocol: 'tcp', port: 3000, listen: 'all' });
    expect(deviceOf(back, 'lucia-laptop')?.host.services).toEqual(deviceOf(net, 'lucia-laptop')?.host.services);
    expect(deviceOf(moved, 'marta-laptop')).toEqual(deviceOf(net, 'marta-laptop'));
    const served = applyAction(net, { type: 'setServices', ownerId: OFFICE_FLOORS.server.id, services: [DATABASE, NAME_SERVER] });
    const serverMoved = applyAction(served, { type: 'setListenAddress', ownerId: OFFICE_FLOORS.server.id, protocol: 'udp', port: 53, listen: 'loopback' });
    expect(serverOf(serverMoved, OFFICE_FLOORS.server.id)?.services).toEqual([DATABASE, { ...NAME_SERVER, listen: 'loopback' }]);
    expect(validate(moved)).toEqual([]);
    expect(validate(serverMoved)).toEqual([]);
  });

  it('a service is a protocol, a port from 1 to 65535 and a listening address', () => {
    const parses = (services: unknown[]) => networkActionSchema.safeParse({ type: 'setServices', ownerId: 'lucia-laptop', services }).success;
    expect(parses([APP, NAME_SERVER, tcpService(65535, 'loopback')])).toBe(true);
    expect(parses([{ ...APP, port: 0 }])).toBe(false);
    expect(parses([{ ...APP, port: 65536 }])).toBe(false);
    expect(parses([{ ...APP, protocol: 'icmp' }])).toBe(false);
    expect(parses([{ ...APP, listen: '0.0.0.0' }])).toBe(false);
    expect(parses([{ protocol: 'tcp', port: 3000 }])).toBe(false);
  });

  it('setForwards replaces the forwards of a router and keeps the rest', () => {
    const net = officeTwoFloorsNet();
    const web: Forward = { protocol: 'tcp', publicPort: 8080, toDeviceId: 'andres-laptop', toPort: 3000 };
    const dns: Forward = { protocol: 'udp', publicPort: 5353, toDeviceId: 'lucia-laptop', toPort: 53 };
    const first = applyAction(net, { type: 'setForwards', routerId: officeRouter.id, forwards: [web, dns] });
    const second = applyAction(first, { type: 'setForwards', routerId: officeRouter.id, forwards: [dns] });
    expect(routerOf(first, officeRouter.id)).toEqual({ ...routerOf(net, officeRouter.id), forwards: [web, dns] });
    expect(routerOf(second, officeRouter.id)?.forwards).toEqual([dns]);
    expect(routerOf(first, provider.id)).toEqual(routerOf(net, provider.id));
    expect(deviceOf(first, 'andres-laptop')).toEqual(deviceOf(net, 'andres-laptop'));
    expect(validate(first)).toEqual([]);
  });

  it('setForwards with no forward leaves the router as it was before it had any', () => {
    const net = officeTwoFloorsNet();
    const forward: Forward = { protocol: 'tcp', publicPort: 3000, toDeviceId: 'andres-laptop', toPort: 3000 };
    const cleared = applyAction(applyAction(net, { type: 'setForwards', routerId: officeRouter.id, forwards: [forward] }), { type: 'setForwards', routerId: officeRouter.id, forwards: [] });
    expect(routerOf(cleared, officeRouter.id)).not.toHaveProperty('forwards');
    expect(cleared).toEqual(net);
    expect(applyAction(net, { type: 'setForwards', routerId: officeRouter.id, forwards: [] })).toEqual(net);
  });

  it('setForwards on a router that does not exist returns the same network', () => {
    const forward: Forward = { protocol: 'tcp', publicPort: 3000, toDeviceId: 'andres-laptop', toPort: 3000 };
    const action: NetworkAction = { type: 'setForwards', routerId: GHOST, forwards: [forward] };
    for (const net of [officeTwoFloorsNet(), officeNet(), lab03Net()]) expect(applyAction(net, action)).toBe(net);
  });

  it('a forward is a protocol that is TCP or UDP, two ports from 1 to 65535 and a device', () => {
    const forward = { protocol: 'tcp', publicPort: 3000, toDeviceId: 'andres-laptop', toPort: 3000 };
    const parses = (forwards: unknown[]) => networkActionSchema.safeParse({ type: 'setForwards', routerId: officeRouter.id, forwards }).success;
    expect(parses([forward, { ...forward, protocol: 'udp', publicPort: 65535 }])).toBe(true);
    expect(parses([{ ...forward, protocol: 'icmp' }])).toBe(false);
    expect(parses([{ ...forward, publicPort: 0 }])).toBe(false);
    expect(parses([{ ...forward, toPort: 65536 }])).toBe(false);
    expect(parses([{ ...forward, toDeviceId: '' }])).toBe(false);
    expect(parses([{ protocol: 'tcp', publicPort: 3000 }])).toBe(false);
  });

  it('actions on unknown ids return the same network', () => {
    for (const [name, action] of UNKNOWN_IDS) {
      const net = OFFICE_ACTIONS.has(action.type) ? officeTwoFloorsNet() : lab03Net();
      expect(applyAction(net, action), name).toBe(net);
    }
  });
});

describe('applyAction for the DNS', () => {
  const { resolver, authoritative } = NAME_SERVER_PIECES;
  const dnsOf = (net: Network, id: string) => serverOf(net, id)?.dns;
  const withHome = (net: Network): Network => applyAction(net, { type: 'addActor', actor: { id: 'home', name: 'casa-lucia', kind: 'home', ip: '192.0.2.77' } });

  it('setDnsServer sets the resolver of a device and takes it away when it gives none', () => {
    const net = officeTwoFloorsNet();
    const set = applyAction(net, { type: 'setDnsServer', deviceId: 'your-laptop', server: resolver.ip });
    expect(deviceOf(set, 'your-laptop')?.dnsServer).toBe(resolver.ip);
    expect(deviceOf(set, 'printer')).toEqual(deviceOf(net, 'printer'));
    const cleared = applyAction(set, { type: 'setDnsServer', deviceId: 'your-laptop' });
    expect(cleared).toEqual(net);
    expect(deviceOf(cleared, 'your-laptop')).not.toHaveProperty('dnsServer');
    expect(validate(set)).toEqual([]);
    expect(networkActionSchema.safeParse({ type: 'setDnsServer', deviceId: 'your-laptop', server: 'not-an-ip' }).success).toBe(false);
  });

  it('setHosts replaces the hosts file of a device and takes the field away when it gives no line', () => {
    const net = officeTwoFloorsNet();
    const shop = { name: `tienda.${NAME_SERVER_PIECES.zone}`, ip: NAME_SERVER_PIECES.site };
    const blog = { name: `blog.${NAME_SERVER_PIECES.zone}`, ip: floor1.printer };
    const set = applyAction(net, { type: 'setHosts', deviceId: 'your-laptop', hosts: [shop] });
    expect(deviceOf(set, 'your-laptop')?.hosts).toEqual([shop]);
    expect(deviceOf(set, 'printer')).toEqual(deviceOf(net, 'printer'));
    expect(deviceOf(applyAction(set, { type: 'setHosts', deviceId: 'your-laptop', hosts: [blog, shop] }), 'your-laptop')?.hosts).toEqual([blog, shop]);
    const cleared = applyAction(set, { type: 'setHosts', deviceId: 'your-laptop', hosts: [] });
    expect(cleared).toEqual(net);
    expect(deviceOf(cleared, 'your-laptop')).not.toHaveProperty('hosts');
    expect(validate(set)).toEqual([]);
    const parses = (hosts: unknown[]) => networkActionSchema.safeParse({ type: 'setHosts', deviceId: 'your-laptop', hosts }).success;
    expect(parses([shop])).toBe(true);
    expect(parses([{ ...shop, ip: 'not-an-ip' }])).toBe(false);
    expect(parses([{ ...shop, name: '' }])).toBe(false);
    expect(parses([{ name: shop.name }])).toBe(false);
  });

  it('setDns replaces the DNS of a server of the internet and takes it away when it gives none', () => {
    const net = officeTwoFloorsNet();
    const dns: ServerDns = { role: 'resolver', upstreams: [] };
    const set = applyAction(net, { type: 'setDns', ownerId: OFFICE_FLOORS.server.id, dns });
    expect(serverOf(set, OFFICE_FLOORS.server.id)?.dns).toEqual(dns);
    const replaced = applyAction(set, { type: 'setDns', ownerId: OFFICE_FLOORS.server.id, dns: { role: 'authoritative' } });
    expect(serverOf(replaced, OFFICE_FLOORS.server.id)?.dns).toEqual({ role: 'authoritative' });
    expect(applyAction(set, { type: 'setDns', ownerId: OFFICE_FLOORS.server.id })).toEqual(net);
    expect(dnsOf(applyAction(officeWithNames(), { type: 'setDns', ownerId: resolver.id }), resolver.id)).toBeUndefined();
  });

  it('setDns, setDnsServer, addRecord and removeRecord on an id the network does not have return the same network', () => {
    const net = withHome(officeWithNames());
    const record = { name: `www.${NAME_SERVER_PIECES.zone}`, type: 'A', value: NAME_SERVER_PIECES.site } as const;
    const actions: NetworkAction[] = [
      { type: 'setDns', ownerId: GHOST, dns: { role: 'resolver' } },
      { type: 'setDns', ownerId: 'home', dns: { role: 'resolver' } },
      { type: 'setDns', ownerId: 'your-laptop', dns: { role: 'resolver' } },
      { type: 'setDnsServer', deviceId: GHOST, server: resolver.ip },
      { type: 'setDnsServer', deviceId: 'home', server: resolver.ip },
      { type: 'addRecord', serverId: 'home', record: { ...record, ttl: 300 } },
      { type: 'removeRecord', serverId: 'home', record },
    ];
    for (const action of actions) expect(applyAction(net, action), JSON.stringify(action)).toBe(net);
    expect(applyAction(net, { type: 'removeRecord', serverId: authoritative.id, record })).not.toBe(net);
  });

  it('the cache of a resolver takes an address or an alias with a time of expiry and nothing else', () => {
    const entry = { name: `www.${NAME_SERVER_PIECES.zone}`, type: 'A', value: NAME_SERVER_PIECES.site, expiresAt: 240 };
    const parses = (cache: unknown[]) => networkActionSchema.safeParse({ type: 'setDns', ownerId: resolver.id, dns: { role: 'resolver', cache } }).success;
    expect(parses([entry, { ...entry, type: 'CNAME', value: `www.${NAME_SERVER_PIECES.zone}` }])).toBe(true);
    expect(parses([{ ...entry, expiresAt: -1 }])).toBe(false);
    expect(parses([{ ...entry, type: 'NS' }])).toBe(false);
    expect(parses([{ ...entry, value: '' }])).toBe(false);
    expect(parses([{ name: entry.name, type: 'A', value: entry.value }])).toBe(false);
  });
});

describe('applyAction for processes and sites', () => {
  const ORDERS: Process = { id: 'orders', name: 'pedidos', running: true };
  const REPORTS: Process = { id: 'reports', name: 'reportes', running: true };
  const SHOP: Site = { id: 'shop', names: ['www.lucia.example'], pages: [], notFoundBody: 'Aquí no hay nada.' };
  const BLOG: Site = { id: 'blog', names: ['blog.lucia.example'], pages: [], notFoundBody: 'Aquí no hay nada.' };
  const WEB_PORT = 80;
  const webServing: Service = { ...tcpService(WEB_PORT), web: { sites: [SHOP], defaultSiteId: SHOP.id } };
  const running = (): Network =>
    withDevice(officeNet(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [{ ...APP, processId: ORDERS.id }, { ...DATABASE, processId: REPORTS.id }], processes: [ORDERS, REPORTS] } });
  const hosting = (): Network => withDevice(officeNet(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [webServing, APP] } });
  const addBlog: NetworkAction = { type: 'addSite', ownerId: 'lucia-laptop', port: WEB_PORT, site: BLOG };
  const sitesOf = (net: Network) => deviceOf(net, 'lucia-laptop')?.host.services.find((service) => service.port === WEB_PORT)?.web?.sites;

  it('setProcess changes whether a process runs and keeps the rest', () => {
    const net = running();
    const stopped = applyAction(net, { type: 'setProcess', deviceId: 'lucia-laptop', processId: REPORTS.id, running: false });
    const host = deviceOf(stopped, 'lucia-laptop')?.host;
    expect(host?.processes).toEqual([ORDERS, { ...REPORTS, running: false }]);
    expect(host?.services).toEqual(deviceOf(net, 'lucia-laptop')?.host.services);
    expect(stopped.devices.filter((device) => device.id !== 'lucia-laptop')).toEqual(net.devices.filter((device) => device.id !== 'lucia-laptop'));
    expect(applyAction(stopped, { type: 'setProcess', deviceId: 'lucia-laptop', processId: REPORTS.id, running: true })).toEqual(net);
  });

  it('setProcess on a device or a process the network does not have returns the same network', () => {
    const net = running();
    expect(applyAction(net, { type: 'setProcess', deviceId: GHOST, processId: REPORTS.id, running: false })).toBe(net);
    expect(applyAction(net, { type: 'setProcess', deviceId: 'lucia-laptop', processId: GHOST, running: false })).toBe(net);
    expect(applyAction(net, { type: 'setProcess', deviceId: 'printer', processId: REPORTS.id, running: false })).toBe(net);
  });

  it('addSite adds a site and keeps the others', () => {
    const net = hosting();
    const added = applyAction(net, addBlog);
    expect(sitesOf(added)).toEqual([SHOP, BLOG]);
    expect(deviceOf(added, 'lucia-laptop')?.host.services.find((service) => service.port === WEB_PORT)?.web?.defaultSiteId).toBe(SHOP.id);
    expect(deviceOf(added, 'lucia-laptop')?.host.services.find((service) => service.port === APP.port)).toEqual(APP);
    expect(siteProblem(net, 'lucia-laptop', WEB_PORT, BLOG)).toBeUndefined();
    expect(networkSchema.safeParse(added).success).toBe(true);
    const server = applyAction(officeTwoFloorsNet(), { type: 'setServices', ownerId: OFFICE_FLOORS.server.id, services: [webServing] });
    const onServer = applyAction(server, { ...addBlog, ownerId: OFFICE_FLOORS.server.id });
    expect(serverOf(onServer, OFFICE_FLOORS.server.id)?.services?.[0].web?.sites).toEqual([SHOP, BLOG]);
  });

  it('addSite with a name that already has a site returns the same network and siteProblem says why', () => {
    const added = applyAction(hosting(), addBlog);
    expect(applyAction(added, addBlog)).toBe(added);
    expect(siteProblem(added, 'lucia-laptop', WEB_PORT, BLOG)).toBe('name-has-site');
    const sameNameOtherCase: Site = { ...BLOG, id: 'other', names: ['Blog.Lucia.Example'] };
    expect(siteProblem(added, 'lucia-laptop', WEB_PORT, sameNameOtherCase)).toBe('name-has-site');
    expect(applyAction(added, { ...addBlog, site: sameNameOtherCase })).toBe(added);
  });

  it('addSite on an owner with no web service on that port returns the same network and siteProblem says why', () => {
    const net = hosting();
    for (const action of [{ ...addBlog, ownerId: GHOST }, { ...addBlog, ownerId: 'printer' }, { ...addBlog, port: APP.port }, { ...addBlog, port: WEB_PORT + 1 }]) {
      expect(siteProblem(net, action.ownerId, action.port, BLOG), JSON.stringify(action)).toBe('no-web-service');
      expect(applyAction(net, action), JSON.stringify(action)).toBe(net);
    }
  });

  it('every site problem has a code and the action parses only with a site under .example', () => {
    const problems: SiteProblem[] = ['no-web-service', 'name-has-site'];
    expect([...SITE_PROBLEMS]).toEqual(problems);
    expect(networkActionSchema.safeParse(addBlog).success).toBe(true);
    expect(networkActionSchema.safeParse({ ...addBlog, port: 0 }).success).toBe(false);
    expect(networkActionSchema.safeParse({ ...addBlog, site: { ...BLOG, names: ['blog.lucia.com'] } }).success).toBe(false);
    expect(networkActionSchema.safeParse({ type: 'setProcess', deviceId: 'lucia-laptop', processId: REPORTS.id, running: 'no' }).success).toBe(false);
  });
});
