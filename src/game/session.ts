import type { TermId } from '@/copy';
import type { Network } from '@/engine';
import { applyMove, configurableParts, knownTerms, startWorld, type AnswerMove, type ConfigurableParts, type IdentifyIncident, type Incident, type PlayerMove, type RuleMove, type SendMove, type SettingMove } from '@/levels';
import { runFlows, sendPacket, type FlowRun, type SentPacket } from './flow-runs';
import { earnsMiddle, type Stars } from './stars';
import { failingTaskIds, type Answers } from './tasks';

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
  answers: Answers;
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

/** Returns the answers an incident starts with: the chip every tray of an identify incident starts picked with, and nothing else. */
function initialAnswers(incident: Incident): Answers {
  if (incident.mechanic !== 'identify') return {};
  const picked = incident.identify.cards.map((card) => [card.deviceId, Object.fromEntries(card.trays.flatMap((tray) => (tray.initialPick === undefined ? [] : [[tray.id, tray.initialPick]])))] as const);
  return Object.fromEntries(picked.filter(([, picks]) => Object.keys(picks).length > 0));
}

/** Starts an incident from its canonical world, with Lucía's reply empty and every initial pick of its cards as the answer saved. */
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
    answers: initialAnswers(incident),
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

/** Sets a setting of a device on its card. It changes the world, so the flows are run again and the packets sent before are gone: their stamps described the old world. The send number goes on counting. A chip already in effect, or one the incident does not offer, changes nothing. */
function setSetting(state: Session, action: SettingMove): Session {
  if (state.phase !== 'playing' || state.incident.mechanic !== 'send') return state;
  const world = applyMove(state.world, state.incident, action);
  if (world === state.world) return state;
  return { ...state, world, runs: runFlows(world, state.incident.flows, state.known), sent: [], rejection: null };
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

function offeredPicks({ identify }: IdentifyIncident, { deviceId, picks }: AnswerMove): Record<string, string> {
  const card = identify.cards.find((candidate) => candidate.deviceId === deviceId);
  const offered = Object.entries(picks).filter(([trayId, chipId]) => card?.trays.find((tray) => tray.id === trayId)?.chips.some((chip) => chip.id === chipId));
  return Object.fromEntries(offered);
}

/** Saves the chips the player confirmed on a card, tray by tray; a tray, a chip or a card the incident does not offer is left out, and an answer that changes nothing returns the same session. */
function answer(state: Session, action: AnswerMove): Session {
  if (state.phase !== 'playing' || state.incident.mechanic !== 'identify') return state;
  const picks = offeredPicks(state.incident, action);
  const saved = state.answers[action.deviceId] ?? {};
  if (Object.entries(picks).every(([trayId, chipId]) => saved[trayId] === chipId)) return state;
  return { ...state, answers: { ...state.answers, [action.deviceId]: { ...saved, ...picks } }, rejection: null };
}

function submit(state: Session): Session {
  if (state.phase !== 'playing') return state;
  const failing = failingTaskIds(state.incident.tasks, state.runs, state.sent, state.answers);
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
    case 'setSetting':
      return setSetting(state, action);
    case 'answerCard':
      return answer(state, action);
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
