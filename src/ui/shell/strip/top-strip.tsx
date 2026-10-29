import type { ReactNode } from 'react';
import { ALMANAC_TEXT, SCREEN_TEXT } from '@/copy';
import { Button } from '@/design';
import { MotionToggle } from '@/ui/motion-toggle';

interface AlmanacButton {
  domId: string;
  expanded: boolean;
  onPress: () => void;
}

interface TopStripProps {
  title: string;
  still: boolean;
  onStillChange: (still: boolean) => void;
  almanac: AlmanacButton;
  clock: ReactNode;
}

export function TopStrip({ title, still, onStillChange, almanac, clock }: TopStripProps) {
  return (
    <header className="incident__strip">
      <Button variant="text" href="#/">
        {SCREEN_TEXT.back}
      </Button>
      <h1>{title}</h1>
      <Button variant="small" id={almanac.domId} aria-expanded={almanac.expanded} onClick={almanac.onPress}>
        {ALMANAC_TEXT.open}
      </Button>
      {clock}
      <MotionToggle still={still} className="incident__motion" onChange={onStillChange} />
    </header>
  );
}
