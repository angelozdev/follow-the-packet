import { describe, expect, it } from 'vitest';
import { probePackets, withProbeActor } from '@/engine/exposure/exposure';
import { DEFAULT_SOURCE_PORT, DEFAULT_TTL, packetSchema } from '@/engine/network/schema';
import type { Firewall, Network, PacketSpec, Rule, Service } from '@/engine/network/types';
import { OFFICE, OFFICE_FLOORS, allOut, chapter4Worlds, device, lab03Net, officeNet, officeTwoFloorsNet, ping, tcp, tcpService, withDevice, withInbound } from '@/testing';
import { openingOf, type SimContext } from './context';
import { simulate } from './simulate';
import { replyStage } from './stages/reply';

const LISTENING_PORT = 3000;
const CLOSED_PORT = 80;
const DNS_PORT = 53;
const GIVEN_SOURCE_PORT = 40000;
const OTHER_LOOPBACK_IP = '127.5.5.5';
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
const listening = (): Network => withDevice(officeNet(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [tcpService(LISTENING_PORT)] } });
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
    const ignored = simulate(withDevice(officeNet(), 'lucia-laptop', { host: { ignoreIcmpEcho: true, services: [] } }), ping(you, OFFICE.lucia));
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

const LUCIA = 'lucia-laptop';
const APP_PORT = 443;
const serving = (...services: Service[]): Network => withDevice(officeNet(), LUCIA, { host: { ignoreIcmpEcho: false, services } });
const serverServing = (...services: Service[]): Network => {
  const net = officeTwoFloorsNet();
  return { ...net, actors: net.actors.map((entry) => (entry.kind === 'server' ? { ...entry, services } : entry)) };
};
const tcpRule = (id: string, peerIp: string): Rule => ({ id, what: { kind: 'tcp', fromPort: LISTENING_PORT, toPort: LISTENING_PORT }, peer: { kind: 'cidr', cidr: `${peerIp}/32` } });
const hostFirewall = (name: string, inbound: Rule[], outbound: Rule[]): Firewall => ({ id: `fw-${name}`, name, kind: 'host-firewall', inbound, outbound });
const stagesOf = (trace: ReturnType<typeof simulate>): string[] => trace.steps.map((step) => step.stage);

