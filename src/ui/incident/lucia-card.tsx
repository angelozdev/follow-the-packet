import { LUCIA_TEXT, TERMS } from '@/copy';
import { STABLE_MS, isIntruding, isStable, type Session } from '@/game';
import { TaggedText } from '@/ui/tagged-text';

export function LuciaCard({ session, onAskHint }: { session: Session; onAskHint: () => void }) {
  const { incident } = session;
  const newTerms = new Set(incident.introduces);
  return (
    <section className="card lucia" aria-labelledby="lucia-title">
      <h2 id="lucia-title">
        {LUCIA_TEXT.name} <span className="muted">· {LUCIA_TEXT.role}</span>
      </h2>
      <p>
        <TaggedText text={incident.report} newTerms={newTerms} />
      </p>
      {isIntruding(session) && (
        <p key={session.alerts} role="alert" className="lucia__alert">
          {LUCIA_TEXT.intrusion}
        </p>
      )}
      <h3>{LUCIA_TEXT.tasks}</h3>
      <ul className="tasks">
        {incident.tasks.map((task) => {
          const ms = session.taskMs[task.id] ?? 0;
          const done = isStable(ms);
          return (
            <li key={task.id} className="task">
              <span aria-hidden="true">{done ? '✓ ' : '☐ '}</span>
              <TaggedText text={task.text} newTerms={newTerms} />
              <span className="sr-only"> ({done ? LUCIA_TEXT.done : LUCIA_TEXT.pending})</span>
              <progress aria-label={LUCIA_TEXT.steady} max={STABLE_MS} value={ms} />
            </li>
          );
        })}
      </ul>
      <h3>{LUCIA_TEXT.newTerms}</h3>
      <dl className="glossary">
        {incident.introduces.map((id) => (
          <div key={id}>
            <dt>
              {TERMS[id].name} <span className="term__new">{LUCIA_TEXT.newBadge}</span>
            </dt>
            <dd>{TERMS[id].definition}</dd>
          </div>
        ))}
      </dl>
      <div aria-live="polite">
        {incident.hints.slice(0, session.hintsShown).map((hint, index) => (
          <p key={hint} className="hint">
            <strong>{LUCIA_TEXT.hint(index + 1)}</strong> <TaggedText text={hint} />
          </p>
        ))}
      </div>
      {session.hintsShown < incident.hints.length && (
        <button type="button" className="btn btn--small" onClick={onAskHint}>
          {LUCIA_TEXT.askHint}
        </button>
      )}
    </section>
  );
}
