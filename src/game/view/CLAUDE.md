# game/view

What the map and the panels show, computed from the session: piece ids, piece labels and locks, a firewall's rules named by chips (`firewall-card.ts`), and the inspection box.

- Every piece is an entity of the catalog in the variant of its model (`EntityRef`): a device and a firewall by their `kind`, the edge by the network's `edge`, an actor by its `kind`. Its term comes from `entityTerm` (`ENTITY_TERMS` in `src/copy/terms.ts`): `ec2-instance`, `security-group` and `internet-gateway` today, none yet for the office variants, and none ever for an actor. A firewall label and the edge label carry their term's official name (`Security Group servidor2`, `Internet gateway`); a device's label is its name (`servidor2`) and an actor's label is its own name.
- The inspection of a piece whose variant has a term, or of a packet with an ICMP message, starts with `INSPECTION_TEXT.whatIs`, the definition of that term, once the term is known (a packet's term is its ICMP message); a piece without a term has no definition.
- The edge and the internet are pieces only while the world has an actor: something outside the network is what makes the way out matter. An office of chapter 1 shows them from the incident that brings Lucía's house.
- Every piece has a state, read from the runs: a device is `intruded` while a forbidden flow reaches it, a firewall is `blocking` while its device's firewalls stop a flow, and every other piece is `normal`.
- Every inspection field declares the term it uses; a field whose term is not known yet is left out.
- Not here: the session state and its reducer (`src/game/`), drawing the map or a panel (`src/scene/`, `src/ui/`), the Spanish text of a term or a reason (`src/copy/`).
- May import: `@/engine`, `@/copy`, `@/levels`, and other files of `src/game/` (`@/game/<file>`).
