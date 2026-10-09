# ui/incident

The incident screen: Lucía's card (tasks, the "Enviar solución" button and her reply, new terms, the folded glossary and hints), the task card of a Security Group, the inspection box, Lucía's question and the result.

- State lives in the session reducer of `@/game`; there is no game clock.
- Effects live in `use-*.ts` hooks next to their first consumer.
- Not here: session state and what the panels show (`src/game/`), the map and its labels (`src/scene/`), visible Spanish text (`src/copy/`).
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, other files of `src/ui/` (`@/ui/<file>`), and only types from `@/engine`.
