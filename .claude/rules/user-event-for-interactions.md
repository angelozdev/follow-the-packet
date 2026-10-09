---
paths:
  - "src/**/*.test.tsx"
---
# user-event for interactions in tests

Tests that simulate what a user does (click, type, tab, hover, select) use `@testing-library/user-event` and `await` every call (`await user.click(...)`). Never use `fireEvent` from `@testing-library/react` or `@testing-library/dom`.

**Why:** `fireEvent` dispatches one synthetic DOM event, so it skips what a real interaction triggers around it (pointer, focus, hover, keyboard sequences) and can pass for a component that breaks in a browser. `user-event` replays the real sequence.

**How to apply:** the project has no shared render helper, so each test calls `const user = userEvent.setup()` once (not at module scope), is `async`, and awaits every interaction before asserting. The first interaction test arrives with the incident screen (plan 2).

Enforcement: no-restricted-imports bans fireEvent from the Testing Library packages in pnpm lint.
