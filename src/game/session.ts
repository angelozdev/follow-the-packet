import type { TermId } from '@/copy';
import type { Network } from '@/engine';
import { applyMove, configurableParts, knownTerms, startWorld, type ConfigurableParts, type Incident, type PlayerMove, type SendMove } from '@/levels';
import { runFlows, sendPacket, type FlowRun, type SentPacket } from './flow-runs';
import { earnsMiddle, type Stars } from './stars';
import { failingTaskIds } from './tasks';

type RuleMove = Exclude<PlayerMove, SendMove>;

export type SessionPhase = 'playing' | 'explaining' | 'result';

export interface Rejection {
  attempt: number;
  failingTaskIds: string[];
  intruding: boolean;
}

export interface Session {
  incident: Incident;
  known: ReadonlySet<TermId>;
  parts: ConfigurableParts;
  world: Network;
  runs: FlowRun[];
  sent: SentPacket[];
  sends: number;
  rejection: Rejection | null;
  alerts: number;
  hintsShown: number;
  phase: SessionPhase;
  middle: boolean;
  choice: number | null;
}

export type SessionAction =
  | PlayerMove
  | { type: 'submit' }
  | { type: 'showHint' }
  | { type: 'chooseExplanation'; index: number }
  | { type: 'showResult' };

function hasIntrusion(runs: FlowRun[]): boolean {
  return runs.some((run) => run.kind === 'forbidden' && run.reached);
}

/** Starts an incident from its canonical world, with Lucía's reply empty. */
export function startSession(incidents: Incident[], incidentId: string): Session {
  const incident = incidents.find((i) => i.id === incidentId);
  if (!incident) throw new Error(`unknown incident ${incidentId}`);
  const known = knownTerms(incidents, incidentId);
  const world = startWorld(incidents, incidentId);
  const runs = runFlows(world, incident.flows, known);
  return {
    incident,
    known,
    parts: configurableParts(known),
    world,
    runs,
    sent: [],
    sends: 0,
    rejection: null,
    alerts: hasIntrusion(runs) ? 1 : 0,
    hintsShown: 0,
    phase: 'playing',
    middle: false,
    choice: null,
  };
}

/** True when a device has this firewall, so it is on the map, and the ladder lets the player change the inbound rules of its kind. */
export function canConfigure(session: Session, firewallId: string): boolean {
  const firewall = session.world.firewalls.find((candidate) => candidate.id === firewallId);
  return firewall !== undefined && session.parts.inboundRules[firewall.kind] && session.world.devices.some((device) => device.firewallIds.includes(firewallId));
}

/** True while a forbidden flow reaches its device. */
export function isIntruding(session: Session): boolean {
  return hasIntrusion(session.runs);
}

function move(state: Session, action: RuleMove): Session {
  if (state.phase !== 'playing' || !canConfigure(state, action.firewallId)) return state;
  const world = applyMove(state.world, state.incident, action);
  if (world === state.world) return state;
  const runs = runFlows(world, state.incident.flows, state.known);
  const startsEpisode = hasIntrusion(runs) && !hasIntrusion(state.runs);
  return { ...state, world, runs, alerts: state.alerts + (startsEpisode ? 1 : 0), rejection: null };
}

/** Sends the packet of three chips: the last packet of each combination stays, and a new send takes Lucía's reply away. */
function send(state: Session, action: SendMove): Session {
  if (state.phase !== 'playing' || state.incident.mechanic !== 'send') return state;
  const packet = sendPacket(state.world, state.incident, action, state.sends + 1, state.known);
  if (!packet) return state;
  const again = state.sent.some((other) => other.id === packet.id);
  const sent = again ? state.sent.map((other) => (other.id === packet.id ? packet : other)) : [...state.sent, packet];
  return { ...state, sent, sends: packet.send, rejection: null };
}

function submit(state: Session): Session {
  if (state.phase !== 'playing') return state;
  const failing = failingTaskIds(state.incident.tasks, state.runs, state.sent);
  if (failing.length === 0) return { ...state, phase: 'explaining', middle: earnsMiddle(state.incident, state.world, state.hintsShown), rejection: null };
  return { ...state, rejection: { attempt: (state.rejection?.attempt ?? 0) + 1, failingTaskIds: failing, intruding: hasIntrusion(state.runs) } };
}

function choose(state: Session, index: number): Session {
  const valid = Number.isInteger(index) && index >= 0 && index < state.incident.explanation.length;
  return state.phase === 'explaining' && state.choice === null && valid ? { ...state, choice: index } : state;
}

export function sessionReducer(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'placeRule':
    case 'removeRule':
      return move(state, action);
    case 'sendPacket':
      return send(state, action);
    case 'submit':
      return submit(state);
    case 'showHint':
      return { ...state, hintsShown: Math.min(state.hintsShown + 1, state.incident.hints.length) };
    case 'chooseExplanation':
      return choose(state, action.index);
    case 'showResult':
      return state.phase === 'explaining' && state.choice !== null ? { ...state, phase: 'result' } : state;
  }
}

/** Returns the stars as they stand: closed, the middle star of the mechanic at the close (only what is needed, or no hints), and the first explanation right. */
export function starsOf(session: Session): Stars {
  return {
    closed: session.phase !== 'playing',
    middle: session.middle,
    explained: session.choice !== null && session.incident.explanation[session.choice].correct,
  };
}
