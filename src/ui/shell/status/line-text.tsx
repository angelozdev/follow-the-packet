import { MESSAGE_TEXT, REGISTRY_TEXT } from '@/copy';
import { Button, Message } from '@/design';
import type { PacketLine, RegistryLine, RouteRow } from '@/game';
import type { GameSceneProps } from '@/scene';
import { TaggedText } from '@/ui/tagged-text';

export type ChooseLine = GameSceneProps['inspectTrigger'];
export type SeeRow = (row: RouteRow) => void;

interface LineTextProps {
  line: RegistryLine;
  choose: ChooseLine;
}

function PacketText({ line }: { line: PacketLine }) {
  return (
    <>
      <strong>
        <TaggedText text={line.label} tips={false} />
      </strong>{' '}
      <TaggedText text={line.result} tips={false} />
      {line.reason && (
        <>
          {' '}
          <TaggedText text={line.reason} tips={false} />
        </>
      )}
    </>
  );
}

/** Takes a line of the registry and what chooses a packet, and returns what the status bar and the open registry say for it: a packet is a button, which chooses it as its stamp does, with its label, its result and the reason it stopped when the player can place it; the change that emptied the sends is the note with its notice; the refusal of an entry of a table is an error message. */
export function LineText({ line, choose }: LineTextProps) {
  switch (line.kind) {
    case 'packet':
      return (
        <Button variant="text" {...choose(line.pieceId)}>
          <PacketText line={line} />
        </Button>
      );
    case 'change':
      return (
        <Message variant="note" words={MESSAGE_TEXT}>
          <TaggedText text={line.notice} />
        </Message>
      );
    case 'rejection':
      return (
        <Message variant="error" words={MESSAGE_TEXT}>
          <TaggedText text={line.text} />
        </Message>
      );
  }
}

/** Takes a line and returns where its «Ver fila en la tabla de rutas» goes, or undefined when it has none: only the line of a send that left, with the routing table known, has one. */
export function rowOfLine(line: RegistryLine): RouteRow | undefined {
  return line.kind === 'packet' ? line.row : undefined;
}

/** Takes the row a line points to and what shows it, and returns «Ver fila en la tabla de rutas». */
export function SeeRowButton({ row, seeRow }: { row: RouteRow; seeRow: SeeRow }) {
  return (
    <Button variant="small" onClick={() => seeRow(row)}>
      {REGISTRY_TEXT.seeRow}
    </Button>
  );
}

/** Takes a line, what chooses a packet and what shows a row, and returns the line with its «Ver fila en la tabla de rutas» after it when it has one. */
export function LineEntry({ line, choose, seeRow }: LineTextProps & { seeRow: SeeRow }) {
  const row = rowOfLine(line);
  return (
    <>
      <LineText line={line} choose={choose} />
      {row && <SeeRowButton row={row} seeRow={seeRow} />}
    </>
  );
}
