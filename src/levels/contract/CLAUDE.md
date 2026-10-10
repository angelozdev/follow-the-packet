# levels/contract

What an incident is, and what its chips can do: the zod schema, types and constructor of an incident (`incident.ts`: `incidentSchema`, `defineIncident`, `ruleIdFor`, the flows, tasks, chips and player moves) and the chips (`chips.ts`: the rule two chips name and the chips a rule has, the packet three send chips make (`packetFromChips`, with the TTL of the message) or, for a traceroute, the probe it repeats (`probeFromChips`), every combination of send chips, the check that no combination leaves an office with no routers, and the check that every id a task expects names something in a world).

- The contract is the only place that says what an incident file may hold; the incident files and the registry read it, they never extend it from outside.
- A send task's `expect.outcome` is one of `OUTCOMES` of the engine, `reached` or `any`; its `by` is an id, and the contract cannot say what it names, because the world may come from the incidents before it: the registry test does (`unknownExpectedIds`).
- Not here: incident content (`src/levels/NN-<chapter>/`), the registry, the world chain and the term ladder (`src/levels/`), game-session state (`src/game/`).
- May import: `@/engine`, `@/copy`, and other files of this folder (`./x`).
