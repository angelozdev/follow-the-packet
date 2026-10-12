# Design system

How "Sigue el paquete" looks, in one place: the tokens, the scales, the primitives and the rules for using them. The code lives in `src/design/`. The review page is `#/entidades`: its section "Elementos de la interfaz" shows every primitive in every variant and state, and its section "Piezas del mapa" shows every map piece with its label and stamp. Playwright compares both with a capture that tolerates no changed pixel, except the edges pixelmatch counts as anti-aliasing. The captures use the system fonts of the machine, so after an OS or browser update that changes them, look at the diff images before re-recording.

## Principles

- **Paper and ink.** Text and lines are ink on paper. Vermilion is the value of three roles, danger, emphasis and focus; only `--color-danger` means danger.
- **Never colour alone.** A state also changes a shape or a text: a dashed border, a double ring, a word.
- **One standard per element.** Every action or link is a `Button`, every chip or option a `Choice`, every tray of chips a `ChipTray`, every panel a `Card`, every set of tabs a `Tabs`, every table a `Table`, every warning or error a `Message`, every own name a `NameTag`, every small heading a caption. A new look is a new variant of its primitive, never a sibling element and never a class added at the call site.

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
| `--palette-green` | `#3a6b4f` |

| Role | Palette | For |
|------|---------|-----|
| `--color-page` | paper | the page, chips and options |
| `--color-surface` | paper light | cards, buttons, map labels, stamps, map pieces (`PAPER_FILL`) |
| `--color-shade` | paper dark | name tags, a chosen option, a disabled button, the shaded parts of map pieces (`PAPER_SHADE`) |
| `--color-ink` | ink | text, borders, the title stripe of a card, a pressed chip, map lines (`INK`) |
| `--color-ink-soft` | ink light | secondary text, captions of fields, a disabled button, dashed and soft borders |
| `--color-on-fill` | paper light | text on a filled background: a pressed chip, the title stripe of a card, the letter of an option, a tooltip, the alert mark, the tab of a `success` or an `error` `Message` |
| `--color-danger` | vermilion | blocked, intruder, alert, a rejected solution, a wrong answer (`DANGER` on the map) |
| `--color-emphasis` | vermilion | the primary button (its text and its dashed border), stars, the "nuevo" mark, the tooltip shadow |
| `--color-focus` | vermilion | the focus ring |
| `--color-success` | green | a right answer: the frame and the tab of a `success` `Message` |

### The vermilion rule

Vermilion is for danger. Emphasis and focus share its value today, but they are separate roles: either can change in one line of `tokens.css` without touching danger. A new use of vermilion picks the role it means; nothing outside `tokens.css` names `--palette-vermilion`.

### Contrast

Every text on a background reaches 4.5:1 (WCAG 2.2 AA, criterion 1.4.3) and every non-text use of vermilion (stamps, stars, the focus ring, dashed borders, the alert mark, map lines) reaches 3:1 against the colour beside it (criterion 1.4.11). One value serves the button fill and the text on paper, because both are the same pair seen from either side: `--palette-vermilion` is `#bf370f`, the old `#e4572e` (3.5:1 under the button label, 3.3:1 as text on the page) darkened with its hue kept (about 14°) and its saturation raised, so it stays a vivid vermilion and does not turn brown.

| Pair | Ratio |
|------|-------|
| `--color-on-fill` on vermilion (the alert mark) | 5.26 |
| `--color-on-fill` on `--color-ink` (the text on the title stripe of a card, the letter of an option) | 13.36 |
| vermilion text on `--color-surface` (the primary button, whose dashed border takes the same 5.26 as a non-text mark) | 5.26 |
| vermilion text on `--color-page` | 4.95 (4.61 on its darkest grain pixels) |
| vermilion text on `--color-shade` (a name tag inside a vermilion sentence sits on it) | 4.57 |
| `--color-success` green on `--color-surface` (the frame, and the fill of the tab, of a `success` `Message`) | 5.83 |
| `--color-on-fill` on green (the word of the tab of a `success` `Message`) | 5.83 |
| `--color-ink-soft` on `--color-surface` (the tab and the frame of a `note` `Message`) | 6.45 |
| `--color-ink` on `--color-surface` (the text of every `Message`, the tab and the dashed frame of a `warning`) | 13.36 |
| the focus ring on page, surface and shade | the same ratios, all above 3 |
| the focus ring on the title stripe, drawn in `--color-on-fill` because vermilion beside ink is 2.5:1 | 13.36 |
| vermilion on the lit floor of the map, measured on a capture on 2026-10-10 (floor `#d0cfcd`; the map draws vermilion shapes as `#cd2c0f`) | 3.58 as the interface draws it, 3.40 as the map draws it |

