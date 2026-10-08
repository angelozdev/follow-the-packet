import { EXPLANATION_TEXT } from '@/copy';
import type { ExplanationOption } from '@/levels';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

interface ExplanationCardProps {
  options: ExplanationOption[];
  choice: number | null;
  onChoose: (index: number) => void;
  onContinue: () => void;
}

function ContinueButton({ onContinue }: { onContinue: () => void }) {
  const button = useFocusOnMount<HTMLButtonElement>();
  return (
    <button ref={button} type="button" className="btn btn--primary" onClick={onContinue}>
      {EXPLANATION_TEXT.seeResult}
    </button>
  );
}

export function ExplanationCard({ options, choice, onChoose, onContinue }: ExplanationCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <section className="card explanation" aria-labelledby="explanation-title">
      <h2 id="explanation-title" ref={heading} tabIndex={-1}>
        {EXPLANATION_TEXT.asks}
      </h2>
      <ol className="options">
        {options.map((option, index) => (
          <li key={option.text}>
            <button type="button" className="option" disabled={choice !== null} aria-pressed={choice === index} onClick={() => onChoose(index)}>
              <TaggedText text={option.text} />
            </button>
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
