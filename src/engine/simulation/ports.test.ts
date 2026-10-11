import { describe, expect, it } from 'vitest';
import { probePackets, withProbeActor } from '@/engine/exposure/exposure';
import { DEFAULT_SOURCE_PORT, DEFAULT_TTL, packetSchema } from '@/engine/network/schema';
import type { Network, PacketSpec } from '@/engine/network/types';
import { OFFICE, OFFICE_FLOORS, allOut, chapter4Worlds, device, lab03Net, officeNet, officeTwoFloorsNet, ping, tcp, withDevice, withInbound } from '@/testing';
import { openingOf, type SimContext } from './context';
import { simulate } from './simulate';
import { replyStage } from './stages/reply';

const LISTENING_PORT = 3000;
const CLOSED_PORT = 80;
const DNS_PORT = 53;
const GIVEN_SOURCE_PORT = 40000;
const SERVER_ONE = '172.31.16.131';
const SERVER_TWO = '172.31.38.97';

const you = device('your-laptop');
const syn = { from: 'client', kind: 'SYN' };
const synAck = { from: 'server', kind: 'SYN-ACK' };
const ack = { from: 'client', kind: 'ACK' };
const rst = { from: 'server', kind: 'RST' };
const query = { from: 'client', kind: 'query' };
const response = { from: 'server', kind: 'response' };

