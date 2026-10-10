# testing

Helpers for tests only: network fixtures (`fixtures.ts`: the lab 03 VPC and the chapter 1 office), incidents (`incidents.ts`: a registered filter incident by its id, a send incident on the office, and one on the office with routers whose chips ping, ping with a TTL and traceroute), readers for the repository's `syllabus.md` and for the chapter map and the levels of the chapters doc (`repo.ts`) and the Vitest setup (`setup.ts`).

- `EVERY_TERM` is every registered term, for the tests that do not care what the player knows yet; a test about what is hidden builds its own set or its own incident.
- Production code never imports `@/testing`.
- May import: `@/engine`, `@/copy`, `@/levels`.
