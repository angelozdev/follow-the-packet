# tests/e2e

Playwright tests against the production build (`pnpm e2e`, port 4183). One file per flow, named `<flow>.spec.ts`.

- Interact through roles and labels, the way a player would.
- Shared helpers are plain modules next to the specs: `console-errors.ts`, `saved-progress.ts` (open a page with progress already saved), `closing.ts` (send the solution, answer Lucía and see the stars) and `map-boxes.ts` (the boxes of the map's labels and stamps, and the pairs that overlap). A spec that plays a later chapter starts with the chapters before it done.
- `entities.spec.ts` compares the `/entidades` page with its capture in `snapshots/`, still, at a fixed window size and pixel ratio, with web fonts blocked so the capture does not depend on the network.
