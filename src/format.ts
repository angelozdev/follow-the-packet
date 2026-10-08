import type { Endpoint, Network, Outcome, PacketSpec, RulePeer, RuleWhat } from './engine/types';

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

export function endpointName(e: Endpoint, net: Network): string {
  if (e.kind === 'instance') return net.instances.find((i) => i.id === e.id)?.name ?? e.id;
  return net.actors.find((a) => a.id === e.id)?.name ?? 'Internet';
}

export function formatPacket(p: PacketSpec, net: Network): string {
  const service = p.protocol === 'icmp' ? (p.icmpType === 8 ? 'ping' : 'ICMP Echo Reply') : `${p.protocol.toUpperCase()} ${p.port}`;
  const to = p.to === '@appTarget' ? 'el destino de su app' : p.to;
  return `${service} de ${endpointName(p.from, net)} a ${to}`;
}

export const OUTCOME_TEXT: Record<Outcome, string> = {
  replied: 'Respondió.',
  timeout: 'Timeout: nadie contestó.',
  refused: 'Connection refused: llegó, pero nada escuchaba.',
  'arrived-no-reply': 'Llegó, pero nadie respondió.',
  unresolved: 'El nombre no se pudo resolver.',
};
