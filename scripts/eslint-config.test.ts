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

  describe('layers and imports', () => {
    const cases: [string, string, string][] = [
      ['engine imports react', 'src/engine/network/probe.ts', "import { useState } from 'react';\nexport const hook = useState;\n"],
      ['copy imports a higher layer', 'src/copy/probe.ts', "import { CHAPTERS } from '@/levels';\nexport const chapters = CHAPTERS;\n"],
      ['scene imports a peer', 'src/scene/probe.ts', "import { loadProgress } from '@/storage';\nexport const load = loadProgress;\n"],
      ['ui reaches into another layer', 'src/ui/probe.ts', "import { CHAPTERS } from '@/levels/chapters';\nexport const chapters = CHAPTERS;\n"],
      ['a layer imports its own barrel', 'src/levels/probe.ts', "import { CHAPTERS } from '@/levels';\nexport const chapters = CHAPTERS;\n"],
      ['a parent-relative import', 'src/levels/probe.ts', "import { CHAPTERS } from '../levels/chapters';\nexport const chapters = CHAPTERS;\n"],
      ['production code imports testing', 'src/levels/probe.ts', "import { lab03Net } from '@/testing';\nexport const net = lab03Net;\n"],
      ['a component imports useEffect', 'src/ui/probe.tsx', "import { useEffect } from 'react';\nexport function Probe() {\n  useEffect(() => undefined, []);\n  return null;\n}\n"],
      ['a test imports fireEvent', 'src/ui/probe.test.tsx', "import { fireEvent } from '@testing-library/react';\nexport const fire = fireEvent;\n"],
    ];

    it.each(cases)('rejects: %s', async (_name, filePath, code) => {
      expect(await ruleIdsFor(filePath, code)).toContain('no-restricted-imports');
    });

    it('rejects a value import from the engine in a view', async () => {
      expect(await ruleIdsFor('src/scene/probe.ts', "import { describePacket } from '@/engine';\nexport const describe = describePacket;\n")).toContain(
        '@typescript-eslint/no-restricted-imports',
      );
    });

    it('allows a type import from the engine in a view', async () => {
      expect(await ruleIdsFor('src/scene/probe.ts', "import type { Network } from '@/engine';\nexport type Net = Network;\n")).toEqual([]);
    });

    it('allows tests to import testing helpers', async () => {
      expect(await ruleIdsFor('src/levels/probe.test.ts', "import { lab03Net } from '@/testing';\nexport const net = lab03Net;\n")).toEqual([]);
    });

    it('allows effects inside a use-*.ts hook', async () => {
      const code = "import { useEffect } from 'react';\nexport function useProbe(): void {\n  useEffect(() => undefined, []);\n}\n";
      expect(await ruleIdsFor('src/ui/use-probe.ts', code)).toEqual([]);
    });

    it('rejects React.useEffect in a component', async () => {
      const code = "import * as React from 'react';\nexport function Probe() {\n  React.useEffect(() => undefined, []);\n  return null;\n}\n";
      expect(await ruleIdsFor('src/ui/probe.tsx', code)).toContain('no-restricted-syntax');
    });

    it('rejects reading the clock, randomness or browser storage in the engine', async () => {
      expect(await ruleIdsFor('src/engine/probe.ts', 'export const now = () => Date.now();\n')).toContain('no-restricted-syntax');
      expect(await ruleIdsFor('src/engine/probe.ts', 'export const roll = () => Math.random();\n')).toContain('no-restricted-syntax');
      expect(await ruleIdsFor('src/engine/probe.ts', "export const read = () => localStorage.getItem('x');\n")).toContain('no-restricted-globals');
    });
  });
});
