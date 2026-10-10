import type { Device, Endpoint, Network, PacketSpec } from '@/engine/network/types';
import type { Hop, Notice, Outcome, Reason, Step, TcpdumpLine } from './trace';

/** What `route` leaves for `forward` to hand over: the IP to find in the sender's own LAN, which is the destination itself or, when the destination is in another LAN, the default gateway. */
export interface Delivery {
  ip: string;
  viaGateway: boolean;
}

/** What answers a packet that reached no device of the network: a router at one of its own interfaces, or a server of the internet. */
export interface Responder {
  id: string;
  ip: string;
  replies: Reason;
}

/** Whoever the packet reached at the end of its road, and how it answers: a device with its programs, or a responder with none. */
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
  hops: Hop[];
  steps: Step[];
  tcpdump: TcpdumpLine[];
}

export type StageResult = { done: false } | { done: true; outcome: Outcome };
export type Stage = (ctx: SimContext) => StageResult;

const WITHOUT_PROGRAMS: Device['host'] = { ignoreIcmpEcho: false, listeningTcpPorts: [] };

/** Returns who the packet reached after the forward stage: the device, or else the router or server that answers for itself. */
export function receiverOf(ctx: SimContext): Receiver {
  const { dest, responder } = ctx;
  if (dest) return { id: dest.id, ip: dest.privateIp, replies: { code: 'host-replies', deviceId: dest.id }, host: dest.host, device: dest };
  return { ...responder!, host: WITHOUT_PROGRAMS };
}

/** Records a tcpdump line at the receiver when it is a device: the player can read a device's tcpdump, not a router's or a server's. */
export function logAt(ctx: SimContext, receiver: Receiver, direction: TcpdumpLine['direction'], src: string, dst: string, summary: string): void {
  if (receiver.device) ctx.tcpdump.push({ deviceId: receiver.id, direction, src, dst, summary });
}

export const CONTINUE: StageResult = { done: false };
export const stop = (outcome: Outcome): StageResult => ({ done: true, outcome });

export function describePacket(p: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): string {
  if (p.protocol === 'icmp') return p.icmpType === 8 ? 'ICMP echo request' : 'ICMP echo reply';
  return `${p.protocol.toUpperCase()} ${p.port}`;
}
