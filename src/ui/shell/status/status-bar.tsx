import { useId, useState } from 'react';
import { REGISTRY_TEXT, SCREEN_TEXT } from '@/copy';
import { Button } from '@/design';
import type { RegistryLine } from '@/game';
import { LineText, type ChooseLine } from './line-text';
import { Registry } from './registry';

interface StatusBarProps {
  lines: RegistryLine[];
  choose: ChooseLine;
}

/** Takes the lines of the registry, the newest first, and what chooses a packet, and returns the bar fixed at the bottom of the incident screen: a live region that says the newest line and nothing else (with no line it says `SCREEN_TEXT.statusEmpty`, which names no term) and «Registro (N)», N being every line, which opens the whole registry above the bar and closes it. The button is disabled while there is no line, and the line that says so is beside it. The open registry is part of the bar, so it takes its height from the page. */
export function StatusBar({ lines, choose }: StatusBarProps) {
  const [open, setOpen] = useState(false);
  const buttonId = useId();
  const listId = useId();
  const shown = open && lines.length > 0;
  const [newest] = lines;
  return (
    <div className="incident__status">
      {shown && <Registry id={listId} labelledBy={buttonId} lines={lines} choose={choose} />}
      <div className="incident__status-line">
        <div role="log">{newest ? <LineText line={newest} choose={choose} /> : <p>{SCREEN_TEXT.statusEmpty}</p>}</div>
        <Button variant="small" id={buttonId} aria-expanded={shown} aria-controls={shown ? listId : undefined} disabled={lines.length === 0} onClick={() => setOpen(!open)}>
          {REGISTRY_TEXT.open(lines.length)}
        </Button>
      </div>
    </div>
  );
}
