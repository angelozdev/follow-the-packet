---
paths:
  - "src/**/*.tsx"
---
# No raw useEffect in components

No `useEffect` or `useLayoutEffect` inline inside a component body. Wrap every effect in a named hook that states its intent instead of an inline `useEffect(() => {...}, [...])`.

Prefer the hooks of `@mantine/hooks` (see [[prefer-established-libraries]]): `useHash` for hash navigation, `useReducedMotion` for the reduced-motion preference, `useWindowEvent` for window events, `useInterval` and `useTimeout` for timing, `useDidUpdate` and `useMounted` for update and mount logic. When no library hook fits, write a project hook named after its intent (for example `useReportLevelResult`).

The hook name should tell you what the effect does without reading its body. Effects live only in hook files named `use-*.ts`, next to their first consumer: a hook's own implementation is allowed to contain the effect — that's its job — and the rule is about what a component is allowed to call directly.

React hooks are imported by name, and a namespace import of react is rejected because it would import useEffect.

Enforcement: no-restricted-imports and no-restricted-syntax forbid useEffect and useLayoutEffect outside use-*.ts files in pnpm lint.
