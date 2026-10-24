import type { RefObject } from 'react';
import { LUCIA_TEXT, MESSAGE_TEXT, TERMS, TERM_ENTITY, termsIn, type TermId, type TermText } from '@/copy';
import { Button, Card, Message } from '@/design';
import { canAskHint, hintsOf, isIntruding, taskHolds, type Rejection, type Session } from '@/game';
import { isGuided, type IncidentTask } from '@/levels';
import { EntityIcon } from '@/scene';
import { CardIcon } from '@/ui/card-icon';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';

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

/** Returns, for each text in the order the card shows it, the new terms it marks: those that appear in it for the first time on the card, so a term is marked once however many texts use it. */
function newTermsFirstSeen(texts: TermText[], newTerms: ReadonlySet<TermId>): ReadonlySet<TermId>[] {
  const unseen = new Set(newTerms);
  return texts.map((text) => {
    const firstSeen = new Set(termsIn(text).filter((id) => unseen.has(id)));
    firstSeen.forEach((id) => unseen.delete(id));
    return firstSeen;
  });
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
          <Message key={task.id} variant="error" words={MESSAGE_TEXT}>
            <TaggedText text={LUCIA_TEXT.failing(task.text)} />
          </Message>
        ))}
      {rejection.intruding && (
        <Message variant="error" words={MESSAGE_TEXT}>
          {LUCIA_TEXT.intruding}
        </Message>
      )}
    </>
  );
}

export function LuciaCard({ session, onAskHint, onSubmit }: LuciaCardProps) {
  const { incident } = session;
  const withTasks = isGuided(incident) ? incident : null;
  const hints = hintsOf(session);
  const newTerms = new Set(incident.introduces);
  const [reportTerms, ...taskTerms] = newTermsFirstSeen([incident.report, ...(withTasks?.tasks.map((task) => task.text) ?? [])], newTerms);
  return (
    <Card aria-labelledby="lucia-title" header={{ icon: <CardIcon kind="lucia" />, title: <h2 id="lucia-title">{LUCIA_TEXT.name}</h2>, meta: LUCIA_TEXT.role }}>
      <p>
        <TaggedText text={incident.report} newTerms={reportTerms} />
      </p>
      {isIntruding(session) && (
        <Message key={session.alerts} variant="error" words={MESSAGE_TEXT} role="alert">
          {LUCIA_TEXT.intrusion}
        </Message>
      )}
      {withTasks && (
        <>
          <h3>{LUCIA_TEXT.tasks}</h3>
          <ul className="tasks">
            {withTasks.tasks.map((task, index) => {
              const done = taskHolds(task, session.runs, session.history, session.answers);
              return (
                <li key={task.id} className="task">
                  <span aria-hidden="true">{done ? '✓ ' : '☐ '}</span>
                  <TaggedText text={task.text} newTerms={taskTerms[index]} />
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
            {session.rejection && <RejectionReply key={session.rejection.attempt} rejection={session.rejection} tasks={withTasks.tasks} />}
          </div>
        </>
      )}
      <details className="lucia__glossary">
        <summary className="caption">{LUCIA_TEXT.glossary}</summary>
        <Glossary terms={glossaryOrder(session.known, newTerms)} newTerms={newTerms} />
      </details>
      <div aria-live="polite">
        {hints.slice(0, session.hintsShown).map((hint, index) => {
          const Line = index === hints.length - 1 ? FocusedHintLine : HintLine;
          return <Line key={hint} number={index + 1} text={hint} />;
        })}
      </div>
      {canAskHint(session) && (
        <Button variant="small" onClick={onAskHint}>
          {LUCIA_TEXT.askHint}
        </Button>
      )}
    </Card>
  );
}
