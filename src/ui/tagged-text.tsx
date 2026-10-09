import { Fragment } from 'react';
import { LUCIA_TEXT, parseTermText, type TermId, type TermText } from '@/copy';
import { TermTip } from './term-tip';

interface TaggedTextProps {
  text: TermText;
  newTerms?: ReadonlySet<TermId>;
  tips?: boolean;
}

/** Renders a tagged text: each term by its name, with its definition on hover unless tips is false, and each new term followed by its "nuevo" mark. */
export function TaggedText({ text, newTerms, tips = true }: TaggedTextProps) {
  return (
    <>
      {parseTermText(text).map((segment, index) => {
        if (segment.kind === 'text') return <Fragment key={index}>{segment.text}</Fragment>;
        return (
          <Fragment key={index}>
            {tips ? <TermTip id={segment.id}>{segment.text}</TermTip> : <span className="term">{segment.text}</span>}
            {newTerms?.has(segment.id) && (
              <>
                {' '}
                <span className="term__new">{LUCIA_TEXT.newBadge}</span>
              </>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
