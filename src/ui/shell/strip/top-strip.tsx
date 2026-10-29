import type { ReactNode } from 'react';
import { SCREEN_TEXT } from '@/copy';
import { Button } from '@/design';
import { MotionToggle } from '@/ui/motion-toggle';

interface TopStripProps {
  title: string;
  still: boolean;
  onStillChange: (still: boolean) => void;
  clock: ReactNode;
}

export function TopStrip({ title, still, onStillChange, clock }: TopStripProps) {
  return (
    <header className="incident__strip">
      <Button variant="text" href="#/">
        {SCREEN_TEXT.back}
      </Button>
      <h1>{title}</h1>
      {clock}
      <MotionToggle still={still} className="incident__motion" onChange={onStillChange} />
    </header>
  );
}
