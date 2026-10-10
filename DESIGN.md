# Design system

How "Sigue el paquete" looks, in one place: the tokens, the scales, the primitives and the rules for using them. The code lives in `src/design/`. The review page is `#/entidades`: its section "Elementos de la interfaz" shows every primitive in every variant and state, and its section "Piezas del mapa" shows every map piece with its label and stamp. Playwright compares both with a capture that tolerates no changed pixel, except the edges pixelmatch counts as anti-aliasing. The captures use the system fonts of the machine, so after an OS or browser update that changes them, look at the diff images before re-recording.

## Principles

- **Paper and ink.** Text and lines are ink on paper. Vermilion is the value of three roles, danger, emphasis and focus; only `--color-danger` means danger.
- **Never colour alone.** A state also changes a shape or a text: a dashed border, a double ring, a word.
- **One standard per element.** Every action or link is a `Button`, every chip or option a `Choice`, every tray of chips a `ChipTray`, every panel a `Card`, every own name a `NameTag`, every small heading a caption. A new look is a new variant of its primitive, never a sibling element and never a class added at the call site.

## Colour

`tokens.css` has two layers. The palette names a colour by what it is; only `tokens.css` uses it. The roles name a colour by what it is for; styles and the 3D map use only roles.

| Palette | Value |
|---------|-------|
| `--palette-paper` | `#f6f1e7` |
| `--palette-paper-light` | `#fbf8f2` |
| `--palette-paper-dark` | `#efe8da` |
| `--palette-ink` | `#2b2b2b` |
| `--palette-ink-light` | `#5f5a52` |
| `--palette-vermilion` | `#bf370f` |

| Role | Palette | For |
|------|---------|-----|
| `--color-page` | paper | the page, chips and options |
| `--color-surface` | paper light | cards, buttons, map labels, stamps, map pieces (`PAPER_FILL`) |
| `--color-shade` | paper dark | name tags, a chosen option, a disabled button, the shaded parts of map pieces (`PAPER_SHADE`) |
| `--color-ink` | ink | text, borders, shadows, map lines (`INK`) |
| `--color-ink-soft` | ink light | secondary text, captions of fields, a disabled button, dashed and soft borders |
| `--color-on-fill` | paper light | text on a filled background: a pressed chip, the primary button, a tooltip, the alert mark |
| `--color-danger` | vermilion | blocked, intruder, alert, a rejected solution, a wrong answer (`DANGER` on the map) |
| `--color-emphasis` | vermilion | the primary button, chapter numbers, stars, the "nuevo" mark, the tooltip shadow |
| `--color-focus` | vermilion | the focus ring |

### The vermilion rule

Vermilion is for danger. Emphasis and focus share its value today, but they are separate roles: either can change in one line of `tokens.css` without touching danger. A new use of vermilion picks the role it means; nothing outside `tokens.css` names `--palette-vermilion`.

### Contrast

Every text on a background reaches 4.5:1 (WCAG 2.2 AA, criterion 1.4.3) and every non-text use of vermilion (stamps, stars, the focus ring, dashed borders, the alert mark, map lines) reaches 3:1 against the colour beside it (criterion 1.4.11). One value serves the button fill and the text on paper, because both are the same pair seen from either side: `--palette-vermilion` is `#bf370f`, the old `#e4572e` (3.5:1 under the button label, 3.3:1 as text on the page) darkened with its hue kept (about 14°) and its saturation raised, so it stays a vivid vermilion and does not turn brown.

| Pair | Ratio |
|------|-------|
| `--color-on-fill` on vermilion (the primary button, the alert mark) | 5.26 |
| vermilion text on `--color-surface` | 5.26 |
| vermilion text on `--color-page` | 4.95 (4.61 on its darkest grain pixels) |
| vermilion text on `--color-shade` (a name tag inside a vermilion sentence sits on it) | 4.57 |
| the focus ring on page, surface and shade | the same ratios, all above 3 |
| vermilion on the lit floor of the map, measured on a capture on 2026-10-10 (floor `#d0cfcd`; the map draws vermilion shapes as `#cd2c0f`) | 3.58 as the interface draws it, 3.40 as the map draws it |

