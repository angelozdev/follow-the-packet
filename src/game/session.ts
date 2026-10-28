import { RESTART_TEXT, deviceName, type RestartKind, type TermId, type TermText } from '@/copy';
import { DEFAULT_DIRECTION, type Direction, type Network } from '@/engine';
import {
  applyMove,
  caseWorld,
  configurableParts,
  editedPart,
  isGuided,
  knownTerms,
  placementProblem,
  revealsRoutersByTraceroute,
  startWorld,
  type AnswerMove,
  type CaseSpec,
  type ClockStep,
  type ConfigurableParts,
  type EntryProblem,
  type IdentifyIncident,
  type Incident,
  type PlayerMove,
  type RuleMove,
  type SendMove,
  type SendOwner,
  type SettingMove,
  type TableMove,
  type WaitMove,
} from '@/levels';
import { dispatchOf, hideStopsOutOfSight, lastOfEach, offersSend, runFlows, sendSequence, type FlowRun, type SentPacket } from './flow-runs';
import { earnsMiddle, everyCauseAtFirstTry, noHintInAnyCase, type CaseResult, type Stars } from './stars';
import { failingTaskIds, type Answers } from './tasks';

export type SessionPhase = 'playing' | 'explaining' | 'result';

export interface Rejection {
  attempt: number;
  failingTaskIds: string[];
  intruding: boolean;
}

/** The entry of a table that the engine did not take, and why: the table it was placed in and the code of the problem. The view says it in words; the session keeps only the code. */
export interface TableProblem {
  tableId: string;
  code: EntryProblem;
}

/** The part of the network whose change emptied sends that were not empty: its kind and the id of the device, router or server that holds it. */
export interface Restart {
  kind: RestartKind;
  ownerId: string;
}

/** A line of the log of the world that is no send, with the number of sends made until then, so it comes after the send of that number and before the next one: the change whose edit emptied sends that were not empty, or the entry of a table that the engine refused. */
export type LogEntry = { kind: 'change'; restart: Restart; sends: number } | { kind: 'rejection'; problem: TableProblem; sends: number };

