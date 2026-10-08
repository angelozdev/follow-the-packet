import { describe, expect, it } from 'vitest';
import { deathPoint, sameCheckpoint } from './checkpoints';
import type { Trace } from './types';

const base: Omit<Trace, 'steps' | 'outcome'> = {
  resolvedIp: '172.31.38.97',
  destinationId: 'servidor2',
  effectiveSource: '172.31.16.131',
  tcpdump: [],
};

describe('deathPoint', () => {
  it('es el primer paso que descarta o rechaza', () => {
    const trace: Trace = {
      ...base,
      outcome: 'timeout',
      steps: [
        { stage: 'route', at: 'vpc', verdict: 'pass', reason: '' },
        { stage: 'sg-in', at: 'servidor2', verdict: 'drop', reason: '' },
      ],
    };
    expect(deathPoint(trace)).toEqual({ stage: 'sg-in', at: 'servidor2' });
  });

  it('si nada lo frena, es la respuesta en el destino', () => {
    const trace: Trace = { ...base, outcome: 'replied', steps: [{ stage: 'reply', at: 'servidor2', verdict: 'pass', reason: '' }] };
    expect(deathPoint(trace)).toEqual({ stage: 'reply', at: 'servidor2' });
  });
});

describe('sameCheckpoint', () => {
  it('compara etapa y pieza', () => {
    expect(sameCheckpoint({ stage: 'sg-in', at: 'a' }, { stage: 'sg-in', at: 'a' })).toBe(true);
    expect(sameCheckpoint({ stage: 'sg-in', at: 'a' }, { stage: 'linux', at: 'a' })).toBe(false);
  });
});
