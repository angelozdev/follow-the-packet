import { openingOf, type SimContext, type Stage } from './context';
import { addressStage } from './stages/address';
import { dnsStage } from './stages/dns';
import { firewallInStage } from './stages/firewall-in';
import { firewallOutStage } from './stages/firewall-out';
import { forwardStage } from './stages/forward';
import { hostStage } from './stages/host';
import { replyStage } from './stages/reply';
import { routeStage } from './stages/route';
import { LOOPBACK_IP, isLoopbackIpv4 } from '@/engine/network/addressing/cidr';
import { DEFAULT_SOURCE_PORT, DEFAULT_TTL } from '@/engine/network/schema';
import type { Endpoint, Network, PacketSpec } from '@/engine/network/types';
import type { ExchangeMessage, Outcome, PacketHeader, PortPair, Trace } from './trace';

export const PIPELINE: Stage[] = [addressStage, dnsStage, routeStage, firewallOutStage, forwardStage, firewallInStage, hostStage, replyStage];

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
function portsOf({ protocol, port, sourcePort }: PacketSpec): PortPair | undefined {
  return protocol === 'icmp' ? undefined : { sourcePort: sourcePort ?? DEFAULT_SOURCE_PORT, destinationPort: port! };
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
    ...(rttMs !== undefined && { rttMs }),
  };
}

/** Runs the packet through every stage and returns its trace; the same network and packet always give the same trace. */
export function simulate(net: Network, packet: PacketSpec): Trace {
  const ctx: SimContext = { net, packet, source: resolveSource(net, packet.from), hops: [], legsMs: [], steps: [], tcpdump: [], exchange: openingOf(packet) };
  for (const stage of PIPELINE) {
    const result = stage(ctx);
    if (result.done) return finish(ctx, result.outcome);
  }
  throw new Error('the simulation ended without an outcome');
}
