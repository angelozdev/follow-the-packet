import type { TermId, TermText } from '@/copy';
import { DEFAULT_DIRECTION, type Direction, type Network } from '@/engine';
import {
  applyMove,
  caseWorld,
  configurableParts,
  isGuided,
  knownTerms,
  startWorld,
  type AnswerMove,
  type CaseSpec,
  type ConfigurableParts,
  type IdentifyIncident,
  type Incident,
  type PlayerMove,
  type RuleMove,
  type SendMove,
  type SendOwner,
  type SettingMove,
} from '@/levels';
import { runFlows, sendPacket, type FlowRun, type SentPacket } from './flow-runs';
import { earnsMiddle, everyCauseAtFirstTry, noHintInAnyCase, type CaseResult, type Stars } from './stars';
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
  start: Network;
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
  caseIndex: number;
  caseResults: CaseResult[];
  named: number[];
}

export type SessionAction =
  | PlayerMove
  | { type: 'submit' }
  | { type: 'showHint' }
  | { type: 'chooseExplanation'; index: number }
  | { type: 'nameCause'; index: number }
  | { type: 'nextCase' }
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

/** Starts an incident from its canonical world, with Lucía's reply empty and every initial pick of its cards as the answer saved. A diagnose starts at its first case, whose world is the one the incident starts from plus the changes of that case. */
export function startSession(incidents: Incident[], incidentId: string): Session {
  const incident = incidents.find((i) => i.id === incidentId);
  if (!incident) throw new Error(`unknown incident ${incidentId}`);
  const known = knownTerms(incidents, incidentId);
  const start = startWorld(incidents, incidentId);
  const world = incident.mechanic === 'diagnose' ? caseWorld(start, incident.diagnose.cases[0]) : start;
  const runs = runFlows(world, incident.flows, known);
  return {
    incident,
    known,
    parts: configurableParts(known),
    start,
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
    caseIndex: 0,
    caseResults: [],
    named: [],
  };
}

/** Returns the case a diagnose incident is on; null for any other incident. */
export function currentCase({ incident, caseIndex }: Session): CaseSpec | null {
  return incident.mechanic === 'diagnose' ? incident.diagnose.cases[caseIndex] : null;
}

/** Returns what offers the send chips now: a send incident, or the case a diagnose is on; null for any other incident. */
export function sendingOf(session: Session): SendOwner | null {
  return session.incident.mechanic === 'send' ? session.incident : currentCase(session);
}

/** Returns the hints of what the player is on: the incident's, or those of the case of a diagnose. */
export function hintsOf({ incident, caseIndex }: Session): readonly TermText[] {
  return incident.mechanic === 'diagnose' ? incident.diagnose.cases[caseIndex].hints : incident.hints;
}

/** True when the player named the right cause of the case a diagnose is on. */
export function caseClosed(session: Session): boolean {
  return session.caseResults.length > session.caseIndex;
}

/** True when there is a hint left to show: not once all are shown, and not in a case already closed, whose hints no longer count. */
export function canAskHint(session: Session): boolean {
  return session.hintsShown < hintsOf(session).length && !caseClosed(session);
}

/** True when a device has this firewall, so it is on the map, and the ladder lets the player change the rules of its kind in this direction, or in either direction when none is given. */
export function canConfigure(session: Session, firewallId: string, direction?: Direction): boolean {
  const firewall = session.world.firewalls.find((candidate) => candidate.id === firewallId);
  if (firewall === undefined || !session.world.devices.some((device) => device.firewallIds.includes(firewallId))) return false;
  const { inboundRules, outboundRules } = session.parts;
  if (direction === undefined) return inboundRules[firewall.kind] || outboundRules[firewall.kind];
  return (direction === 'outbound' ? outboundRules : inboundRules)[firewall.kind];
}

/** True while a forbidden flow reaches its device. */
export function isIntruding(session: Session): boolean {
  return hasIntrusion(session.runs);
}

