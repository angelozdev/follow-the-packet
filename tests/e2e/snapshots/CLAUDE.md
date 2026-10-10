# tests/e2e/snapshots

Reference captures of `toHaveScreenshot`, one per platform (`<name>-<platform>.png`). Playwright writes them; nothing else edits them.

- A capture changes only on purpose: when a task changes how an entity or an interface element looks, it records the new captures with `pnpm exec playwright test entities --update-snapshots=all` and commits them with the change. The comparison tolerates no different pixel and no difference of colour within a pixel (`maxDiffPixels: 0`, `threshold: 0`).
