import { describe, expect, it } from 'vitest';
import { applyAction } from '@/engine/network/actions';
import { ROUTE_DEFAULT } from '@/engine/network/schema';
import type { Network, PacketSpec, Router } from '@/engine/network/types';
import { simulateSequence } from '@/engine/simulation/sequence';
import { simulate } from '@/engine/simulation/simulate';
import { OFFICE_FLOORS, device, lab03Net, officeNet, officeTwoFloorsNet, ping, tcp, tcpService } from '@/testing';
import { FIRST_PUBLIC_PORT, publicIpOf, translateSource, type NatTable } from './translation';

const { floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
const WEB_PORT = 80;
const GIVEN_PORT = 50000;
const SECOND_PUBLIC_PORT = FIRST_PUBLIC_PORT + 1;
const THIRD_PUBLIC_PORT = FIRST_PUBLIC_PORT + 2;
const OTHER_SERVER = { id: 'other-server', ip: '198.51.100.60', link: '198.51.100.2' };
const BRANCH = { id: 'branch-router', towardOffice: '10.255.0.2', fromOffice: '10.255.0.1' };

const you = device('your-laptop');
const lucia = device('lucia-laptop');
const sends = (...packets: PacketSpec[]) => packets.map((packet, at) => ({ packet, at }));
const udp = (from: PacketSpec['from'], to: string, port: number): PacketSpec => ({ from, to, protocol: 'udp', port });
const withPort = (packet: PacketSpec, sourcePort: number): PacketSpec => ({ ...packet, sourcePort });
const routerOf = (net: Network, id: string): Router => net.routers!.find((candidate) => candidate.id === id)!;
const translations = (net: Network, ...packets: PacketSpec[]) => simulateSequence(net, sends(...packets)).map((trace) => trace.translation);

function serving(): Network {
  return applyAction(officeTwoFloorsNet(), { type: 'setServices', ownerId: server.id, services: [tcpService(WEB_PORT)] });
}

function withTwoServers(): Network {
  const net = serving();
  const backboneRouter = routerOf(net, backbone.id);
  const added = applyAction(net, { type: 'addActor', actor: { id: OTHER_SERVER.id, name: OTHER_SERVER.id, ip: OTHER_SERVER.ip, kind: 'server', latencyMs: 20, services: [tcpService(WEB_PORT)] } });
  return applyAction(added, { type: 'updateRouter', routerId: backbone.id, interfaces: [...backboneRouter.interfaces, { ip: OTHER_SERVER.link, faces: OTHER_SERVER.id }] });
}

function withBranchOffice(): Network {
  const net = serving();
  const officeInterfaces = routerOf(net, officeRouter.id).interfaces;
  const added = applyAction(net, {
    type: 'addRouter',
    router: { id: BRANCH.id, name: BRANCH.id, interfaces: [{ ip: BRANCH.towardOffice, faces: officeRouter.id }], routes: [], latencyMs: 5, sendsUnreachable: true },
  });
  return applyAction(added, { type: 'updateRouter', routerId: officeRouter.id, interfaces: [...officeInterfaces, { ip: BRANCH.fromOffice, faces: BRANCH.id }] });
}

describe('the translation of the source of what leaves the office', () => {
  it('the public ip is the ip of the interface with a public address of the router that faces a LAN', () => {
    const net = officeTwoFloorsNet();
    expect(publicIpOf(net, routerOf(net, officeRouter.id), provider.id)).toBe(officeRouter.uplink);
    expect(publicIpOf(net, routerOf(net, officeRouter.id), floor1.id)).toBeUndefined();
    expect(publicIpOf(net, routerOf(net, officeRouter.id), floor2.id)).toBeUndefined();
    expect(publicIpOf(net, routerOf(net, officeRouter.id), 'nobody')).toBeUndefined();
    expect(publicIpOf(net, routerOf(net, provider.id), officeRouter.id)).toBeUndefined();
    expect(publicIpOf(net, routerOf(net, provider.id), backbone.id)).toBeUndefined();
    expect(publicIpOf(net, routerOf(net, backbone.id), server.id)).toBeUndefined();
    expect(simulate(net, ping(you, server.ip)).translation?.outside.ip).toBe(officeRouter.uplink);
  });

  it('two laptops with the same source port get two public ports in one table', () => {
    const traces = simulateSequence(serving(), sends(tcp(you, server.ip, WEB_PORT), tcp(lucia, server.ip, WEB_PORT), tcp(you, server.ip, WEB_PORT)));
    expect(traces.map((trace) => trace.outcome)).toEqual(['replied', 'replied', 'replied']);
    expect(traces.map((trace) => trace.header?.request.sourcePort)).toEqual([51514, 51514, 51515]);
    expect(traces.map((trace) => trace.translation)).toEqual([
      { protocol: 'tcp', inside: { ip: floor1.you, port: 51514 }, outside: { ip: officeRouter.uplink, port: FIRST_PUBLIC_PORT }, isNew: true, fixed: false },
      { protocol: 'tcp', inside: { ip: floor1.lucia, port: 51514 }, outside: { ip: officeRouter.uplink, port: SECOND_PUBLIC_PORT }, isNew: true, fixed: false },
      { protocol: 'tcp', inside: { ip: floor1.you, port: 51515 }, outside: { ip: officeRouter.uplink, port: THIRD_PUBLIC_PORT }, isNew: true, fixed: false },
    ]);

    const again = simulateSequence(serving(), sends(tcp(you, server.ip, WEB_PORT), tcp(lucia, server.ip, WEB_PORT), tcp(you, server.ip, WEB_PORT)));
    expect(simulateSequence(serving(), sends(tcp(lucia, server.ip, WEB_PORT)))[0].translation?.outside.port).toBe(FIRST_PUBLIC_PORT);
    expect(again).toEqual(traces);

    const first = translateSource([], { protocol: 'tcp', ip: floor1.you, port: 51514 }, officeRouter.uplink);
    const second = translateSource(first.table, { protocol: 'tcp', ip: floor1.lucia, port: 51514 }, officeRouter.uplink);
    expect(second.table.map((row) => row.outside.port)).toEqual([FIRST_PUBLIC_PORT, SECOND_PUBLIC_PORT]);
    expect(second.table.map((row) => row.inside.ip)).toEqual([floor1.you, floor1.lucia]);
  });

  it('the same private ip and port reuse its row towards any server', () => {
    const net = withTwoServers();
    const result = translations(
      net,
      withPort(tcp(you, server.ip, WEB_PORT), GIVEN_PORT),
      withPort(tcp(you, OTHER_SERVER.ip, WEB_PORT), GIVEN_PORT),
      withPort(tcp(lucia, OTHER_SERVER.ip, WEB_PORT), GIVEN_PORT),
      withPort(udp(you, server.ip, WEB_PORT), GIVEN_PORT),
      withPort(tcp(you, server.ip, WEB_PORT + 1), GIVEN_PORT),
    );
    expect(result.map((translation) => [translation?.protocol, translation?.inside.ip, translation?.outside.port, translation?.isNew])).toEqual([
      ['tcp', floor1.you, FIRST_PUBLIC_PORT, true],
      ['tcp', floor1.you, FIRST_PUBLIC_PORT, false],
      ['tcp', floor1.lucia, SECOND_PUBLIC_PORT, true],
      ['udp', floor1.you, THIRD_PUBLIC_PORT, true],
      ['tcp', floor1.you, FIRST_PUBLIC_PORT, false],
    ]);
    expect(simulateSequence(net, sends(withPort(tcp(you, OTHER_SERVER.ip, WEB_PORT), GIVEN_PORT))).map((trace) => trace.outcome)).toEqual(['replied']);
  });

  it('a loose simulate translates with an empty table, so it gives the first public port every time', () => {
    const net = serving();
    const packet = tcp(you, server.ip, WEB_PORT);
    const first = simulate(net, packet).translation;
    expect(first).toEqual({ protocol: 'tcp', inside: { ip: floor1.you, port: 51514 }, outside: { ip: officeRouter.uplink, port: FIRST_PUBLIC_PORT }, isNew: true, fixed: false });
    expect(simulate(net, packet).translation).toEqual(first);
    expect(simulate(net, tcp(lucia, server.ip, WEB_PORT)).translation?.outside.port).toBe(FIRST_PUBLIC_PORT);
  });

  it('a ping is translated and leaves no row', () => {
    const net = serving();
    const echo = simulate(net, ping(you, server.ip));
    expect(echo.outcome).toBe('replied');
    expect(echo.translation).toEqual({ protocol: 'icmp', inside: { ip: floor1.you }, outside: { ip: officeRouter.uplink }, isNew: false, fixed: false });
    const mixed = translations(net, ping(you, server.ip), tcp(you, server.ip, WEB_PORT), ping(lucia, server.ip), tcp(lucia, server.ip, WEB_PORT));
    expect(mixed.map((translation) => translation?.protocol)).toEqual(['icmp', 'tcp', 'icmp', 'tcp']);
    expect(mixed.flatMap((translation) => (translation?.isNew ? [translation.outside.port] : []))).toEqual([FIRST_PUBLIC_PORT, SECOND_PUBLIC_PORT]);
  });

  it('the link to the other office is not translated', () => {
    const net = withBranchOffice();
    const toBranch = simulate(net, ping(you, BRANCH.towardOffice));
    const refused = simulate(net, tcp(you, BRANCH.towardOffice, WEB_PORT));
    expect([toBranch.outcome, toBranch.destinationId, refused.outcome]).toEqual(['replied', BRANCH.id, 'refused']);
    expect(toBranch.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id]);
    for (const trace of [toBranch, refused]) expect(trace).not.toHaveProperty('translation');
    expect(simulate(net, tcp(you, server.ip, WEB_PORT)).translation?.outside.port).toBe(FIRST_PUBLIC_PORT);
    expect(translations(net, tcp(you, BRANCH.towardOffice, WEB_PORT), tcp(you, server.ip, WEB_PORT))).toEqual([
      undefined,
      expect.objectContaining({ outside: { ip: officeRouter.uplink, port: FIRST_PUBLIC_PORT } }),
    ]);
  });

  it('a packet of a VPC and a packet that does not leave the office carry no translation', () => {
    const vpc = lab03Net();
    const inside = officeTwoFloorsNet();
    const packets: [Network, PacketSpec][] = [
      [vpc, ping(device('servidor1'), '172.31.38.97')],
      [vpc, ping(device('servidor1'), '34.244.254.100')],
      [vpc, tcp(device('servidor1'), '172.31.38.97', 22)],
      [officeNet(), ping(you, '192.168.1.11')],
      [officeNet(), tcp(you, '192.168.1.11', WEB_PORT)],
      [inside, ping(you, floor1.lucia)],
      [inside, tcp(you, floor2.andres, WEB_PORT)],
      [inside, ping(you, floor1.gateway)],
      [inside, ping(you, floor2.gateway)],
      [inside, ping(you, officeRouter.uplink)],
      [inside, ping(you, floor1.you)],
      [inside, ping(you, '127.0.0.1')],
      [inside, ping(you, 'localhost')],
      [inside, ping(you, 'no-such-name.example')],
      [inside, ping(you, '192.168.1.300')],
      [inside, ping(you, floor1.nobody)],
      [inside, ping(device('guest-laptop'), floor1.lucia)],
      [inside, { ...ping(you, server.ip), ttl: 1 }],
    ];
    const traces = packets.map(([net, packet]) => simulate(net, packet));
    for (const outcome of ['replied', 'refused', 'timeout', 'unreachable', 'unresolved', 'invalid-address', 'no-route', 'ttl-exceeded']) expect(traces.map((trace) => trace.outcome)).toContain(outcome);
    for (const trace of traces) expect(trace).not.toHaveProperty('translation');
    for (const trace of simulateSequence(inside, sends(...packets.filter(([net]) => net === inside).map(([, packet]) => packet)))) expect(trace).not.toHaveProperty('translation');
  });

  it('a packet that dies past the router of the office was translated, and one that dies in it was not', () => {
    const net = serving();
    const dies = { ...tcp(you, server.ip, WEB_PORT), ttl: 2 };
    const ended = simulate(net, dies);
    expect([ended.outcome, ended.notice?.fromId]).toEqual(['ttl-exceeded', provider.id]);
    expect(ended.translation).toMatchObject({ isNew: true, outside: { ip: officeRouter.uplink, port: FIRST_PUBLIC_PORT } });
    const stopped = simulate(net, { ...dies, ttl: 1 });
    expect([stopped.outcome, stopped.notice?.fromId]).toEqual(['ttl-exceeded', officeRouter.id]);
    expect(stopped).not.toHaveProperty('translation');
    expect(translations(net, dies, tcp(you, server.ip, WEB_PORT)).map((translation) => translation?.outside.port)).toEqual([FIRST_PUBLIC_PORT, SECOND_PUBLIC_PORT]);
  });

  it('a loop that crosses the uplink again keeps the first translation', () => {
    const looping = applyAction(serving(), { type: 'addRoute', routerId: provider.id, route: { to: ROUTE_DEFAULT, next: officeRouter.id } });
    const toNowhere = { ...tcp(you, '8.8.8.8', WEB_PORT), ttl: 8 };
    const traces = simulateSequence(looping, sends(toNowhere, tcp(lucia, server.ip, WEB_PORT)));
    expect(traces[0].outcome).toBe('ttl-exceeded');
    expect(traces[0].hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id, officeRouter.id, provider.id, officeRouter.id, provider.id, officeRouter.id, provider.id]);
    expect(traces.map((trace) => trace.translation)).toEqual([
      { protocol: 'tcp', inside: { ip: floor1.you, port: 51514 }, outside: { ip: officeRouter.uplink, port: FIRST_PUBLIC_PORT }, isNew: true, fixed: false },
      { protocol: 'tcp', inside: { ip: floor1.lucia, port: 51514 }, outside: { ip: officeRouter.uplink, port: SECOND_PUBLIC_PORT }, isNew: true, fixed: false },
    ]);
  });

  it('the translation changes neither the header nor the source of the trip', () => {
    const trace = simulate(serving(), tcp(you, server.ip, WEB_PORT));
    expect(trace.effectiveSource).toBe(floor1.you);
    expect(trace.header?.request).toEqual({ source: floor1.you, destination: server.ip, ttl: 64, sourcePort: 51514, destinationPort: WEB_PORT });
    expect(trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id, backbone.id]);
  });

  it('the reply through a translation gives no reason beyond its row', () => {
    const trace = simulate(serving(), tcp(you, server.ip, WEB_PORT));
    expect(trace.outcome).toBe('replied');
    expect(trace.steps.map((step) => [step.stage, step.reason.code])).toEqual([
      ['route', 'route-leaves-office'],
      ['forward', 'forward-hop'],
      ['forward', 'forward-hop'],
      ['forward', 'forward-hop'],
      ['host', 'host-accepts'],
      ['reply', 'reply-stateful'],
    ]);
    expect(trace.steps.at(-1)).toEqual({ stage: 'reply', at: server.id, verdict: 'pass', reason: { code: 'reply-stateful', deviceId: server.id } });
    expect(trace.header?.reply).toEqual({ source: server.ip, destination: floor1.you, sourcePort: WEB_PORT, destinationPort: 51514 });
    expect(trace.exchange?.map((message) => message.kind)).toEqual(['SYN', 'SYN-ACK', 'ACK']);
    expect(trace.translation?.outside).toEqual({ ip: officeRouter.uplink, port: FIRST_PUBLIC_PORT });
  });

  it('a row of the table is a protocol, a private end and a public end, and the table is never changed in place', () => {
    const empty: NatTable = [];
    const { table, translation } = translateSource(empty, { protocol: 'udp', ip: floor1.you, port: GIVEN_PORT }, officeRouter.uplink);
    expect(empty).toEqual([]);
    expect(table).toEqual([{ protocol: 'udp', inside: { ip: floor1.you, port: GIVEN_PORT }, outside: { ip: officeRouter.uplink, port: FIRST_PUBLIC_PORT } }]);
    expect(translation).toEqual({ protocol: 'udp', inside: { ip: floor1.you, port: GIVEN_PORT }, outside: { ip: officeRouter.uplink, port: FIRST_PUBLIC_PORT }, isNew: true, fixed: false });
    const again = translateSource(table, { protocol: 'udp', ip: floor1.you, port: GIVEN_PORT }, officeRouter.uplink);
    expect(again.table).toBe(table);
    expect(again.translation.isNew).toBe(false);
  });
});
