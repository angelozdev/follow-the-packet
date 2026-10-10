# game

The session of one incident, as a pure reducer: the current world, the run of every flow, the packets the player sent (the last one of each combination of chips, with the number of its send), the tasks (done or not, read from the runs and the sent packets at once), the sent solution and Lucía's reply, hints, the explanation and the stars. The middle star depends on the mechanic: only what is needed for a filter, no hints for a send. What the map and the panels show lives in `view/`.

- No game clock: the session changes only with player actions; nothing here reads the clock, storage or the DOM.
- Not here: network rules (`src/engine/`), incident content and the world chain (`src/levels/`), drawing (`src/scene/`, `src/ui/`).
- May import: `@/engine`, `@/copy`, `@/levels`. Files inside import each other directly (`./x`, `./view/x`, `@/game/<folder>/x`).
