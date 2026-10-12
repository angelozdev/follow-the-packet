# tests/e2e/chapter-2

The end-to-end tests of chapter 2 (the fourteen incidents 02-01 to 02-14).

- `chapter-2-play.ts` says how each incident is played with the mouse: `CHAPTER_2`, a list of `PlayedIncident` (`id`, `title`, `play`) in game order, empty until 02-01 exists. Each content task (23 to 33 of the plan) adds the incident it builds and, with it, a smoke test of its block; the whole-chapter test (task 34) plays the list from 02-01 to 02-14, each incident opening the next with three stars. `PlayedIncident` is the type of chapter 1 (`@e2e/chapter-1/chapter-1-play`): the shape of a played incident is the same in every chapter.
- The shared helpers (`cards`, `closing`, `console-errors`, `map-boxes`, `saved-progress`) stay in `tests/e2e/` and are imported through the alias `@e2e/` (`@e2e/cards`), never with `../`. The progress that opens a chapter with the ones before it done is in `@e2e/saved-progress` (`CHAPTER_1_DONE`, `CHAPTER_2_DONE`).
- Not here: a helper that more than one chapter uses (`tests/e2e/`), the captures (`tests/e2e/snapshots/`), what chapter 1 plays (`tests/e2e/chapter-1/`).
