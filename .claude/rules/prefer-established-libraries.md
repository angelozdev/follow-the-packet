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
- 2D map: hand-written SVG; animation: SMIL, a standard of the browser.
- React hooks over browser APIs: `@mantine/hooks` (9.7.1, published 2026-10-06, checked 2026-10-08). `usehooks-ts` was rejected: its last release was 2025-02-05.
- Positioning a tooltip beside its anchor and inside the window: `@floating-ui/react-dom` (2.1.9, published 2026-07-11, checked 2026-10-08). Radix Tooltip was not chosen while `prefer-radix` is undecided; it uses this same library inside.
- Tabs (the `tablist`, `tab` and `tabpanel` roles, the arrow keys, Home and End, one stop in the Tab order): `@radix-ui/react-tabs` (1.1.21, published 2026-07-24, checked 2026-10-10), wrapped as the `Tabs` primitive of `src/design/`. Version 1.1.22 (published 2026-10-05) was too recent for the 14-day rule. `prefer-radix` is still undecided: this adopts only Radix Tabs, not Radix Tooltip.
- Tests in a real browser (the geometry and the CSS that jsdom does not compute): the browser mode of Vitest with `@vitest/browser-playwright` (5.0.3, published 2026-09-30, checked 2026-10-17 with `pnpm view @vitest/browser-playwright@5.0.3 version time peerDependencies`: version 5.0.3, peers `vitest` 5.0.3 and `playwright` `*`). It is exactly the installed `vitest`, 17 days old on the day it was added. Vitest and `@vitest/browser-playwright` 5.0.4 (2026-10-12) and 5.0.5 (2026-10-15) were too recent for the 14-day rule, so both packages stay on 5.0.3 together. `playwright` 1.64.0 is already there through `@playwright/test`, so no browser library was added; `vitest-browser-react` was not added because the `render` of Testing Library runs in the browser too.
