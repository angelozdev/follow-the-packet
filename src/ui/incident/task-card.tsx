import { useState, type KeyboardEvent } from 'react';
import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
import { rowText, type BarrierCard } from '@/game';
import type { FromChip, WhatChip } from '@/levels';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

type Tray = 'what' | 'from';
type Slot = Record<Tray, string | null>;
type Chip = { id: string; label: TermText };

const EMPTY_SLOT: Slot = { what: null, from: null };

interface TaskCardProps {
  card: BarrierCard;
  chips: { what: WhatChip[]; from: FromChip[] };
  onPlace: (whatId: string, fromId: string) => void;
  onRemove: (ruleId: string) => void;
  onClose: () => void;
}

function ChipTray({ name, chips, picked, onPick }: { name: string; chips: Chip[]; picked: string | null; onPick: (chipId: string) => void }) {
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

function SlotChip({ chip, placeholder, onGiveBack }: { chip: Chip | undefined; placeholder: string; onGiveBack: () => void }) {
  return chip ? (
    <button type="button" className="chip" aria-label={TASK_CARD_TEXT.giveBack(toPlainText(chip.label))} onClick={onGiveBack}>
      <TaggedText text={chip.label} />
    </button>
  ) : (
    <span className="slot__empty">{placeholder}</span>
  );
}

export function TaskCard({ card, chips, onPlace, onRemove, onClose }: TaskCardProps) {
  const [slot, setSlot] = useState<Slot>(EMPTY_SLOT);
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const toggle = (tray: Tray, chipId: string) => {
    const next = { ...slot, [tray]: slot[tray] === chipId ? null : chipId };
    if (next.what !== null && next.from !== null) {
      onPlace(next.what, next.from);
      setSlot(EMPTY_SLOT);
    } else {
      setSlot(next);
    }
  };
  const giveBack = (tray: Tray) => {
    setSlot({ ...slot, [tray]: null });
    heading.current?.focus();
  };
  const remove = (ruleId: string) => {
    onRemove(ruleId);
    heading.current?.focus();
  };
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };
  const pickedWhat = chips.what.find((chip) => chip.id === slot.what);
  const pickedFrom = chips.from.find((chip) => chip.id === slot.from);
  return (
    <section role="dialog" aria-label={toPlainText(card.title)} className="card task-card" onKeyDown={closeOnEscape}>
      <h2 ref={heading} tabIndex={-1}>
        <TaggedText text={card.title} />
      </h2>
      {card.rules.length > 0 ? (
        <ul className="rules">
          {card.rules.map((row) => (
            <li key={row.id}>
              <TaggedText text={rowText(row)} />
              <button type="button" className="btn btn--small" aria-label={TASK_CARD_TEXT.remove(toPlainText(rowText(row)))} onClick={() => remove(row.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{TASK_CARD_TEXT.noRules}</p>
      )}
      <div role="group" aria-label={TASK_CARD_TEXT.slot} className="slot">
        <SlotChip chip={pickedWhat} placeholder={TASK_CARD_TEXT.what} onGiveBack={() => giveBack('what')} />
        <span aria-hidden="true">←</span>
        <SlotChip chip={pickedFrom} placeholder={TASK_CARD_TEXT.from} onGiveBack={() => giveBack('from')} />
      </div>
      <ChipTray name={TASK_CARD_TEXT.what} chips={chips.what} picked={slot.what} onPick={(chipId) => toggle('what', chipId)} />
      <ChipTray name={TASK_CARD_TEXT.from} chips={chips.from} picked={slot.from} onPick={(chipId) => toggle('from', chipId)} />
      <button type="button" className="btn" onClick={onClose}>
        {TASK_CARD_TEXT.done}
      </button>
    </section>
  );
}
