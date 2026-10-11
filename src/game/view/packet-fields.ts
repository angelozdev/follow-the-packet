import { INSPECTION_TEXT, describeReason, deviceName, endpointName, type TermId, type TermText } from '@/copy';
import { ROUTE_DEFAULT, stopStep, type DnsTrace, type ExchangeMessage, type PacketHeader, type PacketSpec, type RouteDecision, type Trace, type Translation } from '@/engine';
import type { PacketRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
import { placesOf, routerPlace } from './router-place';

export interface InspectionField {
  label: TermText;
  lines: TermText[];
  notes?: TermText[];
}

const ANYWHERE = '0.0.0.0/0';

type Known = ReadonlySet<TermId>;
type Side = { source: string; destination: string; sourcePort?: number; destinationPort?: number };

function field(label: TermText, lines: TermText[], notes?: TermText[]): InspectionField {
  return { label, lines, ...(notes && { notes }) };
}

function leavesTheOffice(trace: Trace): boolean {
  return trace.steps.some((step) => step.reason.code === 'route-leaves-office');
}

/** The lines with the addresses a header carries and, for TCP and UDP once `port` is known, its ports: the destination port with its term, and the source port only once `source-port` is known. */
function sideLines(side: Side, known: Known): TermText[] {
  const ports = known.has('port') && side.sourcePort !== undefined && side.destinationPort !== undefined;
  return [
    INSPECTION_TEXT.source(side.source, known),
    INSPECTION_TEXT.destination(side.destination, known),
    ...(ports && known.has('source-port') ? [INSPECTION_TEXT.sourcePort(side.sourcePort!)] : []),
    ...(ports ? [INSPECTION_TEXT.destinationPort(side.destinationPort!, known)] : []),
  ];
}

/** The label of the header the packet left with: «Encabezado» alone, or «del Echo Request» (ICMP) or «de ida» (TCP and UDP) while the header of the answer is shown beside it. */
function requestLabel(protocol: PacketSpec['protocol'], answered: boolean, known: Known): TermText {
  if (!answered) return INSPECTION_TEXT.header;
  if (protocol !== 'icmp') return INSPECTION_TEXT.outHeader;
  return known.has('echo-request') ? INSPECTION_TEXT.requestHeader : INSPECTION_TEXT.header;
}

/** The header of the packet as it travels the internet, after the NAT of the office changed its source: the public IP and, for TCP and UDP, the public port. It has no TTL, since the one the sender chose is not the one the packet carries after the router. */
function internetHeader(request: PacketHeader['request'], translation: Translation, label: TermText, known: Known): InspectionField {
  const { destination, destinationPort } = request;
  const side = { source: translation.outside.ip, destination, sourcePort: translation.outside.port, destinationPort };
  return field(INSPECTION_TEXT.inInternet(label, known), sideLines(side, known));
}

/** The fields with the addresses a packet carries: the header it left with and, when it was answered, the header of the answer, which swaps source and destination and, for TCP and UDP, the ports. An ICMP packet calls them the header of the Echo Request and of the Echo Reply; a TCP or UDP packet, the header «de ida» and «de vuelta». The TTL is listed once its term is known, unless the packet is a traceroute, whose last probe has a TTL of its own that the player never chose. A trip that leaves the office shows the headers seen in the local network, labelled so, and, once `nat` is known, the header in the internet after the translation of the router; before, the last one carries a note that outside the office the header changes, without saying how. */
export function headerFields(run: PacketRun, known: Known, ttl: boolean): InspectionField[] {
  const { header, translation } = run.trace;
  if (!header || !known.has('header')) return [];
  const { request, reply } = header;
  const { protocol } = run.packet;
  const local = leavesTheOffice(run.trace);
  const answered = reply !== undefined && (protocol !== 'icmp' || known.has('echo-reply'));
  const named = (label: TermText): TermText => (local ? INSPECTION_TEXT.inLan(label, known) : label);
  const asked = requestLabel(protocol, answered, known);
  const back = protocol === 'icmp' ? INSPECTION_TEXT.replyHeader : INSPECTION_TEXT.backHeader;
  const own = [field(named(asked), [...sideLines(request, known), ...(ttl && known.has('ttl') ? [INSPECTION_TEXT.ttl(request.ttl)] : [])])];
  const answer = reply && answered ? [field(named(back), sideLines(reply, known))] : [];
  const fields = [...own, ...answer];
  const explained = known.has('nat');
  const noted = local && !explained ? [...fields.slice(0, -1), { ...fields[fields.length - 1], notes: [INSPECTION_TEXT.headerChanges] }] : fields;
  const outside = local && explained && translation && run.packet.from.kind === 'device' ? [internetHeader(request, translation, asked, known)] : [];
  return [...noted, ...outside];
}

function serverName(session: Session, run: PacketRun): TermText {
  return run.trace.destinationId ? deviceName(session.world, run.trace.destinationId) : (run.trace.resolvedIp ?? run.packet.to);
}

function said(message: ExchangeMessage, known: Known): TermText {
  if (message.kind === 'RST' && !known.has('rst')) return INSPECTION_TEXT.exchange.unknownRst;
  return INSPECTION_TEXT.exchange.kinds[message.kind];
}

/** The field with what the two ends of a TCP or UDP packet said to each other, in order and as far as the packet got: the three steps of the greeting of a TCP connection (once `handshake` is known) or the query and the answer of a datagram (once `udp` is known). A packet that never left its sender says nothing, and so has no field. */
export function exchangeField(session: Session, run: PacketRun): InspectionField[] {
  const { exchange } = run.trace;
  const tcp = run.packet.protocol === 'tcp';
  if (!exchange?.length || !session.known.has(tcp ? 'handshake' : 'udp')) return [];
  const client = endpointName(run.packet.from, session.world);
  const server = serverName(session, run);
  const lines = exchange.map((message, index) => {
    const [from, to] = message.from === 'client' ? [client, server] : [server, client];
    return INSPECTION_TEXT.exchange.line(index + 1, said(message, session.known), from, to);
  });
  return [field(tcp ? INSPECTION_TEXT.handshake : INSPECTION_TEXT.datagrams, lines)];
}

/** The IP of the next hop of a decision, only when the router it belongs to is on the map: a line never numbers a router the player cannot see. */
function visibleVia(session: Session, via: string | undefined): string | undefined {
  if (via === undefined) return undefined;
  const owner = (session.world.routers ?? []).find((router) => router.interfaces.some((face) => face.ip === via));
  return owner && routerPlace(session, owner.id) !== 'named' ? undefined : via;
}

/** The range a route covers as the player reads it: the default route is 0.0.0.0/0. */
function range(to: string): string {
  return to === ROUTE_DEFAULT ? ANYWHERE : to;
}

function prefixOf(to: string): number {
  return to === ROUTE_DEFAULT ? 0 : Number(to.split('/')[1]);
}

/** The ranges that also covered the destination with a shorter prefix than the one chosen, each once. A route of the same prefix is a tie broken by the order of the table, not a less specific route. */
function lessSpecific(route: RouteDecision): string[] {
  const chosen = prefixOf(route.route.to);
  return [...new Set(route.alsoCovered.filter((other) => prefixOf(other.to) < chosen).map((other) => range(other.to)))];
}

function routeLine(session: Session, decision: RouteDecision): TermText[] {
  const { holderId, route, kind } = decision;
  if (routerPlace(session, holderId) !== 'named') return [];
  const { known } = session;
  const text = INSPECTION_TEXT.routeLine;
  const kindText = known.has(text.terms[kind]) ? `{{${text.terms[kind]}|${text.kinds[kind]}}}` : `{{route|${text.kinds.static}}}`;
  const via = visibleVia(session, route.via);
  const next = via === undefined ? [] : [known.has('next-hop') ? text.nextHop(via) : text.leavesBy(via)];
  const direct = kind === 'connected' ? [text.direct] : [];
  const shorter = lessSpecific(decision);
  const specific = shorter.length > 0 && known.has('most-specific-route') ? [text.mostSpecific(shorter)] : [];
  return [text.line(deviceName(session.world, holderId), range(route.to), [kindText, ...direct, ...next, ...specific])];
}

/** The field with the route each holder of a decision picked to carry the packet on, once `route` is known: one line per decision, naming whose it is (the sender, or a router the map draws). A packet that enters from outside has no decision of its sender, only the routers', so every line says whose route it lists. A router the map does not draw is left out, and so is the IP of a next hop that belongs to one. */
export function routeField(session: Session, run: PacketRun): InspectionField[] {
  const lines = (run.trace.routes ?? []).flatMap((decision) => routeLine(session, decision));
  return session.known.has('route') && lines.length > 0 ? [field(INSPECTION_TEXT.route, lines)] : [];
}

function end(point: { ip: string; port?: number }): string {
  return point.port === undefined ? point.ip : `${point.ip}:${point.port}`;
}

/** The field with what the NAT of the office did to the source of the packet, once `nat` is known: the end it left the device with and the end it leaves the office with. An ICMP message has no ports, so a ping shows only the IPs and says so, and leaves no row; TCP and UDP also say whether the packet made a row of the table or used one that was there. A packet that comes in from outside shows the public end the sender wrote and the device it was delivered to, and says whether a forward or a row delivered it. */
export function translationField(session: Session, run: PacketRun): InspectionField[] {
  const { translation } = run.trace;
  const { known } = session;
  if (!translation || !known.has('nat')) return [];
  const text = INSPECTION_TEXT.translationLine;
  const ported = translation.protocol !== 'icmp';
  if (run.packet.from.kind !== 'device') {
    const how = translation.fixed ? (known.has('port-forwarding') ? [text.forwarded] : []) : known.has('translation-table') ? [text.byRow] : [];
    return [field(INSPECTION_TEXT.translation, [text.out(end(translation.outside), end(translation.inside)), ...how])];
  }
  const row = ported && known.has('translation-table') ? [translation.isNew ? text.newRow : text.sameRow] : [];
  return [field(INSPECTION_TEXT.translation, [text.out(end(translation.inside), end(translation.outside)), ported ? text.portsChanged(known) : text.icmp(known), ...row])];
}

function dig(session: Session, run: PacketRun, dns: DnsTrace): TermText[] {
  const { known } = session;
  const text = INSPECTION_TEXT.dnsAnswer;
  const resolver = serverName(session, run);
  if (dns.status === 'NO-RESOLVER') return [text.nobody(resolver, known)];
  const address = dns.answers.find((record) => record.type === 'A');
  const answer: Record<'NOERROR' | 'NXDOMAIN' | 'SERVFAIL', TermText[]> = {
    NOERROR: dns.answers.length > 0 ? dns.answers.map((record) => text.record(record.name, record.type, record.value, known)) : [text.noAddress(dns.name, known)],
    NXDOMAIN: [known.has('nxdomain') ? text.nxdomain(dns.name) : text.noIp(dns.name)],
    SERVFAIL: [known.has('servfail') ? text.servfail(dns.name) : text.noIp(dns.name)],
  };
  const origin = address && known.has('dns-cache') ? [dns.fromCache ? text.fromCache(resolver) : text.asked(resolver)] : [];
  const seconds = dns.ttlLeft ?? address?.ttl;
  const ttl = address && seconds !== undefined && known.has('dns-ttl') ? [text.ttl(seconds, dns.fromCache && known.has('dns-cache'))] : [];
  return [text.from(resolver), ...answer[dns.status], ...origin, ...ttl];
}

function system(session: Session, run: PacketRun, dns: DnsTrace): TermText[] {
  const step = run.trace.steps.find((candidate) => candidate.stage === 'dns');
  if (!step || step.reason.code === 'dns-unresolved') return [];
  const lead = INSPECTION_TEXT.dnsLead(endpointName(run.packet.from, session.world), dns.name);
  return step === stopStep(run.trace) ? [lead] : [lead, describeReason(step.reason, session.world, session.known, placesOf(session))];
}

/** The field with what happened to the name a packet was sent to, once `dns` is known. A `ping` or an `nc` by name asks first and sends after: it says that the device resolved the name before sending the packet, and how, with the sentence of the reason of that step: it asked its resolver, or its hosts file answered and nobody was asked. That question is not drawn and leaves no row in the translation table, so this is where it shows. A lookup that failed has its cause in the line where the packet stopped, and is not said twice. A `dig` is the question itself, and one from a device with no resolver sends nothing, so it has no field; otherwise the field lists what the resolver answered, with the records, whether the answer came from its cache (once `dns-cache` is known) and its TTL (once `dns-ttl` is known). */
export function dnsField(session: Session, run: PacketRun): InspectionField[] {
  const { dns } = run.trace;
  if (!dns || !session.known.has('dns')) return [];
  const sent = run.trace.resolvedIp !== null;
  const lines = dns.viaDig ? (sent ? dig(session, run, dns) : []) : system(session, run, dns);
  return lines.length > 0 ? [field(INSPECTION_TEXT.dns, lines)] : [];
}
