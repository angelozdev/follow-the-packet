# copy/screens

The Spanish texts of the screens, as named constants and formatters, one file per screen group: the roadmap, notice and entity catalog screens and the interface texts (`ui.ts`, which also holds `MESSAGE_TEXT`, the word each kind of `Message` wears on its tab and says to a screen reader) and the incident screen (`incident-ui.ts`: the map, the inspection box, Lucía, the task card, the terminal, the network settings and services cards, the tabs of a piece, the tables with the words of the problem of a refused entry (`TABLE_TEXT.problems`, one for each code of `RECORD_PROBLEMS`, `ROUTE_PROBLEMS` and `CHIP_PROBLEMS`), the card that classifies, the clock card, the case card, the explanation, the result and the screen).

- Not here: the term registry, tagged text, engine reason codes and packet labels (`src/copy/`), logic that decides outcomes (`src/engine/`), incident content (`src/levels/`).
- Text follows `.claude/rules/rigorous-plain-copy.md`.
- May import: `@/engine` and other files of `src/copy/` (`@/copy/<file>`).
