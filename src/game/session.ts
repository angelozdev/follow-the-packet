import type { TermId } from '@/copy';
import type { Network } from '@/engine';
import { applyMove, configurableParts, knownTerms, startWorld, type ConfigurableParts, type Incident, type PlayerMove } from '@/levels';
import { runFlows, type FlowRun } from './flow-runs';
import { isTight, type Stars } from './stars';
import { advanceTasks, isStable } from './tasks';

export type SessionPhase = 'playing' | 'explaining' | 'result';

export interface Session {
  incident: Incident;
  known: ReadonlySet<TermId>;
  parts: ConfigurableParts;
  world: Network;
  runs: FlowRun[];
  taskMs: Record<string, number>;
  alerts: number;
  hintsShown: number;
  phase: SessionPhase;
  tight: boolean;
  choice: number | null;
}

export type SessionAction =
  | PlayerMove
  | { type: 'tick'; ms: number }
  | { type: 'showHint' }
  | { type: 'chooseExplanation'; index: number }
  | { type: 'showResult' };

function hasIntrusion(runs: FlowRun[]): boolean {
  return runs.some((run) => run.kind === 'forbidden' && run.reached);
}

/** Starts an incident from its canonical world, with every task at zero. */
export function startSession(incidents: Incident[], incidentId: string): Session {
  const incident = incidents.find((i) => i.id === incidentId);
  if (!incident) throw new Error(`unknown incident ${incidentId}`);
  const known = knownTerms(incidents, incidentId);
  const world = startWorld(incidents, incidentId);
  const runs = runFlows(world, incident.flows);
  return {
    incident,
    known,
    parts: configurableParts(known),
    world,
    runs,
    taskMs: Object.fromEntries(incident.tasks.map((task) => [task.id, 0])),
    alerts: hasIntrusion(runs) ? 1 : 0,
    hintsShown: 0,
    phase: 'playing',
    tight: false,
    choice: null,
  };
}

/** True when the door of this security group is on the map and the ladder lets the player change its inbound rules. */
export function canConfigure(session: Session, sgId: string): boolean {
  return session.parts.inboundRules && session.world.instances.some((instance) => instance.sgIds.includes(sgId));
}

/** True while a forbidden flow reaches its server. */
export function isIntruding(session: Session): boolean {
  return hasIntrusion(session.runs);
}

function move(state: Session, action: PlayerMove): Session {
  if (state.phase !== 'playing' || !canConfigure(state, action.sgId)) return state;
  const world = applyMove(state.world, state.incident, action);
  if (world === state.world) return state;
  const runs = runFlows(world, state.incident.flows);
  const startsEpisode = hasIntrusion(runs) && !hasIntrusion(state.runs);
  return { ...state, world, runs, alerts: state.alerts + (startsEpisode ? 1 : 0) };
}

function tick(state: Session, ms: number): Session {
  if (state.phase !== 'playing') return state;
  const taskMs = advanceTasks(state.incident.tasks, state.runs, state.taskMs, ms);
  if (!Object.values(taskMs).every(isStable)) return { ...state, taskMs };
  return { ...state, taskMs, phase: 'explaining', tight: isTight(state.world, state.incident.flows) };
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
    case 'tick':
      return tick(state, action.ms);
    case 'showHint':
      return { ...state, hintsShown: Math.min(state.hintsShown + 1, state.incident.hints.length) };
    case 'chooseExplanation':
      return choose(state, action.index);
    case 'showResult':
      return state.phase === 'explaining' && state.choice !== null ? { ...state, phase: 'result' } : state;
  }
}

/** Returns the stars as they stand: closed, only what is needed at the close, and the first explanation right. */
export function starsOf(session: Session): Stars {
  return {
    closed: session.phase !== 'playing',
    tight: session.tight,
    explained: session.choice !== null && session.incident.explanation[session.choice].correct,
  };
}
