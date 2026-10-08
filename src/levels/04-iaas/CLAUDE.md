# levels/04-iaas

Chapter 4 (IaaS), the night shift: one file per incident (`NN-<slug>.ts`, a default export built with `defineIncident`) and `shared.ts` with the chapter's lesson, base world, flows and chips.

- 04-01 brings the base world; every later incident brings only its changes over the reference solution of the one before.
- Texts tag their terms (`{{security-group}}`) and use only terms introduced by this incident or an earlier one.
- May import: `@/engine`, `@/copy`, `@/levels/incident` and `./shared`.
