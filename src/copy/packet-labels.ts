import { stopStep, type Endpoint, type Network, type Notice, type Outcome, type PacketSpec, type Trace } from '@/engine';
import { nameTag, word, type TermText } from './term-text';
import type { PacketMessage, PacketShape, TermId } from './terms';

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

const ASKS: Record<PacketSpec['protocol'], PacketShape> = { icmp: 'echo-request', tcp: 'tcp-request', udp: 'udp-request' };
const ANSWER: Record<PacketShape, PacketShape> = {
  'echo-request': 'echo-reply',
  'echo-reply': 'echo-reply',
  'tcp-request': 'tcp-reply',
  'tcp-reply': 'tcp-reply',
  'udp-request': 'udp-reply',
  'udp-reply': 'udp-reply',
} satisfies Record<PacketShape, PacketShape>;

/** Returns the shape a packet is drawn with: the one of its protocol, which asks (an Echo Reply, which answers, is the only packet a flow can send that does not). The map and the box of a packet draw this; `packetMessage` stays the ICMP message that names its term. */
export function packetShape(packet: Pick<PacketSpec, 'protocol' | 'icmpType'>): PacketShape {
  return packet.protocol === 'icmp' && packet.icmpType === 0 ? 'echo-reply' : ASKS[packet.protocol];
}

/** Returns the shape of the answer to a packet drawn with this shape: the ring of its own protocol. A packet that already answers has the same one, since nobody answers an answer. */
export function replyShape(shape: PacketShape): PacketShape {
  return ANSWER[shape];
}

/** Names an ICMP message by its protocol and its type, with both terms tagged. */
export function messageLabel(message: PacketMessage): TermText {
  return `{{icmp}} · {{${message}}}`;
}

function destinationName(packet: PacketSpec, trace: Trace, net: Network): TermText {
  const staysAtSender = packet.from.kind === 'device' && trace.destinationId === packet.from.id;
  return trace.destinationId && !staysAtSender ? deviceName(net, trace.destinationId) : packet.to;
}

/** The label of a packet that carries ports: its protocol and its ports as the trace shows them, each part once its term is known. The protocol is TCP or UDP once that term is known, and `packet` before, with the port it goes to when `port` is known; the source port comes with `source-port`: «TCP 51514 → 80». With no `known`, every term is known. */
function transportLabel(protocol: 'tcp' | 'udp', ports: { source: number; destination: number }, known?: ReadonlySet<TermId>): TermText {
  const knows = (term: TermId): boolean => known === undefined || known.has(term);
  const destination = knows('port') ? ports.destination : null;
  if (!knows(protocol)) return destination === null ? '{{packet}}' : `{{packet}} al {{port|puerto}} ${destination}`;
  if (destination === null) return `{{${protocol}}}`;
  return `{{${protocol}}} ${knows('source-port') ? `${ports.source} → ` : ''}${destination}`;
}

function packetService(packet: PacketSpec, trace: Trace, known: ReadonlySet<TermId> | undefined): TermText {
  const request = trace.header?.request;
  if (packet.protocol === 'icmp' || request?.sourcePort === undefined || request.destinationPort === undefined) return serviceLabel(packet, known);
  return transportLabel(packet.protocol, { source: request.sourcePort, destination: request.destinationPort }, known);
}

/** Describes a packet as what, from whom and to whom, naming the device the trace reached or else the address it was sent to; what it is called follows what the player knows (`serviceLabel`). A TCP or UDP packet of an office also names its ports, as it leaves its sender (`transportLabel`); one of a VPC has no ports in its trace and keeps `TCP 22`. A packet that never left its sender (to `127.0.0.1`, `localhost` or its own IP) names the address as it was written, so these packets are told apart. */
export function packetLabel(packet: PacketSpec, trace: Trace, net: Network, known?: ReadonlySet<TermId>): TermText {
  return `${packetService(packet, trace, known)} de ${endpointName(packet.from, net)} a ${destinationName(packet, trace, net)}`;
}

/** The label a packet carries along one leg of its path: its protocol and ports as it asks, and as its answer comes back, with the ports swapped. */
export interface PortLabels {
  request: TermText;
  reply: TermText;
}

/** What a packet with ports wears on the map: its labels leg by leg, and, when it has two, the router at which it changes from the first to the second (the one that translates its ports). */
export interface PacketPorts {
  legs: PortLabels[];
  changesAt?: string;
}

interface Ports {
  source: number;
  destination: number;
}

