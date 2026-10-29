# ui/shell/lucia

The zone of Lucía, at the left of the incident screen. `lucia-zone.tsx` (`LuciaZone`) holds what the caller puts in it: her card and, under it, the clock, the case, the question and the result, as direct children of the zone. `use-lucia-fold.ts` (`useLuciaFold`) is the fold of the zone.

- The zone (`.incident__lucia`) has a fixed width (`--lucia-width` in `src/styles.css`) and a height capped at the room between the strip and the status bar, with a scroll of its own; the text of her cards may grow and never moves the box of the map, because the box is a cell of the grid and the width of the zone does not change. Under 901 px it has no cap and no scroll of its own and lies under the strip, above the map.
- The zone folds to her band: the arrow in the stripe of her card (a `small` `Button` with `aria-expanded` and `aria-controls` that names the zone, `LUCIA_TEXT.foldLabel`) asks `useLuciaFold`, which starts unfolded in every incident, keeps the fold in the state of the screen (nothing is saved: the next incident starts unfolded) and gives the zone its `id`. Folded, the body of her card (`Card` with `folded`) and the cards under it (each takes `hidden` from the screen, which is the one that knows the fold) stay mounted but hidden, so they leave the Tab order and the accessibility tree and keep their state: the hint line that takes the focus when it mounts does not take it again on unfolding. Folding changes the height of the zone and never the box of the map.
- The zone draws nothing of its own: the screen decides what goes in it (`caller-controls-visibility`).
- Not here: what the cards show (`src/ui/incident/side-cards/`), the Spanish text (`src/copy/`).
- May import: `react`.
