# ui/catalog

The `#/entidades` page: the entity catalog for design review, with every piece on one canvas (`src/scene/catalog/`), every icon with its name, and every element of the interface in every variant and state (`interface-section.tsx`). The roadmap does not link to it.

- The interface section draws each element the way the screens draw it. When a screen gains an element, a variant or a state, the section gains its specimen, so the capture covers it.
- Not here: the pieces, the icons and the canvas (`src/scene/`), the names of the variants and the sample texts (`src/copy/ui.ts`).
- May import: `@/scene`, `@/copy`, `@/design`, other files of `src/ui/` (`@/ui/<file>`), and only types from `@/engine`.