export interface Session {
  incident: Incident;
  known: ReadonlySet<TermId>;
  parts: ConfigurableParts;
  start: Network;
  world: Network;
  runs: FlowRun[];
  sent: SentPacket[];
  history: SentPacket[];
  sends: number;
  clock: number;
  entryProblem: TableProblem | null;
  restart: Restart | null;
  log: LogEntry[];
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

/** Returns the session with the stop of every run hidden that the player cannot place: in an incident whose routers wait for a traceroute, a packet that vanished at a router out of sight keeps its stop hidden before and after a traceroute. The same session when nothing changes, and always for any other incident. */
function hideStops(state: Session): Session {
  if (!revealsRoutersByTraceroute(state.incident)) return state;
  const runs = hideStopsOutOfSight(state.incident, state.runs);
  const sent = hideStopsOutOfSight(state.incident, state.sent);
  const history = hideStopsOutOfSight(state.incident, state.history);
  return runs === state.runs && sent === state.sent && history === state.history ? state : { ...state, runs, sent, history };
}

/** Starts an incident from its canonical world, with Lucía's reply empty and every initial pick of its cards as the answer saved. A diagnose starts at its first case, whose world is the one the incident starts from plus the changes of that case. */
export function startSession(incidents: Incident[], incidentId: string): Session {
  const incident = incidents.find((i) => i.id === incidentId);
  if (!incident) throw new Error(`unknown incident ${incidentId}`);
  const known = knownTerms(incidents, incidentId);
  const start = startWorld(incidents, incidentId);
  const world = incident.mechanic === 'diagnose' ? caseWorld(start, incident.diagnose.cases[0]) : start;
  const runs = runFlows(world, incident.flows, known);
  return hideStops({
    incident,
    known,
    parts: configurableParts(known),
    start,
    world,
    runs,
    sent: [],
    history: [],
    sends: 0,
    clock: 0,
    entryProblem: null,
    restart: null,
    log: [],
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
  });
}

/** Returns the case a diagnose incident is on; null for any other incident. */
export function currentCase({ incident, caseIndex }: Session): CaseSpec | null {
  return incident.mechanic === 'diagnose' ? incident.diagnose.cases[caseIndex] : null;
}

/** Returns what offers the send chips now: a send incident, or the case a diagnose is on; null for any other incident. */
export function sendingOf(session: Session): SendOwner | null {
  return session.incident.mechanic === 'send' ? session.incident : currentCase(session);
}

/** Returns the notice that the sends start again, naming the device whose change emptied sends that were not empty; null when no change did, or when the player has sent since. */
export function restartNotice({ restart, world, known }: Session): TermText | null {
  return restart && RESTART_TEXT.notice(restart.kind, deviceName(world, restart.ownerId), known);
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

/** True when a device has this firewall, so it is on the map, and the ladder lets the player change the rules of its kind in this direction, or in either direction when none is given. Never in a diagnose, where the player changes nothing in the world: its firewalls are inspected, not configured. */
export function canConfigure(session: Session, firewallId: string, direction?: Direction): boolean {
  const firewall = session.world.firewalls.find((candidate) => candidate.id === firewallId);
  if (session.incident.mechanic === 'diagnose' || firewall === undefined || !session.world.devices.some((device) => device.firewallIds.includes(firewallId))) return false;
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
  const next = withNewWorld(state, world, action);
  const startsEpisode = hasIntrusion(next.runs) && !hasIntrusion(state.runs);
  return { ...next, alerts: state.alerts + (startsEpisode ? 1 : 0) };
}

/** Clears the sends once the world has changed: the stamps of the packets sent before described the old world, and with them go the translation table and the cache that came from them. The game clock does not go back, and the send number goes on counting. When the sends were not empty it keeps what the move edited as `restart`, so the card of the tasks says why they start again, and as the first line of a new `log`; the refusals before the change go with the sends. An earlier `restart` and its line stay until the player sends. */
function withNewWorld(state: Session, world: Network, action: SettingMove | TableMove | RuleMove): Session {
  const edited = state.history.length > 0 ? editedPart(world, state.incident, action, currentCase(state)) : undefined;
  const log: LogEntry[] = edited ? [{ kind: 'change', restart: edited, sends: state.sends }] : state.log.filter(({ kind }) => kind === 'change');
  return { ...state, world, runs: runFlows(world, state.incident.flows, state.known), sent: [], history: [], rejection: null, entryProblem: null, restart: edited ?? state.restart, log };
}

/** Keeps the problem of an entry the engine refused, and a line of the log for it, unless it is the one just refused with no send since. A refusal the incident gives nothing to explain leaves the session as it was. */
function withProblem(state: Session, action: SettingMove | TableMove): Session {
  if (action.type !== 'placeEntry') return state;
  const code = placementProblem(state.world, state.incident, action, currentCase(state));
  if (code === undefined) return state;
  const problem = { tableId: action.tableId, code };
  const last = state.log.at(-1);
  if (last?.kind === 'rejection' && last.sends === state.sends && last.problem.tableId === problem.tableId && last.problem.code === code) return state;
  return { ...state, entryProblem: problem, log: [...state.log, { kind: 'rejection', problem, sends: state.sends }] };
}

/** True when the player can change the world from the cards of the pieces: in a send incident that is still open, and in a diagnose only in a case that has a fix and is not closed yet, where the tables of the fix are all there is to edit. The session refuses every other edit, and the cards of the tables read this same fact to offer no control that would do nothing. */
export function canEdit(state: Session): boolean {
  if (state.phase !== 'playing') return false;
  return state.incident.mechanic === 'send' || (currentCase(state)?.fix !== undefined && !caseClosed(state));
}

/** Changes the world with something the player sets or edits on a card of a piece: a setting, or an entry placed in or removed from a table (in a diagnose, a table of the fix of the case in play). The flows are run again and the sends are gone, but the clock stays. A move that changes nothing returns the same session, though an entry the engine refuses keeps its problem for the table to show. */
function edit(state: Session, action: SettingMove | TableMove): Session {
  if (!canEdit(state)) return state;
  const world = applyMove(state.world, state.incident, action, currentCase(state));
  return world === state.world ? withProblem(state, action) : withNewWorld(state, world, action);
}

/** Returns the steps of the clock of the incident, which the player waits by; none when the incident has no clock, and none for any other mechanic than a send. */
export function clockSteps({ incident }: Session): ClockStep[] {
  return incident.mechanic === 'send' ? (incident.send.clock?.steps ?? []) : [];
}

/** Moves the game clock on by one of the steps of the incident's clock. A time that is no step, an incident with no clock and a closed incident change nothing. */
function wait(state: Session, { seconds }: WaitMove): Session {
  return state.phase === 'playing' && clockSteps(state).some((step) => step.seconds === seconds) ? { ...state, clock: state.clock + seconds } : state;
}

/** Sends the packet of three chips at the second the clock is on. Every send since the world last changed is simulated again, in order, so each one starts from what the ones before left (`sendSequence`); the last packet of each combination stays in `sent`, and a new send takes Lucía's reply away. In a diagnose only the chips of the case the player is on can be sent. */
function send(state: Session, action: SendMove): Session {
  const offers = sendingOf(state);
  if (state.phase !== 'playing' || !offers || !offersSend(offers, action)) return state;
  const sends = state.sends + 1;
  const history = sendSequence(state.world, offers, [...state.history.map(dispatchOf), { move: action, send: sends, at: state.clock }], state.known);
  return closeCaseIfDone({ ...state, history, sent: lastOfEach(history), sends, rejection: null, restart: null });
}

function offeredPicks({ identify }: IdentifyIncident, { deviceId, picks }: AnswerMove): Record<string, string> {
  const card = identify.cards.find((candidate) => candidate.deviceId === deviceId);
  const { classify } = identify;
  const sortsIt = classify?.items.includes(deviceId) ?? false;
  const offered = Object.entries(picks).filter(
    ([trayId, chipId]) => card?.trays.find((tray) => tray.id === trayId)?.chips.some((chip) => chip.id === chipId) || (sortsIt && trayId === classify?.trayId && classify.bins.some((bin) => bin.id === chipId)),
  );
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
  const failing = failingTaskIds(incident.tasks, state.runs, state.history, state.answers);
  if (failing.length === 0) return { ...state, phase: 'explaining', middle: earnsMiddle(state.incident, state.world, state.hintsShown), rejection: null };
  return { ...state, rejection: { attempt: (state.rejection?.attempt ?? 0) + 1, failingTaskIds: failing, intruding: hasIntrusion(state.runs) } };
}

function choose(state: Session, index: number): Session {
  const { incident } = state;
  const valid = isGuided(incident) && Number.isInteger(index) && index >= 0 && index < incident.explanation.length;
  return state.phase === 'explaining' && state.choice === null && valid ? { ...state, choice: index } : state;
}

/** True when the player named the right cause of the case a diagnose is on, whether or not the case is closed: a case with a fix stays open until the fix holds too. */
export function causeNamed(session: Session): boolean {
  const spec = currentCase(session);
  return spec !== null && session.named.some((index) => spec.cause.options[index].correct);
}

/** Returns the tasks of the fix of the case a diagnose is on that do not hold in the sends since the world last changed (`Session.history`); none when every one holds, and none for a case with no fix. */
export function failingFixTaskIds(session: Session): string[] {
  return failingTaskIds(currentCase(session)?.fix?.tasks ?? [], session.runs, session.history);
}

/** Closes the case a diagnose is on when it is ready: the right cause is named and every task of its fix holds (a case with no fix has none, so the cause alone closes it). It pushes `{ picks, hints }` onto `caseResults` once, whatever order the player did the two things in, and when it is the last case it closes the incident and settles the middle star. A case already closed, a case still missing the cause or the fix, and any other incident return the same session. */
function closeCaseIfDone(state: Session): Session {
  const { incident } = state;
  if (state.phase !== 'playing' || incident.mechanic !== 'diagnose' || caseClosed(state) || !causeNamed(state) || failingFixTaskIds(state).length > 0) return state;
  const caseResults = [...state.caseResults, { picks: state.named, hints: state.hintsShown }];
  const last = caseResults.length === incident.diagnose.cases.length;
  return last ? { ...state, caseResults, phase: 'explaining', middle: noHintInAnyCase(caseResults) } : { ...state, caseResults };
}

/** Names an option as the cause of the case a diagnose is on. A wrong one is kept, to show its feedback, and the player tries another. The right one is kept too, and the case closes when its fix holds as well (at once for a case with no fix); until then no other cause can be named, so the right one is always the last of the options named. An option out of range, one already named, any naming in a case already closed and any naming once the right cause is kept changes nothing. */
function nameCause(state: Session, index: number): Session {
  const spec = currentCase(state);
  const offered = spec !== null && Number.isInteger(index) && index >= 0 && index < spec.cause.options.length;
  if (state.phase !== 'playing' || !offered || caseClosed(state) || causeNamed(state) || state.named.includes(index)) return state;
  return closeCaseIfDone({ ...state, named: [...state.named, index] });
}

/** Opens the next case of a diagnose once the one before is closed: its world is the one the incident started from plus its own changes, and the packets sent, the hints asked and the log belong to the case before. The send number goes on counting. */
function nextCase(state: Session): Session {
  const { incident } = state;
  if (state.phase !== 'playing' || incident.mechanic !== 'diagnose' || !caseClosed(state)) return state;
  const caseIndex = state.caseIndex + 1;
  const world = caseWorld(state.start, incident.diagnose.cases[caseIndex]);
  return { ...state, caseIndex, world, runs: runFlows(world, incident.flows, state.known), sent: [], history: [], entryProblem: null, log: [], hintsShown: 0, named: [] };
}

function reduce(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'placeRule':
    case 'removeRule':
      return move(state, action);
    case 'sendPacket':
      return send(state, action);
    case 'setSetting':
    case 'placeEntry':
    case 'removeEntry':
      return edit(state, action);
    case 'wait':
      return wait(state, action);
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

export function sessionReducer(state: Session, action: SessionAction): Session {
  return hideStops(reduce(state, action));
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
