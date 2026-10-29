import { CLOCK_TEXT } from '@/copy';
import { ChipTray } from '@/design';
import type { ClockStep } from '@/levels';
import { CardIcon } from '@/ui/card-icon';
import { TaggedText } from '@/ui/tagged-text';

interface GameClockProps {
  seconds: number;
  steps: ClockStep[];
  onWait: (seconds: number) => void;
}

export function GameClock({ seconds, steps, onWait }: GameClockProps) {
  return (
    <section className="incident__clock" aria-label={CLOCK_TEXT.title}>
      <CardIcon kind="clock" />
      <code aria-live="polite">{CLOCK_TEXT.time(seconds)}</code>
      <ChipTray
        name={CLOCK_TEXT.tray}
        chips={steps.map((step) => ({ id: step.id, label: <TaggedText text={step.label} /> }))}
        onPick={(stepId) => {
          const step = steps.find((candidate) => candidate.id === stepId);
          if (step) onWait(step.seconds);
        }}
      />
    </section>
  );
}
