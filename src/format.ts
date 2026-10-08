import type { Endpoint, Network, Outcome, PacketSpec, Rule, RulePeer, RuleWhat } from './engine/types';
import type { Level } from './levels/schema';

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

export function findRule(net: Network, sgId: string, ruleId: string): Rule | undefined {
  const group = net.securityGroups.find((g) => g.id === sgId);
  return group ? [...group.inbound, ...group.outbound].find((r) => r.id === ruleId) : undefined;
}

export function formatSolution(level: Level): string {
  const net = level.network;
  const sgName = (id: string) => net.securityGroups.find((g) => g.id === id)?.name ?? id;
  const instanceName = (id: string) => net.instances.find((i) => i.id === id)?.name ?? id;
  if (level.solution.kind === 'attacker') return `Lanzar ${formatPacket(level.solution.packet, net)}.`;
  return level.solution.actions
    .map((a) => {
      switch (a.type) {
        case 'addRule':
          return `Agregar en el SG ${sgName(a.sgId)}: ${formatWhat(a.rule.what)} desde ${formatPeer(a.rule.peer, net)}.`;
        case 'removeRule': {
          const rule = findRule(net, a.sgId, a.ruleId);
          return `Borrar del SG ${sgName(a.sgId)} la regla ${rule ? `${formatWhat(rule.what)} desde ${formatPeer(rule.peer, net)}` : a.ruleId}.`;
        }
        case 'setAppTarget':
          return `Apuntar la app de ${instanceName(a.instanceId)} a ${a.target}.`;
        case 'setIgnoreIcmpEcho':
          return `Linux de ${instanceName(a.instanceId)}: ${a.value ? 'ignorar' : 'contestar'} los ping.`;
      }
    })
    .join(' ');
}

export const OUTCOME_TEXT: Record<Outcome, string> = {
  replied: 'Respondió.',
  timeout: 'Timeout: nadie contestó.',
  refused: 'Connection refused: llegó, pero nada escuchaba.',
  'arrived-no-reply': 'Llegó, pero nadie respondió.',
  unresolved: 'El nombre no se pudo resolver.',
};
