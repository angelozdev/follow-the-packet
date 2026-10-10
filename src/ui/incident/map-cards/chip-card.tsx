import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
import { TaggedText } from '@/ui/tagged-text';

interface ChipCardProps {
  title: TermText;
  heading: RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
  children: ReactNode;
}

interface ChipTrayProps {
  name: string;
  chips: { id: string; label: TermText }[];
  picked: string | null;
  onPick: (chipId: string) => void;
}

/** The card that opens beside a piece of the map: a dialog with its title, what the caller puts in it and the "Listo" button; Escape closes it too. */
export function ChipCard({ title, heading, onClose, children }: ChipCardProps) {
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };
  return (
    <section role="dialog" aria-label={toPlainText(title)} className="card chip-card" onKeyDown={closeOnEscape}>
      <h2 ref={heading} tabIndex={-1}>
        <TaggedText text={title} />
      </h2>
      {children}
      <button type="button" className="btn" onClick={onClose}>
        {TASK_CARD_TEXT.done}
      </button>
    </section>
  );
}

/** A named tray of chips, the picked one pressed; a click or Enter picks a chip. */
export function ChipTray({ name, chips, picked, onPick }: ChipTrayProps) {
  return (
    <div role="group" aria-label={name} className="tray">
      <span className="tray__name" aria-hidden="true">
        {name}
      </span>
      {chips.map((chip) => (
        <button key={chip.id} type="button" className="chip" aria-pressed={picked === chip.id} onClick={() => onPick(chip.id)}>
          <TaggedText text={chip.label} />
        </button>
      ))}
    </div>
  );
}
