import type { Checkpoint, Trace } from './trace';

/** Dónde murió el paquete; si no murió, la respuesta en el destino. */
export function deathPoint(trace: Trace): Checkpoint {
  const stopStep = trace.steps.find((s) => s.verdict === 'drop' || s.verdict === 'reject');
  if (stopStep) return { stage: stopStep.stage === 'nat' ? 'route' : stopStep.stage, at: stopStep.at };
  return { stage: 'reply', at: trace.destinationId ?? 'vpc' };
}
