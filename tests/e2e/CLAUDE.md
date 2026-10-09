# tests/e2e

Playwright tests against the production build (`pnpm e2e`, port 4183). One file per flow, named `<flow>.spec.ts`.

- Interact through roles and labels, the way a player would.
- Shared helpers (`console-errors.ts`) are plain modules next to the specs.
- `entities.spec.ts` compares the `/entidades` page with its capture in `snapshots/`, still, at a fixed window size and pixel ratio, with web fonts blocked so the capture does not depend on the network.
