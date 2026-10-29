import type { ReactNode } from 'react';

/** Takes what goes in the zone of Lucía (her card, the clock, the case, the question and the result) and returns the zone at the left of the incident screen: a fixed width whose height is capped at the room between the strip and the status bar, with a scroll of its own. It draws nothing of its own: the caller decides what goes in it (`caller-controls-visibility`). */
export function LuciaZone({ children }: { children: ReactNode }) {
  return <div className="incident__lucia">{children}</div>;
}
