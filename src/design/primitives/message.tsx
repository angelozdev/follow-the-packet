import type { ComponentProps } from 'react';

export type MessageVariant = 'note' | 'success' | 'warning' | 'error';

const MESSAGE_CLASS: Record<MessageVariant, string> = {
  note: 'message message--note',
  success: 'message message--success',
  warning: 'message message--warning',
  error: 'message message--error',
};

const MESSAGE_MARK: Record<MessageVariant, string> = { note: '', success: '✓', warning: '!', error: '✕' };

export type MessageProps = Omit<ComponentProps<'p'>, 'className' | 'style'> & {
  variant?: MessageVariant;
  words: Record<MessageVariant, string>;
};

/** The one message of the game: a paragraph with a tab above its frame that names its kind, `note` for what is neutral, `success` for a right answer, `warning` for what informs without refusing anything and `error` for what was refused, wrong, or is happening now and is a danger. The tab carries the word of the kind (`words`, which arrive as a prop because the design system imports no text) and, for the three that are not a note, a mark, and its frame has a shape of its own: so it never depends on colour. The tab is decorative; a visually hidden word before the text names the kind for screen readers. It has no role of its own: its owner gives it `role="status"` or `role="alert"` when the message must be announced. */
export function Message({ variant = 'note', words, children, ...props }: MessageProps) {
  const word = words[variant];
  const mark = MESSAGE_MARK[variant];
  return (
    <p {...props} className={MESSAGE_CLASS[variant]}>
      <span className="message__tab" aria-hidden="true">
        {mark === '' ? word : `${mark} ${word}`}
      </span>
      <span className="sr-only">{`${word}: `}</span>
      {children}
    </p>
  );
}
