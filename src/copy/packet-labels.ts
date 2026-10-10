import type { Endpoint, Network, Notice, Outcome, PacketSpec, Trace } from '@/engine';
import { nameTag, word, type TermText } from './term-text';
import type { PacketMessage, TermId } from './terms';

const INTERNET_NAME = 'Internet';
const SIGNIFICANT_DIGITS = 12;

/** Returns the name of a device, a router or a server of the internet, marked as a name; an id that names none of them stands for its name. */
export function deviceName(net: Network, deviceId: string): TermText {
  const named = [...net.devices, ...(net.routers ?? []), ...net.actors.filter((actor) => actor.kind === 'server')].find((node) => node.id === deviceId);
  return nameTag(named?.name ?? deviceId);
}

/** Returns the name of the device or the actor a packet comes from, marked as a name; the internet probe that is not on the map is plain "Internet". */
export function endpointName(endpoint: Endpoint, net: Network): TermText {
  if (endpoint.kind === 'device') return deviceName(net, endpoint.id);
  const actor = net.actors.find((a) => a.id === endpoint.id);
  return actor ? nameTag(actor.name) : INTERNET_NAME;
}

/** Writes a round trip time as the player reads it: the figure the engine gave, in milliseconds, with the decimal comma. Adding decimals leaves the noise of floating point (0.1 + 0.2), which keeping 12 significant digits drops; no figure of the engine is rounded. */
export function roundTripText(ms: number): string {
  return `${String(Number(ms.toPrecision(SIGNIFICANT_DIGITS))).replace('.', ',')} ms`;
}

/** Names what a packet carries, with its term tagged: ping for an Echo Request and Echo Reply for a reply, or just packet while the player does not know the term of its message yet (with no `known` given, every term is known). */
export function serviceLabel(packet: Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>, known?: ReadonlySet<TermId>): TermText {
  if (packet.protocol !== 'icmp') return `${packet.protocol.toUpperCase()} ${packet.port}`;
  const message: TermId = packet.icmpType === 8 ? 'ping' : 'echo-reply';
  return known === undefined || known.has(message) ? `{{${message}}}` : '{{packet}}';
}

/** Returns the message a packet is drawn as: an Echo Reply answers, and every other packet (an Echo Request, or TCP and UDP, which no flow sends yet) asks. */
export function packetMessage(packet: Pick<PacketSpec, 'protocol' | 'icmpType'>): PacketMessage {
  return packet.protocol === 'icmp' && packet.icmpType === 0 ? 'echo-reply' : 'echo-request';
}

/** Names an ICMP message by its protocol and its type, with both terms tagged. */
export function messageLabel(message: PacketMessage): TermText {
  return `{{icmp}} · {{${message}}}`;
}

function destinationName(packet: PacketSpec, trace: Trace, net: Network): TermText {
  const staysAtSender = packet.from.kind === 'device' && trace.destinationId === packet.from.id;
  return trace.destinationId && !staysAtSender ? deviceName(net, trace.destinationId) : packet.to;
}

/** Describes a packet as what, from whom and to whom, naming the device the trace reached or else the address it was sent to; what it is called follows what the player knows (`serviceLabel`). A packet that never left its sender (to `127.0.0.1`, `localhost` or its own IP) names the address as it was written, so these packets are told apart. */
export function packetLabel(packet: PacketSpec, trace: Trace, net: Network, known?: ReadonlySet<TermId>): TermText {
  return `${serviceLabel(packet, known)} de ${endpointName(packet.from, net)} a ${destinationName(packet, trace, net)}`;
}

/** Describes a traceroute the way `packetLabel` describes a packet, as what, from whom and to whom: it is called traceroute (and packet while that term is unknown), whatever probe it ended with. */
export function tracerouteLabel(packet: PacketSpec, trace: Trace, net: Network, known?: ReadonlySet<TermId>): TermText {
  const service = known === undefined || known.has('traceroute') ? '{{traceroute}}' : '{{packet}}';
  return `${service} de ${endpointName(packet.from, net)} a ${destinationName(packet, trace, net)}`;
}

