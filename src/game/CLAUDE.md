# game

The session of one incident, as a pure reducer: the current world, the run of every flow, the tasks (done or not, read from the runs at once), the sent solution and Lucía's reply, hints, the explanation and the stars. What the map and the panels show lives in `view/`.

- No game clock: the session changes only with player actions; nothing here reads the clock, storage or the DOM.
- Not here: network rules (`src/engine/`), incident content and the world chain (`src/levels/`), drawing (`src/scene/`, `src/ui/`).
- May import: `@/engine`, `@/copy`, `@/levels`. Files inside import each other directly (`./x`, `./view/x`, `@/game/<folder>/x`).
