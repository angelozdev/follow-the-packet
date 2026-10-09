# game/view

What the map and the panels show, computed from the session: piece ids, piece labels and locks, a Security Group's rules named by chips, and the inspection box.

- Every piece kind declares its term (`PIECE_TERM`). Labels use the term's official name; the inspection of a piece or a packet starts with `INSPECTION_TEXT.whatIs`, the definition of its term (a packet's term is its ICMP message).
- Every inspection field declares the term it uses; a field whose term is not known yet is left out.
- Not here: the session state and its reducer (`src/game/`), drawing the map or a panel (`src/scene/`, `src/ui/`), the Spanish text of a term or a reason (`src/copy/`).
- May import: `@/engine`, `@/copy`, `@/levels`, and other files of `src/game/` (`@/game/<file>`).
