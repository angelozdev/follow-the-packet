# tests/e2e/snapshots

Reference captures of `toHaveScreenshot`, one per platform (`<name>-<platform>.png`). Playwright writes them; nothing else edits them.

- A capture changes only on purpose: when a task changes how an entity or an interface element looks, it records the new captures with `pnpm exec playwright test entities --update-snapshots=all` and commits them with the change. The comparison tolerates no different pixel and no colour threshold (`maxDiffPixels: 0`, `threshold: 0`), except the edges pixelmatch counts as anti-aliasing.
- The captures are drawn with the system fonts of the machine (Google Fonts is blocked in the tests), so after an OS or browser update that changes those fonts, look at the diff images and re-record on purpose with `pnpm exec playwright test entities --update-snapshots=all`.
- The viewport of `tests/e2e/entities.spec.ts` must be taller than the tallest region it captures (the interface section is 2828 px tall, the viewport 3000 px). Observed in Task 18: when the region was taller than the viewport, every monospace text of the capture came out in another font, so each specimen changed. Raise the viewport before a new specimen outgrows it; the capture then also changes by a few anti-aliased pixels at the rounded corners of the old specimens, which the comparison does not count.
