import type { Device, Endpoint, Network, PacketSpec } from '@/engine/network/types';
import type { Notice, Outcome, Step, TcpdumpLine } from './trace';

/** What `route` leaves for `forward` to hand over: the IP to find in the sender's own LAN, which is the destination itself or, when the destination is in another LAN, the default gateway. */
export interface Delivery {
  ip: string;
  viaGateway: boolean;
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
  notice?: Notice;
  steps: Step[];
  tcpdump: TcpdumpLine[];
}

export type StageResult = { done: false } | { done: true; outcome: Outcome };
export type Stage = (ctx: SimContext) => StageResult;

export const CONTINUE: StageResult = { done: false };
export const stop = (outcome: Outcome): StageResult => ({ done: true, outcome });

export function describePacket(p: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): string {
  if (p.protocol === 'icmp') return p.icmpType === 8 ? 'ICMP echo request' : 'ICMP echo reply';
  return `${p.protocol.toUpperCase()} ${p.port}`;
}
