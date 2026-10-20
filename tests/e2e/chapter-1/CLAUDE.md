# tests/e2e/chapter-1

The end-to-end tests of chapter 1 (the fourteen incidents 01-01 to 01-14).

- `chapter-1.spec.ts` plays the whole chapter from 01-01 to 01-14, each incident opening the next with three stars, and keeps the checks that need chapter 1 in play: the roadmap, the stamps a screen reader hears, and the boxes of the map and the cards at 1280×800 and 1440×900, among them that the labels of 01-08 stand where they belong from the first moment they show, and that the same ping sent three times in 01-03 is one stamp and, on the 2D map (`g.map-flight`, none on the 3D, whose packets are in the canvas), three packets in the air at once with the clock of the page held, which go to one when `page.clock` runs past their trips.
- `chapter-1-play.ts` says how each of the fourteen incidents is played with the mouse (`CHAPTER_1`, `WATCH_CASES` and the moves such as `sendThePacket` or `fixTheGateway`). The whole-chapter test and `card-layout.spec.ts` share it.
- The shared helpers (`cards`, `closing`, `console-errors`, `map-boxes`, `saved-progress`) stay in `tests/e2e/` and are imported through the alias `@e2e/` (`@e2e/cards`), never with `../`. Another spec imports the play file as `@e2e/chapter-1/chapter-1-play`; inside this folder the spec imports it as `./chapter-1-play`.
- Not here: a helper that more than one chapter uses (`tests/e2e/`), the captures (`tests/e2e/snapshots/`), what a later chapter plays (its own folder).
