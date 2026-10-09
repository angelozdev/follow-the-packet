# scene/overlay

HTML drawn on the map's HTML layer: piece labels as buttons, the anchor that keeps the task card beside its Security Group, and the shared hover-and-focus handlers.

- A label shows a text the game already made safe for the ladder; it never decides what a piece is or whether it can be changed. It shows the lock of a fixed piece and the alert «!» of a device under attack, both also read as text, so neither can cover another label. A resource's own name in the label (`[[servidor2]]`) is drawn as a name tag, apart from the entity.
- Not here: the task card itself and every other panel (`src/ui/incident/`), moving packets and stamps (`src/scene/traffic/`).
- May import: `@/copy`, `@/levels`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`).
