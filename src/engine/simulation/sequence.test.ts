import { describe, expect, it } from 'vitest';
import { probePackets, withProbeActor } from '@/engine/exposure/exposure';
import { DEFAULT_SOURCE_PORT } from '@/engine/network/schema';
import type { Endpoint, Network, PacketSpec } from '@/engine/network/types';
import { OFFICE, actor, chapter4Worlds, device, officeNet, ping, tcp } from '@/testing';
import { simulateSequence, type Send } from './sequence';
import { simulate } from './simulate';

const CLOSED_PORT = 80;
const DNS_PORT = 53;
const GIVEN_PORT = 40000;
const FIRST = DEFAULT_SOURCE_PORT;
const SECOND = DEFAULT_SOURCE_PORT + 1;
const THIRD = DEFAULT_SOURCE_PORT + 2;

const you = device('your-laptop');
const printer = device('printer');
const attacker = actor('attacker');

const toLucia = (from: Endpoint): PacketSpec => tcp(from, OFFICE.lucia, CLOSED_PORT);
const datagramToLucia = (from: Endpoint): PacketSpec => ({ from, to: OFFICE.lucia, protocol: 'udp', port: DNS_PORT });
const withSourcePort = (packet: PacketSpec): PacketSpec => ({ ...packet, sourcePort: GIVEN_PORT });
const sends = (...packets: PacketSpec[]): Send[] => packets.map((packet, index) => ({ packet, at: index }));
const sourcePorts = (net: Network, ...packets: PacketSpec[]): (number | undefined)[] => simulateSequence(net, sends(...packets)).map((trace) => trace.header?.request.sourcePort);

describe('simulateSequence', () => {
  it('gives the same traces for the same sends', () => {
    const net = officeNet();
    const list = sends(toLucia(you), toLucia(printer), toLucia(you), ping(you, OFFICE.lucia));
    const first = simulateSequence(net, list);
    simulateSequence(net, sends(toLucia(you), toLucia(you)));
    const second = simulateSequence(officeNet(), list);
    expect(first.map((trace) => trace.header?.request.sourcePort)).toEqual([FIRST, FIRST, SECOND, undefined]);
    expect(second).toEqual(first);
  });

  it('leaves the sends it receives untouched', () => {
    const list = sends(toLucia(you), toLucia(you), ping(you, OFFICE.lucia));
    const before = structuredClone(list);
    simulateSequence(officeNet(), list);
    expect(list).toEqual(before);
  });

  it('gives one trace per send, in the order of the sends', () => {
    const list = sends(toLucia(you), ping(you, OFFICE.lucia), datagramToLucia(printer));
    const traces = simulateSequence(officeNet(), list);
    expect(traces.map((trace) => trace.outcome)).toEqual(['refused', 'replied', 'arrived-no-reply']);
    expect(simulateSequence(officeNet(), [])).toEqual([]);
  });

  it('the first connection of a device leaves from 51514 and each new one adds one', () => {
    const traces = simulateSequence(officeNet(), sends(toLucia(you), toLucia(you), toLucia(you)));
    expect(traces.map((trace) => trace.outcome)).toEqual(['refused', 'refused', 'refused']);
    expect(traces.map((trace) => trace.header?.request.sourcePort)).toEqual([51514, 51515, 51516]);
    expect(traces.map((trace) => trace.header?.request.destinationPort)).toEqual([CLOSED_PORT, CLOSED_PORT, CLOSED_PORT]);
  });

  it('two devices each start at 51514', () => {
    expect(sourcePorts(officeNet(), toLucia(you), toLucia(printer), toLucia(you), toLucia(printer))).toEqual([FIRST, FIRST, SECOND, SECOND]);
  });

  it('a client actor of the internet has its own counter, like a device', () => {
    const toYou = (from: Endpoint): PacketSpec => tcp(from, OFFICE.you, CLOSED_PORT);
    expect(sourcePorts(officeNet(), toYou(attacker), toLucia(you), toYou(attacker), toLucia(you))).toEqual([FIRST, FIRST, SECOND, SECOND]);
  });

  it('tcp and udp of a device share one counter', () => {
    expect(sourcePorts(officeNet(), toLucia(you), datagramToLucia(you), toLucia(you))).toEqual([FIRST, SECOND, THIRD]);
  });

  it('a given source port wins over the assignment', () => {
    const traces = simulateSequence(officeNet(), sends(withSourcePort(toLucia(you)), withSourcePort(datagramToLucia(you))));
    expect(traces.map((trace) => trace.header?.request.sourcePort)).toEqual([GIVEN_PORT, GIVEN_PORT]);
    const given = simulateSequence(officeNet(), sends({ ...toLucia(you), sourcePort: FIRST }, toLucia(you)));
    expect(given.map((trace) => trace.header?.request.sourcePort)).toEqual([FIRST, FIRST]);
  });

  it('a given source port does not use up the counter of its device', () => {
    const net = officeNet();
    expect(sourcePorts(net, withSourcePort(toLucia(you)), toLucia(you), toLucia(you))).toEqual([GIVEN_PORT, FIRST, SECOND]);
    expect(sourcePorts(net, toLucia(you), withSourcePort(toLucia(you)), toLucia(you))).toEqual([FIRST, GIVEN_PORT, SECOND]);
  });

  it('an unrelated send does not change the ports of another device', () => {
    const net = officeNet();
    const alone = sourcePorts(net, toLucia(you), toLucia(you), toLucia(you));
    const mixed = sourcePorts(net, toLucia(you), toLucia(printer), tcp(attacker, OFFICE.you, CLOSED_PORT), toLucia(you), datagramToLucia(printer), toLucia(you));
    expect(alone).toEqual([FIRST, SECOND, THIRD]);
    expect([mixed[0], mixed[3], mixed[5]]).toEqual(alone);
  });

  it('an icmp message does not use up a port of its device', () => {
    expect(sourcePorts(officeNet(), toLucia(you), ping(you, OFFICE.lucia), toLucia(you))).toEqual([FIRST, undefined, SECOND]);
  });

  it('a sequence of icmp packets gives the same traces as simulate one by one', () => {
    const net = officeNet();
    const packets = [ping(you, OFFICE.lucia), ping(printer, OFFICE.you), ping(attacker, OFFICE.you), ping(you, 'localhost'), ping(you, OFFICE.nobody), { ...ping(you, OFFICE.lucia), sourcePort: GIVEN_PORT }];
    const traces = simulateSequence(net, sends(...packets));
    expect(traces).toEqual(packets.map((packet) => simulate(net, packet)));
    expect(traces.map((trace) => trace.outcome)).toContain('replied');
    expect(traces.every((trace) => trace.header?.request.sourcePort === undefined)).toBe(true);
  });

  it('a sequence of the packets of a VPC gives the same traces as simulate one by one', () => {
    const worlds = chapter4Worlds().map(({ world, flows }) => ({ net: withProbeActor(world), packets: [...flows, ...probePackets(world)] }));
    expect(worlds.some(({ packets }) => packets.some((packet) => packet.protocol === 'tcp'))).toBe(true);
    for (const { net, packets } of worlds) {
      expect(simulateSequence(net, sends(...packets))).toEqual(packets.map((packet) => simulate(net, packet)));
    }
  });
});
