# scene

The map of the game, drawn in SVG: what is built beside this folder in `map2d/` (its guide, `map2d/CLAUDE.md`, is the one for the map), the icons of the entity catalog (`entities/icons/`), the look of a packet (`traffic/flow-look.ts`), the label of a piece and the type of its inspect trigger (`overlay/`), and the two selectors the interface uses to keep clear of the map (`html-layer.ts`).

- `index.ts` is the layer's barrel: `GameScene` (the `GameScene2D` of `map2d/`) and `CatalogScene` (the `CatalogScene2D` of `map2d/catalog/`), the icons (`EntityIcon`, `StampIcon`, `InkIcon`), `MAP_MARKS` and `MAP_CARD`, `pieceDomId` and the type `GameSceneProps`.
- `html-layer.ts` names, for the UI that floats over the map, what it has to keep clear of: `MAP_MARKS` (the labels, stamps and group names the player reads) and `MAP_CARD` (`.map-card`, a card beside its piece or docked). The scene does not know the inspection box: the box reads both from the DOM and steps aside from the card (`src/ui/incident/use-inspection.ts`).
- Draws what the game computed: piece labels, locks, states and every packet's outcome come in as props; it never decides an outcome.
- Not here: panels and screens (`src/ui/`).
- May import: `@/levels`, `@/copy`, `@/design`, and only types from `@/engine`.
