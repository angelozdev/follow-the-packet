# scene

The isometric paper-and-ink map drawn with React Three Fiber: the entity catalog (`entities/`), where each piece sits (`layout.ts`: one column per subnet or a single row for an office, and the edge, the internet and the actors on the left while the map shows the outside), the road (`road.tsx`), labels and the task card on an HTML layer (`overlay/`), live traffic (`traffic/`) and the canvas of the `/entidades` page (`catalog/`). `map-canvas.tsx` is the canvas both maps are drawn on; `ink.tsx` holds the paper box with ink edges that every piece is built from and the frame of every icon.

- Draws what the game computed: piece labels, locks, states and every packet's outcome come in as props; it never decides an outcome.
- Not here: panels and screens (`src/ui/`).
- May import: `@/levels`, `@/copy`, and only types from `@/engine`.
