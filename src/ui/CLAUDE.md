# ui

Screens and panels: the roadmap (the game chapters grouped by level: a caption `h2` per level and a `Card` per chapter, with «Capítulo N» and its count on the stripe and the chapter's title under it), the notice page (unknown or locked incident), the incident page and the incident screen (`incident/`), the entity catalog page (`catalog/`, at `#/entidades`, not linked from the roadmap), plus shared pieces (`stars.tsx`, `tagged-text.tsx`, `term-tip.tsx`, `card-icon.tsx` (the icon on the stripe of a card whose kind is not an entity of the map), and the "Sin animaciones" checkbox: `motion-toggle.tsx` with `use-still-mode.ts`).

- A term in a text shows its definition on hover, in a tooltip portaled to `document.body` and positioned with `@floating-ui/react-dom` (`term-tip.tsx`). Terms are not Tab stops. The inspection box renders its terms with `tips={false}`, because it does not take the mouse.
- Every button and link is a `Button` of `@/design`, every chip and option a `Choice`, every panel a `Card`, and every name a `NameTag`; this folder writes no `<button>` or `<a>` of its own and adds no look of its own to them.
- Renders results computed elsewhere. Effects live in `use-*.ts` hooks next to their first consumer; prefer `@mantine/hooks`.
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, `@/design`, and only types from `@/engine`.
