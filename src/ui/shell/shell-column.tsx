import type { ReactNode } from 'react';

interface ShellColumnProps {
  lucia: ReactNode;
  panel: ReactNode;
}

/** Takes what goes in the region of Lucía (her card, the clock, the case, the question and the result) and what goes in the panel under it (the note of help, or what the player chose), and returns the column of the incident screen: above 900 px as tall as the window with each region scrolling by itself, and under it, stacked under the map. The panel is the element the caller gives, a direct child of the column. */
export function ShellColumn({ lucia, panel }: ShellColumnProps) {
  return (
    <aside className="incident__side">
      <div className="incident__lucia">{lucia}</div>
      {panel}
    </aside>
  );
}
