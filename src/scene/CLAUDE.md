# scene

The isometric paper-and-ink map drawn with React Three Fiber: layout, pieces, labels and the task card on an HTML layer (`overlay/`), and live traffic (`traffic/`).

- Draws what the game computed: piece labels, locks and every packet's outcome come in as props; it never decides an outcome.
- Not here: panels and screens (`src/ui/`).
- May import: `@/levels`, `@/copy`, and only types from `@/engine`.
