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

    const rejectedComments: [string, string][] = [
      ['a star after a line comment marker', '// * temporary note'],
      ['a star inside a block comment', '/* * temporary explanation */'],
      ['a comment starting with a word the plugin used to allow', '// global state holds the data'],
      ['an eslint directive', '// eslint-disable-next-line'],
    ];

    it.each(rejectedComments)('rejects: %s', async (_name, comment) => {
      expect(await ruleIdsFor('src/ui/probe.ts', `${comment}\nexport const value = 1;\n`)).toContain('no-comments/disallowComments');
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
      ['a test imports a forbidden layer deeply', 'src/engine/network/probe.test.ts', "import { Roadmap } from '@/ui/roadmap';\nexport const View = Roadmap;\n"],
      ['a test imports a forbidden layer barrel', 'src/engine/network/probe.test.ts', "import { Roadmap } from '@/ui';\nexport const View = Roadmap;\n"],
      ['a ./../ parent import', 'src/scene/probe.ts', "import { saveStars } from './../storage/progress';\nexport const save = saveStars;\n"],
      ['an e2e test imports fireEvent', 'tests/e2e/probe.spec.ts', "import { fireEvent } from '@testing-library/react';\nexport const fire = fireEvent;\n"],
      ['a script test imports fireEvent', 'scripts/probe.test.ts', "import { fireEvent } from '@testing-library/dom';\nexport const fire = fireEvent;\n"],
      ['a namespace import of react in a component', 'src/ui/probe.tsx', "import * as React from 'react';\nexport const Probe = React.memo;\n"],
    ];

    const syntaxCases: [string, string, string, string][] = [
      ['a dynamic import', 'src/ui/probe.ts', "export const loadEngine = () => import('@/engine');\n", 'no-restricted-syntax'],
      ['a dynamic import in a test', 'src/ui/probe.test.ts', "export const loadEngine = () => import('@/engine');\n", 'no-restricted-syntax'],
      ['a renamed react import calling useEffect', 'src/ui/probe.tsx', "import R from 'react';\nexport function Probe() {\n  R.useEffect(() => undefined, []);\n  return null;\n}\n", 'no-restricted-syntax'],
      ['globalThis storage in the engine', 'src/engine/network/probe.ts', "export const read = () => globalThis.localStorage.getItem('x');\n", 'no-restricted-globals'],
      ['globalThis.Date in the engine', 'src/engine/network/probe.ts', 'export const now = () => globalThis.Date.now();\n', 'no-restricted-globals'],
      ['a destructured Math.random in the engine', 'src/engine/network/probe.ts', 'const { random } = Math;\nexport const roll = () => random();\n', 'no-restricted-syntax'],
    ];

    it.each(syntaxCases)('rejects: %s', async (_name, filePath, code, ruleId) => {
      expect(await ruleIdsFor(filePath, code)).toContain(ruleId);
    });

    it('rejects self in the engine as a global', async () => {
      expect(await ruleIdsFor('src/engine/network/probe.ts', 'export const origin = () => self.location;\n')).toContain('no-restricted-globals');
    });

    it('allows import.meta.glob', async () => {
      expect(await ruleIdsFor('src/levels/probe.ts', "export const modules = import.meta.glob('./*.ts');\n")).toEqual([]);
    });

    it('allows a test to import its own layer deeply', async () => {
      expect(await ruleIdsFor('src/levels/probe.test.ts', "import { CHAPTERS } from '@/levels/chapters';\nexport const chapters = CHAPTERS;\n")).toEqual([]);
    });

    it.each(cases)('rejects: %s', async (_name, filePath, code) => {
      expect(await ruleIdsFor(filePath, code)).toContain('no-restricted-imports');
    });

    it('rejects a value import from the engine in a view', async () => {
      expect(await ruleIdsFor('src/scene/probe.ts', "import { simulate } from '@/engine';\nexport const run = simulate;\n")).toContain(
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

  describe('names', () => {
    const SOURCE = 'export const value = 1;\n';

    it('rejects a PascalCase file name', async () => {
      expect(await ruleIdsFor('src/ui/RoadMap.tsx', SOURCE)).toContain('check-file/filename-naming-convention');
    });

    it('rejects a PascalCase folder name', async () => {
      expect(await ruleIdsFor('src/ui/Shared/roadmap.tsx', SOURCE)).toContain('check-file/folder-naming-convention');
    });

    const badNames: [string, string][] = [
      ['an e2e tsx file', 'tests/e2e/BadName.tsx'],
      ['a js source file', 'src/ui/BadName.js'],
    ];

    it.each(badNames)('rejects a PascalCase name: %s', async (_name, filePath) => {
      expect(await ruleIdsFor(filePath, SOURCE)).toContain('check-file/filename-naming-convention');
    });

    it('allows numbered kebab-case level files and test suffixes', async () => {
      expect(await ruleIdsFor('src/levels/04-iaas/01-the-first-ping.ts', SOURCE)).toEqual([]);
      expect(await ruleIdsFor('src/ui/roadmap.test.tsx', SOURCE)).toEqual([]);
    });
  });
});
