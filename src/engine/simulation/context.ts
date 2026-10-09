import type { Device, Endpoint, Firewall, Network, PacketSpec } from '@/engine/network/types';
import type { Outcome, Step, TcpdumpLine } from './trace';

export interface SimContext {
  net: Network;
  packet: PacketSpec;
  source: { endpoint: Endpoint; id: string; ip: string; inside: boolean; device?: Device };
  destIp?: string;
  dest?: Device;
  path?: 'private' | 'public';
  effectiveSource?: string;
  steps: Step[];
  tcpdump: TcpdumpLine[];
}

export type StageResult = { done: false } | { done: true; outcome: Outcome };
export type Stage = (ctx: SimContext) => StageResult;

export const CONTINUE: StageResult = { done: false };
export const stop = (outcome: Outcome): StageResult => ({ done: true, outcome });

export function firewallsOf(net: Network, device: Device): Firewall[] {
  return device.firewallIds.flatMap((id) => net.firewalls.filter((f) => f.id === id));
}

export function describePacket(p: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): string {
  if (p.protocol === 'icmp') return p.icmpType === 8 ? 'ICMP echo request' : 'ICMP echo reply';
  return `${p.protocol.toUpperCase()} ${p.port}`;
}
