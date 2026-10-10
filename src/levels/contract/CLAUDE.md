# levels/contract

What an incident is, and what its chips can do: the zod schema, types and constructor of an incident (`incident.ts`: `incidentSchema`, `defineIncident`, `ruleIdFor`, the flows, tasks, chips and player moves) and the chips (`chips.ts`: the rule two chips name and the chips a rule has, the packet and every combination the send chips make, and the check that no combination leaves an office).

- The contract is the only place that says what an incident file may hold; the incident files and the registry read it, they never extend it from outside.
- Not here: incident content (`src/levels/NN-<chapter>/`), the registry, the world chain and the term ladder (`src/levels/`), game-session state (`src/game/`).
- May import: `@/engine`, `@/copy`, and other files of this folder (`./x`).
