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
  children: ReactNode;
}

/** The card that opens beside a piece of the map: a dialog with its title on the stripe, what the caller puts in it and the "Listo" button. Escape always calls `onClose`; "Listo" calls `onDone` when the card has its own way out, and `onClose` when it has not. */
export function ChipCard({ title, icon, heading, onClose, onDone = onClose, children }: ChipCardProps) {
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
        {children}
        <Button onClick={onDone}>{TASK_CARD_TEXT.done}</Button>
      </div>
    </Card>
  );
}

/** Returns a card's chips as the chips of a tray, each label with its terms tagged. */
export function trayChips(chips: { id: string; label: TermText }[]): TrayChip[] {
  return chips.map(({ id, label }) => ({ id, label: <TaggedText text={label} /> }));
}
