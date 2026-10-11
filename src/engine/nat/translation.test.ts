import { describe, expect, it } from 'vitest';
import { applyAction } from '@/engine/network/actions';
import { ROUTE_DEFAULT } from '@/engine/network/schema';
import type { Firewall, Forward, Network, PacketSpec, Router } from '@/engine/network/types';
import { simulateSequence } from '@/engine/simulation/sequence';
import { simulate } from '@/engine/simulation/simulate';
import { ATTACKER_IP, OFFICE_FLOORS, actor, device, lab03Net, officeNet, officeTwoFloorsNet, ping, tcp, tcpService } from '@/testing';
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

const HOME = { id: 'casa-lucia', ip: '192.0.2.77' };
const STRANGER = { id: 'visitor', ip: ATTACKER_IP };
const APP_PORT = 3000;
const PUBLIC_APP_PORT = 8080;
const NO_ROW_PORT = 40009;
const home = actor(HOME.id);
const stranger = actor(STRANGER.id);
const uplink = officeRouter.uplink;
const toApp: Forward = { protocol: 'tcp', publicPort: PUBLIC_APP_PORT, toDeviceId: 'andres-laptop', toPort: APP_PORT };
const toDns: Forward = { protocol: 'udp', publicPort: 5353, toDeviceId: 'andres-laptop', toPort: 53 };
const FIREWALL_OF_ANDRES: Firewall = { id: 'fw-andres', name: 'laptop-andres', kind: 'host-firewall', inbound: [], outbound: [] };
const allowFrom = (cidr: string, port: number) => ({ id: `allow-${port}`, what: { kind: 'tcp', fromPort: port, toPort: port } as const, peer: { kind: 'cidr', cidr } as const });

function fromOutside(): Network {
  const withClients = [HOME, STRANGER].reduce(
    (net, { id, ip }) => applyAction(net, { type: 'addActor', actor: { id, name: id, ip, kind: id === HOME.id ? 'home' : 'attacker' } }),
    officeTwoFloorsNet(),
  );
  return applyAction(withClients, { type: 'setServices', ownerId: 'andres-laptop', services: [tcpService(APP_PORT), { protocol: 'udp', port: 53, listen: 'all' }] });
}

const forwarding = (net: Network, ...forwards: Forward[]) => applyAction(net, { type: 'setForwards', routerId: officeRouter.id, forwards });
const toUplink = (from: PacketSpec['from'], port: number, protocol: 'tcp' | 'udp' = 'tcp'): PacketSpec => ({ from, to: uplink, protocol, port });
const codes = (trace: ReturnType<typeof simulate>) => trace.steps.map((step) => step.reason.code);

