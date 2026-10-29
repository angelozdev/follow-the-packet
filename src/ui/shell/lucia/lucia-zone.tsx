import type { ReactNode } from 'react';

interface LuciaZoneProps {
  id: string;
  children: ReactNode;
}

/** Takes the id of the zone and what the caller puts in it (her card, the clock, the case, the question and the result) and returns the zone at the left of the incident screen: a fixed width whose height is capped at the room between the strip and the status bar, with a scroll of its own. It draws nothing of its own: the caller decides what goes in it, and what hides when the zone is folded (`caller-controls-visibility`). */
export function LuciaZone({ id, children }: LuciaZoneProps) {
  return (
    <div id={id} className="incident__lucia">
      {children}
    </div>
  );
}
