# ui

Screens and panels: the roadmap, the notice page (unknown or locked incident), the incident page and the incident screen (`incident/`), plus shared pieces (`stars.tsx`, `tagged-text.tsx`).

- Renders results computed elsewhere. Effects live in `use-*.ts` hooks next to their first consumer; prefer `@mantine/hooks`.
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, and only types from `@/engine`.
