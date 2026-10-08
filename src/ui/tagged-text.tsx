import { Fragment } from 'react';
import { LUCIA_TEXT, parseTermText, type TermId, type TermText } from '@/copy';

/** Renders a tagged text: each term in bold, and the new ones with their "nuevo" mark. */
export function TaggedText({ text, newTerms }: { text: TermText; newTerms?: ReadonlySet<TermId> }) {
  return (
    <>
      {parseTermText(text).map((segment, index) =>
        segment.kind === 'text' ? (
          <Fragment key={index}>{segment.text}</Fragment>
        ) : (
          <span key={index} className="term">
            {segment.text}
            {newTerms?.has(segment.id) && (
              <>
                {' '}
                <span className="term__new">{LUCIA_TEXT.newBadge}</span>
              </>
            )}
          </span>
        ),
      )}
    </>
  );
}
