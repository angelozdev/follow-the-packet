# levels

The course chapters (`chapters.ts`), the incident contract (`incident.ts`), the registry that loads incident files (`NN-<chapter>/NN-<slug>.ts`) with `import.meta.glob`, the chips that name rules (`chips.ts`), the world chain (`world.ts`) and the term ladder (`ladder.ts`).

- An incident starts from its chapter's base world or from the reference solution of the incident before it plus its changes; never from the player's own solution.
- Not here: game-session state (`src/game/`), simulation (`src/engine/`), visible UI text (`src/copy/`).
- May import: `@/engine`, `@/copy`.
