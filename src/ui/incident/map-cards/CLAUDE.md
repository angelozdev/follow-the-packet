# ui/incident/map-cards

The cards that open beside a piece of the map, both built from `chip-card.tsx` (`ChipCard`: the dialog with its title, Escape and "Listo"; `ChipTray`: a named tray of chips): the task card of a firewall (`task-card.tsx`, rules from Type and Source chips) and the terminal of an origin (`terminal-card.tsx`, a packet from origin, address and message chips, its line and "Enviar").

- A card shows what `@/game` computed (`FirewallCard`, `TerminalCard`) and reports the player's picks; it never decides what a rule or a packet does.
- Both use the same classes: `card chip-card`, `tray`, `chip`, `slot` and `btn`. A new card reuses them before adding any.
- Not here: the screen that opens a card (`src/ui/incident/incident-screen.tsx`), the anchor that keeps it beside its piece (`src/scene/overlay/`).
- May import: `@/game`, `@/levels`, `@/copy`, other files of `src/ui/` (`@/ui/<file>`, `@/ui/incident/use-focus-on-mount`), and only types from `@/engine`.
