import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
import { Button, Card, type TrayChip } from '@/design';
import { TaggedText } from '@/ui/tagged-text';

interface ChipCardProps {
  title: TermText;
  heading: RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
  children: ReactNode;
}

/** The card that opens beside a piece of the map: a dialog with its title, what the caller puts in it and the "Listo" button; Escape closes it too. */
export function ChipCard({ title, heading, onClose, children }: ChipCardProps) {
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };
  return (
    <Card role="dialog" aria-label={toPlainText(title)} onKeyDown={closeOnEscape}>
      <div className="chip-card">
        <h2 ref={heading} tabIndex={-1}>
          <TaggedText text={title} />
        </h2>
        {children}
        <Button onClick={onClose}>{TASK_CARD_TEXT.done}</Button>
      </div>
    </Card>
  );
}

/** Returns a card's chips as the chips of a tray, each label with its terms tagged. */
export function trayChips(chips: { id: string; label: TermText }[]): TrayChip[] {
  return chips.map(({ id, label }) => ({ id, label: <TaggedText text={label} /> }));
}
