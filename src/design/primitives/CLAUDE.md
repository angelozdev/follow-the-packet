# design/primitives

The interface elements that screens share, one file per family (`button.tsx`, `choice.tsx` with `Choice` and `ChipTray`, `name-tag.tsx`), their tests next to them (`button` and `choice`), and their styles with the one focus ring (`primitives.css`). The primitives that hold content (`Card`, `Tabs`) live in `panels/`, which has its own guide; `primitives.css` styles those too.

- A primitive takes no `className` and no `style`: a new look is a new variant of its file, never a class at the call site.
- Not here: a panel, a list of panels or a table (`panels/`), the tokens and the reader of the tokens (`src/design/`), screens and panels of the game (`src/ui/`), map pieces (`src/scene/`), visible text (`src/copy/`).
- May import: no layer. Other layers import it through the barrel of `src/design/` (`@/design`); `src/styles.css` imports `primitives.css`.