- **The grain.** The page's `--grain` darkens its paper by up to about 4 % toward ink, to `#eee9df`; the test treats that darkest pixel as the page.
- **Guard.** `src/design/tokens.test.ts` reads `tokens.css` and asserts these pairs from the roles (`--color-danger` and `--color-emphasis` as text on every paper, `--color-on-fill` on both, `--color-focus` on every paper), so a new value that falls under 4.5:1 or 3:1 fails the test. The map floor is a lit render, not a token, so its ratio is measured by hand.
- **Left out on purpose.** Vermilion beside ink (the outline of a blocking bar, the Atacante cube beside the intruder's rhombus, the tooltip's `--shadow-tip`) is 2.5:1, below 3:1. The ink outline already separates the shape from the paper (the test asserts that), the shadow is decoration, and the state also changes a shape or a word.
- **Not covered.** A `soon` card fades all its content with `opacity: 0.5`; its chapter numbers, in vermilion, and its ink text land near 2:1.

## Type

- **Fonts:** `--font-display` (Newsreader: `h1`, `h2`, chapter numbers, stamps), `--font-body` (IBM Plex Sans: everything else), `--font-mono` (IBM Plex Mono: name tags and the terminal line, `code`).
- **Weights:** `--weight-regular` (400), `--weight-bold` (600), `--weight-display` (500). `index.html` loads Plex Sans 400 and 600, Newsreader 500 and Plex Mono 400. Newsreader 600 is not loaded, on the student's choice (2026-10-09): a stamp and a term inside a title ask for bold, and the browser draws it from 500. A new weight is loaded there first.

| Size | Value | For |
|------|-------|-----|
| `--text-2xs` | 11 px | the "nuevo" mark, the alert mark on the map |
| `--text-xs` | 12 px | captions, a name on the map, catalog captions |
| `--text-sm` | 13 px | map labels, small buttons |
| `--text-md` | 14 px | chips, tooltips, feedback, secondary lines, the terminal line |
| `--text-base` | 16 px | body text, buttons, options |
| `--text-lg` | 18 px | the lede, stamps |
| `--text-xl` | 22.4 px | `h2`, chapter numbers, the incident title |
| `--text-2xl` | 36 px | `h1` |

- **Caption:** the class `caption` (bold, `--text-xs`, uppercase, `--tracking-caps`) for the heading of a list; `caption caption--soft` for the label of a field, a tray or a role. Every `h3` is a caption.
- **Secondary text:** the class `muted` (`--color-ink-soft`): Lucía's role, a card with no rules, the inspect help and the legend of the stamps and the lock.
- **Letters:** `--tracking-caps` (0.06 em) spaces every uppercase text; `--underline-offset` (3 px) lowers the line under links and terms.
- **Line height** stays with the element: 1.5 for body text, 1.2 for headings and captions, 1.4 for options and tooltips, 1.1 for `h1`.

## Space

A 4 px grid. Every margin, padding and gap uses a step, except the one-off measures listed below.

| Step | Value |
|------|-------|
| `--space-2xs` | 4 px |
| `--space-xs` | 8 px |
| `--space-sm` | 12 px |
| `--space-md` | 16 px |
| `--space-lg` | 24 px |
| `--space-xl` | 32 px |
| `--space-2xl` | 40 px |
| `--space-3xl` | 48 px |

## Lines, radii, shadows and focus

