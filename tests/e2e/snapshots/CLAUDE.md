# tests/e2e/snapshots

Reference captures of `toHaveScreenshot`, one per platform (`<name>-<platform>.png`). Playwright writes them; nothing else edits them.

- A capture changes only on purpose: when a task changes how an entity looks, it records the new capture with `pnpm exec playwright test entities --update-snapshots=all` and commits it with the change.
