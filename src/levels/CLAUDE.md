# levels

The game chapters and their levels (`chapters.ts`), the incident contract (`incident.ts`), the registry that loads incident files (`NN-<chapter>/NN-<slug>.ts`) with `import.meta.glob`, the chips (`chips.ts`: the rule two chips name and the chips a rule has, the packet and every combination the send chips make, and the check that no combination leaves an office), the world chain (`world.ts`) and the term ladder (`ladder.ts`).

- `CHAPTERS` holds the 33 chapters of `docs/research/2026-10-09-follow-the-packet-chapters.md` in game order, each with its level (`tier`, one of `TIERS`: 0 Bases to 4 Especialista), its title, the course modules it plays (maybe none) and whether it is optional; `chapters.test.ts` checks them against that doc. A chapter's number is its place in the game, not a course module: chapters 1 and 4 keep their numbers, folders and incident ids. In code a level of the roadmap is a tier, because `level` already names an incident (`LevelEntry`, `#/level/…`).
- An incident starts from its chapter's base world or from the reference solution of the incident before it plus its changes; never from the player's own solution.
- An incident has a mechanic. `filter`: the player places rules with Type and Source chips, and tasks read live flows. `send`: the player sends packets with origin, address and message chips (`packetFromChips`), and each task expects the result of one combination (`replied` or `any`); its flows are only ambient. A send move never changes the world.
- The ladder opens what the player may change: the inbound rules of a host firewall once `rule` is known (01-04), those of a Security Group once `inbound-rule` is known (04-01).
- No flow and no combination of chips sends a packet from a device of an office to an address outside it (`officeLeaks`): the game does not model the office's NAT. The registry test checks it on each incident's start world.
- Not here: game-session state (`src/game/`), simulation (`src/engine/`), visible UI text (`src/copy/`).
- May import: `@/engine`, `@/copy`.
