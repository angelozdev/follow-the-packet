import { useId, useState } from 'react';
import { REGISTRY_TEXT } from '@/copy';
import { Button } from '@/design';
import type { RegistryLine } from '@/game';
import { BottomStrip } from '@/ui/shell/strip/bottom-strip';
import type { ChooseLine, SeeRow } from './line-text';
import { NewestLine } from './newest-line';
import { Registry } from './registry';

interface StatusBarProps {
  lines: RegistryLine[];
  choose: ChooseLine;
  seeRow: SeeRow;
}

export function StatusBar({ lines, choose, seeRow }: StatusBarProps) {
  const [open, setOpen] = useState(false);
  const buttonId = useId();
  const listId = useId();
  const hasLines = lines.length > 0;
  if (!hasLines && open) setOpen(false);
  const shown = open && hasLines;
  return (
    <BottomStrip
      line={
        <NewestLine lines={lines} choose={choose} seeRow={seeRow}>
          {hasLines && (
            <Button variant="small" id={buttonId} aria-expanded={shown} aria-controls={shown ? listId : undefined} onClick={() => setOpen(!open)}>
              {REGISTRY_TEXT.open(lines.length)}
            </Button>
          )}
        </NewestLine>
      }
      bar={null}
      box={shown && <Registry id={listId} labelledBy={buttonId} lines={lines} choose={choose} seeRow={seeRow} />}
    />
  );
}
