# scene/overlay

HTML drawn on the map's HTML layer: piece labels as buttons, the anchor that keeps the task card beside its door, and the shared hover-and-focus handlers.

- A label shows a text the game already made safe for the ladder; it never decides what a piece is or whether it can be changed.
- Not here: the task card itself and every other panel (`src/ui/incident/`), moving packets and stamps (`src/scene/traffic/`).
- May import: `@/copy`, `@/levels`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`).