function legLabels(protocol: 'tcp' | 'udp', ports: Ports, known: ReadonlySet<TermId> | undefined): PortLabels {
  const request = transportLabel(protocol, ports, known);
  const knowsSource = known === undefined || known.has('source-port');
  return { request, reply: knowsSource ? transportLabel(protocol, { source: ports.destination, destination: ports.source }, known) : request };
}

function translatedPorts(packet: PacketSpec, trace: Trace, ports: Ports): Ports | undefined {
  const { translation } = trace;
  if (!translation) return undefined;
  if (packet.from.kind === 'device') return translation.outside.port === undefined ? undefined : { ...ports, source: translation.outside.port };
  return translation.inside.port === undefined ? undefined : { ...ports, destination: translation.inside.port };
}

/** Returns the labels that a TCP or UDP packet wears along its path, in the order its request travels it: one for the leg where it left, and a second for the leg after the router that translated it, when the NAT changed a port and the label says so. The packet of an office device leaves with its own source port and goes on with the public one; a packet from outside is for the public port of the router and goes on, inside, for the port of the device. The answer wears the same legs with the ports swapped. Null for a packet with no ports (an ICMP message, or a packet of a VPC, whose trace has none), so the map draws no label for it. A packet that never left its sender (to `127.0.0.1` or to its own IP) has ports, so it gets the labels of one leg. Each part waits for its term, as `packetLabel` does; with no `known`, every term is known. */
export function packetPortLabels(packet: PacketSpec, trace: Trace, known?: ReadonlySet<TermId>): PortLabels[] | null {
  const request = trace.header?.request;
  if (packet.protocol === 'icmp' || request?.sourcePort === undefined || request.destinationPort === undefined) return null;
  const ports = { source: request.sourcePort, destination: request.destinationPort };
  const first = legLabels(packet.protocol, ports, known);
  const changed = translatedPorts(packet, trace, ports);
  const second = changed && legLabels(packet.protocol, changed, known);
  return second && (second.request !== first.request || second.reply !== first.reply) ? [first, second] : [first];
}

/** Describes a traceroute the way `packetLabel` describes a packet, as what, from whom and to whom: it is called traceroute (and packet while that term is unknown), whatever probe it ended with. */
export function tracerouteLabel(packet: PacketSpec, trace: Trace, net: Network, known?: ReadonlySet<TermId>): TermText {
  const service = known === undefined || known.has('traceroute') ? '{{traceroute}}' : '{{packet}}';
  return `${service} de ${endpointName(packet.from, net)} a ${destinationName(packet, trace, net)}`;
}

export type StampState = 'arrived' | 'blocked' | 'lost' | 'intruder' | 'warned';

export const STAMP_TEXT: Record<StampState, string> = { arrived: 'Llegó.', blocked: 'Bloqueado.', lost: 'Perdido.', intruder: 'Entró y no debía.', warned: 'Apareció un aviso.' };

export type WarnedBy = 'router' | 'host' | 'sender';
export type WarningTerm = Extract<TermId, 'host-unreachable' | 'net-unreachable' | 'time-exceeded' | 'port-unreachable'>;
export const FIRST_WARNING_TERM: WarningTerm = 'host-unreachable';

/** A warning that reached the sender of a packet: the term that names it, or null when no term the player knows names it yet, and who generated it. `host` is the equipment the datagram was addressed to (a device, a server of the internet or a router answering for itself), which returns Port Unreachable and is no router of the road; `sender` is the sender's own device. */
export interface Warning {
  term: WarningTerm | null;
  by: WarnedBy;
}

const WARNING_TERM: Record<Notice['kind'], WarningTerm | null> = {
  'host-unreachable': 'host-unreachable',
  'net-unreachable': null,
  'time-exceeded': 'time-exceeded',
  'port-unreachable': 'port-unreachable',
};

function warnedBy(notice: Notice, packet: Pick<PacketSpec, 'from'>): WarnedBy {
  if (packet.from.kind === 'device' && notice.fromId === packet.from.id) return 'sender';
  return notice.kind === 'port-unreachable' ? 'host' : 'router';
}

