# levels

The course chapters (`chapters.ts`), what the roadmap needs from a level (`level-entry.ts`) and the registry that loads level files (`NN-<chapter>/NN-<slug>.ts`) with `import.meta.glob`.

- Not here: game-session state (`src/game/`), simulation (`src/engine/`), visible UI text (`src/copy/`).
- May import: `@/engine`, `@/copy`.
