import type { Endpoint, Network, Outcome, PacketSpec, Trace } from '@/engine';
import type { TermText } from './term-text';

const INTERNET_NAME = 'Internet';

export function deviceName(net: Network, deviceId: string): string {
  return net.devices.find((d) => d.id === deviceId)?.name ?? deviceId;
}

export function endpointName(endpoint: Endpoint, net: Network): string {
  if (endpoint.kind === 'device') return deviceName(net, endpoint.id);
  return net.actors.find((a) => a.id === endpoint.id)?.name ?? INTERNET_NAME;
}

/** Names what a packet carries, with its term tagged. */
export function serviceLabel(packet: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): TermText {
  if (packet.protocol === 'icmp') return packet.icmpType === 8 ? '{{ping}}' : '{{echo-reply}}';
  return `${packet.protocol.toUpperCase()} ${packet.port}`;
}

/** Describes a packet as what, from whom and to whom, naming the device the trace reached or else the address it was sent to. */
export function packetLabel(packet: PacketSpec, trace: Trace, net: Network): TermText {
  const to = trace.destinationId ? deviceName(net, trace.destinationId) : packet.to;
  return `${serviceLabel(packet)} de ${endpointName(packet.from, net)} a ${to}`;
}

export const OUTCOME_TEXT: Record<Outcome, TermText> = {
  replied: 'Llegó y volvió la respuesta.',
  timeout: 'No llegó: no volvió ninguna respuesta.',
  refused: 'Llegó, pero ningún programa lo estaba esperando.',
  'arrived-no-reply': 'Llegó, pero nadie contestó.',
  unresolved: 'No salió: el nombre no se pudo convertir en una IP.',
  lost: 'Se perdió: no llegó a ningún dispositivo.',
};
