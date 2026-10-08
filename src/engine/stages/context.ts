import type { Endpoint, Instance, Network, Outcome, PacketSpec, SecurityGroup, Step, TcpdumpLine } from '../types';

export interface SimContext {
  net: Network;
  packet: PacketSpec;
  source: { endpoint: Endpoint; id: string; ip: string; inside: boolean; instance?: Instance };
  destIp?: string;
  dest?: Instance;
  path?: 'private' | 'public';
  effectiveSource?: string;
  steps: Step[];
  tcpdump: TcpdumpLine[];
}

export type StageResult = { done: false } | { done: true; outcome: Outcome };
/** Una etapa lee y amplía el contexto; simulate() crea un contexto nuevo en cada llamada. */
export type Stage = (ctx: SimContext) => StageResult;

export const CONTINUE: StageResult = { done: false };
export const stop = (outcome: Outcome): StageResult => ({ done: true, outcome });

export function groupsOf(net: Network, instance: Instance): SecurityGroup[] {
  return instance.sgIds.flatMap((id) => net.securityGroups.filter((g) => g.id === id));
}

export function describePacket(p: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): string {
  if (p.protocol === 'icmp') return p.icmpType === 8 ? 'ICMP echo request' : 'ICMP echo reply';
  return `${p.protocol.toUpperCase()} ${p.port}`;
}
