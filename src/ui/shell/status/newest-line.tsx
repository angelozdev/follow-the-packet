import { SCREEN_TEXT } from '@/copy';
import type { RegistryLine } from '@/game';
import { LineText, SeeRowButton, rowOfLine, type ChooseLine, type SeeRow } from './line-text';

interface NewestLineProps {
  lines: RegistryLine[];
  choose: ChooseLine;
  seeRow: SeeRow;
}

export function NewestLine({ lines, choose, seeRow }: NewestLineProps) {
  const [newest] = lines;
  const newestRow = newest && rowOfLine(newest);
  return (
    <div className="incident__newest">
      <div role="log" tabIndex={0}>
        {newest ? <LineText line={newest} choose={choose} /> : <p>{SCREEN_TEXT.statusEmpty}</p>}
      </div>
      {newestRow && <SeeRowButton row={newestRow} seeRow={seeRow} />}
    </div>
  );
}