const udp = (from: PacketSpec['from'], to: string, port: number): PacketSpec => ({ from, to, protocol: 'udp', port });
const listening = (): Network => withDevice(officeNet(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, listeningTcpPorts: [LISTENING_PORT] } });
const guarded = (): Network => withDevice(listening(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
const openVpc = (): Network => withInbound(lab03Net(), 'sg-servidor2', allOut('everything'));

describe('the source port and the exchange of a trace', () => {
  it('a tcp packet of an office carries its source and destination ports in the request header', () => {
    const accepted = simulate(listening(), tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect(accepted.outcome).toBe('replied');
    expect(accepted.header?.request).toEqual({ source: OFFICE.you, destination: OFFICE.lucia, ttl: DEFAULT_TTL, sourcePort: DEFAULT_SOURCE_PORT, destinationPort: LISTENING_PORT });
    const refused = simulate(officeNet(), tcp(you, OFFICE.lucia, CLOSED_PORT));
    expect(refused.outcome).toBe('refused');
    expect(refused.header?.request).toMatchObject({ sourcePort: DEFAULT_SOURCE_PORT, destinationPort: CLOSED_PORT });
    const silent = simulate(guarded(), tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect(silent.outcome).toBe('timeout');
    expect(silent.header?.request).toMatchObject({ sourcePort: DEFAULT_SOURCE_PORT, destinationPort: LISTENING_PORT });
    const datagram = simulate(officeNet(), udp(you, OFFICE.lucia, DNS_PORT));
    expect(datagram.outcome).toBe('arrived-no-reply');
    expect(datagram.header?.request).toEqual({ source: OFFICE.you, destination: OFFICE.lucia, ttl: DEFAULT_TTL, sourcePort: DEFAULT_SOURCE_PORT, destinationPort: DNS_PORT });
  });

  it('the reply header swaps the ports', () => {
    const accepted = simulate(listening(), tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect(accepted.outcome).toBe('replied');
    expect(accepted.header?.reply).toEqual({ source: OFFICE.lucia, destination: OFFICE.you, sourcePort: LISTENING_PORT, destinationPort: DEFAULT_SOURCE_PORT });
    const given = simulate(listening(), { ...tcp(you, OFFICE.lucia, LISTENING_PORT), sourcePort: GIVEN_SOURCE_PORT });
    expect(given.header?.reply).toMatchObject({ sourcePort: LISTENING_PORT, destinationPort: GIVEN_SOURCE_PORT });
  });

  it('an accepted tcp connection lists SYN, SYN-ACK and ACK', () => {
    const trace = simulate(listening(), tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect(trace.outcome).toBe('replied');
    expect(trace.exchange).toEqual([syn, synAck, ack]);
  });

  it('a refused tcp connection lists SYN and RST', () => {
    const trace = simulate(officeNet(), tcp(you, OFFICE.lucia, CLOSED_PORT));
    expect(trace.outcome).toBe('refused');
    expect(trace.exchange).toEqual([syn, rst]);
    const atRouter = simulate(officeTwoFloorsNet(), tcp(you, OFFICE_FLOORS.floor1.gateway, CLOSED_PORT));
    expect(atRouter.outcome).toBe('refused');
    expect(atRouter.exchange).toEqual([syn, rst]);
  });

  it('a tcp packet with no answer lists only SYN', () => {
    const { server } = OFFICE_FLOORS;
    const fromYou = (to: string, ttl?: number): PacketSpec => ({ ...tcp(you, to, LISTENING_PORT), ...(ttl !== undefined && { ttl }) });
    const traces = [
      simulate(guarded(), fromYou(OFFICE.lucia)),
      simulate(officeTwoFloorsNet(), fromYou(server.nobody)),
      simulate(officeTwoFloorsNet(), fromYou(server.ip, 1)),
    ];
    expect(traces.map((trace) => trace.outcome)).toEqual(['timeout', 'unreachable', 'ttl-exceeded']);
    for (const trace of traces) expect(trace.exchange).toEqual([syn]);
  });

  it('a udp datagram lists its query and no response, because nothing answers a datagram yet', () => {
    const traces = [simulate(officeNet(), udp(you, OFFICE.lucia, DNS_PORT)), simulate(officeTwoFloorsNet(), udp(you, OFFICE_FLOORS.server.ip, DNS_PORT)), simulate(guarded(), udp(you, OFFICE.lucia, DNS_PORT))];
    expect(traces.map((trace) => trace.outcome)).toEqual(['arrived-no-reply', 'arrived-no-reply', 'timeout']);
    for (const trace of traces) expect(trace.exchange).toEqual([query]);
  });

  it('the reply stage lists the response of a udp datagram that gets an answer', () => {
    const net = officeNet();
    const packet = udp(you, OFFICE.lucia, DNS_PORT);
    const sender = net.devices[0];
    const ctx: SimContext = {
      net,
      packet,
      source: { endpoint: you, id: sender.id, ip: sender.privateIp, inside: true, device: sender },
      dest: net.devices[1],
      effectiveSource: sender.privateIp,
      hops: [],
      legsMs: [],
      steps: [],
      tcpdump: [],
      exchange: openingOf(packet),
    };
    expect(replyStage(ctx)).toEqual({ done: true, outcome: 'replied' });
    expect(ctx.exchange).toEqual([query, response]);
  });

  it('a packet that never left its sender lists no exchange', () => {
    const noCable = withDevice(listening(), 'your-laptop', { connected: false });
    const trace = simulate(noCable, tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect(trace.outcome).toBe('no-route');
    expect(trace).not.toHaveProperty('header');
    expect(trace).not.toHaveProperty('exchange');
  });

  it('the source port defaults to 51514 and a given one wins', () => {
    expect(DEFAULT_SOURCE_PORT).toBe(51514);
    const byDefault = simulate(listening(), tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect(byDefault.header?.request.sourcePort).toBe(DEFAULT_SOURCE_PORT);
    const given = simulate(listening(), { ...tcp(you, OFFICE.lucia, LISTENING_PORT), sourcePort: GIVEN_SOURCE_PORT });
    expect(given.header?.request.sourcePort).toBe(GIVEN_SOURCE_PORT);
    const givenUdp = simulate(officeNet(), { ...udp(you, OFFICE.lucia, DNS_PORT), sourcePort: GIVEN_SOURCE_PORT });
    expect(givenUdp.header?.request).toMatchObject({ sourcePort: GIVEN_SOURCE_PORT, destinationPort: DNS_PORT });
  });

  it('a source port is an integer from 1 to 65535', () => {
    const accepts = (sourcePort: number) => packetSchema.safeParse({ ...tcp(you, OFFICE.lucia, LISTENING_PORT), sourcePort }).success;
    expect([1, GIVEN_SOURCE_PORT, 65535].map(accepts)).toEqual([true, true, true]);
    expect([0, 65536, -1, 1.5].map(accepts)).toEqual([false, false, false, false]);
    expect(packetSchema.safeParse(tcp(you, OFFICE.lucia, LISTENING_PORT)).success).toBe(true);
  });

  it('an icmp packet and a packet of a VPC carry no ports and no exchange', () => {
    const echo = simulate(officeNet(), { ...ping(you, OFFICE.lucia), sourcePort: GIVEN_SOURCE_PORT });
    expect(echo.outcome).toBe('replied');
    expect(echo.header).toStrictEqual({ request: { source: OFFICE.you, destination: OFFICE.lucia, ttl: DEFAULT_TTL }, reply: { source: OFFICE.lucia, destination: OFFICE.you } });
    expect(echo).not.toHaveProperty('exchange');
    const traces = [simulate(openVpc(), tcp(device('servidor1'), SERVER_TWO, 22)), simulate(openVpc(), tcp(device('servidor1'), SERVER_TWO, CLOSED_PORT)), simulate(openVpc(), udp(device('servidor1'), SERVER_TWO, DNS_PORT))];
    expect(traces.map((trace) => trace.outcome)).toEqual(['replied', 'refused', 'arrived-no-reply']);
    for (const trace of traces) {
      expect(trace).not.toHaveProperty('header');
      expect(trace).not.toHaveProperty('exchange');
    }
    expect(simulate(openVpc(), tcp(device('servidor1'), SERVER_ONE, 22))).not.toHaveProperty('exchange');
  });

  it('the new trace fields are absent from every trace of a VPC', () => {
    const vpcFields = new Set(['steps', 'outcome', 'resolvedIp', 'destinationId', 'effectiveSource', 'tcpdump', 'notice', 'hops']);
    const worlds = chapter4Worlds();
    expect(worlds.length).toBeGreaterThan(0);
    const traces = worlds.flatMap(({ world, flows }) => {
      expect(world.kind).toBe('vpc');
      const probed = withProbeActor(world);
      return [...flows, ...probePackets(world)].map((packet) => ({ packet, trace: simulate(probed, packet) }));
    });
    for (const protocol of ['tcp', 'udp', 'icmp']) expect(traces.some(({ packet }) => packet.protocol === protocol)).toBe(true);
    expect(traces.some(({ trace }) => trace.outcome === 'replied')).toBe(true);
    for (const { trace } of traces) expect(Object.keys(trace).filter((field) => !vpcFields.has(field))).toEqual([]);
  });

  it('the ICMP branch of the host stage keeps every field it had', () => {
    const replied = simulate(officeNet(), ping(you, OFFICE.lucia));
    const ignored = simulate(withDevice(officeNet(), 'lucia-laptop', { host: { ignoreIcmpEcho: true, listeningTcpPorts: [] } }), ping(you, OFFICE.lucia));
    const unsolicited = simulate(officeNet(), { ...ping(you, OFFICE.lucia), icmpType: 0 });
    expect([replied, ignored, unsolicited].map((trace) => trace.outcome)).toEqual(['replied', 'arrived-no-reply', 'arrived-no-reply']);
    const alwaysThere = ['destinationId', 'effectiveSource', 'header', 'outcome', 'resolvedIp', 'steps', 'tcpdump'];
    expect(Object.keys(replied).sort()).toEqual([...alwaysThere, 'rttMs'].sort());
    expect(Object.keys(ignored).sort()).toEqual(alwaysThere);
    expect(Object.keys(unsolicited).sort()).toEqual(alwaysThere);
    for (const trace of [replied, ignored, unsolicited]) expect(Object.keys(trace.header!.request).sort()).toEqual(['destination', 'source', 'ttl']);
    expect(Object.keys(replied.header!.reply!).sort()).toEqual(['destination', 'source']);
    expect(replied.tcpdump.map((line) => line.summary)).toEqual(['ICMP echo request', 'ICMP echo reply']);
    expect(replied.steps.map((step) => step.reason.code).slice(-2)).toEqual(['host-replies', 'reply-stateful']);
  });
});
