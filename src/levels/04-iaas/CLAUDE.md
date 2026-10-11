# levels/04-iaas

Chapter 4, «La noche de guardia» (level 1, Fundamentos), the night shift; the folder keeps the name of the course module it was first cut from: one file per incident (`NN-<slug>.ts`, a default export built with `defineIncident`) and `shared.ts` with the chapter's lesson, base world, flows and chips.

- 04-01 brings the base world; every later incident brings only its changes over the reference solution of the one before.
- Texts and chips use official AWS names (`.claude/rules/rigorous-plain-copy.md`), tag their terms (`{{security-group}}`) and use only terms introduced by this incident or an earlier one.
- Text that follows a change to the world names what changed (`.claude/rules/explained-behavior-changes.md`): the report, the right explanation or the takeaway says which instance changed and how, in plain words, with its name from `S1` or `S2`.
- `golden-traces.test.ts` keeps the chapter's golden references in `golden-traces.json`: the trace of every flow and the probe battery of 04-01 and 04-02, in its start world, its solved world and its start world plus each one-chip rule, recorded before the generic network model. The JSON is never edited by hand or rewritten with `vitest -u`: a difference means the engine changed what chapter 4 shows. When the engine renames something the trace carries (a field, a stage, a reason code or a place such as `internet-gateway`, recorded as `igw`), the test maps the new name back to the recorded one.
- Not here: the incident contract and chips (`src/levels/contract/`), the registry (`src/levels/`), visible UI text (`src/copy/`), network rules (`src/engine/`).
- May import: `@/engine`, `@/copy`, `@/levels/contract/incident` and `./shared`; the golden test also imports `@/levels/registry` and `@/levels/world`.
