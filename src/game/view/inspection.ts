import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, OUTCOME_TEXT, TERMS, describeReason, entityTerm, messageLabel, nameTag, packetMessage, type EntityRef, type TermId, type TermText } from '@/copy';
import { isClientActor, privateDnsName, publicDnsName, stopStep, type ClientActor, type Device, type Firewall, type FirewallKind, type PacketSpec } from '@/engine';
import type { PacketRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
import { rowText, ruleRows } from './cards/firewall-card';
import { parsePieceId } from './piece-id';
import { showsOutside } from './pieces';

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

function packet(session: Session, run: PacketRun): Inspection {
  const step = stopStep(run.trace);
  return {
    entity: { kind: 'packet', variant: packetMessage(run.packet), intruder: run.intruder },
    title: run.label,
    fields: [
      ...visible([...definition(packetTerm(run.packet, session.known)), ...messageField(run.packet)], session.known),
      { label: INSPECTION_TEXT.result, lines: [OUTCOME_TEXT[run.trace.outcome]] },
      ...(step ? [{ label: INSPECTION_TEXT.stoppedAt, lines: [describeReason(step.reason, session.world)] }] : []),
    ],
  };
}

/** Returns what the inspection box shows for a piece, a flow's packet or a packet the player sent, starting with what it is, or null when the id names nothing on the map (the edge and the internet are not on it while nobody is outside). */
export function inspect(session: Session, pieceId: string): Inspection | null {
  const ref = parsePieceId(pieceId);
  if (!ref) return null;
  const { world, runs, sent } = session;
  if (ref.kind === 'edge' || ref.kind === 'internet') {
    if (!showsOutside(world)) return null;
    return ref.kind === 'edge' ? edge(session) : internet(session);
  }
  switch (ref.kind) {
    case 'device': {
      const found = world.devices.find((candidate) => candidate.id === ref.id);
      return found ? device(session, found) : null;
    }
    case 'firewall': {
      const found = world.firewalls.find((candidate) => candidate.id === ref.id);
      return found ? firewall(session, found) : null;
    }
    case 'actor': {
      const found = world.actors.filter(isClientActor).find((candidate) => candidate.id === ref.id);
      return found ? actor(session, found) : null;
    }
    case 'packet': {
      const found = [...runs, ...sent].find((run) => run.id === ref.id);
      return found ? packet(session, found) : null;
    }
  }
}
