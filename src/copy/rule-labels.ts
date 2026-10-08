import type { Network, RulePeer, RuleWhat } from '@/engine';

export function formatWhat(what: RuleWhat): string {
  switch (what.kind) {
    case 'all':
      return 'Todo el tráfico';
    case 'tcp':
    case 'udp':
      return `${what.kind.toUpperCase()} ${what.fromPort === what.toPort ? what.fromPort : `${what.fromPort}-${what.toPort}`}`;
    case 'icmp':
      return what.icmpType === 'all' ? 'ICMP · todos los tipos' : what.icmpType === 8 ? 'ICMP · Echo Request' : 'ICMP · Echo Reply';
  }
}

export function formatPeer(peer: RulePeer, net: Network): string {
  if (peer.kind === 'cidr') return peer.cidr;
  return `SG ${net.securityGroups.find((g) => g.id === peer.sgId)?.name ?? peer.sgId}`;
}
