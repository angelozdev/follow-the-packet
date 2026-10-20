import { describe, expect, it } from 'vitest';
import { applyAction } from '@/engine/network/actions';
import type { Network, PacketSpec } from '@/engine/network/types';
import { cacheAfter, simulateSequence, type Send } from '@/engine/simulation/sequence';
import { simulate } from '@/engine/simulation/simulate';
import type { Trace } from '@/engine/simulation/trace';
import { NAME_SERVERS, OFFICE_FLOORS, device, dig, officeWithNames, ping, tcp } from '@/testing';
import { DNS_PORT } from './resolve';

const { zone, site, resolver } = NAME_SERVERS;
const { floor1, officeRouter } = OFFICE_FLOORS;
const WWW = `www.${zone}`;
const GONE = `noexiste.${zone}`;
const FIRST = 51514;
const GIVEN = 40000;
const you = device('your-laptop');

const net = officeWithNames();
const sends = (...packets: PacketSpec[]): Send[] => packets.map((packet, index) => ({ packet, at: index }));
const sequence = (world: Network, ...packets: PacketSpec[]) => simulateSequence(world, sends(...packets));
const withHosts = (world: Network, ip: string): Network => applyAction(world, { type: 'setHosts', deviceId: 'your-laptop', hosts: [{ name: WWW, ip }] });
const withFirewallClosed = (world: Network): Network =>
  applyAction(applyAction(world, { type: 'addFirewall', deviceId: 'your-laptop', firewall: { id: 'fw-you', name: 'tu-laptop', kind: 'host-firewall', inbound: [], outbound: [] } }), { type: 'setDnsServer', deviceId: 'your-laptop', server: resolver.ip });
const codes = (world: Network, packet: PacketSpec) => simulate(world, packet).steps.map((step) => step.reason.code);

function expectTheSecondExchange(trace: Trace): void {
  expect(trace.header?.request.sourcePort).toBe(FIRST + 1);
  expect(trace.translation?.outside.port).toBe(40002);
}

