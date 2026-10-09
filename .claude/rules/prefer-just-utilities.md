# Prefer just utilities

Collection and object helpers that read clearer than a hand-written `reduce` or loop come from the matching package of [just](https://github.com/angus-c/just) (`just-group-by`, `just-sort-by`, `just-index`, `just-range`, `just-clamp`, `just-unique`, `just-partition`, `just-pick`, `just-omit`, `just-compare`, `just-random-integer`, …), one package per helper. Never a general-purpose utility library for the same job; the project uses none today.

**Why:** a named helper says what the code does (`groupBy(levels, ({ chapter }) => chapter)`, `clamp(0, distance, total)`) where a `reduce`, a counter loop or nested `Math.min`/`Math.max` makes the reader rebuild the intent. One small, dependency-free package per helper keeps the bundle and the dependency list honest.

**How to apply:**

- Reach for `just` when the code would otherwise be a reduce-based grouping or indexing (`just-group-by`, `just-index`), a manual number range (`just-range`), clamping math (`just-clamp`), `[...new Set(x)]` uniqueness (`just-unique`), a split into two lists by a condition (`just-partition`), picking or dropping keys by a list (`just-pick`, `just-omit`), a deep equality check (`just-compare`), a random integer in a range (`just-random-integer`), or sorting or choosing by a numeric key (`just-sort-by`).
- Native one-liners that already read clearly stay native: `map`, `filter`, `some`, `every`, `find`, `flatMap`, `toSorted`, `Object.entries`, `Object.fromEntries`, a `Set` used for membership, `Math.min(...values)`.
- Sort display names with `localeCompare` or `Intl.Collator`, not `just-sort-by`: it compares by upper-cased code point, so accented Spanish names would land after `Z`.
- Install a package with `pnpm add` (exact, see [[exact-dependency-versions]]) together with the first code that uses it, and import its default export (`import groupBy from 'just-group-by'`). Use only packages published from the `just` repository.
- Skip a helper whose types fight strict TypeScript; keep the native code instead.
