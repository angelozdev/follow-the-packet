# ui/incident/map-cards/terminal

The terminal of an origin, drawn as a card beside its piece (`terminal-card.tsx`): the trays of chips, the line they make, "Enviar" and, once a traceroute was sent with those chips, what it printed.

- It shows what `@/game` computed (`TerminalCard`, `TracerouteView`) and reports the player's picks; it never decides what a packet does.
- Not here: the chip card every map card is built from and the other cards (`src/ui/incident/map-cards/`), what the terminal shows (`src/game/view/cards/terminal/`), the screen that opens it (`src/ui/incident/incident-screen.tsx`).
- May import: `@/game`, `@/levels`, `@/copy`, `@/design`, other files of `src/ui/` (`@/ui/<file>`, `@/ui/incident/map-cards/chip-card`, `@/ui/incident/use-focus-on-mount`), and only types from `@/engine`.
