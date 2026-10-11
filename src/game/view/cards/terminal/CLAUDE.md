# game/view/cards/terminal

What the terminal of an origin shows, computed from the session: the terminal itself (`terminal-card.ts`: its trays of origin, address and message chips, the line the picks make and the pieces that open one) and what a traceroute sent from it printed (`traceroute-lines.ts`).

- A terminal is data: the screen draws it and reports the player's picks; nothing here draws or changes the session.
- A message chip whose command is `nc` or `dig` (chapter 2) has no line yet: `terminalLine` gives null for it until the terminal writes `nc` and `dig` lines.
- Not here: the other cards (`src/game/view/cards/`), piece ids, piece labels and the inspection box (`src/game/view/`), the session state and its reducer (`src/game/`), drawing the terminal (`src/ui/incident/map-cards/terminal/`), the Spanish text (`src/copy/`).
- May import: `@/engine`, `@/copy`, `@/levels`, and other files of `src/game/` (`@/game/<file>`, `@/game/view/<file>`).
