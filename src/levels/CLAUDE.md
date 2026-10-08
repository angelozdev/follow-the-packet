# levels

The course chapters (`chapters.ts`), the incident contract (`incident.ts`, a zod schema) and the registry that loads incident files (`NN-<chapter>/NN-<slug>.ts`) with `import.meta.glob`.

- Not here: game-session state (`src/game/`), simulation (`src/engine/`), visible UI text (`src/copy/`).
- May import: `@/engine`, `@/copy`.
