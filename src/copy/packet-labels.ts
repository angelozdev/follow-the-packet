import { APP_TARGET, type Endpoint, type Network, type Outcome, type PacketSpec } from '@/engine';

export function endpointName(e: Endpoint, net: Network): string {
  if (e.kind === 'instance') return net.instances.find((i) => i.id === e.id)?.name ?? e.id;
  return net.actors.find((a) => a.id === e.id)?.name ?? 'Internet';
}

export function formatPacket(p: PacketSpec, net: Network): string {
  const service = p.protocol === 'icmp' ? (p.icmpType === 8 ? 'ping' : 'ICMP Echo Reply') : `${p.protocol.toUpperCase()} ${p.port}`;
  const to = p.to === APP_TARGET ? 'el destino de su app' : p.to;
  return `${service} de ${endpointName(p.from, net)} a ${to}`;
}

export const OUTCOME_TEXT: Record<Outcome, string> = {
  replied: 'Respondió.',
  timeout: 'Timeout: nadie contestó.',
  refused: 'Connection refused: llegó, pero nada escuchaba.',
  'arrived-no-reply': 'Llegó, pero nadie respondió.',
  unresolved: 'El nombre no se pudo resolver.',
};
