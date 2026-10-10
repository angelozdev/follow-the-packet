# levels

The course chapters (`chapters.ts`), the incident contract (`incident.ts`), the registry that loads incident files (`NN-<chapter>/NN-<slug>.ts`) with `import.meta.glob`, the chips (`chips.ts`: the rule two chips name and the chips a rule has, the packet and every combination the send chips make, and the check that no combination leaves an office), the world chain (`world.ts`) and the term ladder (`ladder.ts`).

- An incident starts from its chapter's base world or from the reference solution of the incident before it plus its changes; never from the player's own solution.
- An incident has a mechanic. `filter`: the player places rules with Type and Source chips, and tasks read live flows. `send`: the player sends packets with origin, address and message chips (`packetFromChips`), and each task expects the result of one combination (`replied` or `any`); its flows are only ambient. A send move never changes the world.
- The ladder opens what the player may change: the inbound rules of a host firewall once `rule` is known (01-04), those of a Security Group once `inbound-rule` is known (04-01).
- No flow and no combination of chips sends a packet from a device of an office to an address outside it (`officeLeaks`): the game does not model the office's NAT. The registry test checks it on each incident's start world.
- Not here: game-session state (`src/game/`), simulation (`src/engine/`), visible UI text (`src/copy/`).
- May import: `@/engine`, `@/copy`.
