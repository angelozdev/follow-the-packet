import { EXPLANATION_TEXT, type TermText } from '@/copy';
import { Button, Choice } from '@/design';
import type { ExplanationOption } from '@/levels';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

interface ExplanationCardProps {
  question: TermText;
  options: ExplanationOption[];
  choice: number | null;
  onChoose: (index: number) => void;
  onContinue: () => void;
}

function ContinueButton({ onContinue }: { onContinue: () => void }) {
  const button = useFocusOnMount<HTMLButtonElement>();
  return (
    <Button ref={button} variant="primary" onClick={onContinue}>
      {EXPLANATION_TEXT.seeResult}
    </Button>
  );
}

export function ExplanationCard({ question, options, choice, onChoose, onContinue }: ExplanationCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <section className="card explanation" aria-labelledby="explanation-title">
      <h2 id="explanation-title" ref={heading} tabIndex={-1}>
        <TaggedText text={EXPLANATION_TEXT.asks(question)} />
      </h2>
      <ol className="options">
        {options.map((option, index) => (
          <li key={option.text}>
            <Choice variant="option" disabled={choice !== null} pressed={choice === index} onClick={() => onChoose(index)}>
              <TaggedText text={option.text} />
            </Choice>
            {choice !== null && (index === choice || option.correct) && (
              <p className={option.correct ? 'feedback feedback--right' : 'feedback feedback--wrong'}>
                <strong>{option.correct ? EXPLANATION_TEXT.right : EXPLANATION_TEXT.wrong}</strong> <TaggedText text={option.feedback} />
              </p>
            )}
          </li>
        ))}
      </ol>
      {choice !== null && <ContinueButton onContinue={onContinue} />}
    </section>
  );
}
