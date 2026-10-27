# ui/shell

The fixed places of the incident screen that do not hold a map: for now, the column at the right of the map (`shell-column.tsx`, `ShellColumn`).

- The column has two regions, one under the other. The region of Lucía (`.incident__lucia`) holds her card, the note of the box with no room, the clock, the case, the question and the result, as the side panel held them. The panel is the element the caller gives, a direct child of the column (`.incident__side`): a `Message` of variant `note`, or the card of what the player chose.
- Above 900 px the column is as tall as the window and the page does not scroll: the region of Lucía takes what her cards need up to 60 % of the column and scrolls by itself, and the panel sits under it. The column itself never scrolls. At 900 px and under it keeps the stacking of before: the map, Lucía and the panel under it, with no cap and no scroll of their own, and the page scrolls.
- The column draws nothing of its own: the caller decides what goes in each region (`caller-controls-visibility`).
- Not here: what the cards show (`src/ui/incident/side-cards/`), the map (`src/scene/`), visible Spanish text (`src/copy/`).
- May import: `react`.
