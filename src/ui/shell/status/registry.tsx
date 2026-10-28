import { useState } from 'react';
import { REGISTRY_TEXT } from '@/copy';
import { Button } from '@/design';
import { printedText, registryRows, type RegistryLine } from '@/game';
import { LineText, type ChooseLine } from './line-text';

interface RegistryProps {
  id: string;
  labelledBy: string;
  lines: RegistryLine[];
  choose: ChooseLine;
}

/** Takes the lines of the registry, the newest first, the id it takes and the id of what names it, and what chooses a packet, and returns the whole registry as a list: one row for each line, and the packet lines that follow each other and print the same text as one row with the number of times, a button that unfolds the older ones, which stay one row each below it. A row of change or of refusal is never part of a group. Which groups are unfolded is kept by their printed text. */
export function Registry({ id, labelledBy, lines, choose }: RegistryProps) {
  const [unfolded, setUnfolded] = useState<ReadonlySet<string>>(new Set());
  const rows = registryRows(lines);
  const toggle = (text: string) => setUnfolded((before) => (before.has(text) ? new Set([...before].filter((kept) => kept !== text)) : new Set([...before, text])));
  return (
    <ol id={id} aria-labelledby={labelledBy} className="incident__registry">
      {rows.map(({ line, older }, index) => {
        const text = printedText(line);
        const open = unfolded.has(text);
        return (
          <li key={rows.length - index}>
            <LineText line={line} choose={choose} />
            {older.length > 0 && (
              <Button variant="small" aria-expanded={open} onClick={() => toggle(text)}>
                {REGISTRY_TEXT.repeats(older.length + 1)}
              </Button>
            )}
            {open && (
              <ul>
                {older.map((packet, at) => (
                  <li key={at}>
                    <LineText line={packet} choose={choose} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
