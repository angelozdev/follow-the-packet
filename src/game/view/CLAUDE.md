# game/view

What the map and the panels show, computed from the session: piece ids, piece labels and locks, a Security Group's rules named by chips, and the inspection box.

- Every piece kind declares its term in `PIECE_TERM`: `ec2-instance` for a server, `security-group` for a barrier, `internet-gateway` for the gateway and none (`null`) for an actor. A barrier label and the gateway label carry their term's official name (`Security Group servidor2`, `Internet gateway`); a server's label is its device name (`servidor2`) and an actor's label is its own name.
- The inspection of a server, a barrier, the gateway or a packet with an ICMP message starts with `INSPECTION_TEXT.whatIs`, the definition of its term, once that term is known (a packet's term is its ICMP message); an actor's inspection has no definition.
- Every inspection field declares the term it uses; a field whose term is not known yet is left out.
- Not here: the session state and its reducer (`src/game/`), drawing the map or a panel (`src/scene/`, `src/ui/`), the Spanish text of a term or a reason (`src/copy/`).
- May import: `@/engine`, `@/copy`, `@/levels`, and other files of `src/game/` (`@/game/<file>`).
