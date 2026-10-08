import { ipInCidr } from '@/engine/network/cidr';
import type { PacketSpec, RulePeer, RuleWhat, SecurityGroup } from '@/engine/network/types';
import type { RuleCheck } from './trace';

type PacketKind = Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>;

export interface PeerContext {
  /** IP que ve la regla (origen en entrada, destino en salida). */
  ip: string;
  /** SGs del otro extremo; vacío si el paquete no viaja por IP privada dentro de la VPC. */
  sgIds: string[];
}

export function matchesWhat(what: RuleWhat, packet: PacketKind): boolean {
  switch (what.kind) {
    case 'all':
      return true;
    case 'tcp':
    case 'udp':
      return packet.protocol === what.kind && packet.port !== undefined && packet.port >= what.fromPort && packet.port <= what.toPort;
    case 'icmp':
      return packet.protocol === 'icmp' && (what.icmpType === 'all' || what.icmpType === packet.icmpType);
  }
}

export function matchesPeer(peer: RulePeer, ctx: PeerContext): boolean {
  return peer.kind === 'cidr' ? ipInCidr(ctx.ip, peer.cidr) : ctx.sgIds.includes(peer.sgId);
}

/** Un SG solo permite: pasa si alguna regla de alguno de los SGs coincide en qué y desde dónde a la vez. */
export function checkRules(
  groups: SecurityGroup[],
  direction: 'inbound' | 'outbound',
  packet: PacketKind,
  ctx: PeerContext,
): { allowed: boolean; checks: RuleCheck[] } {
  const checks = groups.flatMap((group) =>
    group[direction].map((rule) => ({
      sgId: group.id,
      ruleId: rule.id,
      what: matchesWhat(rule.what, packet),
      from: matchesPeer(rule.peer, ctx),
    })),
  );
  return { allowed: checks.some((c) => c.what && c.from), checks };
}
