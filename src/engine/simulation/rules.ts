import { ipInCidr } from '@/engine/network/addressing/cidr';
import type { Firewall, PacketSpec, RulePeer, RuleWhat } from '@/engine/network/types';
import type { RuleCheck } from './trace';

type PacketKind = Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>;

export interface PeerContext {
  ip: string;
  firewallIds: string[];
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
  return peer.kind === 'cidr' ? ipInCidr(ctx.ip, peer.cidr) : ctx.firewallIds.includes(peer.sgId);
}

/** Checks a packet against every rule of the given firewalls; allowed when one rule matches both what and from. */
export function checkRules(
  firewalls: Firewall[],
  direction: 'inbound' | 'outbound',
  packet: PacketKind,
  ctx: PeerContext,
): { allowed: boolean; checks: RuleCheck[] } {
  const checks = firewalls.flatMap((firewall) =>
    firewall[direction].map((rule) => ({
      firewallId: firewall.id,
      ruleId: rule.id,
      what: matchesWhat(rule.what, packet),
      from: matchesPeer(rule.peer, ctx),
    })),
  );
  return { allowed: checks.some((c) => c.what && c.from), checks };
}
