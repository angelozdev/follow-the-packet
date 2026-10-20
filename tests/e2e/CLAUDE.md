# tests/e2e

Playwright tests against the production build (`pnpm e2e`, on its own port from 4183 to 4282: see «Port and parallel suites»). Since Task M23 of the 2D plan there are six, and they play the game as a student does: through the router, the roadmap and the progress saved in the browser. Whatever measures a box, a style or a click inside one screen is not here: it runs in Vitest, in jsdom (`src/**/*.test.tsx`) or in headless Chromium (`src/**/*.browser.test.tsx`, `pnpm test:browser`). A test belongs here only when it needs the real build.

## The six tests

- `chapter-1/chapter-1.spec.ts`: `chapter 1 is played from 01-01 to 01-14, each incident opening the next, with 3 stars each`. It ends on the roadmap: 04-01 still locked, and the first incident of chapter 2 open.
- `chapter-2/chapter-2.spec.ts`: `chapter 2 is played from 02-01 to 02-09, each incident opening the next, with 3 stars each`. It plays `CHAPTER_2` (`chapter-2/chapter-2-play.ts`), so Task 34 appends 02-10 to 02-14 (their play functions are written by the content tasks 29 to 33) to that list and to the title.
- `incidents.spec.ts`: `04-01 and 04-02 reach 3 stars, and the progress survives a reload`.
- `roadmap.spec.ts`: `the roadmap loads every chapter, grouped by level, without console errors`. `SOON_CHAPTER_COUNT` drops by one with each chapter that gets its first incident.
- `progress.spec.ts`: `the stars saved in the browser come back after a reload and open what they should`: an incident opened by the star before it, one opened by its own stars although the one before has none (`04-01`, and `01-14` after `01-13`), and ones still locked.
- `phone.spec.ts`: `the first incident is played with a touch at 390×844: no horizontal scroll and every piece within reach`. It taps (`hasTouch`), it does not click, and it takes the `isReachable` of `src/testing/card-boxes.ts` to the page for each label of the map.

## Helpers

- Plain modules next to the specs: `cards.ts` (open the card of a piece, press «Listo», open a terminal and send from it), `closing.ts` (send the solution or name the cause of a case, answer Lucía and see the stars), `console-errors.ts` (`collectErrors`, which leaves out font downloads that fail without network) and `saved-progress.ts` (open every page of a test with progress already saved: `startWithProgress`, and `CHAPTER_2_DONE`, chapter 1 and then `02-01` to `02-14` with three stars, which is what opens 04-01 once chapter 2 is registered). `chapter-1/chapter-1-play.ts` and `chapter-2/chapter-2-play.ts` say how each incident of a chapter is played with the mouse (`CHAPTER_1`, `CHAPTER_2`).
- A spec in a subfolder imports a shared helper through the alias `@e2e/`, which points at `tests/e2e/` and is configured in `tsconfig.json` (`@e2e/cards`), never with `../`; a spec at this level may use `./`.
- No helper measures a box: `still-scene.ts`, `card-boxes.ts` and `map-boxes.ts` left with the tests that used them. What is measured in a browser has its helpers in `src/testing/` (`browser-play.ts`, `card-boxes.ts`, `map-boxes.ts`).

## Deterministic tests

A test gives the same result in every run. Never `retries`, never a fixed wait, never `skip`, `fixme` or `test.fail` to hide a failure. ESLint rejects `waitForTimeout`, `setTimeout` and `setInterval` in `tests/**` (`eslint.config.js`, proven by `scripts/eslint-config.test.ts`): wait for a state (`expect`, `expect.poll`). The two chapter tests are long and use `test.slow()` (three times the 60 s of the config).

## Port and parallel suites

- `playwright.config.ts` takes the port from `e2ePortOf` (`scripts/e2e-port.ts`): a hash of the real path of the folder that holds the config, in 4183–4282, never 5173 or 5180. The server starts with `--strictPort`, and `reuseExistingServer` is `false`: `pnpm build` runs before every suite, so a suite never runs on an old build. **Never two suites at once in the same folder** (they share `dist`).
- `fullyParallel` is `true` and `workers` is not set, so Playwright uses half of the logical cores.

## Running only some specs

- One spec: `pnpm e2e tests/e2e/progress.spec.ts`. One test: add `-g "<part of its title>"`. Repeat it to prove it does not flake: `--repeat-each=10`. List without running: `--list`, which must show exactly the six titles above.
- `--only-changed` is not used: it follows the files that the tests import, and these tests open the game in the browser and import almost none of its code (a change in `src/ui/incident/use-inspection.ts` selects 0 tests and ends with exit code 0, verified on 2026-10-11).

## When to run what

- Each task: `pnpm check:fast` (types, lint, structure, jscpd and Vitest, no browser) and, for a change that touches a screen, `pnpm test:browser`. The six e2e run when a task closes a block, before a merge, and with `pnpm check`, which is `pnpm check:fast`, `pnpm test:browser` and `pnpm e2e`.
- A failing e2e is compared with the base: the last commit whose full `pnpm check` passed. If it fails there too, it is not of the task: write it in the backlog (`docs/plans/2026-10-08-follow-the-packet-followups.md`) and do not chase it. If it passes there, the regression belongs to the block: fix it inside the block.
- Never two suites at once in the same folder.
