import { describe, expect, it } from 'vitest';
import level01 from '../levels/04-iaas/01-where-ping-dies';
import level07 from '../levels/04-iaas/07-default-club';
import { gameReducer, initGame, type GameAction, type GameState } from './reducer';

const play = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);
const solution01 = level01.solution.kind === 'defender' ? level01.solution.actions[0] : undefined;

describe('gameReducer', () => {
  it('sigue las fases brief → predecir → actuar → resultado', () => {
    let state = initGame(level01);
    expect(state.phase).toBe('brief');
    state = play(state, { type: 'start' });
    expect(state.phase).toBe('predict');
    state = play(state, { type: 'predict', point: level01.prediction.answer });
    expect(state.phase).toBe('act');
    expect(state.predictionCorrect).toBe(true);
    state = play(state, { type: 'apply', action: solution01! }, { type: 'launch' });
    expect(state.phase).toBe('result');
    expect(state.stars?.count).toBe(3);
  });

  it('ignora acciones fuera de su fase', () => {
    const state = initGame(level01);
    expect(play(state, { type: 'launch' })).toBe(state);
    expect(play(state, { type: 'apply', action: solution01! })).toBe(state);
  });

  it('la predicción solo cuenta la primera vez; relanzar no la cambia (Review Focus 3)', () => {
    let state = play(initGame(level01), { type: 'start' }, { type: 'predict', point: { stage: 'linux', at: 'servidor2' } });
    expect(state.predictionCorrect).toBe(false);
    state = play(state, { type: 'launch' }, { type: 'retry' }, { type: 'predict', point: level01.prediction.answer });
    expect(state.predictionCorrect).toBe(false);
    state = play(state, { type: 'apply', action: solution01! }, { type: 'launch' });
    expect(state.stars?.count).toBe(2);
    expect(state.attempts).toBe(2);
  });

  it('deshacer cambios vuelve a la red inicial', () => {
    let state = play(initGame(level01), { type: 'start' }, { type: 'predict', point: level01.prediction.answer });
    state = play(state, { type: 'apply', action: solution01! }, { type: 'reset' });
    expect(state.network).toEqual(level01.network);
  });

  it('las pistas llegan como máximo a 3 (la tercera es la solución)', () => {
    const state = play(initGame(level01), { type: 'showHint' }, { type: 'showHint' }, { type: 'showHint' }, { type: 'showHint' });
    expect(state.hintsShown).toBe(3);
  });

  it('el atacante que se pasa de intentos gana sin la segunda estrella (Review Focus 5)', () => {
    const wrong = level07.prediction.packet;
    const right = level07.solution.kind === 'attacker' ? level07.solution.packet : wrong;
    let state = play(initGame(level07), { type: 'start' }, { type: 'predict', point: level07.prediction.answer });
    state = play(state, { type: 'launch', attack: wrong }, { type: 'retry' }, { type: 'launch', attack: wrong }, { type: 'retry' });
    state = play(state, { type: 'launch', attack: right });
    expect(state.attempts).toBe(3);
    expect(state.stars).toEqual({ objective: true, tight: false, prediction: true, count: 2 });
  });

  it('un atacante no puede lanzar sin paquete', () => {
    const state = play(initGame(level07), { type: 'start' }, { type: 'predict', point: level07.prediction.answer });
    expect(play(state, { type: 'launch' })).toBe(state);
  });
});
