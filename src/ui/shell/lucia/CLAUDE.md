# ui/shell/lucia

The zone of Lucía, at the left of the incident screen. `lucia-zone.tsx` (`LuciaZone`) holds what the caller puts in it: her card, the clock, the case, the question and the result.

- The zone (`.incident__lucia`) has a fixed width (`--lucia-width` in `src/styles.css`) and a height capped at the room between the strip and the status bar, with a scroll of its own; the text of her cards may grow and never moves the box of the map, because the box is a cell of the grid and the width of the zone does not change. Under 901 px it has no cap and no scroll of its own and lies under the strip, above the map.
- The zone draws nothing of its own: the screen decides what goes in it (`caller-controls-visibility`).
- Not here: what the cards show (`src/ui/incident/side-cards/`), the Spanish text (`src/copy/`).
- May import: nothing outside `react`.
