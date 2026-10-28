import { Fragment } from 'react';
import { MESSAGE_TEXT } from '@/copy';
import { ChipTray, Message } from '@/design';
import type { IdentifyCard as Identify } from '@/game';
import { EntityIcon } from '@/scene';
import { TaggedText } from '@/ui/tagged-text';
import { trayChips, type CardFrame } from './card-frame';
import { useDraftsByKey } from './use-drafts-by-key';

type Picks = Record<string, string>;
type Tray = Identify['trays'][number];

interface IdentifyHandlers {
  onAnswer: (picks: Picks) => void;
  onClose: () => void;
}

/** What the player has half done in the card of a device: the chips picked in its trays and whether the lines of the chips picked show. Each device has its own, and it starts from the answer saved. */
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

type DraftState = Pick<IdentifyDraft, 'picks' | 'shown'>;

/** Returns what takes the card of a device and gives its draft. The drafts live above the tabs of the panel, one for each device, so the picks of a device are still there when the player chooses another piece and comes back, and when the panel changes tab. */
export function useIdentifyDrafts(): (card: Identify) => IdentifyDraft {
  const drafts = useDraftsByKey<DraftState>();
  return (card) => {
    const fresh = { picks: savedPicks(card), shown: false };
    const { picks, shown } = drafts.of(card.deviceId, fresh);
    return { picks, shown, setPicks: (next) => drafts.change(card.deviceId, fresh, { picks: next }), setShown: (next) => drafts.change(card.deviceId, fresh, { shown: next }) };
  };
}

/** Returns what the card of a device in an identify incident puts in the panel: its question and a tray of chips for each thing to say about it, starting from the answer saved. A pick is only a draft: "Listo" confirms the picks of every tray and shows, under each tray, the lines of the chip picked; with no line to show, or while they show, "Listo" hides them and calls `onClose`, which the screen makes the release of the piece chosen, and picking another chip hides them. Nothing is reported before "Listo". */
export function identifyFrame(card: Identify, draft: IdentifyDraft, { onAnswer, onClose }: IdentifyHandlers): CardFrame {
  const pick = (trayId: string, chipId: string) => {
    if (draft.picks[trayId] === chipId) return;
    draft.setPicks({ ...draft.picks, [trayId]: chipId });
    draft.setShown(false);
  };
  const done = () => {
    if (draft.shown) {
      draft.setShown(false);
      return onClose();
    }
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
