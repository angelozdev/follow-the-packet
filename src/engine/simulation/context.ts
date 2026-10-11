import type { NatTable, Translation } from '@/engine/nat/translation';
import type { RouteDecision } from '@/engine/network/addressing/routing-table';
import { DEFAULT_SOURCE_PORT } from '@/engine/network/schema';
import type { Device, Endpoint, Network, PacketSpec, Service } from '@/engine/network/types';
import type { ExchangeKind, ExchangeMessage, Hop, Notice, Outcome, Reason, Step, TcpdumpLine } from './trace';

/** What `route` leaves for `forward` to hand over: the IP to find in the sender's own LAN, which is the destination itself or, when the destination is in another LAN, the default gateway. */
export interface Delivery {
  ip: string;
  viaGateway: boolean;
}

/** What answers a packet that reached no device of the network: a router at one of its own interfaces, or a server of the internet, which brings the `services` it listens with. */
export interface Responder {
  id: string;
  ip: string;
  replies: Reason;
  services?: Service[];
}

/** Whoever the packet reached at the end of its road, and how it answers: a device with its services, or a responder with the services of its actor (a server of the internet) or none (a router). */
export interface Receiver extends Responder {
  host: Device['host'];
  device?: Device;
}

export interface SimContext {
  net: Network;
  packet: PacketSpec;
  source: { endpoint: Endpoint; id: string; ip: string; inside: boolean; device?: Device };
  destIp?: string;
  dest?: Device;
  path?: 'private' | 'public' | 'self';
  delivery?: Delivery;
  effectiveSource?: string;
  responder?: Responder;
  notice?: Notice;
  routes?: RouteDecision[];
  nat: NatTable;
  translation?: Translation;
  hops: Hop[];
  legsMs: number[];
  steps: Step[];
  tcpdump: TcpdumpLine[];
  exchange: ExchangeMessage[];
}

export type StageResult = { done: false } | { done: true; outcome: Outcome };
export type Stage = (ctx: SimContext) => StageResult;

/** Returns who the packet reached after the forward stage: the device, or else the router or server that answers for itself. */
export function receiverOf(ctx: SimContext): Receiver {
  const { dest, responder } = ctx;
  if (dest) return { id: dest.id, ip: dest.privateIp, replies: { code: 'host-replies', deviceId: dest.id }, host: dest.host, device: dest };
  return { ...responder!, host: { ignoreIcmpEcho: false, services: responder!.services ?? [] } };
}

/** Records a tcpdump line at the receiver when it is a device: the player can read a device's tcpdump, not a router's or a server's. */
export function logAt(ctx: SimContext, receiver: Receiver, direction: TcpdumpLine['direction'], src: string, dst: string, summary: string): void {
  if (receiver.device) ctx.tcpdump.push({ deviceId: receiver.id, direction, src, dst, summary });
}

/** The source port a TCP or UDP packet leaves from: the one it was given or `DEFAULT_SOURCE_PORT`. An ICMP message has no ports. */
export function sourcePortOf({ sourcePort }: Pick<PacketSpec, 'sourcePort'>): number {
  return sourcePort ?? DEFAULT_SOURCE_PORT;
}

/** Records the route a holder picked to carry the packet on. */
export function recordRoute(ctx: SimContext, decision: RouteDecision): void {
  ctx.routes = [...(ctx.routes ?? []), decision];
}

/** Records the latency of one more leg the packet travelled (a LAN, a router or a server). The round trip time adds them up, so nothing past the one who answered or warned is ever recorded. */
export function addLeg(ctx: SimContext, latencyMs: number): void {
  ctx.legsMs.push(latencyMs);
}

type Transport = Exclude<PacketSpec['protocol'], 'icmp'>;

const SPEAKER: Record<ExchangeKind, ExchangeMessage['from']> = { SYN: 'client', 'SYN-ACK': 'server', ACK: 'client', RST: 'server', query: 'client', response: 'server' };
const OPENING: Record<Transport, ExchangeKind> = { tcp: 'SYN', udp: 'query' };
const ANSWER: Record<Transport, ExchangeKind[]> = { tcp: ['SYN-ACK', 'ACK'], udp: ['response'] };

function messageOf(kind: ExchangeKind): ExchangeMessage {
  return { from: SPEAKER[kind], kind };
}

/** What the sender of a packet says first: the SYN of a TCP connection or the query of a UDP datagram. ICMP is not an exchange of this kind and says nothing. */
export function openingOf({ protocol }: Pick<PacketSpec, 'protocol'>): ExchangeMessage[] {
  return protocol === 'icmp' ? [] : [messageOf(OPENING[protocol])];
}

/** Records that the server refused the connection: it answers the SYN with an RST. */
export function sayRefusal(ctx: SimContext): void {
  ctx.exchange.push(messageOf('RST'));
}

/** Records the answer that came back to the sender of a TCP or UDP packet: a connection is accepted with a SYN-ACK and completed with the client's ACK, and a datagram is answered with a response. ICMP has none of this. */
export function sayAnswer(ctx: SimContext): void {
  const { protocol } = ctx.packet;
  if (protocol !== 'icmp') ctx.exchange.push(...ANSWER[protocol].map(messageOf));
}

export const CONTINUE: StageResult = { done: false };
export const stop = (outcome: Outcome): StageResult => ({ done: true, outcome });

export function describePacket(p: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): string {
  if (p.protocol === 'icmp') return p.icmpType === 8 ? 'ICMP echo request' : 'ICMP echo reply';
  return `${p.protocol.toUpperCase()} ${p.port}`;
}
