import { useState } from 'react';
import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
import { Button, ChipTray, Choice, Tabs } from '@/design';
import type { Direction } from '@/engine';
import { rowText, type FirewallCard } from '@/game';
import type { FromChip, ToChip, WhatChip } from '@/levels';
import { EntityIcon } from '@/scene';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { ChipCard, trayChips } from './chip-card';

type Tray = 'what' | 'peer';
type Slot = Record<Tray, string | null>;
type Chip = { id: string; label: TermText };

const INBOUND: Direction = 'inbound';
const OUTBOUND: Direction = 'outbound';
const EMPTY_SLOT: Slot = { what: null, peer: null };
const EMPTY_SLOTS: Record<Direction, Slot> = { inbound: EMPTY_SLOT, outbound: EMPTY_SLOT };

interface OutboundHandlers {
  onPlace: (whatId: string, toId: string) => void;
  onRemove: (ruleId: string) => void;
}

interface TaskCardProps {
  card: FirewallCard;
  chips: { what: WhatChip[]; from: FromChip[]; to?: ToChip[] };
  onPlace: (whatId: string, fromId: string) => void;
  onRemove: (ruleId: string) => void;
  outbound?: OutboundHandlers;
  onClose: () => void;
}

interface PanelSpec {
  rules: FirewallCard['rules'] | NonNullable<FirewallCard['outbound']>['rules'];
  empty: TermText;
  slotName: string;
  peerName: string;
  peerChips: Chip[];
  place: (whatId: string, peerId: string) => void;
  remove: (ruleId: string) => void;
}

interface PanelProps {
  spec: PanelSpec;
  direction: Direction;
  whatChips: Chip[];
  picked: Slot;
  onToggle: (tray: Tray, chipId: string) => void;
  onGiveBack: (tray: Tray) => void;
  onRemove: (ruleId: string) => void;
}

function SlotChip({ chip, placeholder, onGiveBack }: { chip: Chip | undefined; placeholder: string; onGiveBack: () => void }) {
  return chip ? (
    <Choice aria-label={TASK_CARD_TEXT.giveBack(toPlainText(chip.label))} onClick={onGiveBack}>
      <TaggedText text={chip.label} ips={false} />
    </Choice>
  ) : (
    <span className="slot__empty">{placeholder}</span>
  );
}

function RulesPanel({ spec, direction, whatChips, picked, onToggle, onGiveBack, onRemove }: PanelProps) {
  return (
    <>
      {spec.rules.length > 0 ? (
        <ul className="rules">
          {spec.rules.map((row) => (
            <li key={row.id}>
              <span className="rules__text">
                <TaggedText text={rowText(row)} />
              </span>
              <Button variant="small" aria-label={TASK_CARD_TEXT.remove(toPlainText(rowText(row)))} onClick={() => onRemove(row.id)}>
                ×
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          <TaggedText text={spec.empty} />
        </p>
      )}
      <div role="group" aria-label={spec.slotName} className="slot">
        <SlotChip chip={whatChips.find((chip) => chip.id === picked.what)} placeholder={TASK_CARD_TEXT.what} onGiveBack={() => onGiveBack('what')} />
        <span aria-hidden="true">{TASK_CARD_TEXT.arrow[direction]}</span>
        <SlotChip chip={spec.peerChips.find((chip) => chip.id === picked.peer)} placeholder={spec.peerName} onGiveBack={() => onGiveBack('peer')} />
      </div>
      <ChipTray name={TASK_CARD_TEXT.what} chips={trayChips(whatChips)} picked={picked.what} onPick={(chipId) => onToggle('what', chipId)} />
      <ChipTray name={spec.peerName} chips={trayChips(spec.peerChips)} picked={picked.peer} onPick={(chipId) => onToggle('peer', chipId)} />
    </>
  );
}

function directionOf(tabId: string): Direction {
  return tabId === OUTBOUND ? OUTBOUND : INBOUND;
}

export function TaskCard({ card, chips, onPlace, onRemove, outbound, onClose }: TaskCardProps) {
  const [slots, setSlots] = useState(EMPTY_SLOTS);
  const [selected, setSelected] = useState<Direction>(INBOUND);
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const inboundSpec: PanelSpec = { rules: card.rules, empty: card.empty, slotName: card.slot, peerName: TASK_CARD_TEXT.from, peerChips: chips.from, place: onPlace, remove: onRemove };
  const outboundSide =
    card.outbound && chips.to && outbound
      ? {
          tabs: card.outbound.tabs,
          spec: {
            rules: card.outbound.rules,
            empty: card.outbound.empty,
            slotName: card.outbound.slot,
            peerName: TASK_CARD_TEXT.to,
            peerChips: chips.to,
            place: outbound.onPlace,
            remove: outbound.onRemove,
          } satisfies PanelSpec,
        }
      : null;
  const toggle = (direction: Direction, spec: PanelSpec, tray: Tray, chipId: string) => {
    const slot = slots[direction];
    const next = { ...slot, [tray]: slot[tray] === chipId ? null : chipId };
    if (next.what !== null && next.peer !== null) {
      spec.place(next.what, next.peer);
      setSlots({ ...slots, [direction]: EMPTY_SLOT });
    } else {
      setSlots({ ...slots, [direction]: next });
    }
  };
  const giveBack = (direction: Direction, tray: Tray) => {
    setSlots({ ...slots, [direction]: { ...slots[direction], [tray]: null } });
    heading.current?.focus();
  };
  const remove = (spec: PanelSpec, ruleId: string) => {
    spec.remove(ruleId);
    heading.current?.focus();
  };
  const panel = (direction: Direction, spec: PanelSpec) => (
    <RulesPanel
      spec={spec}
      direction={direction}
      whatChips={chips.what}
      picked={slots[direction]}
      onToggle={(tray, chipId) => toggle(direction, spec, tray, chipId)}
      onGiveBack={(tray) => giveBack(direction, tray)}
      onRemove={(ruleId) => remove(spec, ruleId)}
    />
  );
  return (
    <ChipCard title={card.title} icon={<EntityIcon entity={{ kind: 'firewall', variant: card.kind }} />} heading={heading} onClose={onClose}>
      {outboundSide ? (
        <Tabs
          name={TASK_CARD_TEXT.tabsName}
          selected={selected}
          onSelect={(tabId) => setSelected(directionOf(tabId))}
          tabs={[
            { id: INBOUND, label: <TaggedText text={outboundSide.tabs.inbound} />, panel: panel(INBOUND, inboundSpec) },
            { id: OUTBOUND, label: <TaggedText text={outboundSide.tabs.outbound} />, panel: panel(OUTBOUND, outboundSide.spec) },
          ]}
        />
      ) : (
        panel(INBOUND, inboundSpec)
      )}
    </ChipCard>
  );
}
