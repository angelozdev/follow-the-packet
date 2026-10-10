import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, TERMS, describeOutcome, describeReason, deviceName, entityTerm, messageLabel, nameTag, packetMessage, roundTripText, type EntityRef, type TermId, type TermText } from '@/copy';
import { isClientActor, privateDnsName, publicDnsName, stopStep, type ClientActor, type Device, type Firewall, type FirewallKind, type Hop, type PacketHeader, type PacketSpec, type Router, type ServerActor } from '@/engine';
import type { PacketRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
import { rowText, ruleRows } from './cards/firewall-card';
import { parsePieceId } from './piece-id';
import { drawsRouter, isDrawn, isShown } from './pieces';
import { placesOf, routerPlace } from './router-place';

export interface InspectionField {
  label: TermText;
  lines: TermText[];
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
}

const RULES_TERM: Record<FirewallKind, TermId | null> = { 'security-group': 'inbound-rule', 'host-firewall': 'rule' };

function visible(specs: FieldSpec[], known: ReadonlySet<TermId>): InspectionField[] {
  return specs.filter((spec) => spec.term === null || known.has(spec.term)).map((spec) => ({ label: spec.label, lines: spec.lines() }));
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
        { term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [own.publicIp ?? INSPECTION_TEXT.none] },
        { term: 'dns', label: INSPECTION_TEXT.dnsNames, lines: () => dnsNames(own, region) },
        { term: 'icmp-echo-ignore-all', label: INSPECTION_TEXT.echoIgnore, lines: () => [own.host.ignoreIcmpEcho ? INSPECTION_TEXT.ignoresPing : INSPECTION_TEXT.answersPing] },
        ...guardsField(guards),
      ],
      session.known,
    ),
  };
}

function firewall(session: Session, own: Firewall): Inspection {
  const rows = ruleRows(own, session.incident);
  return {
    entity: { kind: 'firewall', variant: own.kind },
    title: MAP_TEXT.firewall[own.kind](own.name),
    fields: visible(
      [
        ...whatIs({ kind: 'firewall', variant: own.kind }),
        { term: RULES_TERM[own.kind], label: INSPECTION_TEXT.inbound[own.kind], lines: () => (rows.length > 0 ? rows.map(rowText) : [INSPECTION_TEXT.noRules]) },
      ],
      session.known,
    ),
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

function router(session: Session, own: Router): Inspection {
  const entity = { kind: 'edge', variant: 'router' } as const;
  return { entity, title: nameTag(own.name), fields: visible(whatIs(entity), session.known) };
}

function internetServer(session: Session, own: ServerActor): Inspection {
  const entity = { kind: 'device', variant: 'internet-server' } as const;
  return {
    entity,
    title: nameTag(own.name),
    fields: visible([...whatIs(entity), { term: 'ip-address', label: INSPECTION_TEXT.ipAddress, lines: () => [own.ip] }], session.known),
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

/** The fields with the addresses a packet carries: the header it left with and, when the player knows Echo Reply, the header of the answer, which swaps source and destination. The TTL is listed once its term is known. */
function headerFields({ request, reply }: PacketHeader, known: ReadonlySet<TermId>): FieldSpec[] {
  const outbound: FieldSpec = {
    term: 'header',
    label: INSPECTION_TEXT.header,
    lines: () => [INSPECTION_TEXT.source(request.source), INSPECTION_TEXT.destination(request.destination), ...(known.has('ttl') ? [INSPECTION_TEXT.ttl(request.ttl)] : [])],
  };
  const answer: FieldSpec[] =
    reply && known.has('echo-reply') ? [{ term: 'header', label: INSPECTION_TEXT.replyHeader, lines: () => [INSPECTION_TEXT.source(reply.source), INSPECTION_TEXT.destination(reply.destination)] }] : [];
  return [outbound, ...answer];
}

/** Returns the lines of the routers a packet crossed, in order: each router the map draws by its name and the IP of its interface, and each stretch through routers it does not draw as inside or outside the office, so no text names what the player cannot see. */
function pathLines(session: Session, hops: Hop[]): TermText[] {
  return hops.reduce<TermText[]>((lines, hop) => {
    const place = routerPlace(session, hop.routerId);
    if (place === 'named') return [...lines, INSPECTION_TEXT.router(deviceName(session.world, hop.routerId), hop.ip)];
    const line = INSPECTION_TEXT.place[place];
    return lines.at(-1) === line ? lines : [...lines, line];
  }, []);
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

function packet(session: Session, run: PacketRun): Inspection {
  const step = stopStep(run.trace);
  const { header, hops } = run.trace;
  return {
    entity: { kind: 'packet', variant: packetMessage(run.packet), intruder: run.intruder },
    title: run.label,
    fields: [
      ...visible([...definition(packetTerm(run.packet, session.known)), ...messageField(run.packet), ...(header ? headerFields(header, session.known) : [])], session.known),
      ...pathField(session, hops),
      { label: INSPECTION_TEXT.result, lines: [describeOutcome(run.trace.outcome, session.known)] },
      ...roundTripField(session, run),
      ...(step ? [{ label: INSPECTION_TEXT.stoppedAt, lines: [describeReason(step.reason, session.world, session.known, placesOf(session))] }] : []),
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
