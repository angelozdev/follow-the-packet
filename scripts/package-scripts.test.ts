import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PACKAGE_JSON_PATH = fileURLToPath(new URL('../package.json', import.meta.url));
const SEPARATOR = ' && ';
const RUN = 'pnpm ';
const STEPS_OF_CHECK_BEFORE_CHECK_FAST = ['typecheck', 'lint', 'structure', 'dup', 'test'];

interface PackageJson {
  scripts: Record<string, string>;
}

const { scripts }: PackageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));

function stepsOf(name: string): string[] {
  return scripts[name].split(SEPARATOR).map((step) => step.replace(RUN, ''));
}

describe('package.json scripts', () => {
  it('check runs check:fast and then the e2e suite, and check:fast runs every step check had except the e2e suite', () => {
    expect(stepsOf('check')).toEqual(['check:fast', 'e2e']);
    expect(stepsOf('check:fast')).toEqual(STEPS_OF_CHECK_BEFORE_CHECK_FAST);
  });

  it('every step of check and of check:fast is a script of the package', () => {
    for (const step of [...stepsOf('check'), ...stepsOf('check:fast')]) expect(Object.keys(scripts), step).toContain(step);
  });
});
