# testing

Helpers for tests only: network fixtures (`fixtures.ts`), readers for the repository's `syllabus.md` (`repo.ts`) and the Vitest setup (`setup.ts`).

- Production code never imports `@/testing`.
- May import: `@/engine`, `@/copy`, `@/levels`.
