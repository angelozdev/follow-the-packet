# copy

Every Spanish text the player sees, as named constants and formatters, one file per area: the term registry (`terms.ts`), tagged text (`term-text.ts`), engine reason codes (`reasons.ts`), packet labels, the roadmap and notice screens (`ui.ts`) and the incident screen (`incident-ui.ts`).

- A text that uses a term tags it: `{{security-group}}` shows the term's name and `{{rule|reglas}}` shows other words. An unknown tag throws.
- Not here: logic that decides outcomes (`src/engine/`), incident content (`src/levels/`).
- Text follows `.claude/rules/plain-language-copy.md`.
- May import: `@/engine`.
