import { EXPLANATION_TEXT, type TermText } from '@/copy';
import { Button, Card, Choice } from '@/design';
import type { ExplanationOption } from '@/levels';
import { CardIcon } from '@/ui/card-icon';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

interface ExplanationCardProps {
  question: TermText;
  options: ExplanationOption[];
  choice: number | null;
  onChoose: (index: number) => void;
  onContinue: () => void;
}

/** One option of a question as the list draws it: its text, whether it is the right one, whether the player picked it, whether it can still be picked, and the feedback to show under it (null for none). */
export interface OptionLine {
  text: TermText;
  correct: boolean;
  pressed: boolean;
  disabled: boolean;
  feedback: TermText | null;
}

interface OptionListProps {
  options: OptionLine[];
  onPick: (index: number) => void;
}

/** The options of a question with letters, one per line: each is a choice, and the feedback of one the player picked, or of the right one, shows under it as «Correcto.» or «No es eso.». */
export function OptionList({ options, onPick }: OptionListProps) {
  return (
    <ol className="options">
      {options.map((option, index) => (
        <li key={option.text}>
          <Choice variant="option" disabled={option.disabled} pressed={option.pressed} onClick={() => onPick(index)}>
            <TaggedText text={option.text} />
          </Choice>
          {option.feedback !== null && (
            <p className={option.correct ? 'feedback' : 'feedback feedback--wrong'}>
              <strong>{option.correct ? EXPLANATION_TEXT.right : EXPLANATION_TEXT.wrong}</strong> <TaggedText text={option.feedback} />
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** The primary button that takes the player on once the question is answered; the focus lands on it as it appears. */
export function ContinueButton({ label, onContinue }: { label: string; onContinue: () => void }) {
  const button = useFocusOnMount<HTMLButtonElement>();
  return (
    <Button ref={button} variant="primary" onClick={onContinue}>
      {label}
    </Button>
  );
}

function explanationLines(options: ExplanationOption[], choice: number | null): OptionLine[] {
  return options.map((option, index) => ({
    text: option.text,
    correct: option.correct,
    pressed: choice === index,
    disabled: choice !== null,
    feedback: choice !== null && (index === choice || option.correct) ? option.feedback : null,
  }));
}

export function ExplanationCard({ question, options, choice, onChoose, onContinue }: ExplanationCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <Card aria-labelledby="explanation-title" header={{ icon: <CardIcon kind="question" />, type: EXPLANATION_TEXT.type }}>
      <h2 id="explanation-title" ref={heading} tabIndex={-1}>
        <TaggedText text={EXPLANATION_TEXT.asks(question)} />
      </h2>
      <OptionList options={explanationLines(options, choice)} onPick={onChoose} />
      {choice !== null && <ContinueButton label={EXPLANATION_TEXT.seeResult} onContinue={onContinue} />}
    </Card>
  );
}
