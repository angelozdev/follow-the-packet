# game/chapters

The tests that play a whole chapter of the game through the session and the cards: `chapter-1.test.ts`, `chapter-2.test.ts` and `chapter-3.test.ts`, one file for each chapter; the last one grows with each block of chapter 3. `chapter-3-dead-ends.test.ts` explores every move an incident of chapter 3 offers (each message from each origin to each address, each rule, each placement in a table) up to three moves from the start and asserts that from every state reached, playing the incident's solution closes every task: no sequence of up to three of the player's own moves can leave a task that can never hold. Add the incident to its list when a block is built. They were in `src/game/` until that folder reached the cap of 12 files; they hold no code to import.

- Each file checks, incident by incident, the terms the chapter introduces (against its table of the approved design), what its incidents print and show, and what they say; the generic checks of every incident (`incidents.test.ts`, `src/levels/registry.test.ts`, `src/levels/ladder.test.ts`) stay where they are.
- Not here: code, tests of one file of `src/game/` (they sit next to it), tests of the cards or the inspection (`view/`), end-to-end tests (`tests/e2e/`).
- May import: `@/engine`, `@/copy`, `@/levels`, `@/testing` and the files of `src/game/` through `@/game/<file>` and `@/game/view/<folder>/<file>`.
