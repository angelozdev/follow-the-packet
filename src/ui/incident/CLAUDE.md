# ui/incident

The incident screen: Lucía's card (tasks, the "Enviar solución" button and her reply, the folded glossary with this incident's new terms first, and hints), the cards that open beside a piece of the map (`map-cards/`: the task card of a firewall and the terminal of an origin), the inspection box, Lucía's question (the incident's own, or «¿Qué pasó?») and the result.

- The screen decides which card opens: a firewall opens its task card, an origin its terminal. Where the card sits is the scene's rule (`cardPlacement` and `terminalSide` in `src/scene/layout.ts`): the terminal opens on the free side of its origin, so it covers no other piece's label or stamp.
- Until a piece or a stamp is inspected, the inspection area shows the inspect help and a legend of the stamps and the lock, in words that need no term of any chapter.
- The glossary shows the icon of each term that names an entity, and the inspection box shows the icon of what it inspects in its heading (`EntityIcon` from `@/scene`).
- State lives in the session reducer of `@/game`; there is no game clock.
- Effects live in `use-*.ts` hooks next to their first consumer.
- Not here: session state and what the panels show (`src/game/`), the map and its labels (`src/scene/`), visible Spanish text (`src/copy/`).
- May import: `@/game`, `@/scene`, `@/storage`, `@/levels`, `@/copy`, other files of `src/ui/` (`@/ui/<file>`), and only types from `@/engine`.