export type StampState = 'arrived' | 'blocked' | 'lost' | 'intruder' | 'warned';

const STAMP_TEXT: Record<StampState, string> = { arrived: 'Llegó.', blocked: 'Bloqueado.', lost: 'Perdido.', intruder: 'Entró sin permiso.', warned: 'Apareció un aviso.' };

export type WarnedBy = 'router' | 'sender';
export type WarningTerm = Extract<TermId, 'host-unreachable' | 'time-exceeded'>;

/** A warning that reached the sender of a packet: the term that names it and who generated it. */
export interface Warning {
  term: WarningTerm;
  by: WarnedBy;
}

const WARNING_TERM: Record<Notice['kind'], WarningTerm> = { 'host-unreachable': 'host-unreachable', 'net-unreachable': 'host-unreachable', 'time-exceeded': 'time-exceeded' };

/** Returns the warning that a notice of the trace stands for: named by Destination Host Unreachable (a net unreachable shares the ICMP type 3, and the game has one term for both) or by Time Exceeded, and generated by a router or by the sender's own device. The sender's own device warns without the packet leaving it, so nothing comes back from anywhere. */
export function warningOf(notice: Notice, packet: Pick<PacketSpec, 'from'>): Warning {
  const own = packet.from.kind === 'device' && notice.fromId === packet.from.id;
  return { term: WARNING_TERM[notice.kind], by: own ? 'sender' : 'router' };
}

/** Names a stamp for a screen reader: the packet it stands for and how it ended, since its mark is only drawn. */
export function stampLabel(packet: string, state: StampState): string {
  return `Paquete: ${packet}. ${STAMP_TEXT[state]}`;
}

function ttlExceededText(dropped: TermText): TermText {
  return `No llegó: el {{ttl}} llegó a 0 en un {{router}}, que lo ${dropped} y avisó con {{time-exceeded}}.`;
}

export const OUTCOME_TEXT: Record<Outcome, TermText> = {
  replied: 'Llegó y volvió la respuesta.',
  timeout: '{{timeout}}: pasó el tiempo de espera y no volvió nada.',
  refused: 'Llegó, pero ningún programa lo estaba esperando.',
  'arrived-no-reply': 'Llegó, pero nadie contestó.',
  unresolved: 'No salió: el nombre no se pudo convertir en una IP.',
  'invalid-address': 'No salió del dispositivo: la dirección no es una {{ipv4}} válida.',
  'no-route': 'No salió del dispositivo: no tiene por dónde sacar el paquete.',
  unreachable: 'No llegó. Apareció un aviso: no se pudo llegar al destino.',
  'ttl-exceeded': ttlExceededText('{{drop|descartó}}'),
  lost: 'Se perdió: no llegó a ningún dispositivo.',
};

export const NOT_DELIVERED: TermText = 'No llegó a su destino.';

const UNKNOWN_OUTCOME: Partial<Record<Outcome, { term: TermId; text: (destination?: TermText) => TermText }>> = {
  replied: { term: 'echo-reply', text: (destination) => (destination === undefined ? 'Llegó.' : `Llegó a ${destination}.`) },
  timeout: { term: 'timeout', text: () => 'Pasó el tiempo de espera y no volvió nada.' },
  unreachable: { term: 'host-unreachable', text: () => NOT_DELIVERED },
  'ttl-exceeded': { term: 'time-exceeded', text: () => NOT_DELIVERED },
};

/** Returns the text of an outcome with what the player knows: while the message that came back has no known term, it says only that the packet arrived (and, when `destination` is given, where) or that it did not reach its destination, and never that nothing came back, since a warning did. While the term timeout is unknown, the silence is told without the term, and a router that drops the packet at TTL 0 is told as one that discarded it until the term drop is known. */
export function describeOutcome(outcome: Outcome, known: ReadonlySet<TermId>, destination?: TermText): TermText {
  const hidden = UNKNOWN_OUTCOME[outcome];
  if (hidden && !known.has(hidden.term)) return hidden.text(destination);
  return outcome === 'ttl-exceeded' ? ttlExceededText(word(known, 'drop', 'descartó')) : OUTCOME_TEXT[outcome];
}
