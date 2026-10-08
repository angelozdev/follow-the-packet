# Folder structure

The source tree has one primary axis — **layers** — and every level below it is split by concept. Every file goes in the folder the placement rule picks, imports run one way only through each layer's barrel and the `@/` alias, and every folder stays under a file cap.

**Why:** files that change together live together, and the path of a file says where it belongs. Without a written placement rule, folders fill up with unrelated files and units reach into each other's internals.

## Placement

Answer in order; the first "yes" decides:

1. Does it decide what happens to a packet (network model, rules, simulation, scoring)? → `src/engine/`
2. Is it level content or the level contract, registry or evaluation? → `src/levels/`
3. Is it Spanish text shown to the player? → `src/copy/`
4. Is it game-session state (phases, actions, reducer)? → `src/game/`
5. Is it persistence in the browser? → `src/storage/`
6. Does it draw the 3D map? → `src/scene/`
7. Is it a panel, screen or control? → `src/ui/`
8. Is it only for tests (fixtures, repo helpers)? → `src/testing/`

**Promotion ladder.** A piece starts next to its first consumer and moves up only when a second real consumer appears, one level at a time. Nothing is promoted in advance (see [[kiss]]).

## Inside a folder

- At most **12 files** per folder, tests and barrel included, but not the folder's `CLAUDE.md` guide (`scripts/check-structure.ts` does not count it); the file that exceeds the cap forces a split into child concepts (for example `src/engine/` into `network/`, `rules/`, `simulation/`, `scoring/`). Never folders named after a file type (`utils/`, `types/`, `helpers/`).
- Tests sit next to the file they test (`*.test.ts`, `*.test.tsx`); no `__tests__/` folders. End-to-end tests live in `tests/e2e/`.
- Names are kebab-case and English (see [[kebab-case-filenames]]).
- Every folder has a short `CLAUDE.md` guide in English: what belongs there, what does not (and the right folder instead), and what it may import. Creating a folder means writing its guide; moving a file means updating the guides that mention it.

## Imports

- Allowed direction, from higher to lower, never back up and never between peers:
  `app → ui → game · scene · storage → levels → copy → engine`.
  `src/scene/` reads only the engine's types and the computed trace (see [[view-renders-domain-result]]).
- Each layer has a barrel (`index.ts`) with named re-exports only (`export { X } from './x'`, `export type { T } from './t'`), never `export *`, exporting exactly what other layers use.
- Across a layer boundary, import the barrel through the alias (`@/engine`); inside a layer, import the file directly (`./x`). Never import a barrel from inside its own folder. No `../` imports at all.
- The alias `@/` points at `src/` and is configured in `tsconfig.json`, `vite.config.ts` and Vitest.
- A test that mocks a module targets the file that defines the export, not its barrel.

## Boundaries

- `src/testing/` (fixtures, repository helpers) is imported only by tests, never by production code.
- AWS vocabulary is this project's domain language, not an external platform, so it is allowed everywhere.

Enforcement: no-restricted-imports rules generated from the layer table in eslint.config.js (npm run lint, proven by scripts/eslint-config.test.ts) and scripts/check-structure.ts for the 12-file cap and the guides (npm run structure).
