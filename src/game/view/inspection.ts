import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, MAP_TEXT, OUTCOME_TEXT, TERMS, describeReason, type TermId, type TermText } from '@/copy';
import { privateDnsName, publicDnsName, stopStep, type Actor, type Instance, type PacketSpec, type SecurityGroup } from '@/engine';
import type { FlowRun } from '@/game/flow-runs';
import type { Session } from '@/game/session';
import { rowText, ruleRows } from './barrier';
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

function server(session: Session, instance: Instance): Inspection {
  const { region, securityGroups } = session.world;
  const groups = securityGroups.filter((group) => instance.sgIds.includes(group.id));
  return {
    title: instance.name,
    fields: visible(
      [
        whatIs(PIECE_TERM.server),
        { term: 'private-ip', label: INSPECTION_TEXT.privateIp, lines: () => [instance.privateIp] },
        { term: 'public-ip', label: INSPECTION_TEXT.publicIp, lines: () => [instance.publicIp ?? INSPECTION_TEXT.none] },
        {
          term: 'dns',
          label: INSPECTION_TEXT.dnsNames,
          lines: () => [...(instance.publicIp ? [publicDnsName(instance.publicIp, region)] : []), privateDnsName(instance.privateIp, region)],
        },
        { term: 'icmp-echo-ignore-all', label: INSPECTION_TEXT.echoIgnore, lines: () => [instance.linux.ignoreIcmpEcho ? INSPECTION_TEXT.ignoresPing : INSPECTION_TEXT.answersPing] },
        { term: 'security-group', label: INSPECTION_TEXT.securityGroups, lines: () => groups.map((group) => MAP_TEXT.barrier(group.name)) },
      ],
      session.known,
    ),
  };
}

function barrier(session: Session, group: SecurityGroup): Inspection {
  const rows = ruleRows(group, session.incident);
  return {
    title: MAP_TEXT.barrier(group.name),
    fields: visible(
      [whatIs(PIECE_TERM.barrier), { term: 'inbound-rule', label: INSPECTION_TEXT.inbound, lines: () => (rows.length > 0 ? rows.map(rowText) : [INSPECTION_TEXT.noRules]) }],
      session.known,
    ),
  };
}

function gateway(session: Session): Inspection {
  return {
    title: MAP_TEXT.gateway,
    fields: visible([whatIs(PIECE_TERM.gateway), { term: null, label: INSPECTION_TEXT.does, lines: () => [INSPECTION_TEXT.gatewayDoes] }], session.known),
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
  if (ref.kind === 'gateway') return gateway(session);
  const { world, runs } = session;
  switch (ref.kind) {
    case 'server': {
      const found = world.instances.find((instance) => instance.id === ref.id);
      return found ? server(session, found) : null;
    }
    case 'barrier': {
      const found = world.securityGroups.find((group) => group.id === ref.id);
      return found ? barrier(session, found) : null;
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
