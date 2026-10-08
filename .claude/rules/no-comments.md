# No comments in code

No comments in code. If a comment feels necessary to explain something, that's a signal the code itself isn't readable enough — fix the naming or structure instead of adding a comment on top of it.

The one exception: JSDoc in English documenting a function's input and output (what it takes, what it returns) — nothing else. No inline comments, no comments narrating what a block does, no comments justifying a decision: that reasoning belongs in the commit message or in the repository's design docs (`docs/specs/` and `docs/plans/` at the repository root), not in the source. Tool directives are not comments and are allowed; this project uses `// @vitest-environment jsdom`. See [[english-only]].

Enforcement: eslint-plugin-no-comments in npm run lint; only JSDoc and tool directives pass.
