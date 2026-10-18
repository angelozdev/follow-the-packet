# scene/map2d

The 2D (SVG) map of the game, built beside the 3D one until the 3D is deleted. It lives here, and not in `src/scene/`, because that folder has 11 of its 12 files and the flag of Task M9 takes the last one; when `three` goes (Task M24 of `docs/plans/2026-10-12-follow-the-packet-2d-map.md`) its sub-folders move up into `src/scene/` with the same names. The design is in `docs/specs/2026-10-12-follow-the-packet-2d-map-design.md`.

- Sub-folders, each with its own guide: `layout/` (pure functions that decide where everything goes, in pixels) and `marks/` (pure functions that decide what stands on the layout: the fan of stamps with its «+N», the labels of packets, and the pairs of boxes that overlap). The plan adds `cards/`, `entities/`, `overlay/`, `traffic/` and `catalog/` here, one task at a time.
- The 3D files (`game-scene.tsx`, `map-canvas.tsx`, `road.tsx`, `ink.tsx`, `layout.ts` and the folders `entities/`, `traffic/`, `overlay/` and `catalog/` of `src/scene/`) do not change while this folder exists, except the pure files a task of the plan names.
- Draws what the game computed, like the rest of `src/scene/`: it never decides an outcome.
- Not here: panels and screens (`src/ui/`), the Spanish text (`src/copy/`), anything that moves a packet (`src/engine/`).
- May import: `@/copy`, `@/levels`, `@/design`, only types from `@/engine`, and other files of `src/scene/` (`@/scene/<file>`, `@/scene/map2d/<folder>`).
