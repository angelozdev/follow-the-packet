import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
import { Button, Card, type TrayChip } from '@/design';
import { TaggedText } from '@/ui/tagged-text';

interface ChipCardProps {
  title: TermText;
  icon: ReactNode;
  heading: RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
  onDone?: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

/** The card that opens beside a piece of the map: a dialog with its title on the stripe, what the caller puts in it and, at its foot, the caller's `actions` (such as "Enviar") and the "Listo" button. Escape always calls `onClose`; "Listo" calls `onDone` when the card has its own way out, and `onClose` when it has not. The foot stays in view when the card is docked and what it shows outgrows it: only what is above it scrolls. */
export function ChipCard({ title, icon, heading, onClose, onDone = onClose, actions, children }: ChipCardProps) {
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };
  return (
    <Card
      role="dialog"
      aria-label={toPlainText(title)}
      onKeyDown={closeOnEscape}
      header={{
        icon,
        title: (
          <h2 ref={heading} tabIndex={-1}>
            <TaggedText text={title} />
          </h2>
        ),
      }}
    >
      <div className="chip-card">
        <div className="chip-card__body">{children}</div>
        <div className="chip-card__actions">
          {actions}
          <Button onClick={onDone}>{TASK_CARD_TEXT.done}</Button>
        </div>
      </div>
    </Card>
  );
}

/** Returns a card's chips as the chips of a tray, each label with its terms tagged. */
export function trayChips(chips: { id: string; label: TermText }[]): TrayChip[] {
  return chips.map(({ id, label }) => ({ id, label: <TaggedText text={label} /> }));
}

/** What a card puts in the frame every card of the map shares: its title, the icon on its stripe, what it shows, the actions of its foot and, when it has its own way out, what "Listo" does. A card that lives beside others as a tab of a piece is drawn from its frame in the same `ChipCard`. */
export interface CardFrame {
  title: TermText;
  icon: ReactNode;
  body: ReactNode;
  actions?: ReactNode;
  onDone?: () => void;
}

interface FramedCardProps {
  frame: CardFrame;
  heading: RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
  children?: ReactNode;
}

/** The `ChipCard` of a frame. `children` replaces the body of the frame: the card of a piece with tabs puts its tabs there, each with the body of its frame. */
export function FramedCard({ frame, heading, onClose, children = frame.body }: FramedCardProps) {
  return (
    <ChipCard title={frame.title} icon={frame.icon} heading={heading} onClose={onClose} onDone={frame.onDone} actions={frame.actions}>
      {children}
    </ChipCard>
  );
}
