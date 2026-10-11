# design/primitives/panels

The primitives that hold content: `Card` (`card.tsx`), a panel with an optional dark stripe on top; `Tabs` (`tabs.tsx`), a list of panels of which one shows at a time; and `Table`, once Task 17 adds it. Their tests sit next to them (`card` and `tabs`); their styles are in `../primitives.css`, next to the others.

- A primitive here frames or arranges content it does not own: the content arrives as `children`, as the `panel` of a tab or as data for the stripe, and its inner layout belongs to the caller. It takes no `className` and no `style`: a new look is a new variant of its file.
- `Card` has no `overflow`: it never clips its content and a grid or flex parent never squeezes it below its height. The stripe rounds its own top corners instead (see "Style B" in `DESIGN.md`).
- Not here: an element the player acts on or picks with (`button.tsx`, `choice.tsx`) or a name (`name-tag.tsx`), which stay in `src/design/primitives/`; the tokens (`src/design/`), screens (`src/ui/`), map pieces (`src/scene/`) and visible text (`src/copy/`).
- May import: no layer; `react` and, for `Tabs`, `@radix-ui/react-tabs`. A sibling primitive of `src/design/primitives/` is imported with the `@/design/primitives/<file>` path, never with `../`. Other layers import this folder through the barrel of `src/design/` (`@/design`).