describe('services and the listening address in a trip', () => {
  it('a tcp port nobody listens on answers with a reset and a firewall that drops answers with nothing', () => {
    const closed = simulate(officeNet(), tcp(you, OFFICE.lucia, CLOSED_PORT));
    expect(closed.outcome).toBe('refused');
    expect(closed.exchange).toEqual([syn, rst]);
    expect(closed.steps.at(-1)).toMatchObject({ stage: 'host', at: LUCIA, verdict: 'reject', reason: { code: 'host-refused', deviceId: LUCIA, port: CLOSED_PORT } });
    expect(closed.tcpdump.at(-1)).toMatchObject({ deviceId: LUCIA, direction: 'Out', summary: `TCP ${CLOSED_PORT} RST` });
    const dropped = simulate(withDevice(officeNet(), LUCIA, { firewallIds: ['fw-lucia'] }), tcp(you, OFFICE.lucia, CLOSED_PORT));
    expect(dropped.outcome).toBe('timeout');
    expect(dropped.exchange).toEqual([syn]);
    expect(stagesOf(dropped)).not.toContain('host');
    expect(dropped.tcpdump).toEqual([]);
    expect(dropped).not.toHaveProperty('rttMs');
    expect(closed).toHaveProperty('rttMs');
  });

  it('a tcp port with a service on the right address is accepted', () => {
    const everywhere = simulate(serving(tcpService(LISTENING_PORT)), tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect(everywhere.outcome).toBe('replied');
    expect(everywhere.exchange).toEqual([syn, synAck, ack]);
    expect(everywhere.steps.find((step) => step.stage === 'host')?.reason).toEqual({ code: 'host-accepts', deviceId: LUCIA, port: LISTENING_PORT });
    const own = serving(tcpService(LISTENING_PORT, 'loopback'));
    for (const to of ['127.0.0.1', 'localhost']) {
      const fromItself = simulate(own, tcp(device(LUCIA), to, LISTENING_PORT));
      expect(fromItself.outcome, to).toBe('replied');
      expect(fromItself.steps.find((step) => step.stage === 'host')?.reason, to).toEqual({ code: 'host-accepts', deviceId: LUCIA, port: LISTENING_PORT });
    }
  });

  it('a service answers only the port and the protocol it listens on', () => {
    const net = serving(tcpService(LISTENING_PORT), { protocol: 'udp', port: DNS_PORT, listen: 'all' });
    expect(simulate(net, tcp(you, OFFICE.lucia, DNS_PORT)).outcome).toBe('refused');
    expect(simulate(net, tcp(you, OFFICE.lucia, LISTENING_PORT + 1)).outcome).toBe('refused');
    expect(simulate(net, tcp(you, OFFICE.lucia, LISTENING_PORT)).outcome).toBe('replied');
  });

  it('a service on the loopback address refuses a packet to any other IP of the device, the network one from another device or from itself and another 127.x.x.x one from itself', () => {
    const net = serving(tcpService(LISTENING_PORT, 'loopback'));
    const itself = device(LUCIA);
    for (const [from, to] of [[you, OFFICE.lucia], [itself, OFFICE.lucia], [itself, OTHER_LOOPBACK_IP]] as const) {
      const trace = simulate(net, tcp(from, to, LISTENING_PORT));
      const label = `${from.id} to ${to}`;
      expect(trace.outcome, label).toBe('refused');
      expect(trace.exchange, label).toEqual([syn, rst]);
      expect(trace.steps.at(-1), label).toMatchObject({ stage: 'host', verdict: 'reject', reason: { code: 'host-wrong-address', deviceId: LUCIA, port: LISTENING_PORT, ip: to } });
      expect(trace.tcpdump.at(-1), label).toMatchObject({ direction: 'Out', summary: `TCP ${LISTENING_PORT} RST` });
    }
    expect(simulate(net, tcp(you, OTHER_LOOPBACK_IP, LISTENING_PORT)).steps.at(-1)?.reason).toEqual({ code: 'host-refused', deviceId: you.id, port: LISTENING_PORT });
    const nobody = simulate(serving(), tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect(nobody.steps.at(-1)?.reason).toEqual({ code: 'host-refused', deviceId: LUCIA, port: LISTENING_PORT });
  });

  it('a firewall in front of a service on the loopback address drops the packet before the host answers', () => {
    const net = withDevice(serving(tcpService(LISTENING_PORT, 'loopback')), LUCIA, { firewallIds: ['fw-lucia'] });
    const trace = simulate(net, tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect(trace.outcome).toBe('timeout');
    expect(stagesOf(trace)).not.toContain('host');
  });

  it('a server of the internet accepts a tcp connection on a port it serves', () => {
    const { server } = OFFICE_FLOORS;
    const accepted = simulate(serverServing(tcpService(APP_PORT)), tcp(you, server.ip, APP_PORT));
    expect(accepted.outcome).toBe('replied');
    expect(accepted.destinationId).toBe(server.id);
    expect(accepted.exchange).toEqual([syn, synAck, ack]);
    expect(accepted.header?.reply).toMatchObject({ source: server.ip, sourcePort: APP_PORT, destinationPort: DEFAULT_SOURCE_PORT });
    expect(accepted.steps.find((step) => step.stage === 'host')?.reason).toEqual({ code: 'host-accepts', deviceId: server.id, port: APP_PORT });
    expect(accepted.tcpdump).toEqual([]);
    const closed = simulate(serverServing(tcpService(APP_PORT)), tcp(you, server.ip, CLOSED_PORT));
    expect(closed.outcome).toBe('refused');
    expect(closed.exchange).toEqual([syn, rst]);
    const otherProtocol = simulate(serverServing({ protocol: 'udp', port: APP_PORT, listen: 'all' }), tcp(you, server.ip, APP_PORT));
    expect(otherProtocol.outcome).toBe('refused');
    expect(simulate(officeTwoFloorsNet(), tcp(you, server.ip, APP_PORT)).outcome).toBe('refused');
  });

  it('a router has no services: it refuses a tcp connection to its own interface', () => {
    const trace = simulate(serverServing(tcpService(APP_PORT)), tcp(you, OFFICE_FLOORS.floor1.gateway, APP_PORT));
    expect(trace.outcome).toBe('refused');
    expect(trace.steps.at(-1)?.reason).toEqual({ code: 'host-refused', deviceId: OFFICE_FLOORS.officeRouter.id, port: APP_PORT });
  });

  it('the reply of a tcp connection is never stopped by a firewall, outbound or inbound', () => {
    const closedAfterRequest = [hostFirewall('you', [], [tcpRule('you-out', OFFICE.lucia)]), hostFirewall('lucia', [tcpRule('lucia-in', OFFICE.you)], [])];
    const guarding = withDevice(withDevice(serving(tcpService(LISTENING_PORT)), 'your-laptop', { firewallIds: ['fw-you'] }), LUCIA, { firewallIds: ['fw-lucia'] });
    const net: Network = { ...guarding, firewalls: closedAfterRequest };
    const trace = simulate(net, tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect(trace.outcome).toBe('replied');
    expect(trace.exchange).toEqual([syn, synAck, ack]);
    expect(stagesOf(trace).filter((stage) => stage === 'firewall-out' || stage === 'firewall-in')).toEqual(['firewall-out', 'firewall-in']);
    expect(stagesOf(trace).slice(stagesOf(trace).indexOf('host') + 1)).toEqual(['reply']);
    const noOutbound = simulate({ ...net, firewalls: [hostFirewall('you', [], []), closedAfterRequest[1]] }, tcp(you, OFFICE.lucia, LISTENING_PORT));
    const noInbound = simulate({ ...net, firewalls: [closedAfterRequest[0], hostFirewall('lucia', [], [])] }, tcp(you, OFFICE.lucia, LISTENING_PORT));
    expect([noOutbound.outcome, noInbound.outcome]).toEqual(['timeout', 'timeout']);
    expect(stagesOf(noOutbound).at(-1)).toBe('firewall-out');
    expect(stagesOf(noInbound).at(-1)).toBe('firewall-in');
  });

  it('the reply of a tcp connection to a server of the internet is never stopped by the firewall of the sender', () => {
    const { server } = OFFICE_FLOORS;
    const outToServer: Rule = { id: 'you-out', what: { kind: 'tcp', fromPort: APP_PORT, toPort: APP_PORT }, peer: { kind: 'cidr', cidr: `${server.ip}/32` } };
    const net = withDevice(serverServing(tcpService(APP_PORT)), 'your-laptop', { firewallIds: ['fw-you'] });
    const trace = simulate({ ...net, firewalls: [hostFirewall('you', [], [outToServer])] }, tcp(you, server.ip, APP_PORT));
    expect(trace.outcome).toBe('replied');
    expect(stagesOf(trace).filter((stage) => stage === 'firewall-in')).toEqual([]);
    expect(stagesOf(trace).at(-1)).toBe('reply');
  });
});
