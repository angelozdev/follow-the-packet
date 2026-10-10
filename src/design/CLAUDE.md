# design

The game's design system: every colour, font, line, radius and shadow of the interface and the map as a token (`tokens.css`), the reader that lets the 3D map use the same tokens (`tokens.ts`), and the styles every screen shares (`primitives.css`, which holds the one focus ring).

- `tokens.css` has two layers of colour: the palette (`--palette-*`, raw colours named after what they are) and the roles (`--color-*`, named after what they are for). Styles and the map use roles, never the palette. The other tokens (`--font-*`, `--stroke-*`, `--radius*`, `--shadow-*`, `--focus-*`) have one layer.
- Vermilion has three roles, today with the same value: `--color-danger` (blocked, intruder, alert, a rejected solution, a wrong answer), `--color-emphasis` (the primary button, the chapter numbers, the stars, the "nuevo" mark, the tooltip shadow) and `--color-focus` (the focus ring).
- `token(name)` and `tokenPx(name)` read `tokens.css` itself (`?raw`), so the map and the interface share one source; `src/scene/theme.ts` names what the map uses.
- Not here: screens and panels (`src/ui/`), map pieces (`src/scene/`), visible text (`src/copy/`).
- May import: no layer. `src/ui/` and `src/scene/` import it through `index.ts` (`@/design`); `src/styles.css` imports its stylesheets.
