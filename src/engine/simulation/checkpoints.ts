import type { Checkpoint, Step, Trace } from './trace';

/** Returns the step where the packet was dropped or rejected, or undefined when nothing stopped it. */
export function stopStep(trace: Trace): Step | undefined {
  return trace.steps.find((s) => s.verdict === 'drop' || s.verdict === 'reject');
}

/** Returns where the packet stopped, or the reply at its destination when nothing stopped it. */
export function deathPoint(trace: Trace): Checkpoint {
  const step = stopStep(trace);
  if (step) return { stage: step.stage === 'nat' ? 'route' : step.stage, at: step.at };
  return { stage: 'reply', at: trace.destinationId ?? 'vpc' };
}
