# game/view

What the map and the panels show, computed from the session and filtered by the terms the player knows: piece ids, piece labels and locks, a door's rules named by chips, and the inspection box.

- Every inspection field declares the term it uses; a field whose term is not known yet is left out.
- May import: `@/engine`, `@/copy`, `@/levels`, and other files of `src/game/` (`@/game/<file>`).
