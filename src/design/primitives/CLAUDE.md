# design/primitives

The interface elements that screens share, one file per family (`button.tsx`, `choice.tsx` with `Choice` and `ChipTray`, `message.tsx`, `name-tag.tsx`), their tests next to them (`button`, `choice` and `message`), and their styles with the one focus ring (`primitives.css`). The primitives that hold content (`Card`, `Tabs`) live in `panels/`, which has its own guide; `primitives.css` styles those too.

- A primitive takes no `className` and no `style`: a new look is a new variant of its file, never a class at the call site.
- A `ChipTray` that gives no `picked` is a tray of actions (the steps of the clock card): its chips are the same chips, announced as plain buttons because none stays picked. With `picked` (even `null`) the chips are toggles.
- Not here: a panel, a list of panels or a table (`panels/`), the tokens and the reader of the tokens (`src/design/`), screens and panels of the game (`src/ui/`), map pieces (`src/scene/`), visible text (`src/copy/`).
- May import: no layer. Other layers import it through the barrel of `src/design/` (`@/design`); `src/styles.css` imports `primitives.css`.
