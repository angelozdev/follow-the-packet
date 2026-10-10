# game/view/cards

What the cards that open beside a piece of the map show, computed from the session: the task card of a firewall, whose kind, title and rules (named by chips) it computes (`firewall-card.ts`), the terminal of an origin (`terminal-card.ts`) and the output of a traceroute sent from it (`traceroute-lines.ts`).

- A card is data: the screen draws it and reports the player's picks; nothing here draws or changes the session.
- The output of a traceroute (`tracerouteLines(session, picks)`) is null until a traceroute was sent with those picks. It has one line per probe, as `traceroute` of the engine ran them: the hop number, the IP that answered (a star when nobody did), the time and, on the last line of a Destination Host or Network Unreachable, its mark (`!H` or `!N`, what the command prints), plus the notes that explain the star, the marks and that the times are examples, and the reason when the sender could not send at all. What the player does not know is left out: no time before `rtt`, and a warning whose term is unknown is a star, as the map shows no warning. A router the map does not draw is not named by its IP: the line says «dentro de la oficina» or «fuera de la oficina».
- Not here: piece ids, piece labels and the inspection box (`src/game/view/`), the session state and its reducer (`src/game/`), drawing a card (`src/ui/incident/map-cards/`), the Spanish text (`src/copy/`).
- May import: `@/engine`, `@/copy`, `@/levels`, and other files of `src/game/` (`@/game/<file>`, `@/game/view/<file>`).
