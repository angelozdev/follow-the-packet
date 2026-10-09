# copy

Every Spanish text the player sees, as named constants and formatters, one file per area: the term registry (`terms.ts`), tagged text (`term-text.ts`), engine reason codes (`reasons.ts`), packet labels, the roadmap and notice screens (`ui.ts`) and the incident screen (`incident-ui.ts`).

- An AWS service, resource or setting is named as the English console shows it (`Security Group`, `Internet gateway`, `Anywhere-IPv4`); the other terms keep a Spanish name (`instancia EC2`, `regla de entrada`) or are general concepts (`ping`, `CIDR`, `mínimo privilegio`). Every term has a rigorous definition of at most 120 characters; only the Security Group has a short form (`SG`).
- A text that uses a term tags it: `{{security-group}}` shows the term's name and `{{inbound-rule|reglas de entrada}}` shows other words. An unknown tag throws. Pieces and chips show only the name or the short form (`unofficialNames`).
- Not here: logic that decides outcomes (`src/engine/`), incident content (`src/levels/`).
- Text follows `.claude/rules/rigorous-plain-copy.md`.
- May import: `@/engine`.
