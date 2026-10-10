import { useState } from 'react';
import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
import { Button, ChipTray, Choice } from '@/design';
import { rowText, type FirewallCard } from '@/game';
import type { FromChip, WhatChip } from '@/levels';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { ChipCard, trayChips } from './chip-card';

type Tray = 'what' | 'from';
type Slot = Record<Tray, string | null>;
type Chip = { id: string; label: TermText };

const EMPTY_SLOT: Slot = { what: null, from: null };

interface TaskCardProps {
  card: FirewallCard;
  chips: { what: WhatChip[]; from: FromChip[] };
  onPlace: (whatId: string, fromId: string) => void;
  onRemove: (ruleId: string) => void;
  onClose: () => void;
}

function SlotChip({ chip, placeholder, onGiveBack }: { chip: Chip | undefined; placeholder: string; onGiveBack: () => void }) {
  return chip ? (
    <Choice aria-label={TASK_CARD_TEXT.giveBack(toPlainText(chip.label))} onClick={onGiveBack}>
      <TaggedText text={chip.label} />
    </Choice>
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
  const pickedWhat = chips.what.find((chip) => chip.id === slot.what);
  const pickedFrom = chips.from.find((chip) => chip.id === slot.from);
  return (
    <ChipCard title={card.title} heading={heading} onClose={onClose}>
      {card.rules.length > 0 ? (
        <ul className="rules">
          {card.rules.map((row) => (
            <li key={row.id}>
              <span className="rules__text">
                <TaggedText text={rowText(row)} />
              </span>
              <Button variant="small" aria-label={TASK_CARD_TEXT.remove(toPlainText(rowText(row)))} onClick={() => remove(row.id)}>
                ×
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          <TaggedText text={card.empty} />
        </p>
      )}
      <div role="group" aria-label={card.slot} className="slot">
        <SlotChip chip={pickedWhat} placeholder={TASK_CARD_TEXT.what} onGiveBack={() => giveBack('what')} />
        <span aria-hidden="true">←</span>
        <SlotChip chip={pickedFrom} placeholder={TASK_CARD_TEXT.from} onGiveBack={() => giveBack('from')} />
      </div>
      <ChipTray name={TASK_CARD_TEXT.what} chips={trayChips(chips.what)} picked={slot.what} onPick={(chipId) => toggle('what', chipId)} />
      <ChipTray name={TASK_CARD_TEXT.from} chips={trayChips(chips.from)} picked={slot.from} onPick={(chipId) => toggle('from', chipId)} />
    </ChipCard>
  );
}
