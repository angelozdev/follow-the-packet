import { CLOCK_TEXT } from '@/copy';
import { Card, ChipTray } from '@/design';
import type { ClockStep } from '@/levels';
import { CardIcon } from '@/ui/card-icon';
import { TaggedText } from '@/ui/tagged-text';

interface ClockCardProps {
  seconds: number;
  steps: ClockStep[];
  onWait: (seconds: number) => void;
  hidden?: boolean;
}

/** The clock of the game, below the card of Lucía: the seconds it has run, written as minutes and seconds, and one chip for each step the incident lets the player wait by. The time belongs to the whole game and to no piece of the map, which is why it is not in a terminal or in a cache. The chips are actions (none stays picked) and report the seconds of the step. */
export function ClockCard({ seconds, steps, onWait, hidden }: ClockCardProps) {
  return (
    <Card aria-labelledby="clock-title" hidden={hidden} header={{ icon: <CardIcon kind="clock" />, title: <h2 id="clock-title">{CLOCK_TEXT.title}</h2> }}>
      <p className="clock" aria-live="polite">
        <code>{CLOCK_TEXT.time(seconds)}</code>
      </p>
      <ChipTray
        name={CLOCK_TEXT.tray}
        chips={steps.map((step) => ({ id: step.id, label: <TaggedText text={step.label} /> }))}
        onPick={(stepId) => {
          const step = steps.find((candidate) => candidate.id === stepId);
          if (step) onWait(step.seconds);
        }}
      />
      <p className="muted">{CLOCK_TEXT.note}</p>
    </Card>
  );
}
