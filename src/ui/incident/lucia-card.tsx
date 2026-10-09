import type { RefObject } from 'react';
import { LUCIA_TEXT, TERMS, type TermId, type TermText } from '@/copy';
import { STABLE_MS, isIntruding, isStable, type Session } from '@/game';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

interface HintLineProps {
  number: number;
  text: TermText;
  lineRef?: RefObject<HTMLParagraphElement | null>;
}

function HintLine({ number, text, lineRef }: HintLineProps) {
  return (
    <p ref={lineRef} tabIndex={lineRef ? -1 : undefined} className="hint">
      <strong>{LUCIA_TEXT.hint(number)}</strong> <TaggedText text={text} />
    </p>
  );
}

function FocusedHintLine({ number, text }: HintLineProps) {
  const line = useFocusOnMount<HTMLParagraphElement>();
  return <HintLine number={number} text={text} lineRef={line} />;
}

function byName(a: TermId, b: TermId): number {
  return TERMS[a].name.localeCompare(TERMS[b].name, 'es');
}

function TermList({ terms, markNew }: { terms: TermId[]; markNew: boolean }) {
  return (
    <dl className="glossary">
      {terms.map((id) => (
        <div key={id}>
          <dt>
            {TERMS[id].name}
            {markNew && <>{' '}<span className="term__new">{LUCIA_TEXT.newBadge}</span></>}
          </dt>
          <dd>{TERMS[id].definition}</dd>
        </div>
      ))}
    </dl>
  );
}

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
      <TermList terms={incident.introduces} markNew />
      <details className="lucia__glossary">
        <summary>{LUCIA_TEXT.glossary}</summary>
        <TermList terms={[...session.known].sort(byName)} markNew={false} />
      </details>
      <div aria-live="polite">
        {incident.hints.slice(0, session.hintsShown).map((hint, index) => {
          const Line = index === incident.hints.length - 1 ? FocusedHintLine : HintLine;
          return <Line key={hint} number={index + 1} text={hint} />;
        })}
      </div>
      {session.hintsShown < incident.hints.length && (
        <button type="button" className="btn btn--small" onClick={onAskHint}>
          {LUCIA_TEXT.askHint}
        </button>
      )}
    </section>
  );
}
