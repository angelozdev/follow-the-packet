# engine/simulation

`simulate(network, packet)` and its trace: the stage pipeline, rule matching and where a packet stops.

- Each step carries a reason code, never a sentence; `src/copy/` turns codes into Spanish.
- Not here: the stages themselves (`stages/`), the network model (`src/engine/network/`).
- May import: other files of `src/engine/`.
