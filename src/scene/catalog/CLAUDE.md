# scene/catalog

The canvas of the `/entidades` page: every entity of the catalog (`src/scene/entities/`) in every variant and state, in a grid that lines up on the screen of the isometric camera.

- `catalog-cells.tsx` lists the cells, one row per entity or variant (the networks, with the outline of a block; the packets of ICMP, then those of TCP and UDP last, each in the two shapes and in its intruder's version, so the rows above keep their place); `catalog-grid.ts` places them; `catalog-scene.tsx` draws them with a caption under each one.
- A cell draws pieces through the catalog with fixed props: nothing here reads a game or a world.
- Not here: the page around the canvas and the icon list (`src/ui/catalog/`), the pieces themselves (`src/scene/entities/`).
- May import: `@/copy`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`, `@/scene/entities`).
