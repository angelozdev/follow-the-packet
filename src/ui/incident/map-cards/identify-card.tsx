import { Fragment, useState } from 'react';
import { MESSAGE_TEXT } from '@/copy';
import { ChipTray, Message } from '@/design';
import type { IdentifyCard as Identify } from '@/game';
import { EntityIcon } from '@/scene';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { ChipCard, trayChips } from './chip-card';

type Picks = Record<string, string>;
type Tray = Identify['trays'][number];

interface IdentifyCardProps {
  card: Identify;
  onAnswer: (picks: Picks) => void;
  onClose: () => void;
}

function savedPicks(card: Identify): Picks {
  return Object.fromEntries(card.trays.flatMap((tray) => (tray.saved === null ? [] : [[tray.id, tray.saved]])));
}

function chipPicked(tray: Tray, picks: Picks): Tray['chips'][number] | undefined {
  return tray.chips.find((chip) => chip.id === picks[tray.id]);
}

/** The card of a device in an identify incident: its question and a tray of chips for each thing to say about it, starting from the answer saved. A pick is only a draft: "Listo" confirms the picks of every tray and shows, under each tray, the lines of the chip picked; while they show, "Listo" closes the card, and picking another chip hides them. Escape closes the card at any time and leaves the answer saved as it was. */
export function IdentifyCard({ card, onAnswer, onClose }: IdentifyCardProps) {
  const [picks, setPicks] = useState<Picks>(() => savedPicks(card));
  const [shown, setShown] = useState(false);
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const pick = (trayId: string, chipId: string) => {
    if (picks[trayId] === chipId) return;
    setPicks({ ...picks, [trayId]: chipId });
    setShown(false);
  };
  const done = () => {
    if (shown) return onClose();
    onAnswer(picks);
    if (card.trays.some((tray) => (chipPicked(tray, picks)?.lines.length ?? 0) > 0)) setShown(true);
    else onClose();
  };
  return (
    <ChipCard title={card.title} icon={<EntityIcon entity={card.entity} />} heading={heading} onClose={onClose} onDone={done}>
      {card.question && (
        <p>
          <TaggedText text={card.question} />
        </p>
      )}
      {card.trays.map((tray) => {
        const chosen = chipPicked(tray, picks);
        return (
          <Fragment key={tray.id}>
            <ChipTray name={tray.name} chips={trayChips(tray.chips)} picked={picks[tray.id] ?? null} onPick={(chipId) => pick(tray.id, chipId)} variant={tray.segmented ? 'segmented' : 'default'} />
            {shown && chosen && chosen.lines.length > 0 && (
              <Message role="status" variant={chosen.correct ? 'success' : 'error'} words={MESSAGE_TEXT}>
                <TaggedText text={chosen.lines.join(' ')} />
              </Message>
            )}
          </Fragment>
        );
      })}
    </ChipCard>
  );
}
