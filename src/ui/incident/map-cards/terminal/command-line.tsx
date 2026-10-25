import { Fragment } from 'react';
import type { TermText } from '@/copy';
import { commandGroups } from '@/game';
import { TaggedText } from '@/ui/tagged-text';

const NO_BREAK_SPACE = '\u00a0';

/** The line a terminal shows for the picks, as the code of a command: the line breaks only in the spaces between groups and at the points inside a url that `commandGroups` gives, because the spaces inside a group are no-break spaces (a word longer than the row still breaks, as the last resort). The `$ ` prompt is drawn by the stylesheet, so it is not text of the page. */
export function CommandLine({ line }: { line: TermText }) {
  return (
    <code>
      {commandGroups(line).map((group, index) => (
        <Fragment key={index}>
          {index > 0 && ' '}
          {group.map((part, at) => (
            <Fragment key={at}>
              {at > 0 && <wbr />}
              <TaggedText text={part.replaceAll(' ', NO_BREAK_SPACE)} />
            </Fragment>
          ))}
        </Fragment>
      ))}
    </code>
  );
}
