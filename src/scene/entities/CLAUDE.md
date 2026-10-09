# scene/entities

The entity catalog: one file per entity of the map (`network`, `device`, `firewall`, `edge`, `internet`, `actor`, `packet`, `stamp`). Each file exports the entity's map piece and its 2D icon; `entity-icon.tsx` draws the icon of any `EntityRef`. The design of every entity (its card: concept, shape, variants, states, label, movement and accessibility) is in `docs/specs/2026-10-09-follow-the-packet-chapter-1-design.md`, section "Catálogo de entidades".

- A piece takes its position, its variant and its state as props and decides nothing: whether a packet got in, whether a device is under attack or whether a card is open comes from the caller.
- Lines are ink (`INK`) on paper (`PAPER_FILL`); vermilion (`ACCENT`) is only for danger: blocked, intruder and alert. A state is never shown by colour alone: it also changes the shape or the text.
- A packet is drawn by its message (an Echo Request is a filled dot, an Echo Reply a ring) and as a vermilion rhombus for an intruder; an answered packet comes back as an Echo Reply. A blocked packet bursts and leaves ✕; a lost one shrinks away and leaves a dashed ?.
- An icon is the piece seen from the front, in one colour (`currentColor`, drawn with `InkIcon` from `@/scene/ink`), hidden from screen readers because the text beside it names it. Every variant and every stamp state has its own shape.
- Every animation has a still version for "Sin animaciones", chosen by the `still` prop.
- The rest of the game reaches the catalog only through `index.ts` (`@/scene/entities`); files inside import each other directly (`./x`).
- Not here: where a piece sits (`src/scene/layout.ts`), the traffic clock (`src/scene/traffic/`), labels as buttons (`src/scene/overlay/`).
- May import: `@/copy`, only types from `@/engine`, and the scene's drawing helpers (`@/scene/ink`, `@/scene/theme`, `@/scene/layout`, `@/scene/edges`, `@/scene/html-layer`, `@/scene/overlay/inspect-handlers`).
