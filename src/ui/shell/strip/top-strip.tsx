import { SCREEN_TEXT } from '@/copy';
import { Button } from '@/design';
import { MotionToggle } from '@/ui/motion-toggle';

interface TopStripProps {
  title: string;
  still: boolean;
  onStillChange: (still: boolean) => void;
}

/** Takes the title of the incident, whether animations are off and what changes that, and returns the strip across the top of the incident screen: the link back to the roadmap, the title as the `h1` of the page and the «Sin animaciones» checkbox. It is a row of its own above the zones, so it floats over nothing. */
export function TopStrip({ title, still, onStillChange }: TopStripProps) {
  return (
    <header className="incident__strip">
      <Button variant="text" href="#/">
        {SCREEN_TEXT.back}
      </Button>
      <h1>{title}</h1>
      <MotionToggle still={still} className="incident__motion" onChange={onStillChange} />
    </header>
  );
}
