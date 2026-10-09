# ui

Screens and panels: the roadmap, the notice page (unknown or locked incident), the incident page and the incident screen (`incident/`), plus shared pieces (`stars.tsx`, `tagged-text.tsx`, `term-tip.tsx`).

- A term in a text shows its definition on hover, in a tooltip portaled to `document.body` and positioned with `@floating-ui/react-dom` (`term-tip.tsx`). Terms are not Tab stops. The inspection box renders its terms with `tips={false}`, because it does not take the mouse.
- Renders results computed elsewhere. Effects live in `use-*.ts` hooks next to their first consumer; prefer `@mantine/hooks`.
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, and only types from `@/engine`.
