import { MESSAGE_TEXT, SCREEN_TEXT } from '@/copy';
import { Button, Message } from '@/design';
import type { PacketLine, RegistryLine } from '@/game';
import type { GameSceneProps } from '@/scene';
import { TaggedText } from '@/ui/tagged-text';

interface StatusBarProps {
  line: RegistryLine | null;
  choose: GameSceneProps['inspectTrigger'];
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

function LineText({ line, choose }: { line: RegistryLine; choose: StatusBarProps['choose'] }) {
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

/** Takes the newest line of the registry (null when there is none) and what chooses a packet, and returns the bar fixed at the bottom of the incident screen, a live region that says that line and nothing else: a packet is a button, which chooses it as its stamp does, with its label, its result and the reason it stopped when the player can place it; the change that emptied the sends is the note with its notice; the refusal of an entry of a table is an error message; and with no line the bar says `SCREEN_TEXT.statusEmpty`, which names no term. */
export function StatusBar({ line, choose }: StatusBarProps) {
  return (
    <div role="log" className="incident__status">
      {line ? <LineText line={line} choose={choose} /> : <p>{SCREEN_TEXT.statusEmpty}</p>}
    </div>
  );
}
