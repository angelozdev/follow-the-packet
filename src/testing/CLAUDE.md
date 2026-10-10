# testing

Helpers for tests only: network fixtures (`fixtures.ts`: the lab 03 VPC and the chapter 1 office), incidents (`incidents.ts`: a registered filter incident by its id, and a send incident on the office), readers for the repository's `syllabus.md` (`repo.ts`) and the Vitest setup (`setup.ts`).

- Production code never imports `@/testing`.
- May import: `@/engine`, `@/copy`, `@/levels`.
