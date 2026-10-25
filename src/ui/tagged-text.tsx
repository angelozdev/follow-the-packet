import { Fragment } from 'react';
import { LUCIA_TEXT, parseTermText, type TermId, type TermSegment, type TermText } from '@/copy';
import { NameTag } from '@/design';
import { TermTip } from './floating-box/term-tip';

interface TaggedTextProps {
  text: TermText;
  newTerms?: ReadonlySet<TermId>;
  tips?: boolean;
  ips?: boolean;
}

const IPV4_WITH_END = /(\b\d{1,3}(?:\.\d{1,3}){3}(?:[:/]\d+)?\b)/;

/** Returns the positions of the segments that are the first appearance, in the text, of one of the new terms. */
function markedPositions(segments: TermSegment[], newTerms: ReadonlySet<TermId> | undefined): Set<number> {
  const pending = new Set(newTerms);
  const marked = new Set<number>();
  segments.forEach((segment, index) => {
    if (segment.kind === 'term' && pending.delete(segment.id)) marked.add(index);
  });
  return marked;
}

function PlainText({ text, ips }: { text: string; ips: boolean }) {
  if (!ips) return text;
  return text.split(IPV4_WITH_END).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="ip-text">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Renders a tagged text: each term by its name, with its definition on hover unless tips is false, the first appearance of each new term followed by its "nuevo" mark, each resource name as a name tag and, unless ips is false (the text is already code), each IP of the plain text, with its port or its prefix, in the mono face with no box. */
export function TaggedText({ text, newTerms, tips = true, ips = true }: TaggedTextProps) {
  const segments = parseTermText(text);
  const marked = markedPositions(segments, newTerms);
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'text') return <PlainText key={index} text={segment.text} ips={ips} />;
        if (segment.kind === 'name') return <NameTag key={index}>{segment.text}</NameTag>;
        return (
          <Fragment key={index}>
            {tips ? <TermTip id={segment.id}>{segment.text}</TermTip> : <span className="term">{segment.text}</span>}
            {marked.has(index) && (
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
