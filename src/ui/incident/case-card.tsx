import { useState } from 'react';
import { CASE_TEXT, EXPLANATION_TEXT } from '@/copy';
import { Button, Card } from '@/design';
import type { CaseCard as Case } from '@/game';
import { CardIcon } from '@/ui/card-icon';
import { TaggedText } from '@/ui/tagged-text';
import { ContinueButton, OptionList, type OptionLine } from './explanation-card';
import { useFocusOnMount } from './use-focus-on-mount';

interface CaseCardProps {
  card: Case;
  onNameCause: (index: number) => void;
  onNext: () => void;
  onShowResult: () => void;
}

function Tests({ origin }: { origin: Case['origins'][number] }) {
  return (
    <>
      <h3>
        <TaggedText text={CASE_TEXT.tests(origin.name)} />
      </h3>
      <ul className="tasks">
        {origin.tests.map((test) => (
          <li key={`${test.toId}-${test.messageId}`} className="task">
            <span aria-hidden="true">{test.sent ? '✓ ' : '☐ '}</span>
            <code>
              <TaggedText text={test.line} />
            </code>
            <span className="sr-only"> ({test.sent ? CASE_TEXT.sent : CASE_TEXT.unsent})</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function optionLines({ options, closed }: Case): OptionLine[] {
  return options.map((option) => ({
    text: option.text,
    correct: option.state === 'right',
    pressed: option.state !== 'untried',
    disabled: closed || option.state !== 'untried',
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

/** The card of the case a diagnose is on, in the side panel: its number, what Lucía reports and the tests the origin can send, each marked once sent. «Ya sé la causa» opens the one question of the case with its options in the order the case gives them; a wrong one shows its feedback and the player tries another; the right one closes the case and offers the next, or the result after the last. The caller keys it by the case, so each case starts with its question closed. */
export function CaseCard({ card, onNameCause, onNext, onShowResult }: CaseCardProps) {
  const [asking, setAsking] = useState(false);
  return (
    <Card aria-labelledby="case-title" header={{ icon: <CardIcon kind="case" />, title: <h2 id="case-title">{CASE_TEXT.title(card.number, card.total)}</h2> }}>
      <p>
        <TaggedText text={CASE_TEXT.says(card.report)} />
      </p>
      {card.origins.map((origin) => (
        <Tests key={origin.fromId} origin={origin} />
      ))}
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