- **The grain.** The page's `--grain` darkens its paper by up to about 4 % toward ink, to `#eee9df`; the test treats that darkest pixel as the page.
- **The green of `success`** (decided with `Message`, 2026-10-11): `--palette-green` is `#3a6b4f`, a muted green like the ink of a stamp, and its only role is `--color-success`, the colour of a right answer. It sits on the paper at 5.83 on the surface, 5.49 on the page, 5.11 on the page with its grain and 5.07 on the shade, and the `--color-on-fill` text of its tab sits on it at 5.83. The game has one theme: the prototype page of the decision also had a dark theme, and there the same role was `#86b896`, which measured 6.67 on its dark surface and 7.54 under its dark fill text; those two numbers are in the test, and `tokens.css` has no dark block. Green and vermilion are hard to tell apart with deuteranopia, so a `success` and an `error` message never differ by colour alone: see `Message`.
- **Guard.** `src/design/tokens.test.ts` reads `tokens.css` and asserts these pairs from the roles (`--color-danger` and `--color-emphasis` as text on every paper, `--color-on-fill` on both and on ink, `--color-focus` on every paper, and the pairs of every variant of `Message`: its tab text on its fill at 4.5:1 and its frame on every paper at 3:1; and the success green on the surface and under its fill text), so a new value that falls under 4.5:1 or 3:1 fails the test. The map floor is a lit render, not a token, so its ratio is measured by hand.
- **Left out on purpose.** Vermilion beside ink (the outline of a blocking bar, the Atacante cube beside the packet of an intruder, the tooltip's `--shadow-tip`) is 2.5:1, below 3:1. The ink outline already separates the shape from the paper (the test asserts that), the shadow is decoration, and the state also changes a shape or a word.
- **Faded on purpose.** A `soon` card fades all its content with `opacity: 0.5`, on the student's choice (2026-10-10, «me gustan que estén con opacidad»): it is inactive content, a chapter that does not open yet. Measured on the page's paper, its vermilion number lands at 2.25:1, its ink title at 2.98:1 and «Próximamente» at 2.21:1 (5.26, 13.36 and 6.45 without the fade). Keep the fade: the dashed border, the missing shadow and the word «Próximamente» also mark the state, and raising these ratios is the student's call, not a fix.

## Type

- **Fonts:** `--font-display` (Newsreader: `h1`, `h2`, stamps), `--font-body` (IBM Plex Sans: everything else), `--font-mono` (IBM Plex Mono: name tags and the terminal line, `code`).
- **Weights:** `--weight-regular` (400), `--weight-bold` (600), `--weight-display` (500). `index.html` loads Plex Sans 400 and 600, Newsreader 500 and Plex Mono 400. Newsreader 600 is not loaded, on the student's choice (2026-10-09): a stamp and a term inside a title ask for bold, and the browser draws it from 500. A new weight is loaded there first.

| Size | Value | For |
|------|-------|-----|
| `--text-2xs` | 11 px | the "nuevo" mark, the alert mark on the map |
| `--text-xs` | 12 px | captions, the tab of a `Message`, a name on the map, catalog captions |
| `--text-sm` | 13 px | map labels, small buttons, the title stripe of a card |
| `--text-md` | 14 px | chips, tooltips, the text of a `Message`, secondary lines, the terminal line |
| `--text-base` | 16 px | body text, buttons, options |
| `--text-lg` | 18 px | the lede, stamps, the heading of a card under its stripe |
| `--text-xl` | 22.4 px | `h2`, the incident title |
| `--text-2xl` | 36 px | `h1` |

- **Caption:** the class `caption` (bold, `--text-xs`, uppercase, `--tracking-caps`) for the heading of a list; `caption caption--soft` for the label of a field, a tray or a role, and for the mark of an optional chapter. Every `h3` is a caption. A level of the roadmap («Nivel 0 · Bases») heads the list of its chapters, so it is a caption too, written as an `h2` with the class: an `h3` right after the `h1` would skip a heading level.
- **Secondary text:** the class `muted` (`--color-ink-soft`): Lucía's role, a card with no rules, the inspect help, the legend of the stamps and the lock, and the notes under what a traceroute printed.
- **Lines inside a card:** the class `rules` (a list with no bullets, the text at the left and a small value at the right): the rules of a task card and the numbered hops a traceroute prints in the terminal, the hop number written in the line. A time or a mark at the right is `muted`.
- **Output of a tool:** the lines an `nc` or a `dig` printed, in the class `output` (the «Salida» of the terminal card): one `code` line each (`output__line`, `--text-sm`, `white-space: pre-wrap` so a long line wraps and its tabs stay, `tab-size: 4`), the key lines of a `dig` (its status and its answer) on `--color-shade` with a `--stroke-bold` ink border at the left, and, where a folded output hides lines, a mark in `--color-ink-soft` between dotted rules («⋯ 4 líneas plegadas»). The control that unfolds them is the `small` `Button` («Ver las 17 líneas restantes») with `aria-expanded`, left-aligned in the body of the card. The output has no scroll of its own: it is part of the body of the card on the map, which scrolls it under the cap of the map.
- **Letters:** `--tracking-caps` (0.06 em) spaces every uppercase text; `--underline-offset` (3 px) lowers the line under links and terms.
- **Line height** stays with the element: 1.5 for body text, 1.2 for headings and captions, 1.4 for options and tooltips, 1.45 for the text of a `Message` and 1 for its tab, 1.1 for `h1`.

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

- **Lines** are one scale for the borders of the interface and the lines of the 3D map (`LINE` in `src/scene/theme.ts` reads the same tokens): `--stroke-thin` 1 px (map labels, name tags, details of map pieces), `--stroke-regular` 1.5 px (chips, slots, the ink edges of map pieces), `--stroke-bold` 2 px (buttons, cards, options, the focus ring, the network slab), `--stroke-heavy` 2.5 px (the stamp ring, a packet's trace), `--stroke-double` 4 px (the intruder stamp's double ring).
- **Radii:** `--radius` 3 px (name tags, tooltips), `--radius-tile` 10 px (buttons, options, slots), `--radius-card` 14 px (cards), `--radius-pill` (chips, the primary button), `--radius-round` (stamps, the letter of an option, the alert mark).
- **Shadows:** `--shadow-sm` (buttons, a lip of 3 px below), `--shadow-card` (cards, a lip of 5 px below), `--shadow-tip` (the tooltip, in emphasis).
- **Focus:** one rule for every element, `:focus-visible` with `--focus-ring` at `--focus-offset`. The only exception is the title stripe of a card, where `--focus-ring-on-ink` draws the same ring in `--color-on-fill`, because vermilion beside ink is 2.5:1 and the title of a card is focused when it opens.
- **One-off measures** that belong to a single rule stay in it: the side panel (380 px), the inspection box (22 rem), the stamp (32 px), the alert mark (15 px), the letter of an option (1.8 rem), the padding of a map label (1 px 6 px) and of a name tag (0.35 em), and two measures relative to their own text: the right margin of `.entity-icon` (`0.35em`) and the font size of `.name-tag` (`0.82em`).
- **A card on the map** takes its width and its gap to its piece from `src/scene/layout.ts`, which needs them to pick the card's side: `card-anchor.tsx` sets `--card-width`, `--card-gap`, `--card-x`, `--card-y`, `--card-top` and `--card-room` on every map card. The docked card (`.map-card--dock`, in the corner of the map) reads x and y; a card beside its piece (`.map-card--left`, `.map-card--right`) reads top and y to stay between the title bar that floats over the map and its bottom margin (`clamp`); every map card reads room, which caps its height, and its body scrolls when the content is taller. Any card docks when neither side keeps it inside the map, so on a phone the card of a firewall docks as a terminal does. The inspection box (and its help) sits over the bottom right of the map above 900 px; at 900 px and under it sits under the map, so a docked card never covers it. The inspection box appears as a preview while the pointer or the focus is on a piece or a stamp, so it lingers a moment after the pointer leaves (to let it cross to the box) and stays while the pointer is over it; a click, a tap or Enter pins it, and then its stripe says «Fijada» with a small «Cerrar» button and the piece or stamp that opened it wears an ink ring set off from it by a thin gap of paper (`data-pinned`; one rule in `src/styles.css` for `.stamp` and `.map-button`, drawn as a shadow so the vermilion focus ring still shows outside it, and as an outline in forced colours, which remove shadows). It takes the mouse only when its text does not fit (the «Cerrar» button always does), so that a box that fits, pinned or not, never blocks the label under it. They are not tokens.

## Primitives

All in `src/design/primitives/` (`Card`, `Tabs` and `Table`, which hold content, in its `panels/` folder), imported through `@/design`. The words a primitive shows (the tab of a `Message`) come in as props from `src/copy/`, because `src/design/` imports no layer. A primitive takes no `className` and no `style`: its look comes from its variant, and where it sits is its parent's business (a gap, a grid, a wrapper inside a card).

| Primitive | Variants | Use it for |
|-----------|----------|------------|
| `Button` | `primary` (the stamp), `secondary` (default), `small`, `text`; with `href` it is a link; `disabled` greys it out and drops its shadow | every action and every link. One `primary` per panel or card, the action that panel exists for («Enviar solución» in Lucía's card, «Enviar» in the terminal); the rest («Listo») are `secondary` |
| `Choice` | `chip` (default), `option`; `pressed` makes it a toggle | a short value to pick (`chip`) or a sentence to choose (`option`, which wears a letter A, B, C from a CSS counter when it sits in an `ol.options`); without `pressed`, an action drawn as a chip (giving a chip back). A pressed chip keeps a name inside it readable |
| `ChipTray` | `default`, `segmented` | a named row of chips where at most one is picked: the trays of the task card and of the terminal, and of any card that picks values with chips; `segmented` for a yes or no, two chips in one pill. Without `picked` it is a row of actions drawn the same, announced as plain buttons (the steps of the clock card) |
| `Card` | `default`, `soon`; a `section` or, with `as="li"`, a list item; an optional `header` (the title stripe) | every panel, the cards beside a piece of the map included (the task card and the terminal); `soon` for what is not open yet |
| `Tabs` | — (`name`, `tabs` as `{ id, label, panel }`, `selected`, `onSelect`) | a list of panels of which one shows at a time, chosen by tabs: «Entrada» and «Salida» on the firewall card, the tabs of the card a piece opens (a laptop's «Terminal», «Ajustes de red» and «Tabla de rutas»; a router's «Tabla de rutas» and «Tabla de traducciones») and later the inbound and outbound rules of a Security Group and a NACL. A new primitive and not a variant because no other primitive switches between panels with the keyboard and the roles of a tab (`tablist`, `tab`, `tabpanel`, the arrow keys, Home and End); Radix Tabs gives them and `Tabs` dresses them with the tokens. Radix mounts only the selected panel: keep the state of what a panel holds above the tabs |
| `Table` | — (`caption`, `columns` as `{ id, label }`, `rows` as `{ id, cells, inUse?, onRemove? }`, and the words `emptyText`, `inUseText` and `removeText`) | rows under named columns: the routes of a router, the translations of a NAT, the records of a zone, the cache of a resolver. A row in use wears a pill with its word, not only a colour; a row with `onRemove` ends in a small `Button` named from its row («Quitar 10.0.0.0/16 172.16.0.2»), so no two share a name; an empty table shows `emptyText` under the header. It sits inside a `Card` and its wrapper scrolls, sideways when the columns do not fit and up and down inside a card with a height cap, like a card on the map. A new primitive and not a variant because no other primitive draws columns (`Card` holds it, `Button` removes a row, `ChipTray` picks the entry); the caption is visually hidden because the card already shows the title |
| `Message` | `note` (default), `success`, `warning`, `error`; `words` (the word of each kind, as props because the design system imports no text) | every warning or error the game tells the player, and any note or right answer that is said in a sentence: Lucía's alert and her reply to a rejected solution, the feedback of a chip or of an option, the reason a traceroute could not leave the sender, the notice page, and the rejection of an entry of a table. A paragraph in the «Pestaña» style (V18, 2026-10-11): text in a frame with a tab of a folder that sticks out above it and names its kind, «NOTA», «✓ CORRECTO», «! AVISO» or «✕ ERROR» (upper case by style), and a frame with a shape of its own: `note` a thin frame in `--color-ink-soft`, `success` a bold frame and a tab filled with `--color-success`, `warning` a dashed frame and tab, `error` a double frame in `--color-danger` and a tab filled with it. The tab is decorative (`aria-hidden`) and a visually hidden word, «Error: », comes before the text, so the kind never depends on colour. It has no role of its own: its owner gives it `role="status"` when it is announced politely or `role="alert"` when it is a danger that happens now, and the same owner keeps the region that holds it mounted. Its tab sticks out above the frame, so it asks for room above (`--space-xl`) and a parent that sets its own margins must leave that room. A new primitive and not a variant because no other primitive can do the job: `Button`, `Choice`, `ChipTray`, `Tabs`, `NameTag` and `Table` are controls or labels, and a `Card` is a panel with a stripe, a title and a shadow, so a one-line message in a card would be a card in a card; before it, four loose classes and two plain paragraphs did this with five looks |
| `NameTag` | — | a resource's or an actor's own name (`servidor2`, `Atacante`), in text and in map labels |
| `caption` (class) | `caption`, `caption--soft` | the heading of a list, a level of the roadmap included; the label of a field, a tray or a role, the name of a floor on the map, or the mark of an optional chapter |

The map has its own pieces, drawn by the entity catalog (`src/scene/entities/`) with the same tokens. Their labels (`PieceLabel`, `src/scene/overlay/`) take their look from `src/design/primitives/primitives.css`: a label that is only a name wears the name tag's frame, written once for both. A piece has one button in its label, however many cards it has: the card it opens wears a `Tabs` with a tab for each (a laptop's terminal, its network settings and its routes; a router's routes and translations), so a label never grows. A device is one piece in four variants (`laptop`, `printer`, `ec2-instance` and `internet-server`), and a server of the internet is the `internet-server` variant, a narrow tower with three bays and an antenna stub, never a variant of the actor piece: it is a machine that answers, so it is named and inspected as a device, even though the model keeps it as an actor because it sits outside the office.

### Style B

Every card of the game has the same look, the approved one of the prototype page (2026-10-10): rounded corners (`--radius-card`), a thick ink border, a shadow below and, with a `header`, a dark stripe on top that holds an icon and text. The stripe takes its parts as data, `{ icon, title, type, meta }`, and has two forms with one heading each:

- **The title is the stripe** (Lucía, the terminal, the task card of a firewall): the caller passes its own `h2` as `title`, and the stripe is that heading. Whatever else sits in the stripe (`meta`, the name tag inside a title) is read apart from the heading's name.
- **The title is under the stripe** (the question, the result, the inspection box, a chapter of the roadmap): the stripe carries the `type` of card («Pregunta», «Resultado», «Inspección», «Capítulo 1») and, at its right edge, a `meta` («3/14», «Próximamente»). The caller's own `h2` is the first thing in the body, drawn as the headline of the card.

A card never clips or shrinks: it has no `overflow`, and the stripe rounds its own top corners (`--radius-card` minus `--stroke-bold`, the inside of the border). A box with `overflow: hidden` has a minimum size of 0 as a grid item, so the side panel (a grid, as tall as the window) squeezed its cards to share that height, cut their content at the card's edge and left the panel nothing to scroll. Now the cards keep the height of their content and the panel scrolls. The only scrolling inside a card is the body of a card on the map (`.map-card`: docked or beside its piece), whose foot stays in view, the body of the inspection box (`.incident__inspection`), which has its own height limit, and the wrapper of a `Table`, which scrolls sideways when its columns do not fit and, as a flex item of the body of a card on the map, up and down when its rows are more than the card's height cap lets show. A floating box never cuts its text off without a way to read it: when it does not fit, its band stays and its body scrolls inside it, at any width and height of the window, and the scroller draws its scrollbar (a pill in `--color-ink-soft`, `--space-sm` wide, with `::-webkit-scrollbar`), because the overlay scrollbars of macOS stay hidden until the player scrolls and a text cut at the bottom with no mark reads as the end of the text.

The caller owns the `h2`, its `id`, its focus and the `aria-labelledby` of the card. The icon is decorative (`aria-hidden`): an entity's icon for a card about an entity, and `CardIcon` (`src/ui/card-icon.tsx`) for Lucía, the question, the result, the inspection box, the terminal, the network settings of a device, a case of a diagnose and a chapter. The type and the title of every card come from `src/copy/screens/`.

The primary `Button` is the stamp: `--color-surface` fill, `--color-emphasis` text and dashed border, a pill, uppercase with `--tracking-caps`, a fixed `rotate(-2deg)` and, when pressed, `translateY(2px)`. The tilt moves its corners up to about 4 px beyond its box, which layout does not see, so a stamp that is a direct child of a card's body keeps `--space-sm` above it (and below it, unless it ends the card, where the padding of the body gives the room) and the buttons of the result card keep `--space-sm` between them. Under `prefers-reduced-motion` it does not move when pressed and keeps its tilt, and disabled it keeps its shape and tilt with the greyed colours. The secondary and small buttons take the rounded corners and thick border.

A packet on the map is a variant of one piece, drawn flat and facing the camera, and one rule holds for every packet: its shape says its protocol and a border says its role. ICMP is a dot, TCP a square and UDP a hexagon (decided 2026-10-11, V12 = B), each ink and filled when it asks and a ring when it answers; an intruder is the same shape in vermilion with a second border of the same shape around it (V19 = B: the rhombus the intruder had in chapters 1 and 4 is gone); a warning is an ink triangle with an exclamation mark cut out of it (the `warning` variant, which is never an intruder's). A packet with ports also wears a label beside it, `packet-tag` (the frame of a map label, in the mono face, with no pointer and no screen reader since its stamp already tells it): its protocol and ports as they are in the leg where the packet is, «TCP 51514 → 80» before the router that translates them and «TCP 40001 → 80» after it, and the answer with the ports swapped; without animations the still drawing shows the label of the leg where the packet stands. A ping and any packet of a VPC wear none. A datagram that reached its host and got a Port Unreachable is drawn as a warning that comes back from that host, with the stamp of a warning, never as an arrival: no program received it. The outline of a block of IPs is a variant of the network piece, the `block` variant: a dashed ink outline on the ground, with no fill, around each run of pieces the player placed inside the block (D-6), so the outline is never a sibling element of the slab. The block variant also wears its name, the block in CIDR notation (`192.168.1.0/24`), as a map label in the frame of `packet-tag` (the `lb--pkt` label of the D-6 prototype), at the front corner where the outline ends, so the label moves with the outline when a piece joins it or leaves it; it is part of the variant (`NetworkPiece` takes the `name`) and not an element beside it, it takes no pointer and no screen reader (the card of the block says the same), and the catalog specimen has no name, so its capture does not change. Its stamp is a state of one piece too: ✓, ✕, ? (dashed), a double ring (an intruder that gets in) or ! (a warning came back, in ink with a solid ring: `warned`). A warning is never a sibling element of the packet, and its stamp is never a sibling of the stamp.

## Adding a variant instead of a new element

1. Find the primitive that does the job in the table above. If one does, the new look is a variant: add it to the variant type and the class map of its file, and its rule to `src/design/primitives/primitives.css`, with tokens only.
2. Add its specimen to `src/ui/catalog/interface-section.tsx`, with its caption in `INTERFACE_TEXT`.
3. Record the captures on purpose, `pnpm exec playwright test entities --update-snapshots=all`, and check that the difference is only the new specimen. A specimen goes in a free cell of the catalog grid (`src/scene/catalog/catalog-cells.tsx`, 5 columns by 10 rows): a sixth column makes the canvas 1260 px wide, more than the 1232 px section, and a new row, or a longer list of icons, moves the interface section down, which changes its zero-tolerance capture (measured again on 2026-10-12, when the packets of TCP and UDP and the outline of a block joined the catalog: the list of icons went from 24 to 33, two rows more, and the pieces canvas gained two rows; the interface capture then differed from the old one only by the phase of the grain, with no pixel more than 42 of 255 away and 10 above 12, the largest at the anti-aliased corners of the specimens. Measured on 2026-10-10: moving the section down by 216 px or by 184 px, a new row of 192 px plus or minus the change in the icon list, changed about 70 % of its pixels, because the page's grain is a 160 px tile anchored to the document; a shift of exactly 160 px still changed 4 pixels, at rounded corners).
4. A new primitive is only for a role no primitive can take with a variant. It gets its file in `src/design/primitives/`, or in `src/design/primitives/panels/` if it holds content like `Card`, `Tabs` and `Table`, its test, its specimen and a row in the table above that says why. The tokens stay in `src/design/` and the primitives live in `src/design/primitives/`, which holds 8 of the 12 files the folder rule allows (`Message` and its test made it 8), and `panels/` holds 6 (`CLAUDE.md` guides are not counted); when one of them fills, split it by family before adding a file.
5. A new token is only for a role no token serves: a colour enters the palette and gets a role; a size, a space or a line joins its scale.

## What guards the standard

The two zero-tolerance captures of `#/entidades` show any pixel that moves (except the edges pixelmatch counts as anti-aliasing), and TypeScript rejects a `className` or a `style` on a primitive. A third guard reads the colour tokens: the contrast test of `src/design/tokens.test.ts` (see "Contrast"). On the student's choice (2026-10-09) there is no test over the CSS rules, no lint rule against a raw `<button>` or `<a>`, and no rule file for the standard: a review finds a sixth button.

The one exception, decided with style B (2026-10-10), is what a capture cannot see: six Playwright tests of `tests/e2e/entities.spec.ts` measure the computed style or the boxes in a real browser, not the text of the CSS. Three are the stamp (uppercase, dashed border and text in emphasis, pill, `rotate(-2deg)` at rest and pressed; it moves 2 px down when pressed and does not under reduced motion; the disabled one keeps the tilt). The fourth reads what the browser draws for the options (the letters A, B and C, from a DOM snapshot, and their accessible names, from the accessibility tree, which do not carry the letter). The fifth reads the look of every `Message` (`each variant of Message is told apart by a mark or a border shape and not only by colour`: the border style and width of its frame, the word of its tab and that the tab is upper case, so `success` and `error` differ by more than their colour). The sixth, `the tab of a Message sticks out above its frame without covering the message above it`, measures the boxes of a stack of messages: the tab sits on the top edge of its frame and starts at its corner, and it starts below the frame of the message above. jsdom sees neither the movement nor `::before`. A seventh, in `tests/e2e/card-layout.spec.ts`, measures the same in the cards of the game, where a rule of the parent (`.chip-card p` once set every margin to 0) can take away the room the tab asks for.

The guard for «no warning or error outside the standard» is a rendered-DOM test, not a rule over the CSS or the code: `every warning and error an incident can trigger is drawn by Message and no alert is drawn outside it` (`src/ui/incident/incident-screen.test.tsx`) mounts an incident with a firewall, an identify incident, a case of a diagnose and a send incident with a traceroute the sender cannot send, and checks that each text is inside a `Message` of the variant it should have and that no `role="alert"` is outside one. A message that is new in a view the test does not walk is found by the review, as with a sixth button.

Two more tests of `tests/e2e/card-layout.spec.ts` measure the boxes of the cards of the game in a real browser: nothing is clipped or spilled, no two cards overlap, a stamp keeps a gap above it and the buttons keep a gap between them and from the card's bottom edge, and the last element of each card comes into view with the mouse wheel on a low window.
