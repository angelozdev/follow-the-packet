import type { Trace, Verdict } from '../../engine/types';
import { OUTCOME_TEXT } from '../../format';

const MARK: Record<Verdict, string> = { pass: '✓', drop: '✕', reject: '⊘', info: '·' };

export function TraceList({ trace }: { trace: Trace }) {
  return (
    <section className="card" aria-labelledby="trace-title">
      <h3 id="trace-title">Recorrido</h3>
      <ol className="trace">
        {trace.steps.map((step, index) => (
          <li key={index} className={`trace__step trace__step--${step.verdict}`}>
            <span aria-hidden="true">{MARK[step.verdict]}</span> {step.reason}
          </li>
        ))}
      </ol>
      <p className="trace__outcome">{OUTCOME_TEXT[trace.outcome]}</p>
    </section>
  );
}
