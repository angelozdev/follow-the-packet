import { EMPTY_CACHE, type DnsCache } from '@/engine/dns/cache';
import { answerFrom } from '@/engine/dns/resolve';
import { openingOf, sourcePortOf, type SimContext, type Stage } from './context';
import { addressStage } from './stages/address';
import { createDnsStage } from './stages/dns';
import { firewallInStage } from './stages/firewall-in';
import { firewallOutStage } from './stages/firewall-out';
import { forwardStage } from './stages/forward';
import { hostStage } from './stages/host';
import { replyStage } from './stages/reply';
import { routeStage } from './stages/route';
import { LOOPBACK_IP, isLoopbackIpv4 } from '@/engine/network/addressing/cidr';
import type { NatTable } from '@/engine/nat/translation';
import { DEFAULT_TTL } from '@/engine/network/schema';
import type { Endpoint, Network, PacketSpec } from '@/engine/network/types';
import type { ExchangeMessage, Outcome, PacketHeader, PortPair, Trace } from './trace';

export const PIPELINE: Stage[] = [addressStage, createDnsStage(sendQuery), routeStage, firewallOutStage, forwardStage, firewallInStage, hostStage, replyStage];

function resolveSource(net: Network, from: Endpoint): SimContext['source'] {
  if (from.kind === 'device') {
    const device = net.devices.find((d) => d.id === from.id);
    if (!device) throw new Error(`unknown device ${from.id}`);
    return { endpoint: from, id: device.id, ip: device.privateIp, inside: true, device };
  }
  const found = net.actors.find((a) => a.id === from.id);
  if (!found) throw new Error(`unknown actor ${from.id}`);
  return { endpoint: from, id: found.id, ip: found.ip, inside: false };
}

const HOST_ONLY_RTT_MS = 0.05;
const COMES_BACK: ReadonlySet<Outcome> = new Set(['replied', 'refused', 'unreachable', 'ttl-exceeded']);

/** Returns the source IP a packet leaves with: the private IP of the sender, or `127.0.0.1` when a device sends to a loopback address, which never leaves it. */
function sourceIpOf(ctx: SimContext, destIp: string): string {
  return ctx.source.device && isLoopbackIpv4(destIp) ? LOOPBACK_IP : ctx.source.ip;
}

/** The ports a TCP or UDP packet leaves with: the source port it was given or `DEFAULT_SOURCE_PORT`, and the port it is for. ICMP has no ports. */
function portsOf(packet: PacketSpec): PortPair | undefined {
  const { protocol, port } = packet;
  return protocol === 'icmp' ? undefined : { sourcePort: sourcePortOf(packet), destinationPort: port! };
}

/** The header of the packet the sender put on the wire, in an office: its private IP as source (`127.0.0.1` for a packet to a loopback address), the resolved destination, the TTL it left with and, for TCP and UDP, its two ports. A packet that stopped at its sender (an address that is not valid, a name nobody resolved, no cable or no gateway) has none, and neither has a VPC. The reply is the request with source and destination swapped (RFC 792), the ports too, and only a packet that was answered has one. */
function headerOf(ctx: SimContext, outcome: Outcome): PacketHeader | undefined {
  if (ctx.net.kind !== 'office' || ctx.destIp === undefined || outcome === 'no-route') return undefined;
  const ports = portsOf(ctx.packet);
  const request = { source: sourceIpOf(ctx, ctx.destIp), destination: ctx.destIp, ttl: ctx.packet.ttl ?? DEFAULT_TTL, ...ports };
  const reply = { source: request.destination, destination: request.source, ...(ports && { sourcePort: ports.destinationPort, destinationPort: ports.sourcePort }) };
  return { request, ...(outcome === 'replied' && { reply }) };
}

/** What the two ends of a TCP or UDP packet said to each other, in an office, as far as the packet got. It exists where the header does, and only for TCP and UDP: a VPC, a packet that stopped at its sender and an ICMP message have none. */
function exchangeOf(ctx: SimContext, header: PacketHeader | undefined): ExchangeMessage[] | undefined {
  return header && ctx.exchange.length > 0 ? ctx.exchange : undefined;
}