- **Lines** are one scale for the borders of the interface and the lines of the 3D map (`LINE` in `src/scene/theme.ts` reads the same tokens): `--stroke-thin` 1 px (map labels, name tags, details of map pieces), `--stroke-regular` 1.5 px (buttons, cards, chips, the ink edges of map pieces), `--stroke-bold` 2 px (the focus ring, the network slab), `--stroke-heavy` 2.5 px (the stamp ring, a packet's trace), `--stroke-double` 4 px (the intruder stamp's double ring).
- **Radii:** `--radius` 3 px (buttons, name tags, tooltips), `--radius-pill` (chips), `--radius-round` (stamps, the alert mark).
- **Shadows:** `--shadow-sm` (buttons), `--shadow-md` (cards), `--shadow-tip` (the tooltip, in emphasis).
- **Focus:** one rule for every element, `:focus-visible` with `--focus-ring` at `--focus-offset`. No element sets its own outline.
- **One-off measures** that belong to a single rule stay in it: the side panel (380 px), the inspection box (22 rem), the stamp (32 px), the alert mark (15 px), the padding of a map label (1 px 6 px) and of a name tag (0.35 em), and two measures relative to their own text: the right margin of `.entity-icon` (`0.35em`) and the font size of `.name-tag` (`0.82em`).
- **A card on the map** takes its width and its gap to its piece from `src/scene/layout.ts`, which needs them to pick the card's side: `card-anchor.tsx` sets `--card-width`, `--card-gap`, `--card-x` and `--card-y` on every map card, and only the docked card (`.map-card--dock`, in the corner of the map) reads x and y. They are not tokens.

## Primitives

All in `src/design/`, imported through `@/design`. A primitive takes no `className` and no `style`: its look comes from its variant, and where it sits is its parent's business (a gap, a grid, a wrapper inside a card).

| Primitive | Variants | Use it for |
|-----------|----------|------------|
| `Button` | `primary`, `secondary` (default), `small`, `text`; with `href` it is a link; `disabled` greys it out and drops its shadow | every action and every link. One `primary` per panel or card, the action that panel exists for («Enviar solución» in Lucía's card, «Enviar» in the terminal); the rest («Listo») are `secondary` |
| `Choice` | `chip` (default), `option`; `pressed` makes it a toggle | a short value to pick (`chip`) or a sentence to choose (`option`); without `pressed`, an action drawn as a chip (giving a chip back). A pressed chip keeps a name inside it readable |
| `ChipTray` | — | a named row of chips where at most one is picked: the trays of the task card and of the terminal, and of any card that picks values with chips |
| `Card` | `default`, `soon`; a `section` or, with `as="li"`, a list item | every panel, the cards beside a piece of the map included (the task card and the terminal); `soon` for what is not open yet |
| `NameTag` | — | a resource's or an actor's own name (`servidor2`, `Atacante`), in text and in map labels |
| `caption` (class) | `caption`, `caption--soft` | the heading of a list; the label of a field, a tray or a role |

The map has its own pieces, drawn by the entity catalog (`src/scene/entities/`) with the same tokens. Their labels (`PieceLabel`, `src/scene/overlay/`) take their look from `primitives.css`: a label that is only a name wears the name tag's frame, written once for both.

## Adding a variant instead of a new element

1. Find the primitive that does the job in the table above. If one does, the new look is a variant: add it to the variant type and the class map of its file, and its rule to `primitives.css`, with tokens only.
2. Add its specimen to `src/ui/catalog/interface-section.tsx`, with its caption in `INTERFACE_TEXT`.
3. Record the captures on purpose, `pnpm exec playwright test entities --update-snapshots=all`, and check that the difference is only the new specimen.
4. A new primitive is only for a role no primitive can take with a variant. It gets its file in `src/design/`, its test, its specimen and a row in the table above that says why. `src/design/` holds 11 of the 12 files the folder rule allows, so a new primitive with its test first needs the folder split (for example into `tokens/` and `primitives/`).
5. A new token is only for a role no token serves: a colour enters the palette and gets a role; a size, a space or a line joins its scale.

## What guards the standard

The two zero-tolerance captures of `#/entidades` show any pixel that moves (except the edges pixelmatch counts as anti-aliasing), and TypeScript rejects a `className` or a `style` on a primitive. A third guard reads the colour tokens: the contrast test of `src/design/tokens.test.ts` (see "Contrast"). On the student's choice (2026-10-09) there is no test over the CSS rules, no lint rule against a raw `<button>` or `<a>`, and no rule file for the standard: a review finds a sixth button.
