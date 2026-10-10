# tests/e2e

Playwright tests against the production build (`pnpm e2e`, port 4183). One file per flow, named `<flow>.spec.ts`.

- Interact through roles and labels, the way a player would.
- Shared helpers are plain modules next to the specs: `console-errors.ts`, `saved-progress.ts` (open a page with progress already saved), `closing.ts` (send the solution, answer Lucía and see the stars) and `map-boxes.ts` (the boxes of the map's labels and stamps, and the pairs that overlap). A spec that plays a later chapter starts with the chapters before it done.
- `entities.spec.ts` compares two regions of the `/entidades` page with their captures in `snapshots/`: the map pieces and the interface elements, with the focus ring on one option. Both are taken still, at a fixed window size and pixel ratio, with web fonts blocked so the captures do not depend on the network. They tolerate no different pixel and no colour threshold, except the edges pixelmatch counts as anti-aliasing. The same spec measures what a capture cannot see, in the real browser: the primary button as a stamp (computed style, and its movement when pressed with and without reduced motion) and the letters of the options (a DOM snapshot) with their accessible names (the accessibility tree).
