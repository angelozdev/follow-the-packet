# scene

The isometric paper-and-ink map drawn with React Three Fiber: the entity catalog (`entities/`), where each piece sits (`layout.ts`: one column per subnet or a single row for an office, and the edge, the internet and the actors on the left while the map shows the outside), the road (`road.tsx`), labels and the cards that open beside a piece on an HTML layer (`overlay/`), live traffic (`traffic/`) and the canvas of the `/entidades` page (`catalog/`). `map-canvas.tsx` is the canvas both maps are drawn on; `ink.tsx` holds the paper box with ink edges that every piece is built from and the frame of every icon.

- A card opens beside its piece, on the side `cardPlacement` and `terminalSide` pick in `layout.ts`. A firewall's card sits 110px from it, on the side with more room. The terminal of a device or an actor sits 68px from it (just past its mat and its label) and opens on the side where it stays inside the map and covers no other piece's label, so in an office it opens toward the end of the row with no other device; if neither side is clear it takes the side with more room, as a firewall's card does. `cameraPosition` and `CAMERA_ZOOM` are the map's one camera, which the layout tests use to project positions to pixels.
- Draws what the game computed: piece labels, locks, states and every packet's outcome come in as props; it never decides an outcome.
- Not here: panels and screens (`src/ui/`).
- May import: `@/levels`, `@/copy`, and only types from `@/engine`.