/** The round trip time of an office, when something came back to the sender (a reply, a refusal or a warning): twice the sum of the legs the packet travelled, which stops at whoever answered or warned. A trip that never left the device (loopback, `localhost`, its own IP) takes a fixed, tiny time. A warning the sender generates itself has none: it comes only after the sender waited for someone to answer for that IP, and a ping prints no time for it. A Port Unreachable is not that kind of warning, because the host did receive the datagram and answered, so the one a device sends itself takes the same tiny time as any other trip that never left it. The times are illustrative, not measured. */
function roundTripMs(ctx: SimContext, outcome: Outcome): number | undefined {
  if (ctx.net.kind !== 'office' || !COMES_BACK.has(outcome)) return undefined;
  if (ctx.legsMs.length > 0) return 2 * ctx.legsMs.reduce((total, latencyMs) => total + latencyMs, 0);
  return ctx.notice && ctx.notice.kind !== 'port-unreachable' ? undefined : HOST_ONLY_RTT_MS;
}

function finish(ctx: SimContext, outcome: Outcome): Trace {
  const header = headerOf(ctx, outcome);
  const exchange = exchangeOf(ctx, header);
  const rttMs = roundTripMs(ctx, outcome);
  return {
    steps: ctx.steps,
    outcome,
    resolvedIp: ctx.destIp ?? null,
    destinationId: ctx.dest?.id ?? ctx.responder?.id ?? null,
    effectiveSource: ctx.effectiveSource ?? ctx.source.ip,
    tcpdump: ctx.tcpdump,
    ...(ctx.notice && { notice: ctx.notice }),
    ...(ctx.hops.length > 0 && { hops: ctx.hops }),
    ...(header && { header }),
    ...(exchange && { exchange }),
    ...(ctx.routes && { routes: ctx.routes }),
    ...(ctx.translation && { translation: ctx.translation }),
    ...(ctx.dns && { dns: ctx.dns }),
    ...(rttMs !== undefined && { rttMs }),
  };
}

/** What a send inherits from the sends before it and hands on to the next: the translation table of the NAT and what the resolvers remembered. */
export interface Carried {
  nat: NatTable;
  dnsCache: DnsCache;
}

/** The trace of a packet and what it leaves for the next send. */
export interface Run {
  trace: Trace;
  carried: Carried;
}

const NOTHING_CARRIED: Carried = { nat: [], dnsCache: EMPTY_CACHE };

/** The second of the game clock that a packet sent on its own leaves at. */
const GAME_START = 0;

/** Sends the question of a name lookup through the network as a packet of its own. It starts from what no send carried: the question is not one of the player's sends, so it neither uses up a source port nor leaves a row in the translation table of the sequence. */
function sendQuery(net: Network, packet: PacketSpec): Trace {
  return run(net, packet, NOTHING_CARRIED, GAME_START).trace;
}

/** Builds the run of a packet that has ended. A `dig` is the datagram to the resolver, so its answer is taken once the trip is over: if it came back replied from a resolver, the resolver answers the name from its cache or by asking, as for any lookup, and the trace gains `dns`; if it did not, the trace says `NO-RESOLVER` and is the trace of the datagram that failed, with the warning of whoever rejected it. */
function conclude(ctx: SimContext, outcome: Outcome): Run {
  const trace = finish(ctx, outcome);
  if (ctx.asking === undefined) return { trace, carried: { nat: ctx.nat, dnsCache: ctx.dnsCache } };
  const resolution = answerFrom(ctx.net, trace, ctx.asking, 'dig', { now: ctx.now, cache: ctx.dnsCache });
  return { trace: { ...trace, dns: resolution.dns }, carried: { nat: ctx.nat, dnsCache: resolution.answered ? resolution.cache : ctx.dnsCache } };
}

/** Runs the packet through every stage, starting from what the sends before it carried and measured against second `at` of the game clock, and returns its trace with what it carries on. The same network, packet, carried state and second always give the same result, and the state it receives is never changed. */
export function run(net: Network, packet: PacketSpec, carried: Carried, at: number): Run {
  const ctx: SimContext = { net, packet, source: resolveSource(net, packet.from), nat: carried.nat, dnsCache: carried.dnsCache, now: at, hops: [], legsMs: [], steps: [], tcpdump: [], exchange: openingOf(packet) };
  for (const stage of PIPELINE) {
    const result = stage(ctx);
    if (result.done) return conclude(ctx, result.outcome);
  }
  throw new Error('the simulation ended without an outcome');
}

/** Runs the packet through every stage and returns its trace; the same network and packet always give the same trace. It knows nothing of the sends before it, so a packet that leaves the office is translated against an empty table and a resolver answers from no cache but its own initial one, measured at second 0. */
export function simulate(net: Network, packet: PacketSpec): Trace {
  return run(net, packet, NOTHING_CARRIED, GAME_START).trace;
}
