# scene

The isometric paper-and-ink map drawn with React Three Fiber: the entity catalog (`entities/`), where each piece sits (`layout.ts`), the road (`road.tsx`), labels and the task card on an HTML layer (`overlay/`), and live traffic (`traffic/`). `ink.tsx` holds the paper box with ink edges that every piece is built from.

- Draws what the game computed: piece labels, locks, states and every packet's outcome come in as props; it never decides an outcome.
- Not here: panels and screens (`src/ui/`).
- May import: `@/levels`, `@/copy`, and only types from `@/engine`.
