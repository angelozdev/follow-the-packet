import type { RefObject } from 'react';
import { LUCIA_TEXT, TERMS, TERM_ENTITY, type TermId, type TermText } from '@/copy';
import { Button, Card } from '@/design';
import { isIntruding, taskHolds, type Rejection, type Session } from '@/game';
import type { IncidentTask } from '@/levels';
import { EntityIcon } from '@/scene';
import { CardIcon } from '@/ui/card-icon';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

interface HintLineProps {
  number: number;
  text: TermText;
  lineRef?: RefObject<HTMLParagraphElement | null>;
}

interface LuciaCardProps {
  session: Session;
  onAskHint: () => void;
  onSubmit: () => void;
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

/** Orders the glossary: the terms this incident introduces first, then the earlier ones, each group by name. */
function glossaryOrder(known: ReadonlySet<TermId>, newTerms: ReadonlySet<TermId>): TermId[] {
  return [...known].sort((a, b) => Number(newTerms.has(b)) - Number(newTerms.has(a)) || byName(a, b));
}

function Glossary({ terms, newTerms }: { terms: TermId[]; newTerms: ReadonlySet<TermId> }) {
  return (
    <dl className="glossary">
      {terms.map((id) => {
        const entity = TERM_ENTITY[id];
        return (
          <div key={id}>
            <dt>
              {entity && <EntityIcon entity={entity} />}
              <span className="glossary__name">{TERMS[id].name}</span>
              {newTerms.has(id) && <>{' '}<span className="term__new">{LUCIA_TEXT.newBadge}</span></>}
            </dt>
            <dd>{TERMS[id].definition}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function RejectionReply({ rejection, tasks }: { rejection: Rejection; tasks: IncidentTask[] }) {
  return (
    <>
      {tasks
        .filter((task) => rejection.failingTaskIds.includes(task.id))
        .map((task) => (
          <p key={task.id}>
            <TaggedText text={LUCIA_TEXT.failing(task.text)} />
          </p>
        ))}
      {rejection.intruding && <p>{LUCIA_TEXT.intruding}</p>}
    </>
  );
}

export function LuciaCard({ session, onAskHint, onSubmit }: LuciaCardProps) {
  const { incident } = session;
  const newTerms = new Set(incident.introduces);
  return (
    <Card aria-labelledby="lucia-title" header={{ icon: <CardIcon kind="lucia" />, title: <h2 id="lucia-title">{LUCIA_TEXT.name}</h2>, meta: LUCIA_TEXT.role }}>
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
          const done = taskHolds(task, session.runs, session.sent);
          return (
            <li key={task.id} className="task">
              <span aria-hidden="true">{done ? '✓ ' : '☐ '}</span>
              <TaggedText text={task.text} newTerms={newTerms} />
              <span className="sr-only"> ({done ? LUCIA_TEXT.done : LUCIA_TEXT.pending})</span>
            </li>
          );
        })}
      </ul>
      {session.phase === 'playing' && (
        <Button variant="primary" onClick={onSubmit}>
          {LUCIA_TEXT.submit}
        </Button>
      )}
      <div role="status" className="lucia__reply">
        {session.rejection && <RejectionReply key={session.rejection.attempt} rejection={session.rejection} tasks={incident.tasks} />}
      </div>
      <details className="lucia__glossary">
        <summary className="caption">{LUCIA_TEXT.glossary}</summary>
        <Glossary terms={glossaryOrder(session.known, newTerms)} newTerms={newTerms} />
      </details>
      <div aria-live="polite">
        {incident.hints.slice(0, session.hintsShown).map((hint, index) => {
          const Line = index === incident.hints.length - 1 ? FocusedHintLine : HintLine;
          return <Line key={hint} number={index + 1} text={hint} />;
        })}
      </div>
      {session.hintsShown < incident.hints.length && (
        <Button variant="small" onClick={onAskHint}>
          {LUCIA_TEXT.askHint}
        </Button>
      )}
    </Card>
  );
}
