# game

The session of one incident, as a pure reducer: the current world, the run of every flow, the stability time of each task, hints, the explanation and the stars. What the map and the panels show lives in `view/`.

- Time arrives only as `tick(ms)` actions; nothing here reads the clock, storage or the DOM.
- Not here: network rules (`src/engine/`), incident content and the world chain (`src/levels/`), drawing (`src/scene/`, `src/ui/`).
- May import: `@/engine`, `@/copy`, `@/levels`. Files inside import each other directly (`./x`, `./view/x`, `@/game/<folder>/x`).
