import { sameCheckpoint } from '../engine/checkpoints';
import { scoreStars, type Stars } from '../engine/scoring';
import type { Checkpoint, Network, PacketSpec, Trace } from '../engine/types';
import { applyAction } from '../levels/apply';
import { evaluateAttack, evaluateDefender, type AttackerEvaluation, type DefenderEvaluation } from '../levels/evaluate';
import type { Level, LevelAction } from '../levels/schema';

export type Phase = 'brief' | 'predict' | 'act' | 'result';
export type Evaluation = DefenderEvaluation | AttackerEvaluation;

export interface GameState {
  level: Level;
  phase: Phase;
  network: Network;
  prediction: Checkpoint | null;
  /** Se calcula al predecir, contra la red inicial; relanzar no la cambia. */
  predictionCorrect: boolean | null;
  attempts: number;
  lastTrace: Trace | null;
  lastPacket: PacketSpec | null;
  evaluation: Evaluation | null;
  stars: Stars | null;
  /** 0-3; la tercera "pista" es la solución. */
  hintsShown: number;
}

export type GameAction =
  | { type: 'start' }
  | { type: 'predict'; point: Checkpoint }
  | { type: 'apply'; action: LevelAction }
  | { type: 'reset' }
  | { type: 'launch'; attack?: PacketSpec }
  | { type: 'retry' }
  | { type: 'showHint' };

export function initGame(level: Level): GameState {
  return {
    level,
    phase: 'brief',
    network: level.network,
    prediction: null,
    predictionCorrect: null,
    attempts: 0,
    lastTrace: null,
    lastPacket: null,
    evaluation: null,
    stars: null,
    hintsShown: 0,
  };
}

function launch(state: GameState, attack: PacketSpec | undefined): GameState {
  const { level } = state;
  const objective = level.objective;
  const attempts = state.attempts + 1;
  const prediction = state.predictionCorrect === true;
  if (objective.kind === 'defender') {
    const evaluation = evaluateDefender(level, state.network);
    const main = evaluation.mustPass[0];
    return {
      ...state,
      phase: 'result',
      attempts,
      evaluation,
      lastTrace: main.trace,
      lastPacket: main.packet,
      stars: scoreStars(evaluation.objective, evaluation.tight, prediction),
    };
  }
  if (!attack) return state;
  const evaluation = evaluateAttack(level, state.network, attack);
  return {
    ...state,
    phase: 'result',
    attempts,
    evaluation,
    lastTrace: evaluation.trace,
    lastPacket: attack,
    stars: scoreStars(evaluation.objective, attempts <= objective.maxAttempts, prediction),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      return state.phase === 'brief' ? { ...state, phase: 'predict' } : state;
    case 'predict':
      if (state.phase !== 'predict') return state;
      return {
        ...state,
        phase: 'act',
        prediction: action.point,
        predictionCorrect: sameCheckpoint(action.point, state.level.prediction.answer),
      };
    case 'apply':
      return state.phase === 'act' ? { ...state, network: applyAction(state.network, action.action) } : state;
    case 'reset':
      return state.phase === 'act' ? { ...state, network: state.level.network } : state;
    case 'launch':
      return state.phase === 'act' ? launch(state, action.attack) : state;
    case 'retry':
      return state.phase === 'result' ? { ...state, phase: 'act' } : state;
    case 'showHint':
      return { ...state, hintsShown: Math.min(3, state.hintsShown + 1) };
  }
}
