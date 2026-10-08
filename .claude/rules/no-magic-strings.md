# No magic strings

Don't scatter raw string/number literals through logic when the same value is meaningful or reused. Give it a named constant (`const MAX_RETRIES = 3`, `const STATUS_LABEL: Record<Status, string> = {...}`) instead of repeating the literal inline at each call site.

**Why:** a literal repeated across files drifts silently when one copy is edited and the others aren't — a named constant is edited once, and the name documents what the value means.

**How to apply:** applies to values with meaning beyond their type: thresholds, labels and ids of external-platform resources, feature-flag names, query keys, status strings used more than once, polling intervals, URLs/paths. Does not apply to a one-off literal used exactly once where a constant would only add indirection (see [[kiss]]), or to a value that's inherently a fixed piece of text (a single label, a single error message). When in doubt: if the same value shows up a second time, or the value would be unclear without its variable name, name it.

In this project the recurring values are IPs, CIDRs, AWS names and the lesson reference (in each chapter's `shared.ts` once levels exist, and in `src/testing/fixtures.ts` for tests), scene colors (`src/scene/theme.ts`), the progress storage key (`src/storage/progress.ts`) and visible Spanish text maps (`src/copy/`).

Naming a constant doesn't exempt its text from the language rule: visible text held in label maps and constants still follows [[english-only]].
