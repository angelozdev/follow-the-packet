import type { Endpoint, Network, Outcome, PacketSpec, Trace } from '@/engine';
import { nameTag, type TermText } from './term-text';
import type { PacketMessage } from './terms';

const INTERNET_NAME = 'Internet';

/** Returns the name of a device, marked as a name; an id that names no device stands for its name. */
export function deviceName(net: Network, deviceId: string): TermText {
  return nameTag(net.devices.find((d) => d.id === deviceId)?.name ?? deviceId);
}

/** Returns the name of the device or the actor a packet comes from, marked as a name; the internet probe that is not on the map is plain "Internet". */
export function endpointName(endpoint: Endpoint, net: Network): TermText {
  if (endpoint.kind === 'device') return deviceName(net, endpoint.id);
  const actor = net.actors.find((a) => a.id === endpoint.id);
  return actor ? nameTag(actor.name) : INTERNET_NAME;
}

/** Names what a packet carries, with its term tagged. */
export function serviceLabel(packet: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>): TermText {
  if (packet.protocol === 'icmp') return packet.icmpType === 8 ? '{{ping}}' : '{{echo-reply}}';
  return `${packet.protocol.toUpperCase()} ${packet.port}`;
}

/** Returns the message a packet is drawn as: an Echo Reply answers, and every other packet (an Echo Request, or TCP and UDP, which no flow sends yet) asks. */
export function packetMessage(packet: Pick<PacketSpec, 'protocol' | 'icmpType'>): PacketMessage {
  return packet.protocol === 'icmp' && packet.icmpType === 0 ? 'echo-reply' : 'echo-request';
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