function move(state: Session, action: RuleMove): Session {
  if (state.phase !== 'playing' || !canConfigure(state, action.firewallId, action.direction ?? DEFAULT_DIRECTION)) return state;
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

/** Sends the packet of three chips: the last packet of each combination stays, and a new send takes Lucía's reply away. In a diagnose only the chips of the case the player is on can be sent. */
function send(state: Session, action: SendMove): Session {
  const offers = sendingOf(state);
  if (state.phase !== 'playing' || !offers) return state;
  const packet = sendPacket(state.world, offers, action, state.sends + 1, state.known);
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
  const { incident } = state;
  if (state.phase !== 'playing' || !isGuided(incident)) return state;
  const failing = failingTaskIds(incident.tasks, state.runs, state.sent, state.answers);
  if (failing.length === 0) return { ...state, phase: 'explaining', middle: earnsMiddle(state.incident, state.world, state.hintsShown), rejection: null };
  return { ...state, rejection: { attempt: (state.rejection?.attempt ?? 0) + 1, failingTaskIds: failing, intruding: hasIntrusion(state.runs) } };
}

function choose(state: Session, index: number): Session {
  const { incident } = state;
  const valid = isGuided(incident) && Number.isInteger(index) && index >= 0 && index < incident.explanation.length;
  return state.phase === 'explaining' && state.choice === null && valid ? { ...state, choice: index } : state;
}

/** Names an option as the cause of the case a diagnose is on. A wrong one is kept, to show its feedback, and the player tries again. The right one closes the case, with the options named and the hints asked in it; if it was the last case, the incident closes too. An option out of range, one already named, or any naming in a case already closed changes nothing. */
function nameCause(state: Session, index: number): Session {
  const spec = currentCase(state);
  const offered = spec !== null && Number.isInteger(index) && index >= 0 && index < spec.cause.options.length;
  if (state.phase !== 'playing' || !offered || caseClosed(state) || state.named.includes(index)) return state;
  const named = [...state.named, index];
  if (!spec.cause.options[index].correct) return { ...state, named };
  const caseResults = [...state.caseResults, { picks: named, hints: state.hintsShown }];
  const last = state.incident.mechanic === 'diagnose' && caseResults.length === state.incident.diagnose.cases.length;
  return last ? { ...state, named, caseResults, phase: 'explaining', middle: noHintInAnyCase(caseResults) } : { ...state, named, caseResults };
}

/** Opens the next case of a diagnose once the one before is closed: its world is the one the incident started from plus its own changes, and the packets sent and the hints asked belong to the case before. The send number goes on counting. */
function nextCase(state: Session): Session {
  const { incident } = state;
  if (state.phase !== 'playing' || incident.mechanic !== 'diagnose' || !caseClosed(state)) return state;
  const caseIndex = state.caseIndex + 1;
  const world = caseWorld(state.start, incident.diagnose.cases[caseIndex]);
  return { ...state, caseIndex, world, runs: runFlows(world, incident.flows, state.known), sent: [], hintsShown: 0, named: [] };
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
      return canAskHint(state) ? { ...state, hintsShown: state.hintsShown + 1 } : state;
    case 'chooseExplanation':
      return choose(state, action.index);
    case 'nameCause':
      return nameCause(state, action.index);
    case 'nextCase':
      return nextCase(state);
    case 'showResult':
      return state.phase === 'explaining' && (state.choice !== null || !isGuided(state.incident)) ? { ...state, phase: 'result' } : state;
  }
}

/** Returns the stars as they stand: closed, the middle star of the mechanic at the close (only what is needed, or no hints in the incident, or in any case of a diagnose), and the first explanation right (in a diagnose, the cause of every case named right at the first try). */
export function starsOf(session: Session): Stars {
  const { incident } = session;
  return {
    closed: session.phase !== 'playing',
    middle: session.middle,
    explained: isGuided(incident) ? session.choice !== null && incident.explanation[session.choice].correct : everyCauseAtFirstTry(session.caseResults, incident.diagnose.cases.length),
  };
}
