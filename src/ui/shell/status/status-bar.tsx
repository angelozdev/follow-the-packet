import { useId, useState } from 'react';
import { REGISTRY_TEXT, SCREEN_TEXT } from '@/copy';
import { Button } from '@/design';
import type { RegistryLine } from '@/game';
import { LineText, SeeRowButton, rowOfLine, type ChooseLine, type SeeRow } from './line-text';
import { Registry } from './registry';
import { useRoomForTheBar } from './use-room-for-the-bar';

interface StatusBarProps {
  lines: RegistryLine[];
  choose: ChooseLine;
  seeRow: SeeRow;
}

/** Takes the lines of the registry, the newest first, what chooses a packet and what shows the row of a send in its table, and returns the bar fixed at the bottom of the incident screen: a live region that says the newest line and nothing else (with no line it says `SCREEN_TEXT.statusEmpty`, which names no term) and «Registro (N)», N being every line, which opens the whole registry above the bar and closes it, and «Ver fila» of the newest line when it has one, which is outside that region. With no line the button is not drawn (the empty line is all the bar says) and a registry that was open stays closed when a line comes back. The open registry is part of the bar, so it takes its height from the page, and the bar keeps the bottom scroll padding of the page equal to its height (`useRoomForTheBar`). */
export function StatusBar({ lines, choose, seeRow }: StatusBarProps) {
  const [open, setOpen] = useState(false);
  const barRef = useRoomForTheBar();
  const buttonId = useId();
  const listId = useId();
  const hasLines = lines.length > 0;
  if (!hasLines && open) setOpen(false);
  const shown = open && hasLines;
  const [newest] = lines;
  const newestRow = newest && rowOfLine(newest);
  return (
    <div ref={barRef} className="incident__status">
      {shown && <Registry id={listId} labelledBy={buttonId} lines={lines} choose={choose} seeRow={seeRow} />}
      <div className="incident__status-line">
        <div role="log">{newest ? <LineText line={newest} choose={choose} /> : <p>{SCREEN_TEXT.statusEmpty}</p>}</div>
        {newestRow && <SeeRowButton row={newestRow} seeRow={seeRow} />}
        {hasLines && (
          <Button variant="small" id={buttonId} aria-expanded={shown} aria-controls={shown ? listId : undefined} onClick={() => setOpen(!open)}>
            {REGISTRY_TEXT.open(lines.length)}
          </Button>
        )}
      </div>
    </div>
  );
}