/** Returns the warning that a notice of the trace stands for: Destination Host Unreachable, Time Exceeded or Port Unreachable, and generated by a router, by the host the packet was for or by the sender's own device. A router with no route warns with a net unreachable, which shares the ICMP type 3 with a host unreachable but is not one: the game names it Destination Net Unreachable only once `known` has that term, and with no `known` (unlike the other texts, where no `known` means every term is known) or before the term it has no term, so no text calls it a host. The sender's own device warns without the packet leaving it, so nothing comes back from anywhere. */
export function warningOf(notice: Notice, packet: Pick<PacketSpec, 'from'>, known?: ReadonlySet<TermId>): Warning {
  const term = notice.kind === 'net-unreachable' && known?.has('net-unreachable') ? 'net-unreachable' : WARNING_TERM[notice.kind];
  return { term, by: warnedBy(notice, packet) };
}

/** What a packet's computed result says about its stamp: whether it was not meant to get in (`intruder`), whether it reached a device, whether a firewall the player knows stopped it, and the warning the player knows that came back. */
export interface StampResult {
  intruder: boolean;
  reached: boolean;
  blocked: boolean;
  warning: Warning | null;
}

/** Returns the stamp that a packet's result leaves: a warning the player knows first (a datagram that reached its host and got a Port Unreachable is not an arrival, since no program received it), then a packet that reached a device, which is an intruder if it was not meant to get in, and then blocked, when a firewall the player knows stopped it, or lost. */
export function stampOf({ warning, reached, intruder, blocked }: StampResult): StampState {
  if (warning) return 'warned';
  if (reached) return intruder ? 'intruder' : 'arrived';
  return blocked ? 'blocked' : 'lost';
}

const PROBLEM_STAMP: Record<StampState, boolean> = { arrived: false, blocked: true, lost: true, intruder: true, warned: true };

/** True for the stamps that tell the player something went wrong (blocked, lost, warned and an intruder that got in), and false for one that arrived. */
export function isProblemStamp(state: StampState): boolean {
  return PROBLEM_STAMP[state];
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
  unreachable: { term: FIRST_WARNING_TERM, text: () => NOT_DELIVERED },
  'ttl-exceeded': { term: 'time-exceeded', text: () => NOT_DELIVERED },
};

/** Returns the text of an outcome with what the player knows: while the message that came back has no known term, it says only that the packet arrived (and, when `destination` is given, where) or that it did not reach its destination, and never that nothing came back, since a warning did. While the term timeout is unknown, the silence is told without the term, and a router that drops the packet at TTL 0 is told as one that discarded it until the term drop is known. */
export function describeOutcome(outcome: Outcome, known: ReadonlySet<TermId>, destination?: TermText): TermText {
  const hidden = UNKNOWN_OUTCOME[outcome];
  if (hidden && !known.has(hidden.term)) return hidden.text(destination);
  return outcome === 'ttl-exceeded' ? ttlExceededText(word(known, 'drop', 'descartó')) : OUTCOME_TEXT[outcome];
}

const REJECTED = 'Llegó, pero lo rechazaron.';

function portUnreachableResult(known: ReadonlySet<TermId>, destination?: TermText): TermText {
  if (!known.has('port-unreachable')) return REJECTED;
  return destination === undefined ? 'Llegó, pero ningún programa lo recibió: el equipo devolvió el aviso {{port-unreachable}}.' : `Llegó a ${destination}, pero ningún programa lo recibió: devolvió el aviso {{port-unreachable}}.`;
}

function wrongAddressResult(known: ReadonlySet<TermId>): TermText {
  if (!known.has('listen-address')) return REJECTED;
  return `Llegó, pero el ${word(known, 'service', 'servicio')} de ese ${word(known, 'port', 'puerto')} no escucha en la {{ip-address|IP}} a la que fue el paquete.`;
}

/** Returns the text of the result of a trace with what the player knows. It is `describeOutcome` except for the two results whose outcome alone cannot say what happened: a refusal says whether nobody listens on the port (`OUTCOME_TEXT.refused`) or the service listens on another address, and a Port Unreachable says that the datagram arrived at the equipment, that no program received it and that the equipment returned the warning, which is not what a Destination Host Unreachable means. Each is a hidden cause: while its term (`listen-address`, `port-unreachable`) is unknown, the text says only that the packet arrived and was rejected. None names an operating system or gives a reason. */
export function describeResult(trace: Trace, known: ReadonlySet<TermId>, destination?: TermText): TermText {
  if (trace.outcome === 'unreachable' && trace.notice?.kind === 'port-unreachable') return portUnreachableResult(known, destination);
  if (trace.outcome === 'refused' && stopStep(trace)?.reason.code === 'host-wrong-address') return wrongAddressResult(known);
  return describeOutcome(trace.outcome, known, destination);
}
