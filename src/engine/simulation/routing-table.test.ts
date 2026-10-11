import { describe, expect, it } from 'vitest';
import { ipInCidr, isLoopbackIpv4 } from '@/engine/network/addressing/cidr';
import { applyAction } from '@/engine/network/actions';
import { isConnected, lanOf } from '@/engine/network/addressing/topology';
import { ROUTE_DEFAULT } from '@/engine/network/schema';
import type { Device, Network, PacketSpec } from '@/engine/network/types';
import { stopStep } from '@/engine/simulation/paths/checkpoints';
import { OFFICE_FLOORS, chapter1Worlds, device, officeNet, officeTwoFloorsNet, ping, withDevice } from '@/testing';
import { simulate } from './simulate';

const { floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
const you = device('your-laptop');
const OUTSIDE_IP = '8.8.8.8';
const STRANGERS = ['192.168.1.99', OUTSIDE_IP, '10.0.0.10', 'localhost'];

interface Handoff {
  to: string;
  via?: string;
  reason: 'route-private' | 'route-leaves-office';
}

type BeforeThisTask = Handoff | 'stays-at-the-sender' | 'goes-on-by-its-public-ip';

function beforeThisTask(net: Network, sender: Device, ip: string): BeforeThisTask {
  if (!isConnected(sender)) return 'stays-at-the-sender';
  const lan = lanOf(net, sender)?.cidr ?? net.cidr;
  if (ipInCidr(ip, lan)) return { to: lan, reason: 'route-private' };
  if (!sender.gateway) return 'stays-at-the-sender';
  if (ipInCidr(ip, net.cidr)) return { to: ROUTE_DEFAULT, via: sender.gateway, reason: 'route-private' };
  return (net.routers ?? []).length > 0 ? { to: ROUTE_DEFAULT, via: sender.gateway, reason: 'route-leaves-office' } : 'goes-on-by-its-public-ip';
}

function everyPingBetweenDevices(world: Network): PacketSpec[] {
  const interfaces = (world.routers ?? []).flatMap((router) => router.interfaces.map((face) => face.ip));
  const servers = world.actors.filter((actor) => actor.kind === 'server').map((actor) => actor.ip);
  const targets = [...world.devices.map((candidate) => candidate.privateIp), ...interfaces, ...servers, ...STRANGERS];
  return world.devices.flatMap((sender) => targets.map((to) => ping(device(sender.id), to)));
}

function expectTheSenderToDecideAsBefore(world: Network, packet: PacketSpec): void {
  const trace = simulate(world, packet);
  const sender = packet.from.kind === 'device' ? world.devices.find((candidate) => candidate.id === packet.from.id) : undefined;
  const ip = trace.resolvedIp;
  if (!sender || !ip || isLoopbackIpv4(ip) || ip === sender.privateIp) {
    expect(trace.routes).toBeUndefined();
    return;
  }
  const before = beforeThisTask(world, sender, ip);
  const routeStep = trace.steps.find((step) => step.stage === 'route');
  if (before === 'stays-at-the-sender') {
    expect([trace.routes, trace.outcome, routeStep?.verdict, routeStep?.at]).toEqual([undefined, 'no-route', 'drop', sender.id]);
  } else if (before === 'goes-on-by-its-public-ip') {
    expect([trace.routes, routeStep?.reason.code]).toEqual([undefined, 'route-no-public-device']);
  } else {
    expect(trace.routes?.[0]).toMatchObject({ holderId: sender.id, route: { to: before.to } });
    expect(trace.routes?.[0].route.via).toBe(before.via);
    expect(routeStep).toMatchObject({ verdict: 'pass', reason: { code: before.reason } });
  }
}

describe('the routing table in the simulation', () => {
  it('the choice of route in the office of chapter 1 gives the same outcome as before', () => {
    const worlds = chapter1Worlds();
    const packets = worlds.flatMap(({ world, packets: sent }) => [...sent, ...everyPingBetweenDevices(world)].map((packet) => ({ world, packet })));
    const withoutRouters = withDevice(officeNet(), 'your-laptop', { gateway: floor1.gateway });
    packets.push({ world: withoutRouters, packet: ping(you, OUTSIDE_IP) });
    for (const { world, packet } of packets) expectTheSenderToDecideAsBefore(world, packet);
  });

  it('a destination in the LAN of the device uses the connected route and a destination outside it uses the default route', () => {
    const world = officeTwoFloorsNet();
    const decided = (to: string) => simulate(world, ping(you, to)).routes?.[0];
    expect(decided(floor1.lucia)).toEqual({
      holderId: 'your-laptop',
      route: { to: floor1.cidr },
      kind: 'connected',
      alsoCovered: [{ to: ROUTE_DEFAULT, kind: 'default', via: floor1.gateway }],
    });
    for (const outside of [floor2.andres, server.ip]) {
      expect(decided(outside)).toEqual({ holderId: 'your-laptop', route: { to: ROUTE_DEFAULT, via: floor1.gateway }, kind: 'default', alsoCovered: [] });
    }
  });

  it('the trace lists one decision for the sender and one for each router, in the order the packet met them', () => {
    const world = officeTwoFloorsNet();
    const trace = simulate(world, ping(you, server.ip));
    expect(trace.outcome).toBe('replied');
    expect(trace.routes?.map(({ holderId, kind }) => [holderId, kind])).toEqual([
      ['your-laptop', 'default'],
      [officeRouter.id, 'default'],
      [provider.id, 'static'],
      [backbone.id, 'connected'],
    ]);
    expect(trace.routes?.[2]).toMatchObject({ route: { to: server.range, via: backbone.towardProvider }, alsoCovered: [] });
  });

  it('a packet that never leaves its sender has no decision', () => {
    const world = officeTwoFloorsNet();
    const guest = device('guest-laptop');
    const unplugged = simulate(world, ping(guest, floor1.lucia));
    const self = simulate(world, ping(you, floor1.you));
    const loopback = simulate(world, ping(you, '127.0.0.1'));
    const unresolved = simulate(world, ping(you, 'no-such-name.example'));
    expect([unplugged.outcome, self.outcome, loopback.outcome, unresolved.outcome]).toEqual(['no-route', 'replied', 'replied', 'unresolved']);
    for (const trace of [unplugged, self, loopback, unresolved]) expect(trace).not.toHaveProperty('routes');
  });
});

describe('the routes of a router that the player edits', () => {
  const withoutRoutes = (): Network => applyAction(officeTwoFloorsNet(), { type: 'removeRoute', routerId: officeRouter.id, to: ROUTE_DEFAULT });
  const withRoute = (net: Network, to: string): Network => applyAction(net, { type: 'addRoute', routerId: officeRouter.id, route: { to, next: provider.id } });

  it('a router with no route that covers the destination warns Destination Net Unreachable', () => {
    const net = withoutRoutes();
    expect(net.routers?.find((router) => router.id === officeRouter.id)?.routes).toEqual([]);
    for (const destination of [server.ip, OUTSIDE_IP, '10.0.0.10']) {
      const trace = simulate(net, ping(you, destination));
      expect(trace.outcome, destination).toBe('unreachable');
      expect(trace.notice).toEqual({ kind: 'net-unreachable', fromId: officeRouter.id, fromIp: floor1.gateway });
      expect(stopStep(trace)).toEqual({
        stage: 'forward',
        at: officeRouter.id,
        verdict: 'drop',
        reason: { code: 'forward-no-route', routerId: officeRouter.id, ip: destination, warns: true },
      });
      expect(trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id]);
      expect(trace.routes?.map((decision) => decision.holderId)).toEqual(['your-laptop']);
      expect([trace.destinationId, trace.tcpdump]).toEqual([null, []]);
    }
    const lan = simulate(net, ping(you, floor2.andres));
    expect([lan.outcome, lan.routes?.map((decision) => decision.holderId)]).toEqual(['replied', ['your-laptop', officeRouter.id]]);
    expect(simulate(withRoute(net, ROUTE_DEFAULT), ping(you, server.ip)).outcome).toBe('replied');
  });

  it('with only a default route, a private destination is dropped by the provider with no warning, as in chapter 1', () => {
    const onlyDefault = withRoute(withoutRoutes(), ROUTE_DEFAULT);
    for (const privateIp of ['10.0.0.10', '10.0.0.20', '172.16.4.4']) {
      const trace = simulate(onlyDefault, ping(you, privateIp));
      expect(trace.outcome, privateIp).toBe('timeout');
      expect(stopStep(trace)).toEqual({ stage: 'forward', at: provider.id, verdict: 'drop', reason: { code: 'forward-private-dropped', routerId: provider.id, ip: privateIp } });
      expect(trace).not.toHaveProperty('notice');
      expect(trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id]);
      expect(trace.routes?.map(({ holderId, kind }) => [holderId, kind])).toEqual([['your-laptop', 'default'], [officeRouter.id, 'default']]);
      expect(trace).toEqual(simulate(officeTwoFloorsNet(), ping(you, privateIp)));
    }
  });

  it('a more specific route beats the default route and the trace says so', () => {
    const net = withRoute(officeTwoFloorsNet(), server.range);
    const trace = simulate(net, ping(you, server.ip));
    expect(trace.outcome).toBe('replied');
    expect(trace.routes?.[1]).toEqual({
      holderId: officeRouter.id,
      route: { to: server.range, via: provider.towardOffice },
      kind: 'static',
      alsoCovered: [{ to: ROUTE_DEFAULT, kind: 'default', via: provider.towardOffice }],
    });
    const listedFirst = applyAction(officeTwoFloorsNet(), {
      type: 'updateRouter',
      routerId: officeRouter.id,
      routes: [{ to: server.range, next: provider.id }, { to: ROUTE_DEFAULT, next: provider.id }],
    });
    expect(simulate(listedFirst, ping(you, server.ip)).routes).toEqual(trace.routes);
    const elsewhere = simulate(net, ping(you, OUTSIDE_IP));
    expect(elsewhere.routes?.[1]).toEqual({ holderId: officeRouter.id, route: { to: ROUTE_DEFAULT, via: provider.towardOffice }, kind: 'default', alsoCovered: [] });
  });
});
