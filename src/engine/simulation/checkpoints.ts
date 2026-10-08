import type { Checkpoint, Trace } from './trace';

/** Returns where the packet stopped, or the reply at its destination when nothing stopped it. */
export function deathPoint(trace: Trace): Checkpoint {
  const stopStep = trace.steps.find((s) => s.verdict === 'drop' || s.verdict === 'reject');
  if (stopStep) return { stage: stopStep.stage === 'nat' ? 'route' : stopStep.stage, at: stopStep.at };
  return { stage: 'reply', at: trace.destinationId ?? 'vpc' };
}
