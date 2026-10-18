# tests

End-to-end tests live in `e2e/`. Unit tests and browser tests live next to the file they test inside `src/`: a `*.test.ts(x)` runs in `pnpm test` (the `unit` project, Node or jsdom) and a `*.browser.test.tsx` runs in `pnpm test:browser` (the `browser` project, headless Chromium), for what needs a real layout or real CSS (see `src/testing/CLAUDE.md`). Nothing in this folder runs in the browser project.
