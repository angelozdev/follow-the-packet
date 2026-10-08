# ui

Screens and panels: the roadmap, the incident page and the notice page.

- Renders results computed elsewhere. Effects live in `use-*.ts` hooks next to their first consumer; prefer `@mantine/hooks`.
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, and only types from `@/engine`.
