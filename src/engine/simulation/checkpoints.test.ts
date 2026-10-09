import { describe, expect, it } from 'vitest';
import { deathPoint, stopStep } from './checkpoints';
import type { Trace } from './trace';

const base: Omit<Trace, 'steps' | 'outcome'> = {
  resolvedIp: '172.31.38.97',
  destinationId: 'servidor2',
  effectiveSource: '172.31.16.131',
  tcpdump: [],
};

describe('deathPoint', () => {
  it('is the first step that drops or rejects', () => {
    const trace: Trace = {
      ...base,
      outcome: 'timeout',
      steps: [
        { stage: 'route', at: 'vpc', verdict: 'pass', reason: { code: 'route-private' } },
        { stage: 'firewall-in', at: 'servidor2', verdict: 'drop', reason: { code: 'firewall-in-drop', deviceId: 'servidor2' } },
      ],
    };
    expect(deathPoint(trace)).toEqual({ stage: 'firewall-in', at: 'servidor2' });
  });

  it('when nothing stops it, it is the reply at the destination', () => {
    const trace: Trace = { ...base, outcome: 'replied', steps: [{ stage: 'reply', at: 'servidor2', verdict: 'pass', reason: { code: 'reply-stateful', deviceId: 'servidor2' } }] };
    expect(deathPoint(trace)).toEqual({ stage: 'reply', at: 'servidor2' });
  });
});

describe('stopStep', () => {
  it('is the step that dropped the packet', () => {
    const drop = { stage: 'firewall-in', at: 'servidor2', verdict: 'drop', reason: { code: 'firewall-in-drop', deviceId: 'servidor2' } } as const;
    const trace: Trace = { ...base, outcome: 'timeout', steps: [{ stage: 'route', at: 'vpc', verdict: 'pass', reason: { code: 'route-private' } }, drop] };
    expect(stopStep(trace)).toEqual(drop);
  });

  it('is undefined when nothing stopped it', () => {
    const trace: Trace = { ...base, outcome: 'replied', steps: [{ stage: 'reply', at: 'servidor2', verdict: 'pass', reason: { code: 'reply-stateful', deviceId: 'servidor2' } }] };
    expect(stopStep(trace)).toBeUndefined();
  });
});
