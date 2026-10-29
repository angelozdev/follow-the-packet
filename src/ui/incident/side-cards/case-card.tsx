import { useState } from 'react';
import { CASE_TEXT, EXPLANATION_TEXT, type TermText } from '@/copy';
import { Button, Card } from '@/design';
import type { CaseCard as Case, CaseRepair } from '@/game';
import { CardIcon } from '@/ui/card-icon';
import { TaggedText } from '@/ui/tagged-text';
import { ContinueButton, OptionList, type OptionLine } from './explanation-card';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';

interface CaseCardProps {
  card: Case;
  onNameCause: (index: number) => void;
  onNext: () => void;
  onShowResult: () => void;
  hidden?: boolean;
}

interface Tick {
  key: string;
  text: TermText;
  ticked: boolean;
}

interface TickListProps {
  items: Tick[];
  code?: boolean;
  said: { ticked: string; unticked: string };
}

function TickList({ items, code = false, said }: TickListProps) {
  return (
    <ul className="tasks">
      {items.map((item) => {
        const text = <TaggedText text={item.text} ips={!code} />;
        return (
          <li key={item.key} className="task">
            <span aria-hidden="true">{item.ticked ? '✓ ' : '☐ '}</span>
            {code ? <code>{text}</code> : text}
            <span className="sr-only"> ({item.ticked ? said.ticked : said.unticked})</span>
          </li>
        );
      })}
    </ul>
  );
}

function Tests({ origin }: { origin: Case['origins'][number] }) {
  return (
    <>
      <h3>
        <TaggedText text={CASE_TEXT.tests(origin.name)} />
      </h3>
      <TickList code items={origin.tests.map((test) => ({ key: `${test.toId}-${test.messageId}`, text: test.line, ticked: test.sent }))} said={{ ticked: CASE_TEXT.sent, unticked: CASE_TEXT.unsent }} />
    </>
  );
}

function Repair({ repair, waiting }: { repair: CaseRepair; waiting: boolean }) {
  return (
    <>
      <h3>{CASE_TEXT.repair}</h3>
      <p>
        <TaggedText text={CASE_TEXT.editIn(repair.tables.map((table) => table.title))} />
      </p>
      <TickList items={repair.tasks.map((task) => ({ key: task.id, text: task.text, ticked: task.done }))} said={{ ticked: CASE_TEXT.holds, unticked: CASE_TEXT.pending }} />
      {waiting && <p className="muted">{CASE_TEXT.causeNamed}</p>}
    </>
  );
}

function optionLines({ options }: Case): OptionLine[] {
  const rightNamed = options.some((option) => option.state === 'right');
  return options.map((option) => ({
    text: option.text,
    correct: option.state === 'right',
    pressed: option.state !== 'untried',
    disabled: rightNamed || option.state !== 'untried',
    feedback: option.feedback,
  }));
}

function Question({ card, onNameCause }: Pick<CaseCardProps, 'card' | 'onNameCause'>) {
  const question = useFocusOnMount<HTMLParagraphElement>();
  return (
    <>
      <p ref={question} tabIndex={-1}>
        <TaggedText text={EXPLANATION_TEXT.asks(card.question)} />
      </p>
      <OptionList options={optionLines(card)} onPick={onNameCause} />
    </>
  );
}

/** The card of the case a diagnose is on, in the side panel: its number, what Lucía reports and the tests the origin can send, each marked once sent. A case with a fix adds what it asks besides the cause: where it is fixed and its tasks, each marked once it holds. «Ya sé la causa» opens the one question of the case with its options in the order the case gives them; a wrong one shows its feedback and the player tries another; the right one closes the case and offers the next, or the result after the last, and in a case with a fix it closes it only once the tasks hold too (until then it says the cause is named and the fix is missing). The caller keys it by the case, so each case starts with its question closed. */
export function CaseCard({ card, onNameCause, onNext, onShowResult, hidden }: CaseCardProps) {
  const [asking, setAsking] = useState(false);
  return (
    <Card aria-labelledby="case-title" hidden={hidden} header={{ icon: <CardIcon kind="case" />, title: <h2 id="case-title">{CASE_TEXT.title(card.number, card.total)}</h2> }}>
      <p>
        <TaggedText text={CASE_TEXT.says(card.report)} />
      </p>
      {card.origins.map((origin) => (
        <Tests key={origin.fromId} origin={origin} />
      ))}
      {card.repair && <Repair repair={card.repair} waiting={!card.closed && card.options.some((option) => option.state === 'right')} />}
      {asking ? (
        <Question card={card} onNameCause={onNameCause} />
      ) : (
        <Button variant="primary" onClick={() => setAsking(true)}>
          {CASE_TEXT.know}
        </Button>
      )}
      {card.closed && <ContinueButton label={card.last ? EXPLANATION_TEXT.seeResult : CASE_TEXT.next} onContinue={card.last ? onShowResult : onNext} />}
    </Card>
  );
}