describe('the question of a lookup by name', () => {
  it('a ping by name carries the question that went to its resolver: a udp datagram to port 53 with its own source port', () => {
    const { question, outcome } = simulate(net, ping(you, WWW));
    expect(outcome).toBe('replied');
    expect(question?.packet).toEqual({ from: you, to: resolver.ip, protocol: 'udp', port: DNS_PORT, sourcePort: FIRST });
    expect(question?.trace.outcome).toBe('replied');
    expect(question?.trace.destinationId).toBe(resolver.id);
    expect(question?.trace.header?.request).toMatchObject({ source: floor1.you, destination: resolver.ip, sourcePort: FIRST, destinationPort: DNS_PORT });
    expect(question?.trace.header?.reply).toMatchObject({ source: resolver.ip, destination: floor1.you, sourcePort: DNS_PORT, destinationPort: FIRST });
    expect(question?.trace.exchange).toEqual([{ from: 'client', kind: 'query' }, { from: 'server', kind: 'response' }]);
    expect(question?.trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, OFFICE_FLOORS.provider.id, OFFICE_FLOORS.backbone.id]);
  });

  it('the question carries the answer of the resolver as the trace of a dig does, and the packet that asked keeps its own dns', () => {
    const asked = simulate(net, ping(you, WWW));
    const dug = simulate(net, dig(you, WWW));
    expect(asked.dns).toMatchObject({ name: WWW, status: 'NOERROR', viaDig: false });
    expect(asked.question?.trace.dns).toEqual({ ...asked.dns, viaDig: true });
    expect(asked.question?.trace.dns).toEqual(dug.dns);
    expect(simulate(net, ping(you, GONE)).question?.trace.dns).toMatchObject({ status: 'NXDOMAIN', viaDig: true });
  });

  it('a tcp packet by name leaves from the port after the one of its question', () => {
    const asked = simulate(net, tcp(you, WWW, 80));
    expect(asked.question?.packet.sourcePort).toBe(FIRST);
    expect(asked.header?.request).toMatchObject({ destination: site, sourcePort: FIRST + 1, destinationPort: 80 });
    const noQuestion = simulate(net, tcp(you, site, 80));
    expect(noQuestion.header?.request.sourcePort).toBe(FIRST);
  });

  it('a source port given by hand wins for the packet and the question still takes the counter', () => {
    const [first, second] = sequence(net, { ...tcp(you, WWW, 80), sourcePort: GIVEN }, tcp(you, WWW, 80));
    expect(first.header?.request.sourcePort).toBe(GIVEN);
    expect(first.question?.packet.sourcePort).toBe(FIRST);
    expect(second.question?.packet.sourcePort).toBe(FIRST + 1);
    expect(second.header?.request.sourcePort).toBe(FIRST + 2);
  });

  it('in a sequence each send by name asks again and its question takes a new source port', () => {
    const traces = simulateSequence(net, [0, 10, 20].map((at) => ({ packet: ping(you, WWW), at })));
    expect(traces.map((trace) => trace.question?.packet.sourcePort)).toEqual([FIRST, FIRST + 1, FIRST + 2]);
    expect(traces.map((trace) => trace.question?.trace.dns?.fromCache)).toEqual([false, true, true]);
    expect(traces.map((trace) => trace.question?.trace.outcome)).toEqual(['replied', 'replied', 'replied']);
  });

  it('the question leaves a row of the translation table before the packet that asked, and the packet takes the next public port', () => {
    const asked = simulate(net, tcp(you, WWW, 80));
    expect(asked.question?.trace.translation).toMatchObject({ protocol: 'udp', inside: { ip: floor1.you, port: FIRST }, outside: { ip: officeRouter.uplink, port: 40001 }, isNew: true });
    expect(asked.translation).toMatchObject({ protocol: 'tcp', inside: { ip: floor1.you, port: FIRST + 1 }, outside: { ip: officeRouter.uplink, port: 40002 }, isNew: true });
  });

  it('a ping by name leaves the row of its question and none of its own', () => {
    const [pinged, byIp] = sequence(net, ping(you, WWW), tcp(you, site, 80));
    expect(pinged.question?.trace.translation).toMatchObject({ protocol: 'udp', outside: { port: 40001 }, isNew: true });
    expect(pinged.translation?.protocol).toBe('icmp');
    expect(byIp.translation).toMatchObject({ protocol: 'tcp', outside: { port: 40002 }, isNew: true });
    expect(byIp.header?.request.sourcePort).toBe(FIRST + 1);
  });

  it('a name answered by the hosts file sends no question, takes no port for one and leaves no row', () => {
    const [byHosts, byIp] = sequence(withHosts(net, site), tcp(you, WWW, 80), tcp(you, site, 80));
    expect(byHosts).not.toHaveProperty('question');
    expect(byHosts.dns?.usedHostsFile).toBe(true);
    expect(byHosts.header?.request.sourcePort).toBe(FIRST);
    expect(byHosts.translation?.outside.port).toBe(40001);
    expectTheSecondExchange(byIp);
  });

  it('a device with no resolver sends no question', () => {
    const none = applyAction(net, { type: 'setDnsServer', deviceId: 'your-laptop' });
    for (const packet of [ping(you, WWW), tcp(you, WWW, 80), dig(you, WWW)]) {
      const trace = simulate(none, packet);
      expect(trace.outcome).toBe('unresolved');
      expect(trace).not.toHaveProperty('question');
    }
    expect(codes(none, ping(you, WWW))).toEqual(['dns-unresolved']);
  });

  it('a dig is the question itself and carries no question', () => {
    const dug = simulate(net, dig(you, WWW));
    expect(dug.dns?.viaDig).toBe(true);
    expect(dug).not.toHaveProperty('question');
  });

  it('a packet addressed by IP carries no question', () => {
    for (const packet of [ping(you, site), tcp(you, site, 80), ping(you, 'localhost'), ping(you, floor1.lucia)]) expect(simulate(net, packet)).not.toHaveProperty('question');
  });

  it('a question carries no question of its own', () => {
    const asked = simulate(net, tcp(you, WWW, 80));
    expect(asked.question?.trace).not.toHaveProperty('question');
    expect(asked.question?.trace.dns?.viaDig).toBe(true);
  });

  it('a question that a firewall drops ends the packet as unresolved with dns-resolver-silent and the question has no reply', () => {
    const closed = withFirewallClosed(net);
    const trace = simulate(closed, tcp(you, WWW, 80));
    expect(trace.outcome).toBe('unresolved');
    expect(trace.steps).toEqual([{ stage: 'dns', at: 'your-laptop', verdict: 'drop', reason: { code: 'dns-resolver-silent', deviceId: 'your-laptop', name: WWW, ip: resolver.ip } }]);
    expect(trace.question?.packet).toMatchObject({ to: resolver.ip, port: DNS_PORT, sourcePort: FIRST });
    expect(trace.question?.trace.outcome).toBe('timeout');
    expect(trace.question?.trace.header).toMatchObject({ request: { sourcePort: FIRST, destinationPort: DNS_PORT } });
    expect(trace.question?.trace.header).not.toHaveProperty('reply');
    expect(trace.question?.trace.dns).toMatchObject({ status: 'NO-RESOLVER', viaDig: true });
  });

  it('a name that does not exist leaves the question replied, the packet unresolved and no port taken by the packet', () => {
    const [missing, byIp] = sequence(net, tcp(you, GONE, 80), tcp(you, site, 80));
    expect(missing.outcome).toBe('unresolved');
    expect(missing).not.toHaveProperty('header');
    expect(missing.steps.map((step) => step.reason.code)).toEqual(['dns-nxdomain']);
    expect(missing.question?.trace.outcome).toBe('replied');
    expect(missing.question?.trace.dns).toMatchObject({ status: 'NXDOMAIN', viaDig: true });
    expect(missing.question?.trace.translation?.outside.port).toBe(40001);
    expectTheSecondExchange(byIp);
  });

  it('a resolver with no service on port 53 answers the question with Port Unreachable and the packet is unresolved with dns-no-resolver', () => {
    const toPrinter = applyAction(net, { type: 'setDnsServer', deviceId: 'your-laptop', server: floor1.printer });
    const trace = simulate(toPrinter, tcp(you, WWW, 80));
    expect(trace.outcome).toBe('unresolved');
    expect(trace.steps.map((step) => step.reason)).toEqual([{ code: 'dns-no-resolver', deviceId: 'your-laptop', name: WWW, ip: floor1.printer, hostId: 'printer' }]);
    expect(trace.question?.trace).toMatchObject({ outcome: 'unreachable', notice: { kind: 'port-unreachable', fromId: 'printer' }, dns: { status: 'NO-RESOLVER', viaDig: true } });
    expect(trace.question?.packet).toMatchObject({ to: floor1.printer, port: DNS_PORT, sourcePort: FIRST });
  });

  it('the question is measured against the second of its send and the answer fills the cache of the resolver for the next send', () => {
    const list: Send[] = [{ packet: ping(you, WWW), at: 100 }, { packet: ping(you, WWW), at: 160 }];
    const [first, second] = simulateSequence(net, list);
    expect(first.question?.trace.dns).toMatchObject({ fromCache: false });
    expect(first.question?.trace.dns).not.toHaveProperty('ttlLeft');
    expect(second.question?.trace.dns).toMatchObject({ fromCache: true, ttlLeft: 240 });
    expect(second.dns).toMatchObject({ fromCache: true, ttlLeft: 240 });
    expect(cacheAfter(net, list, resolver.id, 160)).toEqual([{ name: WWW, type: 'A', value: site, ttlLeft: 240 }]);
  });

  it('a loose simulate is the sequence of one send', () => {
    const asking = tcp(you, WWW, 80);
    const silent = tcp(you, site, 80);
    expect(simulate(net, asking)).toEqual(sequence(net, asking)[0]);
    expect(simulate(net, silent)).toEqual(sequence(net, silent)[0]);
    expect(simulate(net, silent).header?.request.sourcePort).toBe(FIRST);
    expect(simulate(net, asking).question?.packet.sourcePort).toBe(FIRST);
    expect(simulate(net, asking).header?.request.sourcePort).toBe(FIRST + 1);
  });

  it('the steps of a send by name are the ones they were: the question writes no step in the trace that asked', () => {
    const byName = simulate(net, ping(you, WWW));
    const byIp = simulate(net, ping(you, site));
    expect(byName.steps[0]).toMatchObject({ stage: 'dns', reason: { code: 'dns-answered' } });
    expect(byName.steps.slice(1)).toEqual(byIp.steps);
    expect(byName.hops).toEqual(byIp.hops);
    expect(byName.tcpdump).toEqual(byIp.tcpdump);
    expect(byName.rttMs).toBe(byIp.rttMs);
    expect(byName.routes).toEqual(byIp.routes);
  });
});