describe('what comes from outside reaches a device only through a row or a forward', () => {
  it('a packet from outside with no translation is not delivered to any device', () => {
    const net = forwarding(fromOutside(), toApp);
    for (const protocol of ['tcp', 'udp'] as const) {
      const trace = simulate(net, toUplink(home, NO_ROW_PORT, protocol));
      expect([trace.outcome, trace.destinationId, trace.resolvedIp]).toEqual(['timeout', null, uplink]);
      expect(trace.steps).toEqual([{ stage: 'forward', at: officeRouter.id, verdict: 'drop', reason: { code: 'nat-no-translation', routerId: officeRouter.id, protocol, ip: uplink, port: NO_ROW_PORT } }]);
      expect(trace.hops).toEqual([{ routerId: officeRouter.id, ip: uplink, ttlLeft: 63 }]);
      for (const field of ['translation', 'notice', 'routes', 'rttMs'] as const) expect(trace, field).not.toHaveProperty(field);
      expect(trace.tcpdump).toEqual([]);
      expect(trace.exchange?.map((message) => message.kind)).toEqual([protocol === 'tcp' ? 'SYN' : 'query']);
    }
    const unknownPort = simulate(net, toUplink(home, PUBLIC_APP_PORT + 1));
    expect([unknownPort.outcome, unknownPort.destinationId]).toEqual(['timeout', null]);
    expect(simulate(net, toUplink(home, PUBLIC_APP_PORT, 'udp')).outcome).toBe('timeout');
  });

  it('a fixed forward delivers to the device it names and nothing filters it', () => {
    const net = forwarding(fromOutside(), toApp, toDns);
    const trace = simulate(net, toUplink(home, PUBLIC_APP_PORT));
    expect([trace.outcome, trace.destinationId, trace.resolvedIp, trace.effectiveSource]).toEqual(['replied', 'andres-laptop', uplink, HOME.ip]);
    expect(trace.translation).toEqual({ protocol: 'tcp', inside: { ip: floor2.andres, port: APP_PORT }, outside: { ip: uplink, port: PUBLIC_APP_PORT }, isNew: false, fixed: true });
    expect(trace.steps.map((step) => [step.stage, step.reason.code])).toEqual([['forward', 'nat-forwarded'], ['forward', 'forward-hop'], ['host', 'host-accepts'], ['reply', 'reply-stateful']]);
    expect(trace.steps[0].reason).toEqual({ code: 'nat-forwarded', routerId: officeRouter.id, deviceId: 'andres-laptop', protocol: 'tcp', ip: uplink, port: PUBLIC_APP_PORT, toPort: APP_PORT, fixed: true });
    expect(trace.header).toEqual({
      request: { source: HOME.ip, destination: uplink, ttl: 64, sourcePort: 51514, destinationPort: PUBLIC_APP_PORT },
      reply: { source: uplink, destination: HOME.ip, sourcePort: PUBLIC_APP_PORT, destinationPort: 51514 },
    });
    expect(trace.exchange?.map((message) => message.kind)).toEqual(['SYN', 'SYN-ACK', 'ACK']);
    expect(trace.tcpdump.map(({ deviceId, direction, src, dst, summary }) => [deviceId, direction, src, dst, summary])).toEqual([
      ['andres-laptop', 'In', HOME.ip, floor2.andres, `TCP ${APP_PORT}`],
      ['andres-laptop', 'Out', floor2.andres, HOME.ip, `TCP ${APP_PORT} reply`],
    ]);
    expect(trace.routes?.map(({ holderId, kind }) => [holderId, kind])).toEqual([[officeRouter.id, 'connected']]);

    const datagram = simulate(net, toUplink(stranger, toDns.publicPort, 'udp'));
    expect([datagram.outcome, datagram.destinationId, datagram.translation?.fixed]).toEqual(['replied', 'andres-laptop', true]);
    expect(datagram.exchange?.map((message) => message.kind)).toEqual(['query', 'response']);
    expect(simulate(net, toUplink(stranger, PUBLIC_APP_PORT)).outcome).toBe('replied');
    expect(codes(simulate(net, toUplink(stranger, PUBLIC_APP_PORT)))).not.toContain('firewall-in-pass');
  });

  it('a forward to a device with a firewall is still stopped by that firewall', () => {
    const guarded = applyAction(forwarding(fromOutside(), toApp), { type: 'addFirewall', deviceId: 'andres-laptop', firewall: FIREWALL_OF_ANDRES });
    const attempt = (net: Network) => simulate(net, toUplink(home, PUBLIC_APP_PORT));
    const stopped = attempt(guarded);
    expect([stopped.outcome, stopped.destinationId, stopped.translation?.fixed]).toEqual(['timeout', 'andres-laptop', true]);
    expect(stopped.steps.map((step) => [step.stage, step.reason.code, step.verdict])).toEqual([['forward', 'nat-forwarded', 'pass'], ['forward', 'forward-hop', 'pass'], ['firewall-in', 'firewall-in-drop', 'drop']]);

    const onThePublicPort = applyAction(guarded, { type: 'addRule', firewallId: FIREWALL_OF_ANDRES.id, rule: allowFrom('0.0.0.0/0', PUBLIC_APP_PORT) });
    expect(attempt(onThePublicPort).outcome).toBe('timeout');
    const onTheDevicePort = applyAction(guarded, { type: 'addRule', firewallId: FIREWALL_OF_ANDRES.id, rule: allowFrom('0.0.0.0/0', APP_PORT) });
    expect(attempt(onTheDevicePort).outcome).toBe('replied');
    const fromElsewhere = applyAction(guarded, { type: 'addRule', firewallId: FIREWALL_OF_ANDRES.id, rule: allowFrom(`${STRANGER.ip}/32`, APP_PORT) });
    expect(attempt(fromElsewhere).outcome).toBe('timeout');
    expect(simulate(fromElsewhere, toUplink(stranger, PUBLIC_APP_PORT)).outcome).toBe('replied');
  });

  it('a packet from a client actor to a public IP that no router owns is lost', () => {
    const net = forwarding(fromOutside(), toApp);
    const packets: PacketSpec[] = [
      { from: home, to: server.ip, protocol: 'tcp', port: 80 },
      { from: home, to: '203.0.113.99', protocol: 'udp', port: 53 },
      { from: stranger, to: '8.8.8.8', protocol: 'icmp', icmpType: 8 },
    ];
    for (const packet of packets) {
      const trace = simulate(net, packet);
      expect([trace.outcome, trace.destinationId], packet.to).toEqual(['lost', null]);
      expect(trace.steps).toEqual([{ stage: 'route', at: 'office', verdict: 'drop', reason: { code: 'route-no-device', ip: packet.to } }]);
      for (const field of ['hops', 'translation'] as const) expect(trace, field).not.toHaveProperty(field);
    }
  });

  it('what a client actor sent before the new rule still behaves as it did: a private IP is lost, and an office with no routers keeps its old stop', () => {
    const privateIp = simulate(fromOutside(), { from: home, to: floor1.you, protocol: 'tcp', port: APP_PORT });
    expect([privateIp.outcome, privateIp.steps.map((step) => step.reason.code)]).toEqual(['lost', ['route-private-from-outside']]);
    const routerless = simulate(officeNet(), { from: actor('attacker'), to: '203.0.113.5', protocol: 'tcp', port: 22 });
    expect([routerless.outcome, routerless.steps.map((step) => step.reason.code)]).toEqual(['timeout', ['route-no-public-device']]);
  });

  it('a packet from outside finds the row that an earlier send of the sequence made', () => {
    const net = applyAction(fromOutside(), { type: 'setServices', ownerId: 'your-laptop', services: [tcpService(51514)] });
    const answered = simulateSequence(net, sends(tcp(you, server.ip, WEB_PORT), toUplink(home, FIRST_PUBLIC_PORT), toUplink(home, SECOND_PUBLIC_PORT)));
    expect(answered.map((trace) => trace.outcome)).toEqual(['refused', 'replied', 'timeout']);
    expect(answered[1].destinationId).toBe('your-laptop');
    expect(answered[1].translation).toEqual({ protocol: 'tcp', inside: { ip: floor1.you, port: 51514 }, outside: { ip: uplink, port: FIRST_PUBLIC_PORT }, isNew: false, fixed: false });
    expect(answered[1].steps.map((step) => step.reason)).toEqual([
      { code: 'nat-forwarded', routerId: officeRouter.id, deviceId: 'your-laptop', protocol: 'tcp', ip: uplink, port: FIRST_PUBLIC_PORT, toPort: 51514, fixed: false },
      { code: 'forward-hop', routerId: officeRouter.id, ip: uplink, ttlLeft: 63 },
      { code: 'host-accepts', deviceId: 'your-laptop', port: 51514 },
      { code: 'reply-stateful', deviceId: 'your-laptop' },
    ]);
    expect(answered[1].tcpdump.map((line) => line.summary)).toEqual(['TCP 51514', 'TCP 51514 reply']);
    expect(simulate(net, toUplink(home, FIRST_PUBLIC_PORT)).outcome).toBe('timeout');
    expect(simulateSequence(net, sends(tcp(you, server.ip, WEB_PORT), toUplink(home, FIRST_PUBLIC_PORT, 'udp'))).map((trace) => trace.outcome)).toEqual(['refused', 'timeout']);
  });

  it('a row of the table sends the packet to a device that rejects it with the port the device has', () => {
    const traces = simulateSequence(fromOutside(), sends(tcp(you, server.ip, WEB_PORT), toUplink(home, FIRST_PUBLIC_PORT)));
    expect(traces.map((trace) => trace.outcome)).toEqual(['refused', 'refused']);
    expect(traces[1].steps.at(-1)?.reason).toEqual({ code: 'host-refused', deviceId: 'your-laptop', port: 51514 });
    expect(traces[1].tcpdump.map((line) => line.summary)).toEqual(['TCP 51514', 'TCP 51514 RST']);
    expect(traces[1].header?.request).toMatchObject({ destination: uplink, destinationPort: FIRST_PUBLIC_PORT });
  });

  it('the ttl goes down once at the router, which discards a packet whose ttl ends there before it translates anything', () => {
    const net = forwarding(fromOutside(), toApp);
    const trace = simulate(net, { ...toUplink(home, PUBLIC_APP_PORT), ttl: 5 });
    expect(trace.hops).toEqual([{ routerId: officeRouter.id, ip: uplink, ttlLeft: 4 }]);
    expect(trace.steps.find((step) => step.reason.code === 'forward-hop')?.reason).toEqual({ code: 'forward-hop', routerId: officeRouter.id, ip: uplink, ttlLeft: 4 });
    const ended = simulate(net, { ...toUplink(home, PUBLIC_APP_PORT), ttl: 1 });
    expect([ended.outcome, ended.notice?.kind, ended.notice?.fromId, ended.destinationId]).toEqual(['ttl-exceeded', 'time-exceeded', officeRouter.id, null]);
    expect(codes(ended)).toEqual(['forward-ttl-exceeded']);
    expect(ended).not.toHaveProperty('translation');
  });

  it('a ping to the public IP of the router and a packet to a router that does not translate are answered as before', () => {
    const net = forwarding(fromOutside(), toApp);
    const echo = simulate(net, { from: home, to: uplink, protocol: 'icmp', icmpType: 8 });
    expect([echo.outcome, echo.destinationId, codes(echo)]).toEqual(['replied', officeRouter.id, ['forward-router-replies', 'reply-stateful']]);
    for (const field of ['hops', 'translation'] as const) expect(echo, field).not.toHaveProperty(field);
    const toProvider = simulate(net, { from: home, to: provider.towardOffice, protocol: 'tcp', port: 22 });
    expect([toProvider.outcome, toProvider.destinationId, codes(toProvider)]).toEqual(['refused', provider.id, ['host-refused']]);
    expect(toProvider).not.toHaveProperty('translation');
  });

  it('a forward to a device with no cable ends at the router, which says nobody has that IP', () => {
    const net = forwarding(fromOutside(), { ...toApp, toDeviceId: 'guest-laptop' });
    const trace = simulate(net, toUplink(home, PUBLIC_APP_PORT));
    expect([trace.outcome, trace.notice?.kind, trace.notice?.fromId, trace.destinationId]).toEqual(['unreachable', 'host-unreachable', officeRouter.id, null]);
    expect(trace.translation).toMatchObject({ inside: { ip: floor1.guest, port: APP_PORT }, fixed: true });
    expect(codes(trace)).toEqual(['nat-forwarded', 'forward-no-host']);
  });

  it('a public port that a forward uses is never handed to a row', () => {
    const net = forwarding(fromOutside(), { ...toApp, publicPort: FIRST_PUBLIC_PORT });
    const traces = simulateSequence(net, sends(tcp(you, server.ip, WEB_PORT), tcp(lucia, server.ip, WEB_PORT)));
    expect(traces.map((trace) => trace.translation?.outside.port)).toEqual([SECOND_PUBLIC_PORT, THIRD_PUBLIC_PORT]);
    const delivered = simulateSequence(net, sends(tcp(you, server.ip, WEB_PORT), toUplink(home, FIRST_PUBLIC_PORT), toUplink(home, SECOND_PUBLIC_PORT)));
    expect([delivered[1].translation?.fixed, delivered[1].destinationId]).toEqual([true, 'andres-laptop']);
    expect([delivered[2].translation?.fixed, delivered[2].destinationId]).toEqual([false, 'your-laptop']);
  });
});
