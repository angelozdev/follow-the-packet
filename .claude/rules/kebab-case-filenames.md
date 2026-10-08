# Kebab-case filenames

Every file and folder under `src/` and `tests/` is named kebab-case: `game-scene.tsx`, `rule-editor.tsx`, `use-report-level-result.ts`. No `PascalCase.tsx` or `camelCase.ts` filenames.

This only affects the filename. The exported symbol inside still uses normal JS/TS identifier casing — `game-scene.tsx` still `export function GameScene()`, `use-report-level-result.ts` still `export function useReportLevelResult()`. Hyphens aren't legal in identifiers, so the file and the symbol it exports necessarily look different; that's expected, not a mismatch to fix.

Middle extensions are ignored: `*.test.ts`, `*.test.tsx`, `*.spec.ts`. Root config files (`vite.config.ts`, `eslint.config.js`, `playwright.config.ts`) are tool-required names and already comply.

Enforcement: eslint-plugin-check-file on src/ and tests/ in npm run lint.
