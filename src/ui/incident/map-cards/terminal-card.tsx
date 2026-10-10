import { useState } from 'react';
import { TERMINAL_TEXT, type TermText } from '@/copy';
import type { SendPicks, SendTrayName, TerminalCard as Terminal } from '@/game';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { ChipCard, ChipTray } from './chip-card';

interface TerminalCardProps {
  card: Terminal;
  describe: (picks: Partial<SendPicks>) => TermText | null;
  onPickOrigin: (fromId: string) => void;
  onSend: (picks: SendPicks) => void;
  onClose: () => void;
}

/** The terminal of an origin: a chip from each tray it shows, the line those chips make (the real ping command, or a packet made by hand) and "Enviar". Picking another origin moves the card beside it; the other picks stay. */
export function TerminalCard({ card, describe, onPickOrigin, onSend, onClose }: TerminalCardProps) {
  const [picks, setPicks] = useState<Partial<SendPicks>>(card.fixed);
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const chosen: Partial<SendPicks> = { ...picks, from: card.fromId };
  const line = describe(chosen);
  const pick = (tray: SendTrayName, chipId: string) => {
    if (tray === 'from') onPickOrigin(chipId);
    else setPicks({ ...picks, [tray]: chipId });
  };
  const send = () => {
    if (chosen.to && chosen.message) onSend({ from: card.fromId, to: chosen.to, message: chosen.message });
  };
  return (
    <ChipCard title={card.title} heading={heading} onClose={onClose}>
      <p className="slot" aria-live="polite">
        {line ? (
          <code>
            <TaggedText text={line} />
          </code>
        ) : (
          <span className="slot__empty">{TERMINAL_TEXT.incomplete}</span>
        )}
      </p>
      {card.trays.map((tray) => (
        <ChipTray key={tray.name} name={TERMINAL_TEXT.trays[tray.name]} chips={tray.chips} picked={chosen[tray.name] ?? null} onPick={(chipId) => pick(tray.name, chipId)} />
      ))}
      <button type="button" className="btn" disabled={!line} onClick={send}>
        {TERMINAL_TEXT.send}
      </button>
    </ChipCard>
  );
}
