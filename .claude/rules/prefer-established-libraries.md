# Prefer established libraries over hand-written infrastructure

Generic infrastructure — timing (intervals, timeouts, debounce), animation, hooks over browser APIs (media queries, events, storage, URL hash), dates, ids, schema validation — comes from a well-adopted library instead of being written by hand. Hand-written code is for the project's own domain: the network simulation, the levels and the game flow.

**Why:** generic infrastructure looks small but hides edge cases (cleanup, stale closures, time zones) that a widely used library has already met and tested. Every line the project does not write is a line it does not maintain.

**How to apply:**

- Before writing a generic helper or hook, look for a library that covers it. A library qualifies when it is maintained (a release in the last 12 months), ships TypeScript types, is widely used, is small or tree-shakeable, and does not overlap a dependency the project already has.
- Check those facts with `pnpm view <pkg> version time.modified peerDependencies`, never from memory, and record the choice with its date below.
- One library per job: never add a second library that does what an existing dependency already does.
- Install it with `pnpm add` together with the first code that uses it (see [[exact-dependency-versions]]). Collection helpers follow [[prefer-just-utilities]].

**Choices so far:**

- Schema validation: `zod`.
- 3D rendering: `three` through `@react-three/fiber` and `@react-three/drei`.
- React hooks over browser APIs: `@mantine/hooks` (9.7.1, published 2026-10-06, checked 2026-10-08). `usehooks-ts` was rejected: its last release was 2025-02-05.
- Positioning a tooltip beside its anchor and inside the window: `@floating-ui/react-dom` (2.1.9, published 2026-07-11, checked 2026-10-08). Radix Tooltip was not chosen while `prefer-radix` is undecided; it uses this same library inside.
