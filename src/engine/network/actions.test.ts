import { describe, expect, it } from 'vitest';
import { ATTACKER_IP, OFFICE_FLOORS, allOut, echoFrom, lab03Net, officeNet, officeTwoFloorsNet, withDevice } from '@/testing';
import { applyAction, networkActionSchema, type NetworkAction } from './actions';
import { networkSchema } from './schema';
import { IMPLICIT_LAN_ID } from './topology';
import type { Actor, Device, Firewall, Lan, Network, Router } from './types';

const { floor1, floor2, officeRouter, provider, backbone } = OFFICE_FLOORS;
const FLOOR_3 = { id: 'floor-3', cidr: '192.168.3.0/24', gateway: '192.168.3.1', uplink: '192.168.2.2', ana: '192.168.3.15' } as const;
const OFFICE_ACTIONS = new Set<NetworkAction['type']>(['updateRouter', 'connectDevice', 'setGateway']);

const inboundIds = (net: Network, firewallId: string) => net.firewalls.find((f) => f.id === firewallId)?.inbound.map((r) => r.id);
const outboundIds = (net: Network, firewallId: string) => net.firewalls.find((f) => f.id === firewallId)?.outbound.map((r) => r.id);
const deviceOf = (net: Network, id: string) => net.devices.find((d) => d.id === id);
const routerOf = (net: Network, id: string) => net.routers?.find((r) => r.id === id);
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
      host: { ignoreIcmpEcho: false, listeningTcpPorts: [] },
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

  it('actions on unknown ids return the same network', () => {
    for (const [name, action] of UNKNOWN_IDS) {
      const net = OFFICE_ACTIONS.has(action.type) ? officeTwoFloorsNet() : lab03Net();
      expect(applyAction(net, action), name).toBe(net);
    }
  });
});
