import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, TERMS, describeOutcome, describeReason, deviceName, entityTerm, messageLabel, nameTag, packetMessage, roundTripText, type EntityRef, type TermId, type TermText } from '@/copy';
import { TRACEROUTE_MAX_HOPS, isClientActor, isConnected, lansOf, privateDnsName, publicDnsName, stopStep, type ClientActor, type Device, type Firewall, type Hop, type Network, type PacketHeader, type PacketSpec, type Router, type ServerActor, type Trace } from '@/engine';
import { routerOutOfSight, type PacketRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
import { RULES_TERM } from '@/levels';
import { outboundRows, rowText, ruleRows } from './cards/firewall-card';
import { parsePieceId } from './piece-id';
import { drawsRouter, isDrawn, isShown } from './pieces';
import { placesOf, routerPlace } from './router-place';

export interface InspectionField {
  label: TermText;
  lines: TermText[];
  notes?: TermText[];
}

export interface Inspection {
  entity: EntityRef;
  title: TermText;
  fields: InspectionField[];
}

interface FieldSpec {
  term: TermId | null;
  label: TermText;
  lines: () => TermText[];
  notes?: TermText[];
}

function visible(specs: FieldSpec[], known: ReadonlySet<TermId>): InspectionField[] {
  return specs.filter((spec) => spec.term === null || known.has(spec.term)).map(({ label, lines, notes }) => ({ label, lines: lines(), ...(notes && { notes }) }));
}

function definition(term: TermId | null): FieldSpec[] {
  return term ? [{ term, label: INSPECTION_TEXT.whatIs, lines: () => [TERMS[term].definition] }] : [];
}

function whatIs(entity: EntityRef): FieldSpec[] {
  return definition(entityTerm(entity));
}

/** The term a packet is defined by: its ICMP message once that term is known, and the general term `packet` before. */
function packetTerm(packet: PacketSpec, known: ReadonlySet<TermId>): TermId {
  const message = packet.protocol === 'icmp' ? entityTerm({ kind: 'packet', variant: packetMessage(packet) }) : null;
  return message && known.has(message) ? message : 'packet';
}

/** The field with a device's IP: called IP privada once that term is known, and dirección IP before. */
function addressField(own: Device, known: ReadonlySet<TermId>): FieldSpec {
  const term: TermId = known.has('private-ip') ? 'private-ip' : 'ip-address';
  return { term, label: term === 'private-ip' ? INSPECTION_TEXT.privateIp : INSPECTION_TEXT.ipAddress, lines: () => [own.privateIp] };
}

/** The field with whether a device of an office is connected to the network: a device with no cable keeps its IP and is not part of the network. A device of a VPC has none. */
function connectionField(own: Device, kind: Network['kind']): FieldSpec[] {
  if (kind !== 'office') return [];
  return [{ term: 'network', label: INSPECTION_TEXT.connection, lines: () => [isConnected(own) ? INSPECTION_TEXT.connected : INSPECTION_TEXT.disconnected] }];
}

/** The field with the public IP of a device of a VPC, or that it has none. A device of an office shows no such field: how a packet leaves the office is a black box in chapter 1, so the box says nothing about a public address the laptop does not use itself. */
function publicIpField(own: Device, kind: Network['kind']): FieldSpec[] {
  if (kind !== 'vpc') return [];
  return [{ term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [own.publicIp ?? INSPECTION_TEXT.none] }];
}

function dnsNames(device: Device, region: string | undefined): string[] {
  if (!region) return [];
  return [...(device.publicIp ? [publicDnsName(device.publicIp, region)] : []), privateDnsName(device.privateIp, region)];
}

function guardsField(guards: Firewall[]): FieldSpec[] {
  const [first] = guards;
  if (!first) return [];
  return [{ term: entityTerm({ kind: 'firewall', variant: first.kind }), label: INSPECTION_TEXT.firewalls[first.kind], lines: () => guards.map((guard) => MAP_TEXT.firewall[guard.kind](guard.name)) }];
}

function device(session: Session, own: Device): Inspection {
  const { region, firewalls } = session.world;
  const guards = firewalls.filter((firewall) => own.firewallIds.includes(firewall.id));
  return {
    entity: { kind: 'device', variant: own.kind },
    title: nameTag(own.name),
    fields: visible(
      [
        ...whatIs({ kind: 'device', variant: own.kind }),
        addressField(own, session.known),
        ...connectionField(own, session.world.kind),
        ...publicIpField(own, session.world.kind),
        { term: 'dns', label: INSPECTION_TEXT.dnsNames, lines: () => dnsNames(own, region) },
        { term: 'icmp-echo-ignore-all', label: INSPECTION_TEXT.echoIgnore, lines: () => [own.host.ignoreIcmpEcho ? INSPECTION_TEXT.ignoresPing : INSPECTION_TEXT.answersPing] },
        ...guardsField(guards),
      ],
      session.known,
    ),
  };
}

function rulesFields(session: Session, own: Firewall): FieldSpec[] {
  const lines = (rows: TermText[], none: TermText) => () => (rows.length > 0 ? rows : [none]);
  const inbound = lines(ruleRows(session, own).map(rowText), INSPECTION_TEXT.noRules[own.kind]);
  if (!session.parts.outboundRules[own.kind]) return [{ term: RULES_TERM.inbound[own.kind], label: INSPECTION_TEXT.inbound[own.kind], lines: inbound }];
  return [
    { term: RULES_TERM.inbound[own.kind], label: INSPECTION_TEXT.directions[own.kind].inbound, lines: inbound },
    { term: RULES_TERM.outbound[own.kind], label: INSPECTION_TEXT.directions[own.kind].outbound, lines: lines(outboundRows(session, own).map(rowText), INSPECTION_TEXT.noOutboundRules) },
  ];
}

function firewall(session: Session, own: Firewall): Inspection {
  return {
    entity: { kind: 'firewall', variant: own.kind },
    title: MAP_TEXT.firewall[own.kind](own.name),
    fields: visible([...whatIs({ kind: 'firewall', variant: own.kind }), ...rulesFields(session, own)], session.known),
  };
}

function edge(session: Session): Inspection {
  const variant = session.world.edge;
  return {
    entity: { kind: 'edge', variant },
    title: MAP_TEXT.edge[variant],
    fields: visible([...whatIs({ kind: 'edge', variant }), { term: null, label: INSPECTION_TEXT.does, lines: () => [INSPECTION_TEXT.edgeDoes[variant]] }], session.known),
  };
}

function internet(session: Session): Inspection {
  return {
    entity: { kind: 'internet', variant: 'internet' },
    title: MAP_TEXT.internet,
    fields: visible([...whatIs({ kind: 'internet', variant: 'internet' }), { term: null, label: INSPECTION_TEXT.does, lines: () => [INSPECTION_TEXT.internetDoes] }], session.known),
  };
}

/** The fields with the IP a router has on each local network it faces, named after that network. An interface that faces another router or a server is left out, so the box never names or numbers anything the map may not draw. */
function interfaceFields(world: Network, own: Router): FieldSpec[] {
  return lansOf(world).flatMap((lan) => {
    const face = own.interfaces.find((candidate) => candidate.faces === lan.id);
    return face ? [{ term: 'ip-address' as const, label: INSPECTION_TEXT.routerIp(lan.name), lines: () => [face.ip] }] : [];
  });
}

function router(session: Session, own: Router): Inspection {
  const entity = { kind: 'edge', variant: 'router' } as const;
  return { entity, title: nameTag(own.name), fields: visible([...whatIs(entity), ...interfaceFields(session.world, own)], session.known) };
}

/** The box of a server of the internet: what a device is and its IP, called dirección IP until the term IP pública is known and IP pública after, because the address of a server of the internet is one. */
function internetServer(session: Session, own: ServerActor): Inspection {
  const entity = { kind: 'device', variant: 'internet-server' } as const;
  const term: TermId = session.known.has('public-ip') ? 'public-ip' : 'ip-address';
  return {
    entity,
    title: nameTag(own.name),
    fields: visible([...whatIs(entity), { term, label: term === 'public-ip' ? INSPECTION_TEXT.publicIp : INSPECTION_TEXT.ipAddress, lines: () => [own.ip] }], session.known),
  };
}

function actor(session: Session, who: ClientActor): Inspection {
  return {
    entity: { kind: 'actor', variant: who.kind },
    title: nameTag(who.name),
    fields: visible(
      [
        { term: null, label: INSPECTION_TEXT.who, lines: () => [ACTOR_ROLE_TEXT[who.kind]] },
        { term: 'public-ip', label: INSPECTION_TEXT.ip, lines: () => [who.ip] },
      ],
      session.known,
    ),
  };
}

function messageField(packet: PacketSpec): FieldSpec[] {
  return packet.protocol === 'icmp' ? [{ term: 'echo-request', label: INSPECTION_TEXT.message, lines: () => [messageLabel(packetMessage(packet))] }] : [];
}

interface HeaderOptions {
  ttl: boolean;
  local: boolean;
}

/** The fields with the addresses a packet carries: the header it left with and, when the player knows Echo Reply, the header of the answer, which swaps source and destination (then the first one is called the header of the Echo Request, once that term is known). The TTL is listed once its term is known, unless the packet is a traceroute, whose last probe has a TTL of its own that the player never chose. For a trip that leaves the office the headers are those seen in the local network: they are labelled so, and a last line says that outside the office the header changes, without saying how. */
function headerFields({ request, reply }: PacketHeader, known: ReadonlySet<TermId>, { ttl, local }: HeaderOptions): FieldSpec[] {
  const answered = reply !== undefined && known.has('echo-reply');
  const named = (label: TermText): TermText => (local ? INSPECTION_TEXT.inLan(label, known) : label);
  const outbound: FieldSpec = {
    term: 'header',
    label: named(answered && known.has('echo-request') ? INSPECTION_TEXT.requestHeader : INSPECTION_TEXT.header),
    lines: () => [INSPECTION_TEXT.source(request.source, known), INSPECTION_TEXT.destination(request.destination, known), ...(ttl && known.has('ttl') ? [INSPECTION_TEXT.ttl(request.ttl)] : [])],
  };
  const answer: FieldSpec[] =
    reply && answered
      ? [{ term: 'header', label: named(INSPECTION_TEXT.replyHeader), lines: () => [INSPECTION_TEXT.source(reply.source, known), INSPECTION_TEXT.destination(reply.destination, known)] }]
      : [];
  const fields = [outbound, ...answer];
  return local ? [...fields.slice(0, -1), { ...fields[fields.length - 1], notes: [INSPECTION_TEXT.headerChanges] }] : fields;
}

/** Returns the lines of the routers a packet crossed, in order: each router the map draws by its name and the IP of its interface, and each stretch through routers it does not draw as inside or outside the office, so no text names what the player cannot see. A packet that goes round a loop crosses the same routers again and again, so only the first hops are listed, as many as a traceroute prints, and a last line counts the rest. */
function pathLines(session: Session, hops: Hop[]): TermText[] {
  const listed = hops.slice(0, TRACEROUTE_MAX_HOPS);
  const lines = listed.reduce<TermText[]>((acc, hop) => {
    const place = routerPlace(session, hop.routerId);
    if (place === 'named') return [...acc, INSPECTION_TEXT.router(deviceName(session.world, hop.routerId), hop.ip)];
    const line = INSPECTION_TEXT.place[place];
    return acc.at(-1) === line ? acc : [...acc, line];
  }, []);
  const rest = hops.length - listed.length;
  return rest > 0 ? [...lines, INSPECTION_TEXT.moreHops(rest)] : lines;
}

/** The field with the routers a packet crossed. It is called "Pasó por" until the term hop is known, and "Saltos" after. A packet that crossed none has no such field. */
function pathField(session: Session, hops: Hop[] = []): InspectionField[] {
  if (hops.length === 0) return [];
  return [{ label: session.known.has('hop') ? INSPECTION_TEXT.hops : INSPECTION_TEXT.passedThrough, lines: pathLines(session, hops) }];
}

/** The field with the round trip time, once the term is known and only for a packet that came back to its sender: a reply, a refusal or a warning from a router the player knows. Silence and a warning the sender generates itself have none, and a warning whose term is unknown is seen as silence. */
function roundTripField(session: Session, run: PacketRun): InspectionField[] {
  const { rttMs, notice } = run.trace;
  const cameBack = rttMs !== undefined && (notice === undefined || run.warning !== null);
  return cameBack && session.known.has('rtt') ? [{ label: INSPECTION_TEXT.roundTrip, lines: [roundTripText(rttMs), INSPECTION_TEXT.exampleTime] }] : [];
}

function leavesTheOffice(trace: Trace): boolean {
  return trace.steps.some((step) => step.reason.code === 'route-leaves-office');
}

function packet(session: Session, run: PacketRun): Inspection {
  const step = stopStep(run.trace);
  const { header, hops } = run.trace;
  const traced = 'route' in run && run.route !== undefined;
  const knowsTheRoute = routerOutOfSight(session.incident, run) === undefined;
  const options = { ttl: !traced, local: leavesTheOffice(run.trace) };
  return {
    entity: { kind: 'packet', variant: packetMessage(run.packet), intruder: run.intruder },
    title: run.label,
    fields: [
      ...visible([...definition(traced ? 'traceroute' : packetTerm(run.packet, session.known)), ...messageField(run.packet), ...(header ? headerFields(header, session.known, options) : [])], session.known),
      ...pathField(session, knowsTheRoute ? hops : []),
      { label: INSPECTION_TEXT.result, lines: [describeOutcome(run.trace.outcome, session.known, run.trace.destinationId ? deviceName(session.world, run.trace.destinationId) : undefined)] },
      ...roundTripField(session, run),
      ...(step && knowsTheRoute && !traced ? [{ label: INSPECTION_TEXT.stoppedAt, lines: [describeReason(step.reason, session.world, session.known, placesOf(session))] }] : []),
    ],
  };
}

/** Returns what the inspection box shows for a piece, a flow's packet or a packet the player sent, starting with what it is, or null when the id names nothing on the map (a firewall, a router, the edge and the internet are not on it while their terms are unknown, and nothing is on it that the incident does not show). */
export function inspect(session: Session, pieceId: string): Inspection | null {
  const ref = parsePieceId(pieceId);
  if (!ref) return null;
  const { world, runs, sent, known } = session;
  switch (ref.kind) {
    case 'edge':
      return isDrawn(known, { kind: 'edge', variant: world.edge }) ? edge(session) : null;
    case 'internet':
      return isDrawn(known, { kind: 'internet', variant: 'internet' }) ? internet(session) : null;
    case 'device': {
      const found = world.devices.find((candidate) => candidate.id === ref.id);
      return found && isShown(session, found.id) ? device(session, found) : null;
    }
    case 'firewall': {
      const found = world.firewalls.find((candidate) => candidate.id === ref.id);
      const owner = found && world.devices.find((candidate) => candidate.firewallIds.includes(found.id));
      return found && owner && isShown(session, owner.id) && isDrawn(known, { kind: 'firewall', variant: found.kind }) ? firewall(session, found) : null;
    }
    case 'actor': {
      const found = world.actors.find((candidate) => candidate.id === ref.id);
      if (!found || !isShown(session, found.id)) return null;
      return isClientActor(found) ? actor(session, found) : internetServer(session, found);
    }
    case 'router': {
      const found = (world.routers ?? []).find((candidate) => candidate.id === ref.id);
      return found && drawsRouter(session, found.id) ? router(session, found) : null;
    }
    case 'packet': {
      const found = [...runs, ...sent].find((run) => run.id === ref.id);
      return found ? packet(session, found) : null;
    }
  }
}
