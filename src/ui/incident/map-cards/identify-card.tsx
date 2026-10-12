import { Fragment, useState } from 'react';
import { MESSAGE_TEXT } from '@/copy';
import { ChipTray, Message } from '@/design';
import type { IdentifyCard as Identify } from '@/game';
import { EntityIcon } from '@/scene';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { FramedCard, trayChips, type CardFrame } from './chip-card';

type Picks = Record<string, string>;
type Tray = Identify['trays'][number];

interface IdentifyCardProps {
  card: Identify;
  onAnswer: (picks: Picks) => void;
  onClose: () => void;
}

/** What the player has half done in the card of a device: the chips picked in its trays and whether the lines of the chips picked show. It goes back to the answer saved when the card is the card of another device. */
export interface IdentifyDraft {
  picks: Picks;
  shown: boolean;
  setPicks: (picks: Picks) => void;
  setShown: (shown: boolean) => void;
}

function savedPicks(card: Identify): Picks {
  return Object.fromEntries(card.trays.flatMap((tray) => (tray.saved === null ? [] : [[tray.id, tray.saved]])));
}

function chipPicked(tray: Tray, picks: Picks): Tray['chips'][number] | undefined {
  return tray.chips.find((chip) => chip.id === picks[tray.id]);
}

interface DraftState {
  deviceId: string | null;
  picks: Picks;
  shown: boolean;
}

function freshDraft(card: Identify | null): DraftState {
  return { deviceId: card?.deviceId ?? null, picks: card ? savedPicks(card) : {}, shown: false };
}

export function useIdentifyDraft(card: Identify | null): IdentifyDraft {
  const deviceId = card?.deviceId ?? null;
  const [kept, setKept] = useState<DraftState>(() => freshDraft(card));
  const current = kept.deviceId === deviceId ? kept : freshDraft(card);
  const change = (next: Partial<Pick<DraftState, 'picks' | 'shown'>>) => setKept((previous) => ({ ...(previous.deviceId === deviceId ? previous : freshDraft(card)), ...next }));
  return { picks: current.picks, shown: current.shown, setPicks: (picks) => change({ picks }), setShown: (shown) => change({ shown }) };
}

/** Returns what the card of a device in an identify incident puts in its card: its question and a tray of chips for each thing to say about it, starting from the answer saved. A pick is only a draft: "Listo" confirms the picks of every tray and shows, under each tray, the lines of the chip picked; while they show, "Listo" closes the card, and picking another chip hides them. Escape closes the card at any time and leaves the answer saved as it was. */
export function identifyFrame(card: Identify, draft: IdentifyDraft, { onAnswer, onClose }: Pick<IdentifyCardProps, 'onAnswer' | 'onClose'>): CardFrame {
  const pick = (trayId: string, chipId: string) => {
    if (draft.picks[trayId] === chipId) return;
    draft.setPicks({ ...draft.picks, [trayId]: chipId });
    draft.setShown(false);
  };
  const done = () => {
    if (draft.shown) return onClose();
    onAnswer(draft.picks);
    if (card.trays.some((tray) => (chipPicked(tray, draft.picks)?.lines.length ?? 0) > 0)) draft.setShown(true);
    else onClose();
  };
  return {
    title: card.title,
    icon: <EntityIcon entity={card.entity} />,
    onDone: done,
    body: (
      <>
        {card.question && (
          <p>
            <TaggedText text={card.question} />
          </p>
        )}
        {card.trays.map((tray) => {
          const chosen = chipPicked(tray, draft.picks);
          return (
            <Fragment key={tray.id}>
              <ChipTray name={tray.name} chips={trayChips(tray.chips)} picked={draft.picks[tray.id] ?? null} onPick={(chipId) => pick(tray.id, chipId)} variant={tray.segmented ? 'segmented' : 'default'} />
              {draft.shown && chosen && chosen.lines.length > 0 && (
                <Message role="status" variant={chosen.correct ? 'success' : 'error'} words={MESSAGE_TEXT}>
                  <TaggedText text={chosen.lines.join(' ')} />
                </Message>
              )}
            </Fragment>
          );
        })}
      </>
    ),
  };
}

/** The card of a device in an identify incident as a card of its own, for a piece whose only card it is. */
export function IdentifyCard({ card, onAnswer, onClose }: IdentifyCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const draft = useIdentifyDraft(card);
  return <FramedCard frame={identifyFrame(card, draft, { onAnswer, onClose })} heading={heading} onClose={onClose} />;
}
