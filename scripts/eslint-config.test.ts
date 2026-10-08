import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const LINT_TIMEOUT_MS = 30_000;
const VITEST_DIRECTIVE = ['@vitest', 'environment jsdom'].join('-');
const eslint = new ESLint({ cwd: PROJECT_ROOT });

async function ruleIdsFor(filePath: string, code: string): Promise<(string | null)[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId);
}

describe('eslint config', { timeout: LINT_TIMEOUT_MS }, () => {
  describe('comments', () => {
    it('rejects a plain comment', async () => {
      expect(await ruleIdsFor('src/engine/probe.ts', '// note\nexport const value = 1;\n')).toContain('no-comments/disallowComments');
    });

    it('allows English JSDoc', async () => {
      expect(await ruleIdsFor('src/engine/probe.ts', '/** Returns one. */\nexport function one(): number {\n  return 1;\n}\n')).toEqual([]);
    });

    it('allows the Vitest environment directive', async () => {
      expect(await ruleIdsFor('src/levels/probe.test.ts', `// ${VITEST_DIRECTIVE}\nexport const value = 1;\n`)).toEqual([]);
    });
  });
});
