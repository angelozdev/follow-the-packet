import { TASK_CARD_TEXT, toPlainText, type TermText } from '@/copy';
import { Button, ChipTray, Choice, Tabs } from '@/design';
import type { Direction } from '@/engine';
import { rowText, type FirewallCard } from '@/game';
import type { FromChip, ToChip, WhatChip } from '@/levels';
import { TaggedText } from '@/ui/tagged-text';
import { trayChips, type CardFrame } from './card-frame';
import { useDraftsByKey } from './use-drafts-by-key';

type Tray = 'what' | 'peer';
type Slot = Record<Tray, string | null>;
type Chip = { id: string; label: TermText };

const INBOUND: Direction = 'inbound';
const OUTBOUND: Direction = 'outbound';
const EMPTY_SLOT: Slot = { what: null, peer: null };
const EMPTY_SLOTS: Record<Direction, Slot> = { inbound: EMPTY_SLOT, outbound: EMPTY_SLOT };
const FRESH_DRAFT = { slots: EMPTY_SLOTS, selected: INBOUND };

/** What the rules of a firewall ask of their screen: placing the rule the chips of the slot make and taking one away, for the inbound list and, when the incident gives it, for the outbound one. */
export interface RuleHandlers {
  onPlace: (whatId: string, fromId: string) => void;
  onRemove: (ruleId: string) => void;
  outbound: {
    onPlace: (whatId: string, toId: string) => void;
    onRemove: (ruleId: string) => void;
  };
}

/** What the player has half done in the rules of a firewall: the chips in the slot of each direction and the direction chosen. Each firewall has its own, above the tabs of the panel. */
export interface RuleDraft {
  slots: Record<Direction, Slot>;
  selected: Direction;
  setSlots: (slots: Record<Direction, Slot>) => void;
  setSelected: (selected: Direction) => void;
}

type DraftState = Pick<RuleDraft, 'slots' | 'selected'>;

/** Returns what takes the id of a firewall and gives the draft of its rules. */
export function useRuleDrafts(): (firewallId: string) => RuleDraft {
  const drafts = useDraftsByKey<DraftState>();
  return (firewallId) => {
    const { slots, selected } = drafts.of(firewallId, FRESH_DRAFT);
    return { slots, selected, setSlots: (next) => drafts.change(firewallId, FRESH_DRAFT, { slots: next }), setSelected: (next) => drafts.change(firewallId, FRESH_DRAFT, { selected: next }) };
  };
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

/** Returns what the rules of a firewall put in the panel: its inbound list and, while the ladder has opened the outbound rules of its kind and the incident offers Destination chips, a second one, as two tabs of the direction (`entrada` and `salida` for a host firewall, `regla de entrada` and `regla de salida` for a Security Group), the inbound one first. Each list shows its rules with a button to take each away, the slot of the new rule and the trays that fill it (Type and Source, or Type and Destination): a rule is placed when both chips are in the slot, and the chips given back to the trays are the player's choice. The draft is the caller's, so a chip left in a slot is still there when the player changes direction, tab or piece. After taking a rule away or giving a chip back the focus goes back to where `refocus` says, because the button that had it is gone. */
export function rulesFrame(card: FirewallCard, chips: { what: WhatChip[]; from: FromChip[]; to?: ToChip[] }, draft: RuleDraft, handlers: RuleHandlers, refocus: () => void): CardFrame {
  const { slots } = draft;
  const inboundSpec: PanelSpec = { rules: card.rules, empty: card.empty, slotName: card.slot, peerName: TASK_CARD_TEXT.from, peerChips: chips.from, place: handlers.onPlace, remove: handlers.onRemove };
  const outboundSide =
    card.outbound && chips.to
      ? {
          tabs: card.outbound.tabs,
          spec: {
            rules: card.outbound.rules,
            empty: card.outbound.empty,
            slotName: card.outbound.slot,
            peerName: TASK_CARD_TEXT.to,
            peerChips: chips.to,
            place: handlers.outbound.onPlace,
            remove: handlers.outbound.onRemove,
          } satisfies PanelSpec,
        }
      : null;
  const toggle = (direction: Direction, spec: PanelSpec, tray: Tray, chipId: string) => {
    const slot = slots[direction];
    const next = { ...slot, [tray]: slot[tray] === chipId ? null : chipId };
    if (next.what !== null && next.peer !== null) {
      spec.place(next.what, next.peer);
      draft.setSlots({ ...slots, [direction]: EMPTY_SLOT });
    } else {
      draft.setSlots({ ...slots, [direction]: next });
    }
  };
  const giveBack = (direction: Direction, tray: Tray) => {
    draft.setSlots({ ...slots, [direction]: { ...slots[direction], [tray]: null } });
    refocus();
  };
  const remove = (spec: PanelSpec, ruleId: string) => {
    spec.remove(ruleId);
    refocus();
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
  return {
    body: outboundSide ? (
      <Tabs
        name={TASK_CARD_TEXT.tabsName}
        variant="underline"
        selected={draft.selected}
        onSelect={(tabId) => draft.setSelected(directionOf(tabId))}
        tabs={[
          { id: INBOUND, label: <TaggedText text={outboundSide.tabs.inbound} />, panel: panel(INBOUND, inboundSpec) },
          { id: OUTBOUND, label: <TaggedText text={outboundSide.tabs.outbound} />, panel: panel(OUTBOUND, outboundSide.spec) },
        ]}
      />
    ) : (
      panel(INBOUND, inboundSpec)
    ),
  };
}
