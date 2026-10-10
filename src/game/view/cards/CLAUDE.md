# game/view/cards

What the cards that open beside a piece of the map show, computed from the session: the task card of a firewall, whose rules are named by chips (`firewall-card.ts`), and the terminal of an origin (`terminal-card.ts`).

- A card is data: the screen draws it and reports the player's picks; nothing here draws or changes the session.
- Not here: piece ids, piece labels and the inspection box (`src/game/view/`), the session state and its reducer (`src/game/`), drawing a card (`src/ui/incident/map-cards/`), the Spanish text (`src/copy/`).
- May import: `@/engine`, `@/copy`, `@/levels`, and other files of `src/game/` (`@/game/<file>`, `@/game/view/<file>`).
