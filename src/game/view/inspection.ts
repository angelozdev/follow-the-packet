import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, OUTCOME_TEXT, TERMS, describeReason, type TermId, type TermText } from '@/copy';
import { privateDnsName, publicDnsName, stopStep, type Actor, type Device, type Firewall, type PacketSpec } from '@/engine';
import type { FlowRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
import { rowText, ruleRows } from './firewall-card';
import { parsePieceId } from './piece-id';
import { PIECE_TERM } from './pieces';

export interface InspectionField {
  label: TermText;
  lines: TermText[];
}

export interface Inspection {
  title: TermText;
  fields: InspectionField[];
}

interface FieldSpec {
  term: TermId | null;
  label: TermText;
  lines: () => TermText[];
}

const ICMP_MESSAGE_TERM = { 8: 'echo-request', 0: 'echo-reply' } as const satisfies Record<NonNullable<PacketSpec['icmpType']>, TermId>;

function visible(specs: FieldSpec[], known: ReadonlySet<TermId>): InspectionField[] {
  return specs.filter((spec) => spec.term === null || known.has(spec.term)).map((spec) => ({ label: spec.label, lines: spec.lines() }));
}

function whatIs(term: TermId): FieldSpec {
  return { term, label: INSPECTION_TEXT.whatIs, lines: () => [TERMS[term].definition] };
}

function packetTerm(packet: PacketSpec): TermId | null {
  return packet.protocol === 'icmp' && packet.icmpType !== undefined ? ICMP_MESSAGE_TERM[packet.icmpType] : null;
}

function dnsNames(device: Device, region: string | undefined): string[] {
  if (!region) return [];
  return [...(device.publicIp ? [publicDnsName(device.publicIp, region)] : []), privateDnsName(device.privateIp, region)];
}

function device(session: Session, own: Device): Inspection {
  const { region, firewalls } = session.world;
  const guards = firewalls.filter((firewall) => own.firewallIds.includes(firewall.id));
  return {
    title: own.name,
    fields: visible(
      [
        whatIs(PIECE_TERM.device),
        { term: 'private-ip', label: INSPECTION_TEXT.privateIp, lines: () => [own.privateIp] },
        { term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [own.publicIp ?? INSPECTION_TEXT.none] },
        { term: 'dns', label: INSPECTION_TEXT.dnsNames, lines: () => dnsNames(own, region) },
        { term: 'icmp-echo-ignore-all', label: INSPECTION_TEXT.echoIgnore, lines: () => [own.host.ignoreIcmpEcho ? INSPECTION_TEXT.ignoresPing : INSPECTION_TEXT.answersPing] },
        { term: 'security-group', label: INSPECTION_TEXT.firewalls, lines: () => guards.map((firewall) => MAP_TEXT.firewall(firewall.name)) },
      ],
      session.known,
    ),
  };
}

function firewall(session: Session, own: Firewall): Inspection {
  const rows = ruleRows(own, session.incident);
  return {
    title: MAP_TEXT.firewall(own.name),
    fields: visible(
      [whatIs(PIECE_TERM.firewall), { term: 'inbound-rule', label: INSPECTION_TEXT.inbound, lines: () => (rows.length > 0 ? rows.map(rowText) : [INSPECTION_TEXT.noRules]) }],
      session.known,
    ),
  };
}

function edge(session: Session): Inspection {
  return {
    title: MAP_TEXT.edge,
    fields: visible([whatIs(PIECE_TERM.edge), { term: null, label: INSPECTION_TEXT.does, lines: () => [INSPECTION_TEXT.edgeDoes] }], session.known),
  };
}

function actor(session: Session, who: Actor): Inspection {
  return {
    title: who.name,
    fields: visible(
      [
        { term: null, label: INSPECTION_TEXT.who, lines: () => [ACTOR_ROLE_TEXT[who.kind]] },
        { term: 'public-ip', label: INSPECTION_TEXT.ip, lines: () => [who.ip] },
      ],
      session.known,
    ),
  };
}

function packet(session: Session, run: FlowRun): Inspection {
  const step = stopStep(run.trace);
  const term = packetTerm(run.packet);
  return {
    title: run.label,
    fields: [
      ...visible(term ? [whatIs(term)] : [], session.known),
      { label: INSPECTION_TEXT.result, lines: [OUTCOME_TEXT[run.trace.outcome]] },
      ...(step ? [{ label: INSPECTION_TEXT.stoppedAt, lines: [describeReason(step.reason, session.world)] }] : []),
    ],
  };
}

/** Returns what the inspection box shows for a piece or a packet, starting with what it is, or null when the id names nothing on the map. */
export function inspect(session: Session, pieceId: string): Inspection | null {
  const ref = parsePieceId(pieceId);
  if (!ref) return null;
  if (ref.kind === 'edge') return edge(session);
  const { world, runs } = session;
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
      const found = world.actors.find((candidate) => candidate.id === ref.id);
      return found ? actor(session, found) : null;
    }
    case 'packet': {
      const found = runs.find((run) => run.id === ref.id);
      return found ? packet(session, found) : null;
    }
  }
}
