import { describe, expect, it } from 'vitest';
import { probePackets, withProbeActor } from '@/engine/exposure/exposure';
import { DEFAULT_SOURCE_PORT } from '@/engine/network/schema';
import type { Endpoint, Network, PacketSpec } from '@/engine/network/types';
import { NAME_SERVERS, OFFICE, actor, chapter4Worlds, device, dig, officeNet, officeWithNames, ping, tcp, withResolverCache } from '@/testing';
import { cacheAfter, simulateSequence, type Send } from './sequence';
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
    expect(traces.map((trace) => trace.outcome)).toEqual(['refused', 'replied', 'unreachable']);
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

describe('the cache of a resolver in a sequence', () => {
  const { zone, site, resolver } = NAME_SERVERS;
  const WWW = `www.${zone}`;
  const BLOG = `blog.${zone}`;
  const names = officeWithNames();
  const secondsLeft = (list: Send[]) => simulateSequence(names, list).map((trace) => trace.dns?.ttlLeft);

  it('the cache of the resolver is carried from one dig to the next', () => {
    const traces = simulateSequence(names, [
      { packet: dig(you, WWW), at: 0 },
      { packet: dig(you, WWW), at: 60 },
      { packet: dig(you, BLOG), at: 90 },
      { packet: dig(you, BLOG), at: 100 },
    ]);
    expect(traces.map((trace) => trace.dns?.fromCache)).toEqual([false, true, false, true]);
    expect(traces.map((trace) => trace.dns?.ttlLeft)).toEqual([undefined, 240, undefined, 290]);
    expect(traces[1].dns?.answers).toEqual([{ name: WWW, type: 'A', value: site, ttl: 240 }]);
  });

  it('each dig is measured against the second it leaves at and not against its place in the list', () => {
    expect(secondsLeft([{ packet: dig(you, WWW), at: 1000 }, { packet: dig(you, WWW), at: 1100 }, { packet: dig(you, WWW), at: 1299 }, { packet: dig(you, WWW), at: 1300 }])).toEqual([undefined, 200, 1, undefined]);
  });

  it('a lookup by name fills the cache of the resolver and uses neither a port of its sender nor a row of the table, while the dig that follows has both', () => {
    const traces = simulateSequence(names, [
      { packet: tcp(you, WWW, 80), at: 0 },
      { packet: dig(you, WWW), at: 5 },
      { packet: tcp(you, site, 80), at: 6 },
    ]);
    const [byName, asked, byIp] = traces;
    expect(byName.dns?.fromCache).toBe(false);
    expect(byName.header?.request.sourcePort).toBe(FIRST);
    expect(byName.translation?.outside.port).toBe(40001);
    expect(asked.dns).toMatchObject({ fromCache: true, ttlLeft: 295 });
    expect(asked.header?.request).toMatchObject({ destination: resolver.ip, sourcePort: SECOND, destinationPort: DNS_PORT });
    expect(asked.translation).toMatchObject({ protocol: 'udp', inside: { port: SECOND }, outside: { port: 40002 } });
    expect(byIp.header?.request.sourcePort).toBe(THIRD);
    expect(byIp.translation?.outside.port).toBe(40003);
  });

  it('an answer that holds no address and a send that asks nobody leave the cache as it was', () => {
    const traces = simulateSequence(names, [
      { packet: dig(you, `noexiste.${zone}`), at: 0 },
      { packet: ping(you, OFFICE.lucia), at: 1 },
      { packet: dig(you, `noexiste.${zone}`), at: 2 },
      { packet: dig(you, WWW), at: 3 },
    ]);
    expect(traces.map((trace) => trace.dns?.fromCache)).toEqual([false, undefined, false, false]);
  });

  it('gives the same traces for the same sends, and a send that came before the sequence leaves nothing in it', () => {
    const list: Send[] = [{ packet: dig(you, WWW), at: 0 }, { packet: ping(you, BLOG), at: 30 }, { packet: dig(you, BLOG), at: 31 }];
    const first = simulateSequence(names, list);
    simulateSequence(names, [{ packet: dig(you, WWW), at: 0 }]);
    expect(simulateSequence(names, list)).toEqual(first);
    expect(first.map((trace) => trace.dns?.fromCache)).toEqual([false, false, true]);
    expect(simulate(names, dig(you, WWW)).dns?.fromCache).toBe(false);
  });
});

describe('what a resolver holds after a sequence', () => {
  const { zone, site, resolver, authoritative } = NAME_SERVERS;
  const WWW = `www.${zone}`;
  const names = officeWithNames();
  const rows = (list: Send[], now: number, id: string = resolver.id) => cacheAfter(names, list, id, now);

  it('lists the answers the sends left with the seconds each has left at the second asked', () => {
    const list: Send[] = [{ packet: dig(you, WWW), at: 10 }];
    expect(rows(list, 10)).toEqual([{ name: WWW, type: 'A', value: site, ttlLeft: 300 }]);
    expect(rows(list, 70)).toEqual([{ name: WWW, type: 'A', value: site, ttlLeft: 240 }]);
    expect(rows(list, 309)).toEqual([{ name: WWW, type: 'A', value: site, ttlLeft: 1 }]);
    expect(rows(list, 310)).toEqual([]);
  });

  it('holds the entries of the world before any send, measured against the clock of the game', () => {
    const seeded = withResolverCache(names, [{ name: WWW, type: 'A', value: site, expiresAt: 240 }]);
    expect(cacheAfter(seeded, [], resolver.id, 0)).toEqual([{ name: WWW, type: 'A', value: site, ttlLeft: 240 }]);
    expect(cacheAfter(seeded, [], resolver.id, 239)).toEqual([{ name: WWW, type: 'A', value: site, ttlLeft: 1 }]);
    expect(cacheAfter(seeded, [], resolver.id, 300)).toEqual([]);
  });

  it('shows the newer answer in place of the entry of the world for the same name and type', () => {
    const seeded = withResolverCache(names, [{ name: WWW, type: 'A', value: '198.51.100.99', expiresAt: 5 }]);
    expect(cacheAfter(seeded, [{ packet: dig(you, WWW), at: 10 }], resolver.id, 10)).toEqual([{ name: WWW, type: 'A', value: site, ttlLeft: 300 }]);
  });

  it('keeps each link of an alias chain and nothing a lookup did not store', () => {
    const list: Send[] = [{ packet: dig(you, `blog.${zone}`), at: 0 }, { packet: dig(you, `noexiste.${zone}`), at: 1 }];
    expect(rows(list, 2).map(({ name, type, ttlLeft }) => [name, type, ttlLeft])).toEqual([[`blog.${zone}`, 'CNAME', 298], [WWW, 'A', 298]]);
  });

  it('is empty for a server that is no resolver and for an id that is no server, and it leaves the sends untouched', () => {
    const list: Send[] = [{ packet: dig(you, WWW), at: 0 }];
    const before = structuredClone(list);
    expect(rows(list, 1, authoritative.id)).toEqual([]);
    expect(rows(list, 1, 'nobody')).toEqual([]);
    expect(list).toEqual(before);
  });
});
